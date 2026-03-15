// settings/settings.js — Settings page controller

import { loadProfile, saveProfile, DEFAULT_PROFILE } from '../modules/profile.js';
import { callAI } from '../modules/provider.js';
import { validateTemplate, fileToArrayBuffer } from '../modules/template.js';
import { analyzeTemplate, extractTextFromDocx } from '../modules/templateInterpreter.js';
import { mapError } from '../modules/errorMapper.js';

// ── State ─────────────────────────────────────────────────────────────────
let profile = null;
let settings = {};
let docSettings = {};

const PROVIDER_MODELS = {
  mock: ['mock-basic'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  ollama: ['llama3', 'mistral', 'gemma', 'phi3']
};

const DEFAULT_MODELS = {
  mock: 'mock-basic',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
  ollama: 'llama3'
};

// ── DOM helpers ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  // Check for embedded mode
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbedded = urlParams.get('embed') === 'true';
  if (isEmbedded) {
    document.body.classList.add('embedded');
  }

  // Load saved data
  const stored = await chrome.storage.sync.get(['providerSettings', 'docSettings']);
  settings = stored.providerSettings || {};
  docSettings = stored.docSettings || { templateMode: 'smart' };
  if (!docSettings.templateMode) docSettings.templateMode = 'smart';
  profile = await loadProfile();

  // Populate fields
  populateProviderSection(settings);
  populateDocSection(docSettings);
  populateProfile(profile);
  await populateTemplateStatus();

  // Wire up navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      $(`section-${btn.dataset.section}`).classList.add('active');
    });
  });

  // Wire up saves
  $('btn-save-provider').addEventListener('click', saveProvider);
  $('btn-save-documents').addEventListener('click', saveDocuments);
  $('btn-save-profile').addEventListener('click', saveProfileData);

  // Provider field interactions
  $('sel-provider').addEventListener('change', () => updateProviderVisibility(true));
  $('sel-model').addEventListener('change', () => {
    if ($('sel-model').value === 'custom') {
      $('inp-custom-model').classList.remove('hidden');
      $('inp-custom-model').focus();
    } else {
      $('inp-custom-model').classList.add('hidden');
    }
  });
  $('inp-filename-pattern').addEventListener('input', updateFilenamePreview);
  $('btn-test-provider').addEventListener('click', testConnection);

  // Template uploads
  $('inp-resume-template').addEventListener('change', e => handleTemplateUpload(e, 'resume'));
  $('inp-cl-template').addEventListener('change', e => handleTemplateUpload(e, 'cover-letter'));
  $('inp-source-resume').addEventListener('change', handleSourceResumeUpload);

  // Profile dynamic list buttons
  $('btn-add-exp').addEventListener('click',  () => addExperienceEntry());
  $('btn-add-edu').addEventListener('click',  () => addEducationEntry());
  $('btn-add-cert').addEventListener('click', () => addCertEntry());

  // Template Mode Toggle
  document.querySelectorAll('input[name="templateMode"]').forEach(r => {
    r.addEventListener('change', async () => {
      updateTemplateModeVis();
      docSettings.templateMode = document.querySelector('input[name="templateMode"]:checked').value;
      await saveDocuments(); // Auto save mode
    });
  });

  updateFilenamePreview();
}

// ── Provider Section ──────────────────────────────────────────────────────
function populateProviderSection(s) {
  if (s.provider)  $('sel-provider').value  = s.provider;
  if (s.apiKey)    $('inp-apikey').value     = s.apiKey;
  if (s.endpoint)  $('inp-endpoint').value   = s.endpoint;
  if (s.simulateFailure) $('sel-simulate-failure').value = s.simulateFailure;
  updateProviderVisibility(false);
}

function updateProviderVisibility(providerChanged = false) {
  const p = $('sel-provider').value;
  const isMock = p === 'mock';
  $('group-apikey').classList.toggle('hidden',   isMock || p === 'ollama' || !p);
  $('group-endpoint').classList.toggle('hidden', p !== 'ollama');
  $('provider-test-area').style.display = isMock ? 'none' : '';
  
  const modelGroup = $('group-model');
  if (modelGroup) modelGroup.style.display = !p ? 'none' : '';
  
  updateModelDropdown(p, providerChanged);
}

