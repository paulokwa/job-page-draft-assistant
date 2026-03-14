// modules/template.js
// Handles .docx template upload, placeholder validation, and document generation.
// Uses docxtemplater + pizzip (loaded as globals from lib/).

/**
 * Validates a .docx ArrayBuffer and returns detected placeholders.
 * Uses a native ZIP parser (no PizZip) to avoid the CSP eval() violation
 * that the webpack-bundled pizzip.js triggers in Chrome MV3 extensions.
 * @param {ArrayBuffer} arrayBuffer
 * @returns {{ placeholders: string[], warnings: string[] }}
 */
export async function validateTemplate(arrayBuffer) {
  let xmlContent;
  try {
    xmlContent = await extractXmlFromDocx(arrayBuffer);
  } catch (e) {
    throw new Error('Could not read the file. Make sure it is a valid .docx file.');
  }

  const placeholderRegex = /\{\{([A-Z0-9_]+)\}\}/g;
  const found = new Set();
  let match;
  while ((match = placeholderRegex.exec(xmlContent)) !== null) {
    found.add(`{{${match[1]}}}`);
  }

  const placeholders = [...found].sort();

  // Check for important missing placeholders
  const resumeRequired = ['{{FULL_NAME}}', '{{SUMMARY}}', '{{EXPERIENCE_1_TITLE}}'];
  const coverRequired  = ['{{FULL_NAME}}', '{{COVER_LETTER_BODY}}'];

  const warnings = [];
  const allRequired = [...new Set([...resumeRequired, ...coverRequired])];
  allRequired.forEach(p => {
    if (!found.has(p)) warnings.push(`Missing recommended placeholder: ${p}`);
  });

  return { placeholders, warnings };
}

/**
 * Extracts all XML text from a .docx (ZIP) ArrayBuffer using pure browser APIs.
 * Walks the ZIP central directory to find .xml entries and decompresses them
 * with DecompressionStream — no eval(), no third-party libs.
 * @param {ArrayBuffer} ab
 * @returns {Promise<string>}
 */
async function extractXmlFromDocx(ab) {
  const bytes = new Uint8Array(ab);
  const view  = new DataView(ab);
  const dec   = new TextDecoder('utf-8', { fatal: false });

  // Find End of Central Directory record (signature 0x06054b50, last in file)
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocdOffset = i; break; }
  }
  if (eocdOffset < 0) throw new Error('Not a valid ZIP file');

  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const cdCount  = view.getUint16(eocdOffset + 10, true);

  const xmlParts = [];
  let pos = cdOffset;

  for (let i = 0; i < cdCount; i++) {
    if (view.getUint32(pos, true) !== 0x02014b50) break; // central dir sig

    const compMethod  = view.getUint16(pos + 10, true);
    const compSize    = view.getUint32(pos + 20, true);
    const uncompSize  = view.getUint32(pos + 24, true);
    const nameLen     = view.getUint16(pos + 28, true);
    const extraLen    = view.getUint16(pos + 30, true);
    const commentLen  = view.getUint16(pos + 32, true);
    const localOffset = view.getUint32(pos + 42, true);

    const name = dec.decode(bytes.slice(pos + 46, pos + 46 + nameLen));
    pos += 46 + nameLen + extraLen + commentLen;

    // Only process .xml files (Word content lives in word/*.xml)
    if (!name.endsWith('.xml')) continue;

    // Read local file header to find actual data start
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart     = localOffset + 30 + nameLen + localExtraLen;
    const compData      = bytes.slice(dataStart, dataStart + compSize);

    let text;
    if (compMethod === 0) {
      // Stored (no compression)
      text = dec.decode(compData);
    } else if (compMethod === 8) {
      // Deflate — use DecompressionStream (Chrome 80+, always available in MV3)
      try {
        const ds     = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();
        writer.write(compData);
        writer.close();
        const chunks = [];
        let done = false;
        while (!done) {
          const { value, done: d } = await reader.read();
          if (value) chunks.push(value);
          done = d;
        }
        const total = chunks.reduce((n, c) => n + c.length, 0);
        const merged = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) { merged.set(c, off); off += c.length; }
        text = dec.decode(merged);
      } catch {
        continue; // skip unreadable entries
      }
    } else {
      continue; // unsupported compression method
    }

    xmlParts.push(text);
  }

  return xmlParts.join('\n');
}

