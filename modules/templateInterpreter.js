// modules/templateInterpreter.js
// Handles reading regular Word templates (without placeholders) and injecting content under headings.

/**
 * Extracts just the word/document.xml content from a .docx file using native APIs.
 * This avoids PizZip's eval() in Chrome extensions when reading.
 */
async function extractDocumentXml(ab) {
  const bytes = new Uint8Array(ab);
  const view  = new DataView(ab);
  const dec   = new TextDecoder('utf-8', { fatal: false });

  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocdOffset = i; break; }
  }
  if (eocdOffset < 0) throw new Error('Not a valid ZIP file (EOCD not found)');

  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const cdCount  = view.getUint16(eocdOffset + 10, true);

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

    if (name !== 'word/document.xml') continue;

    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataStart     = localOffset + 30 + nameLen + localExtraLen;
    const compData      = bytes.slice(dataStart, dataStart + compSize);

    if (compMethod === 0) {
      return dec.decode(compData);
    } else if (compMethod === 8) {
      const ds = new DecompressionStream('deflate-raw');
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
      return dec.decode(merged);
    } else {
      throw new Error('Unsupported compression method');
    }
  }

  throw new Error('word/document.xml not found in template');
}

/**
 * Parses the document XML and heuristically identifies likely section headings and layout risks.
 * @param {ArrayBuffer} arrayBuffer The DOCX file ArrayBuffer
 */
export async function analyzeTemplate(arrayBuffer) {
  const xmlString = await extractDocumentXml(arrayBuffer);
  
  // Check if it has old-style placeholders
  const placeholderRegex = /\{\{([A-Z0-9_]+)\}\}/g;
  const foundPlaceholders = new Set();
  let match;
  while ((match = placeholderRegex.exec(xmlString)) !== null) {
    foundPlaceholders.add(`{{${match[1]}}}`);
  }

  // Parse XML to look for headings and risks
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const wNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  
  const risk = calculateFormatRisk(xmlString);
  const headings = [];
  const paragraphs = doc.getElementsByTagNameNS(wNamespace, 'p');
  
  for (const p of paragraphs) {
    let text = getTextFromNode(p, wNamespace).trim();
    if (!text) continue;
    
    // Heuristics for heading detection
    if (isHeadingHeuristic(text)) {
      headings.push({
        text,
        node: p,
        // Approximate context: number of bullets following this heading
        bulletCount: countBulletsUntilNextHeading(p, wNamespace)
      });
    }
  }
  
  return {
    foundFormat: foundPlaceholders.size > 0 ? 'placeholders' : 'smart',
    headings: headings.map(h => h.text),
    placeholders: [...foundPlaceholders].sort(),
    risk,
    structureMap: {
      headings: headings.map(h => ({ text: h.text, bulletCount: h.bulletCount }))
    }
  };
}

function calculateFormatRisk(xmlString) {
  let score = 0;
  // Floating elements / drawings are high risk
  if (xmlString.includes('<wp:anchor') || xmlString.includes('<w:drawing')) score += 10;
  if (xmlString.includes('<w:pict')) score += 10;
  // Complex tables
  if ((xmlString.match(/<w:tbl/g) || []).length > 2) score += 5;
  // Text boxes
  if (xmlString.includes('w:txbxContent')) score += 15;

  if (score >= 20) return { level: 'high', score, message: 'Heavily custom layout detected. Formatting fidelity may not be perfect.' };
  if (score >= 5) return { level: 'medium', score, message: 'Moderate complexity detected. Using cautious replacement logic.' };
  return { level: 'low', score, message: 'Standard template layout.' };
}

function isHeadingHeuristic(text) {
  const isShort = text.length > 0 && text.length < 60;
  const isAllUpperCase = text === text.toUpperCase() && /[A-Z]/.test(text);
  const isTitleCase = /^[A-Z][a-z]/.test(text) && !text.startsWith('•') && !text.startsWith('-');
  const hasContactInfo = text.includes('@') || /\d{3}[-\s]?\d{3}[-\s]?\d{4}/.test(text);
  return isShort && (isAllUpperCase || isTitleCase) && !hasContactInfo;
}

function getTextFromNode(node, ns) {
  const texts = node.getElementsByTagNameNS(ns, 't');
  let full = '';
  for (const t of texts) full += t.textContent;
  return full;
}

function countBulletsUntilNextHeading(startP, ns) {
  let count = 0;
  let curr = startP.nextSibling;
  while (curr) {
    if (curr.nodeName === 'w:p') {
      const text = getTextFromNode(curr, ns).trim();
      if (!text) { curr = curr.nextSibling; continue; }
      if (isHeadingHeuristic(text)) break;
      if (text.startsWith('•') || text.startsWith('-') || curr.getElementsByTagNameNS(ns, 'numPr').length > 0) {
        count++;
      }
    }
    curr = curr.nextSibling;
  }
  return count;
}

/**
 * Parses the document XML and extracts all raw text content.
 * @param {ArrayBuffer} arrayBuffer The DOCX file ArrayBuffer
 * @returns {Promise<string>} The full plain text of the document
 */
export async function extractTextFromDocx(arrayBuffer) {
  const xmlString = await extractDocumentXml(arrayBuffer);
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const wNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  
  const paragraphs = doc.getElementsByTagNameNS(wNamespace, 'p');
  let fullText = '';
  
  for (const p of paragraphs) {
    const runs = p.getElementsByTagNameNS(wNamespace, 'r');
    let pText = '';
    for (const r of runs) {
      const textNodes = r.getElementsByTagNameNS(wNamespace, 't');
      for (const t of textNodes) {
        pText += t.textContent;
      }
    }
    const trimmed = pText.trim();
    if (trimmed) fullText += trimmed + '\\n';
  }
  
  return fullText.trim();
}