function updateModelDropdown(provider, providerChanged) {
  if (!provider) return;
  const selModel = $('sel-model');
  const inpCustom = $('inp-custom-model');
  
  const currentVal = providerChanged ? DEFAULT_MODELS[provider] : (selModel.value === 'custom' ? inpCustom.value : (settings.modelName || DEFAULT_MODELS[provider]));
  
  selModel.innerHTML = '';
  const models = PROVIDER_MODELS[provider] || [];
  
  let found = false;
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    if (m === currentVal) {
      opt.selected = true;
      found = true;
    }
    selModel.appendChild(opt);
  });
  
  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = 'Custom...';
  if (!found && currentVal) {
    customOpt.selected = true;
    inpCustom.value = currentVal;
    inpCustom.classList.remove('hidden');
  } else {
    inpCustom.classList.add('hidden');
  }
  selModel.appendChild(customOpt);
}

async function saveProvider() {
  const provider = $('sel-provider').value;
  const apiKey = $('inp-apikey').value.trim();
  
  if ((provider === 'openai' || provider === 'gemini') && !apiKey) {
    $('apikey-warning').classList.remove('hidden');
  } else {
    $('apikey-warning').classList.add('hidden');
  }

  const modelVal = $('sel-model').value;
  const finalModel = modelVal === 'custom' ? $('inp-custom-model').value.trim() : modelVal;

  settings = {
    provider,
    apiKey,
    modelName: finalModel,
    endpoint:  $('inp-endpoint').value.trim(),
    simulateFailure: $('sel-simulate-failure').value,
    // carry over template names
    resumeTemplateName:      settings.resumeTemplateName      || null,
    coverLetterTemplateName: settings.coverLetterTemplateName || null,
  };
  await chrome.storage.sync.set({ providerSettings: settings });
  showToast('✅ AI settings saved');
  flashSaveBanner();
}

async function testConnection() {
  const result = $('test-result');
  const p = $('sel-provider').value;

  if (p === 'mock') {
    result.textContent = '✅ Mock Mode — no connection needed!';
    result.className = 'test-result test-ok';
    return;
  }

  result.textContent = '⏳ Testing…';
  result.className = 'test-result';

  const provider = $('sel-provider').value;
  const apiKey = $('inp-apikey').value.trim();

  if ((provider === 'openai' || provider === 'gemini') && !apiKey) {
    $('apikey-warning').classList.remove('hidden');
  } else {
    $('apikey-warning').classList.add('hidden');
  }

  const modelVal = $('sel-model').value;
  const finalModel = modelVal === 'custom' ? $('inp-custom-model').value.trim() : modelVal;

  const testSettings = {
    provider,
    apiKey,
    modelName: finalModel,
    endpoint:  $('inp-endpoint').value.trim(),
  };

  try {
    const response = await callAI(
      'You are a test assistant.',
      'Reply with only: "Connection successful"',
      testSettings
    );
    if (response.toLowerCase().includes('connection') || response.length > 0) {
      result.textContent = '✅ Connected!';
      result.className = 'test-result test-ok';
    } else {
      throw new Error('Empty response');
    }
  } catch (e) {
    const { message } = mapError(e);
    result.textContent = `❌ Failed: ${message}`;
    result.className = 'test-result test-fail';
  }
}

// ── Document Section ──────────────────────────────────────────────────────
function populateDocSection(d) {
  if (d.defaultType)       $('sel-default-type').value     = d.defaultType;
  if (d.filenamePattern)   $('inp-filename-pattern').value = d.filenamePattern;

  const rMode = document.querySelector(`input[name="templateMode"][value="${d.templateMode || 'smart'}"]`);
  if (rMode) rMode.checked = true;
  updateTemplateModeVis();

  updateFilenamePreview();
}

function updateTemplateModeVis() {
  const mode = document.querySelector('input[name="templateMode"]:checked').value;
  const isSmart = mode === 'smart';
  
  $('template-desc-smart').classList.toggle('hidden', !isSmart);
  $('template-desc-placeholders').classList.toggle('hidden', isSmart);
  $('resume-hint-smart').classList.toggle('hidden', !isSmart);
  $('resume-hint-placeholders').classList.toggle('hidden', isSmart);
  $('cl-hint-smart').classList.toggle('hidden', !isSmart);
  $('cl-hint-placeholders').classList.toggle('hidden', isSmart);
  if ($('placeholder-ref-card')) $('placeholder-ref-card').classList.toggle('hidden', isSmart);

  $('resume-placeholders').classList.add('hidden');
  $('resume-mapping-ui').classList.add('hidden');
  $('cl-placeholders').classList.add('hidden');
  $('cl-mapping-ui').classList.add('hidden');
}