/**
 * Fills a .docx template ArrayBuffer with data values.
 * @param {ArrayBuffer} arrayBuffer
 * @param {object} dataMap - e.g. { FULL_NAME: 'Jane Doe', SUMMARY: '...' }
 * @returns {Blob} - The generated .docx as a Blob
 */
export async function fillTemplate(arrayBuffer, dataMap) {
  const { PizZip, Docxtemplater } = getLibs();

  let zip;
  try {
    zip = new PizZip(arrayBuffer);
  } catch (e) {
    throw new Error('Could not process the template file.');
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(dataMap);

  const out = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  return out;
}

/**
 * Reads an ArrayBuffer from a File object.
 */
export function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Triggers a browser download of a Blob as a .docx file.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 500);
}

/**
 * Builds a filename from a pattern + job context.
 * Supported variables: {jobTitle}, {company}, {date}, {docType}
 */
export function buildFilename(pattern, { jobTitle, company, date, docType }) {
  const today = date || new Date().toISOString().slice(0, 10);
  return (pattern || '{docType} - {company} - {jobTitle}')
    .replace(/\{jobTitle\}/gi, sanitize(jobTitle) || 'Resume')
    .replace(/\{company\}/gi,  sanitize(company)  || 'Company')
    .replace(/\{date\}/gi,     today)
    .replace(/\{docType\}/gi,  docType || 'Document')
    + '.docx';
}

