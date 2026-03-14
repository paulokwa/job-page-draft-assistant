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
 * Parses the document XML and heuristically identifies likely section headings.
 * @param {ArrayBuffer} arrayBuffer The DOCX file ArrayBuffer
 * @returns {Promise<{ foundFormat: 'placeholders' | 'smart', headings: string[], placeholders: string[] }>}
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

  // Parse XML to look for headings
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const wNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  
  const headings = [];
  const paragraphs = doc.getElementsByTagNameNS(wNamespace, 'p');
  
  for (const p of paragraphs) {
    // Extract text from paragraph
    const runs = p.getElementsByTagNameNS(wNamespace, 'r');
    let text = '';
    for (const r of runs) {
      const textNodes = r.getElementsByTagNameNS(wNamespace, 't');
      for (const t of textNodes) {
        text += t.textContent;
      }
    }
    
    text = text.trim();
    if (!text) continue;
    
    // Simple heuristics for heading detection:
    // Short line (under 60 chars) AND (all uppercase OR title case)
    const isShort = text.length > 0 && text.length < 60;
    const isAllUpperCase = text === text.toUpperCase() && /[A-Z]/.test(text);
    // Rough check for title case (first letter of words usually capitalized, no common bullet chars at start)
    const isTitleCase = /^[A-Z][a-z]/.test(text) && !text.startsWith('•') && !text.startsWith('-');
    
    // Filter out apparent contact info lines if they contain emails or phones
    const hasEmail = text.includes('@');
    const hasPhone = /\\d{3}[-\\s]?\\d{3}[-\\s]?\\d{4}/.test(text);
    
    if (isShort && (isAllUpperCase || isTitleCase) && !hasEmail && !hasPhone) {
      headings.push({
        text,
        // We could store an index or identifier, but we will match by text later
      });
    }
  }
  
  return {
    foundFormat: foundPlaceholders.size > 0 ? 'placeholders' : 'smart',
    headings: headings.map(h => h.text),
    placeholders: [...foundPlaceholders].sort()
  };
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
 * Inserts content into the template under the specified headings.
 * @param {ArrayBuffer} arrayBuffer 
 * @param {Object} mapping Map of headingText -> "SUMMARY" | "EXPERIENCE" | ...
 * @param {Object} sectionsContent Map of "SUMMARY" -> "actual draft text"
 * @returns {Blob} The finalized DOCX
 */
export async function generateSmartDocument(arrayBuffer, mapping, sectionsContent) {
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

  // We need to find the headings, and for each heading, find its "next" sibling paragraph to understand body styling.
  // Then we inject the generated nodes there. We process in reverse order so node insertion doesn't mess up iterators, 
  // or we can just collect the injection points and do it safely.
  
  const injectionPoints = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    // Extract text from paragraph
    const runs = p.getElementsByTagNameNS(wNamespace, 'r');
    let text = '';
    for (const r of runs) {
      const textNodes = r.getElementsByTagNameNS(wNamespace, 't');
      for (const t of textNodes) {
        text += t.textContent;
      }
    }
    
    text = text.trim();
    if (!text) continue;

    // Check if this text matches any mapped heading exact text
    const standardSectionKey = mapping[text];
    if (standardSectionKey && sectionsContent[standardSectionKey]) {
      // we found a heading that user mapped, and we have content for it.
      
      // Look ahead for style template. We'll find the next non-empty paragraph that isn't a heading itself
      let styleTemplateNode = null;
      for (let j = i + 1; j < paragraphs.length; j++) {
        const nextPText = paragraphs[j].textContent.trim();
        if (nextPText.length > 0) { // simplistic check
           styleTemplateNode = paragraphs[j];
           break;
        }
      }
      
      // If we didn't find a style template (e.g. at end of document), fallback to the heading node itself 
      // although that might make text bold/large, it's better than nothing, or null to rely on Word defaults.
      // Let's actually prefer null if no sibling found so it uses "Normal" style rather than duplicating Heading style.
      
      injectionPoints.push({
        headingNode: p,
        styleTemplateNode,
        content: sectionsContent[standardSectionKey]
      });
    }
  }

  // Inject content in reverse to maintain DOM integrity (if we insert before/after, we don't invalidate later nodes)
  for (let point of injectionPoints.reverse()) {
    const { headingNode, styleTemplateNode, content } = point;
    const newNodes = createParagraphNodes(doc, content, styleTemplateNode);
    
    // Insert new nodes immediately after the heading node
    let currentNode = headingNode;
    for (const newNode of newNodes) {
      if (currentNode.nextSibling) {
        currentNode.parentNode.insertBefore(newNode, currentNode.nextSibling);
      } else {
        currentNode.parentNode.appendChild(newNode);
      }
      currentNode = newNode;
    }
    
    // Optional: if there was sample text under the heading (before the next heading), maybe we should delete it?
    // Wait, requirement 1 statement: "The template may contain empty space under these headings."
    // We will just insert after the heading. The user can leave empty space. If they had dummy text, it might remain.
    // For V1, simple insert is safer than attempting to delete dummy text which might accidentally delete the next section if our heuristics fail.
  }

  // Serialize back to string
  const serializer = new XMLSerializer();
  let newXmlString = serializer.serializeToString(doc);
  
  // Note: DOMParser/XMLSerializer might drop the XML declaration <?xml ...?> so let's prepend it if needed
  if (!newXmlString.startsWith('<?xml')) {
    newXmlString = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\\n' + newXmlString;
  }

  // Update zip
  zip.file('word/document.xml', newXmlString);

  // Generate Blob
  const out = zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  return out;
}