function updateFilenamePreview() {
  const pattern = $('inp-filename-pattern').value || '{docType} - {company} - {jobTitle}';
  const today = new Date().toISOString().slice(0, 10);
  const sub = (t, docType) => t
    .replace(/\{jobTitle\}/gi, 'Case Worker')
    .replace(/\{company\}/gi,  'Nova Scotia Health')
    .replace(/\{date\}/gi,     today)
    .replace(/\{docType\}/gi,  docType)
    + '.docx';
  $('filename-preview-1').textContent = sub(pattern, 'Resume');
  $('filename-preview-2').textContent = sub(pattern, 'Cover Letter');
}

async function saveDocuments() {
  docSettings.defaultType = $('sel-default-type').value;
  docSettings.filenamePattern = $('inp-filename-pattern').value.trim();
  docSettings.templateMode = document.querySelector('input[name="templateMode"]:checked').value;
  
  // Also update filenamePattern in providerSettings for dashboard access
  settings.filenamePattern = docSettings.filenamePattern;
  await chrome.storage.sync.set({ docSettings, providerSettings: settings });
  showToast('✅ Document settings saved');
  flashSaveBanner();
}

// ── Templates ─────────────────────────────────────────────────────────────
async function populateTemplateStatus() {
  // Check local storage for the actual templates to confirm they exist
  const localData = await chrome.storage.local.get(['resumeTemplate', 'coverLetterTemplate', 'sourceResumeTemplate', 'sourceResumeName']);

  if (localData.sourceResumeTemplate) {
    $('source-resume-badge').classList.remove('hidden');
    const name = localData.sourceResumeName || 'source resume';
    $('source-upload-text').textContent = `${name} uploaded ✓ (click to replace)`;
    $('source-resume-active-bar').textContent = `📄 Active Source: ${name}`;
    $('source-resume-active-bar').classList.remove('hidden');
  }

  if (localData.resumeTemplate) {
    $('resume-template-badge').classList.remove('hidden');
    const name = settings.resumeTemplateName || 'resume template';
    $('resume-upload-text').textContent = `${name} uploaded ✓ (click to replace)`;
    updateTemplateStatusBar('resume', name);
  }
  if (localData.coverLetterTemplate) {
    $('cl-template-badge').classList.remove('hidden');
    const name = settings.coverLetterTemplateName || 'cover letter template';
    $('cl-upload-text').textContent = `${name} uploaded ✓ (click to replace)`;
    updateTemplateStatusBar('cover-letter', name);
  }
}

/**
 * Shows or updates the persistent active-template strip below the upload area.
 * @param {'resume'|'cover-letter'} docType
 * @param {string} filename
 */
function updateTemplateStatusBar(docType, filename) {
  const barId = docType === 'resume' ? 'resume-active-bar' : 'cl-active-bar';
  const bar = $(barId);
  if (!bar) return;
  bar.textContent = `📄 Active template: ${filename}`;
  bar.classList.remove('hidden');
}