function sanitize(str) {
  return (str || '').replace(/[<>:"/\\|?*]/g, '').trim();
}

/**
 * Converts a plain-text draft into the dataMap needed for template.fillTemplate().
 * This is a best-effort mapper — users should use templates with {{COVER_LETTER_BODY}}
 * for cover letters and structured experience placeholders for resumes.
 */
export function draftToDataMap(draft, profile, jobData, docType) {
  const p = profile?.personal || {};
  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  const baseMap = {
    FULL_NAME:   p.fullName  || '',
    EMAIL:       p.email     || '',
    PHONE:       p.phone     || '',
    LINKEDIN:    p.linkedin  || '',
    PORTFOLIO:   p.portfolio || '',
    DATE:        today,
    JOB_TITLE:   jobData?.jobTitle  || '',
    COMPANY_NAME: jobData?.company  || '',
    HIRING_MANAGER: 'Hiring Manager',
  };

  if (docType === 'cover-letter') {
    return { ...baseMap, COVER_LETTER_BODY: draft };
  }

  // Full text sections for Smart Mode
  const smartSections = {
    SUMMARY: extractSection(draft, ['professional summary', 'summary', 'profile']),
    SKILLS:  extractSection(draft, ['skills', 'core competencies', 'competencies']),
    EXPERIENCE: extractSection(draft, ['experience', 'employment history', 'work history', 'professional experience']),
    EDUCATION: extractSection(draft, ['education', 'academic background']),
    CERTIFICATIONS: extractSection(draft, ['certifications', 'licenses']),
    CONTACT: `${baseMap.FULL_NAME}\\n${baseMap.PHONE} | ${baseMap.EMAIL}\\n${baseMap.LINKEDIN} | ${baseMap.PORTFOLIO}`.replace(/^[\\s|]+|[\\s|]+$/g, '').trim(),
  };

  // For resumes: try to map the full draft to SUMMARY + content
  // Advanced: parse sections from draft text
  return {
    ...baseMap,
    ...smartSections,
    EXPERIENCE_1_TITLE:   extractFromExperience(draft, 0, 'title'),
    EXPERIENCE_1_COMPANY: extractFromExperience(draft, 0, 'company'),
    EXPERIENCE_1_DATES:   extractFromExperience(draft, 0, 'dates'),
    EXPERIENCE_1_BULLETS: extractFromExperience(draft, 0, 'bullets'),
    EXPERIENCE_2_TITLE:   extractFromExperience(draft, 1, 'title'),
    EXPERIENCE_2_COMPANY: extractFromExperience(draft, 1, 'company'),
    EXPERIENCE_2_DATES:   extractFromExperience(draft, 1, 'dates'),
    EXPERIENCE_2_BULLETS: extractFromExperience(draft, 1, 'bullets'),
    EXPERIENCE_3_TITLE:   extractFromExperience(draft, 2, 'title'),
    EXPERIENCE_3_COMPANY: extractFromExperience(draft, 2, 'company'),
    EXPERIENCE_3_DATES:   extractFromExperience(draft, 2, 'dates'),
    EXPERIENCE_3_BULLETS: extractFromExperience(draft, 2, 'bullets'),
    // Full draft also available for simple single-block templates
    RESUME_BODY: draft,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getLibs() {
  const PizZipLib = (typeof PizZip !== 'undefined') ? PizZip : window.PizZip;
  // The UMD bundle exposes the class as window.docxtemplater (lowercase)
  const DocxLib = (typeof Docxtemplater !== 'undefined') ? Docxtemplater
                : (typeof docxtemplater !== 'undefined') ? docxtemplater
                : window.docxtemplater;
  if (!PizZipLib || !DocxLib) {
    throw new Error('Required libraries (PizZip, Docxtemplater) are not loaded. Check that lib/ files are present.');
  }
  return { PizZip: PizZipLib, Docxtemplater: DocxLib };
}

function extractSection(text, headings) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase().trim();
    if (headings.some(h => lower.includes(h))) {
      const sectionLines = [];
      for (let j = i + 1; j < lines.length; j++) {
        // Stop at the next heading line (short all-caps or title-case line)
        if (j > i + 1 && isHeading(lines[j])) break;
        sectionLines.push(lines[j]);
      }
      return sectionLines.join('\n').trim();
    }
  }
  return '';
}

function isHeading(line) {
  const t = line.trim();
  return t.length > 0 && t.length < 60 && (t === t.toUpperCase() || /^[A-Z][a-z]/.test(t)) && !t.startsWith('•') && !t.startsWith('-');
}

function extractFromExperience(text, index, field) {
  // Find work experience sections (blocks that look like job entries)
  const experienceHeadingRe = /work experience|employment history|professional experience|experience/i;
  const lines = text.split('\n');
  let inExp = false;
  const blocks = [];
  let currentBlock = [];

  for (const line of lines) {
    if (!inExp && experienceHeadingRe.test(line)) { inExp = true; continue; }
    if (!inExp) continue;
    if (isHeading(line) && !experienceHeadingRe.test(line) && currentBlock.length > 0) {
      // Hit a new top-level section
      const blockText = currentBlock.join('\n').trim();
      if (blockText) { inExp = false; break; }
    }
    // Detect new sub-entry (line that looks like a job title line)
    if (looksLikeJobEntry(line) && currentBlock.length > 0) {
      blocks.push([...currentBlock]);
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);

  const block = blocks[index];
  if (!block) return '';

  switch (field) {
    case 'title':   return block[0]?.trim() || '';
    case 'company': return block[1]?.trim() || '';
    case 'dates':   return block[2]?.trim() || '';
    case 'bullets': return block.slice(3).join('\n').trim();
    default:        return '';
  }
}

function looksLikeJobEntry(line) {
  return /^[A-Z][A-Za-z\s,]+(?:\||–|-|at)\s[A-Z]/.test(line.trim());
}