/**
 * Utility to parse plain text into DOCX XML paragraph nodes.
 * @param {Document} doc The XML DOM Document
 * @param {string} text The generated text block
 * @param {Element} styleTemplateNode A template `<w:p>` node to clone styles from
 * @returns {Element[]} Array of new `<w:p>` nodes
 */
function createParagraphNodes(doc, text, styleTemplateNode) {
  const wNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const lines = text.split('\\n');
  const newNodes = [];

  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines between paragraphs if any

    // Create new paragraph clone (this duplicates the style settings of the template node, e.g., spacing/font)
    const newP = styleTemplateNode ? styleTemplateNode.cloneNode(false) : doc.createElementNS(wNamespace, 'w:p');
    
    // Copy the <w:pPr> (paragraph properties) if present
    if (styleTemplateNode) {
      const pPrs = styleTemplateNode.getElementsByTagNameNS(wNamespace, 'pPr');
      if (pPrs.length > 0) {
        newP.appendChild(pPrs[0].cloneNode(true));
      }
    }

    // Create a run <w:r>
    const newR = doc.createElementNS(wNamespace, 'w:r');
    
    // If the template had a run with run properties <w:rPr>, clone it
    if (styleTemplateNode) {
      const runs = styleTemplateNode.getElementsByTagNameNS(wNamespace, 'r');
      if (runs.length > 0) {
        const rPrs = runs[0].getElementsByTagNameNS(wNamespace, 'rPr');
        if (rPrs.length > 0) {
          newR.appendChild(rPrs[0].cloneNode(true));
        }
      }
    }

    // Handle bullets (rough heuristic: lines starting with standard bullet characters)
    let textContent = line;
    const isBullet = /^[•\\-\\*\\+]\\s/.test(textContent);
    
    if (isBullet) {
      // Create bullet formatting... this is complicated in Word so we'll just keep the character
      // and maybe add an indentation if we can, but preserving the character is safest for now
      // To strictly do Word bullets, we'd need <w:numPr>. We'll just write the text with the symbol.
      // E.g. "• Managed team" -> "• Managed team"
    }

    const newT = doc.createElementNS(wNamespace, 'w:t');
    newT.textContent = textContent;
    // Useful for preserving spaces
    newT.setAttribute('xml:space', 'preserve');
    
    newR.appendChild(newT);
    newP.appendChild(newR);
    newNodes.push(newP);
  }

  return newNodes;
}

/**
 * Inserts structured content into the template.
 * @param {ArrayBuffer} arrayBuffer 
 * @param {Object} mapping Map of headingText -> "SUMMARY" | "EXPERIENCE" | ...
 * @param {Object} structuredContent The JSON content from AI
 * @returns {Blob} The finalized DOCX
 */
export async function generateSmartDocument(arrayBuffer, mapping, structuredContent) {
  const PizZipLib = typeof PizZip !== 'undefined' ? PizZip : window.PizZip;
  if (!PizZipLib) throw new Error('PizZip library missing');

  let zip;
  try {
    zip = new PizZipLib(arrayBuffer);
  } catch (e) {
    throw new Error('Could not process the template file with PizZip.');
  }

  const docxFile = zip.file('word/document.xml');
  if (!docxFile) throw new Error('Template missing word/document.xml');

  const xmlString = docxFile.asText();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const wNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  const paragraphs = doc.getElementsByTagNameNS(wNamespace, 'p');
  const injectionPoints = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const text = getTextFromNode(p, wNamespace).trim();
    if (!text) continue;

    const mappedKey = mapping[text];
    if (mappedKey && structuredContent[mappedKey]) {
      let styleTemplateNode = null;
      for (let j = i + 1; j < paragraphs.length; j++) {
        if (getTextFromNode(paragraphs[j], wNamespace).trim()) {
           styleTemplateNode = paragraphs[j];
           break;
         }
      }
      
      injectionPoints.push({
        headingNode: p,
        styleTemplateNode,
        content: structuredContent[mappedKey]
      });
    }
  }

  for (let point of injectionPoints.reverse()) {
    const { headingNode, styleTemplateNode, content } = point;
    const newNodes = [];

    if (Array.isArray(content)) {
      // Handle list (e.g. skills or experience bullets)
      for (const item of content) {
        if (typeof item === 'string') {
          newNodes.push(...createParagraphNodes(doc, item, styleTemplateNode));
        } else if (typeof item === 'object') {
          // Handle complex entries like work experience
          newNodes.push(...createExperienceEntryNodes(doc, item, styleTemplateNode, wNamespace));
        }
      }
    } else {
      // Handle single block (summary)
      newNodes.push(...createParagraphNodes(doc, content, styleTemplateNode));
    }
    
    let currentNode = headingNode;
    for (const newNode of newNodes) {
      if (currentNode.nextSibling) {
        currentNode.parentNode.insertBefore(newNode, currentNode.nextSibling);
      } else {
        currentNode.parentNode.appendChild(newNode);
      }
      currentNode = newNode;
    }
  }

  const serializer = new XMLSerializer();
  let newXmlString = serializer.serializeToString(doc);
  if (!newXmlString.startsWith('<?xml')) {
    newXmlString = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + newXmlString;
  }

  zip.file('word/document.xml', newXmlString);

  return zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

function createExperienceEntryNodes(doc, exp, styleTemplate, ns) {
  const nodes = [];
  nodes.push(...createParagraphNodes(doc, exp.title, styleTemplate));
  nodes.push(...createParagraphNodes(doc, `${exp.company} | ${exp.dates}`, styleTemplate));
  for (const b of exp.bullets) {
    nodes.push(...createParagraphNodes(doc, `• ${b}`, styleTemplate));
  }
  return nodes;
}