async function handleTemplateUpload(event, docType) {
  const file = event.target.files?.[0];
  if (!file) return;

  const isResume = docType === 'resume';
  const badgeId  = isResume ? 'resume-template-badge' : 'cl-template-badge';
  const textId   = isResume ? 'resume-upload-text'    : 'cl-upload-text';
  const phListId = isResume ? 'resume-placeholders'   : 'cl-placeholders';
  const mappingUiId = isResume ? 'resume-mapping-ui'  : 'cl-mapping-ui';
  const mode = docSettings.templateMode || 'smart';

  try {
    const ab = await fileToArrayBuffer(file);
    const b64 = arrayBufferToBase64(ab);
    const localPayload = {};
    if (isResume) {
      localPayload.resumeTemplate = b64;
      settings.resumeTemplateName = file.name;
    } else {
      localPayload.coverLetterTemplate = b64;
      settings.coverLetterTemplateName = file.name;
    }

    if (mode === 'smart') {
      const { headings, foundFormat } = await analyzeTemplate(ab);
      await chrome.storage.local.set(localPayload);
      await chrome.storage.sync.set({ providerSettings: settings });
      
      $(badgeId).classList.remove('hidden');
      $(textId).textContent = `${file.name} uploaded ✓ (click to replace)`;
      updateTemplateStatusBar(docType, file.name);

      renderMappingUi(docType, headings, mappingUiId);
      showToast(`✅ Template uploaded: ${headings.length} section(s) detected`);

      if (foundFormat === 'placeholders') {
        setTimeout(() => showToast('Info: Detected tags {{}}, but using Smart Headings.'), 3500);
      }
    } else {
      const { placeholders, warnings } = await validateTemplate(ab);
      await chrome.storage.local.set(localPayload);
      await chrome.storage.sync.set({ providerSettings: settings });

      $(badgeId).classList.remove('hidden');
      $(textId).textContent = `${file.name} uploaded ✓ (click to replace)`;
      updateTemplateStatusBar(docType, file.name);

      const phList = $(phListId);
      phList.classList.remove('hidden');
      phList.innerHTML = `
        <strong>Detected placeholders (${placeholders.length}):</strong>
        <div class="found">${placeholders.map(p => `<span class="ph-tag">${p}</span>`).join('')}</div>
        ${warnings.map(w => `<div class="placeholder-warning">⚠️ ${w}</div>`).join('')}
      `;
      if (!placeholders.length) {
        phList.innerHTML = '<div class="placeholder-warning">⚠️ No <code>{{PLACEHOLDER}}</code> tags found. Make sure your template uses double curly brace placeholders.</div>';
      }

      showToast(`✅ Template uploaded: ${placeholders.length} placeholder(s) detected`);
    }

  } catch (e) {
    showToast(`❌ Template error: ${e.message}`);
  }
}

async function handleSourceResumeUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const ab = await fileToArrayBuffer(file);
    const b64 = arrayBufferToBase64(ab);
    const plainText = await extractTextFromDocx(ab);

    // Save full docx back as sourceResumeTemplate for layout fallback
    // Save plain text for AI
    await chrome.storage.local.set({
      sourceResumeTemplate: b64,
      sourceResumeText: plainText,
      sourceResumeName: file.name
    });

    $('source-resume-badge').classList.remove('hidden');
    $('source-upload-text').textContent = `${file.name} uploaded ✓ (click to replace)`;
    $('source-resume-active-bar').textContent = `📄 Active Source: ${file.name}`;
    $('source-resume-active-bar').classList.remove('hidden');

    showToast(`✅ Source Resume uploaded and text extracted.`);
    
    // Auto-fill profile if AI is configured
    if (settings.provider && settings.provider !== 'mock') {
      try {
        const { extractProfileFromResume } = await import('../modules/extraction.js');
        showToast(`🤖 AI is analyzing your resume to auto-fill your profile... (This may take a few seconds)`);
        
        const extractedData = await extractProfileFromResume(plainText, settings);
        
        // Merge extracted data into current profile
        profile = {
          ...profile,
          personal: { ...(profile.personal || {}), ...(extractedData.personal || {}) },
          skills: extractedData.skills || profile.skills || [],
          // Replace lists to avoid duplication problems if re-uploaded, but user can always edit
          summaries: extractedData.summaries?.length ? extractedData.summaries : profile.summaries,
          experience: extractedData.experience?.length ? extractedData.experience : profile.experience,
          education: extractedData.education?.length ? extractedData.education : profile.education,
          certifications: extractedData.certifications?.length ? extractedData.certifications : profile.certifications,
        };
        
        populateProfile(profile);
        
        // Let the user know they need to save
        setTimeout(() => showToast(`✨ Profile fields auto-filled! Please review and click "Save Profile" at the bottom.`), 3500);
      } catch (aiError) {
        console.error("AI Profile Extraction failed:", aiError);
        const { message } = mapError(aiError);
        setTimeout(() => showToast(`⚠️ Resume uploaded, but AI profile extraction failed: ${message}`), 3500);
      }
    }

  } catch (e) {
    showToast(`❌ Source Resume error: ${e.message}`);
  }
}

function renderMappingUi(docType, headings, containerId) {
  const container = $(containerId);
  container.classList.remove('hidden');
  container.innerHTML = `
    <strong style="margin-bottom:8px; display:block;">Map Headers to Content Sections:</strong>
    <p class="field-hint" style="margin-bottom:12px;">We detected these headings. Tell us what section they represent.</p>
  `;

  const options = docType === 'resume' 
    ? ['IGNORE', 'SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILLS', 'CERTIFICATIONS', 'CONTACT']
    : ['IGNORE', 'COVER_LETTER_BODY', 'DATE', 'CONTACT'];

  docSettings.templateMapping = docSettings.templateMapping || {};
  const docMappingMap = docSettings.templateMapping[docType] || {};

  headings.forEach(h => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid var(--border-light);';
    
    let bestMatch = 'IGNORE';
    if (docMappingMap[h]) {
      bestMatch = docMappingMap[h];
    } else {
      const H = h.toUpperCase();
      options.forEach(opt => {
         if (opt !== 'IGNORE' && H.includes(opt.replace('_', ' '))) {
           bestMatch = opt;
         }
      });
      if (H.includes('PROFILE') || H.includes('ABOUT')) bestMatch = 'SUMMARY';
      if (H.includes('EMPLOYMENT') || H.includes('WORK') || H.includes('HISTORY')) bestMatch = 'EXPERIENCE';
    }

    const select = document.createElement('select');
    select.className = 'mapping-select';
    select.dataset.heading = h;
    select.dataset.docType = docType;
    // Basic styling for the select inline to avoid messing with CSS too much
    select.style.padding = '4px';
    select.style.borderRadius = '4px';

    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt === 'IGNORE' ? '— Ignore —' : opt.replace(/_/g, ' ');
      if (opt === bestMatch) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      saveMapping(docType, h, select.value);
    });
    // save initially guessed
    saveMapping(docType, h, bestMatch, false);

    row.innerHTML = `<span style="font-family:var(--font-mono); font-size:13px; color:var(--text); background:var(--bg-hover); padding:2px 6px; border-radius:4px;">${escHtml(h)}</span>`;
    row.appendChild(select);
    container.appendChild(row);
  });

  if (headings.length === 0) {
    container.innerHTML += `<div class="placeholder-warning">⚠️ No standard headings detected. Please ensure your document has short section headers.</div>`;
  }
}

async function saveMapping(docType, heading, role, showNotification = true) {
  docSettings.templateMapping = docSettings.templateMapping || {};
  docSettings.templateMapping[docType] = docSettings.templateMapping[docType] || {};
  docSettings.templateMapping[docType][heading] = role;
  await chrome.storage.sync.set({ docSettings });
  if (showNotification) showToast('✅ Mapping saved');
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

// ── Profile Section ───────────────────────────────────────────────────────
function populateProfile(p) {
  // Personal
  $('p-name').value      = p.personal?.fullName  || '';
  $('p-email').value     = p.personal?.email     || '';
  $('p-phone').value     = p.personal?.phone     || '';
  $('p-address').value   = p.personal?.address   || '';
  $('p-linkedin').value  = p.personal?.linkedin  || '';
  $('p-portfolio').value = p.personal?.portfolio || '';

  // Skills
  $('p-skills').value = (p.skills || []).join('\n');

  // Do not claim
  $('p-do-not-claim').value = p.doNotClaimNotes || '';

  // Summaries
  renderSummaries(p.summaries || DEFAULT_PROFILE.summaries);

  // Dynamic lists
  (p.experience    || []).forEach(exp  => addExperienceEntry(exp));
  (p.education     || []).forEach(edu  => addEducationEntry(edu));
  (p.certifications|| []).forEach(cert => addCertEntry(cert));
}

// ── Summaries ─────────────────────────────────────────────────────────────
function renderSummaries(summaries) {
  const container = $('summaries-list');
  container.innerHTML = '';
  summaries.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'summary-entry';
    row.style.cssText = 'display:grid;grid-template-columns:150px 1fr auto;gap:8px;align-items:flex-start;margin-bottom:8px;';
    row.innerHTML = `
      <input type="text" value="${escHtml(s.label)}" placeholder="Label" data-sum-label="${i}" class="summary-label-input" />
      <textarea rows="3" placeholder="Write your summary here…" data-sum-text="${i}" class="summary-text-input">${escHtml(s.text)}</textarea>
      <button class="btn-remove" data-sum-remove="${i}" title="Remove">✕</button>
    `;
    container.appendChild(row);
  });

  // Add button
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add';
  addBtn.type = 'button';
  addBtn.textContent = '+ Add Summary Variant';
  addBtn.addEventListener('click', () => {
    const existing = readSummaries();
    existing.push({ label: 'New Summary', text: '' });
    renderSummaries(existing);
  });
  container.appendChild(addBtn);

  // Remove buttons
  container.querySelectorAll('[data-sum-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const existing = readSummaries();
      existing.splice(Number(btn.dataset.sumRemove), 1);
      renderSummaries(existing);
    });
  });
}

function readSummaries() {
  const labels = document.querySelectorAll('.summary-label-input');
  const texts  = document.querySelectorAll('.summary-text-input');
  const result = [];
  labels.forEach((l, i) => result.push({ label: l.value, text: texts[i]?.value || '' }));
  return result;
}

// ── Experience ────────────────────────────────────────────────────────────
function addExperienceEntry(data = {}) {
  const container = $('experience-list');
  const id = Date.now() + Math.random();
  const div = document.createElement('div');
  div.className = 'exp-entry';
  div.dataset.expId = id;
  div.innerHTML = `
    <div class="entry-header">
      <span class="entry-title-preview">${escHtml(data.title || 'New Role')}</span>
      <button class="btn-remove" title="Remove role">✕</button>
    </div>
    <div class="entry-sub-grid">
      <div class="field-group">
        <label>Job Title</label>
        <input type="text" class="exp-title" value="${escHtml(data.title || '')}" placeholder="e.g. Case Worker" />
      </div>
      <div class="field-group">
        <label>Company</label>
        <input type="text" class="exp-company" value="${escHtml(data.company || '')}" placeholder="e.g. Nova Scotia Health" />
      </div>
      <div class="field-group">
        <label>Dates</label>
        <input type="text" class="exp-dates" value="${escHtml(data.dates || '')}" placeholder="e.g. Jan 2022 – Present" />
      </div>
      <div class="field-group">
        <label>Location</label>
        <input type="text" class="exp-location" value="${escHtml(data.location || '')}" placeholder="e.g. Halifax, NS" />
      </div>
    </div>
    <div class="field-group">
      <label>Key Responsibilities / Bullet Points</label>
      <textarea class="exp-bullets" rows="4" placeholder="• Managed caseloads of 40+ clients&#10;• Coordinated with multidisciplinary teams&#10;• Maintained documentation in CRM system">${escHtml(data.bullets || '')}</textarea>
    </div>
    <div class="field-group">
      <label>Sector Tags (comma-separated)</label>
      <input type="text" class="exp-tags" value="${escHtml((data.tags || []).join(', '))}" placeholder="customer service, case management, social support" />
    </div>
  `;
  container.appendChild(div);

  // Update preview on title change
  div.querySelector('.exp-title').addEventListener('input', e => {
    div.querySelector('.entry-title-preview').textContent = e.target.value || 'New Role';
  });
  div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
}

function readExperience() {
  return [...document.querySelectorAll('.exp-entry')].map(div => ({
    title:    div.querySelector('.exp-title').value,
    company:  div.querySelector('.exp-company').value,
    dates:    div.querySelector('.exp-dates').value,
    location: div.querySelector('.exp-location').value,
    bullets:  div.querySelector('.exp-bullets').value,
    tags:     div.querySelector('.exp-tags').value.split(',').map(t => t.trim()).filter(Boolean),
  }));
}

// ── Education ─────────────────────────────────────────────────────────────
function addEducationEntry(data = {}) {
  const container = $('education-list');
  const div = document.createElement('div');
  div.className = 'edu-entry';
  div.innerHTML = `
    <div class="entry-header">
      <span class="entry-title-preview">${escHtml(data.degree || 'New Degree')}</span>
      <button class="btn-remove" title="Remove">✕</button>
    </div>
    <div class="entry-sub-grid">
      <div class="field-group">
        <label>Degree / Diploma / Certificate</label>
        <input type="text" class="edu-degree" value="${escHtml(data.degree || '')}" placeholder="e.g. Bachelor of Social Work" />
      </div>
      <div class="field-group">
        <label>School / Institution</label>
        <input type="text" class="edu-school" value="${escHtml(data.school || '')}" placeholder="e.g. Dalhousie University" />
      </div>
      <div class="field-group">
        <label>Year</label>
        <input type="text" class="edu-year" value="${escHtml(data.year || '')}" placeholder="e.g. 2019" />
      </div>
      <div class="field-group">
        <label>Notes</label>
        <input type="text" class="edu-notes" value="${escHtml(data.notes || '')}" placeholder="e.g. Dean's List, Minor in Psychology" />
      </div>
    </div>
  `;
  container.appendChild(div);
  div.querySelector('.edu-degree').addEventListener('input', e => {
    div.querySelector('.entry-title-preview').textContent = e.target.value || 'New Degree';
  });
  div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
}

function readEducation() {
  return [...document.querySelectorAll('.edu-entry')].map(div => ({
    degree: div.querySelector('.edu-degree').value,
    school: div.querySelector('.edu-school').value,
    year:   div.querySelector('.edu-year').value,
    notes:  div.querySelector('.edu-notes').value,
  }));
}

// ── Certifications ────────────────────────────────────────────────────────
function addCertEntry(data = {}) {
  const container = $('certifications-list');
  const div = document.createElement('div');
  div.className = 'cert-entry';
  div.innerHTML = `
    <div class="entry-header">
      <span class="entry-title-preview">${escHtml(data.name || 'New Certification')}</span>
      <button class="btn-remove" title="Remove">✕</button>
    </div>
    <div class="entry-sub-grid">
      <div class="field-group">
        <label>Certification Name</label>
        <input type="text" class="cert-name" value="${escHtml(data.name || '')}" placeholder="e.g. WHMIS 2015" />
      </div>
      <div class="field-group">
        <label>Issuer</label>
        <input type="text" class="cert-issuer" value="${escHtml(data.issuer || '')}" placeholder="e.g. Canadian Centre for Occupational Health" />
      </div>
      <div class="field-group">
        <label>Year</label>
        <input type="text" class="cert-year" value="${escHtml(data.year || '')}" placeholder="e.g. 2023" />
      </div>
      <div class="field-group" style="display:flex;flex-direction:row;align-items:center;gap:8px;padding-top:22px;">
        <input type="checkbox" id="do-not-claim-${data.name || 'cert'}" class="cert-dnc" ${data.doNotClaim ? 'checked' : ''} />
        <label for="do-not-claim-${data.name || 'cert'}" style="color:var(--warning);font-size:11.5px;cursor:pointer;">Do not claim unless specified</label>
      </div>
    </div>
  `;
  container.appendChild(div);
  div.querySelector('.cert-name').addEventListener('input', e => {
    div.querySelector('.entry-title-preview').textContent = e.target.value || 'New Certification';
  });
  div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
}

function readCertifications() {
  return [...document.querySelectorAll('.cert-entry')].map(div => ({
    name:       div.querySelector('.cert-name').value,
    issuer:     div.querySelector('.cert-issuer').value,
    year:       div.querySelector('.cert-year').value,
    doNotClaim: div.querySelector('.cert-dnc').checked,
  }));
}

// ── Save Profile ──────────────────────────────────────────────────────────
async function saveProfileData() {
  profile = {
    personal: {
      fullName:  $('p-name').value.trim(),
      email:     $('p-email').value.trim(),
      phone:     $('p-phone').value.trim(),
      address:   $('p-address').value.trim(),
      linkedin:  $('p-linkedin').value.trim(),
      portfolio: $('p-portfolio').value.trim(),
    },
    summaries:      readSummaries(),
    skills:         $('p-skills').value.split('\n').map(s => s.trim()).filter(Boolean),
    experience:     readExperience(),
    education:      readEducation(),
    certifications: readCertifications(),
    doNotClaimNotes: $('p-do-not-claim').value.trim(),
  };

  await saveProfile(profile);
  showToast('✅ Profile saved');
  flashSaveBanner();
}

// ── UI Helpers ────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

function flashSaveBanner() {
  const b = $('save-banner');
  b.classList.remove('hidden');
  setTimeout(() => b.classList.add('hidden'), 2000);
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Boot ──────────────────────────────────────────────────────────────────
init().catch(console.error);
