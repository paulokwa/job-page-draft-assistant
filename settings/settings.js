// settings/settings.js — Settings page controller

import { loadProfile, saveProfile, DEFAULT_PROFILE } from '../modules/profile.js';
import { callAI } from '../modules/provider.js';
import { validateTemplate, fileToArrayBuffer } from '../modules/template.js';

// ── State ─────────────────────────────────────────────────────────────────
let profile = null;
let settings = {};

// ── DOM helpers ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  // Load saved data
  const stored = await chrome.storage.sync.get(['providerSettings', 'docSettings']);
  settings = stored.providerSettings || {};
  const docSettings = stored.docSettings || {};
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
  $('sel-provider').addEventListener('change', updateProviderVisibility);
  $('inp-filename-pattern').addEventListener('input', updateFilenamePreview);
  $('btn-test-provider').addEventListener('click', testConnection);

  // Template uploads
  $('inp-resume-template').addEventListener('change', e => handleTemplateUpload(e, 'resume'));
  $('inp-cl-template').addEventListener('change', e => handleTemplateUpload(e, 'cover-letter'));

  // Profile dynamic list buttons
  $('btn-add-exp').addEventListener('click',  () => addExperienceEntry());
  $('btn-add-edu').addEventListener('click',  () => addEducationEntry());
  $('btn-add-cert').addEventListener('click', () => addCertEntry());

  updateFilenamePreview();
}

// ── Provider Section ──────────────────────────────────────────────────────
function populateProviderSection(s) {
  if (s.provider)  $('sel-provider').value  = s.provider;
  if (s.apiKey)    $('inp-apikey').value     = s.apiKey;
  if (s.modelName) $('inp-model').value      = s.modelName;
  if (s.endpoint)  $('inp-endpoint').value   = s.endpoint;
  updateProviderVisibility();
}

function updateProviderVisibility() {
  const p = $('sel-provider').value;
  const isMock = p === 'mock';
  $('group-apikey').classList.toggle('hidden',   isMock || p === 'ollama' || !p);
  $('group-endpoint').classList.toggle('hidden', p !== 'ollama');
  // Hide model field and test area for mock
  $('provider-test-area').style.display = isMock ? 'none' : '';
  const modelGroup = $('inp-model').closest('.field-group');
  if (modelGroup) modelGroup.style.display = isMock ? 'none' : '';
}

async function saveProvider() {
  settings = {
    provider:  $('sel-provider').value,
    apiKey:    $('inp-apikey').value.trim(),
    modelName: $('inp-model').value.trim(),
    endpoint:  $('inp-endpoint').value.trim(),
    // carry over template data
    resumeTemplate:      settings.resumeTemplate      || null,
    coverLetterTemplate: settings.coverLetterTemplate || null,
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

  const testSettings = {
    provider:  p,
    apiKey:    $('inp-apikey').value.trim(),
    modelName: $('inp-model').value.trim(),
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
    result.textContent = `❌ Failed: ${e.message}`;
    result.className = 'test-result test-fail';
  }
}

// ── Document Section ──────────────────────────────────────────────────────
function populateDocSection(d) {
  if (d.defaultType)       $('sel-default-type').value     = d.defaultType;
  if (d.filenamePattern)   $('inp-filename-pattern').value = d.filenamePattern;
  updateFilenamePreview();
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
  const docSettings = {
    defaultType:     $('sel-default-type').value,
    filenamePattern: $('inp-filename-pattern').value.trim(),
  };
  // Also update filenamePattern in providerSettings for dashboard access
  settings.filenamePattern = docSettings.filenamePattern;
  await chrome.storage.sync.set({ docSettings, providerSettings: settings });
  showToast('✅ Document settings saved');
  flashSaveBanner();
}

// ── Templates ─────────────────────────────────────────────────────────────
async function populateTemplateStatus() {
  if (settings.resumeTemplate) {
    $('resume-template-badge').classList.remove('hidden');
    $('resume-upload-text').textContent = 'Resume template uploaded ✓ (click to replace)';
  }
  if (settings.coverLetterTemplate) {
    $('cl-template-badge').classList.remove('hidden');
    $('cl-upload-text').textContent = 'Cover letter template uploaded ✓ (click to replace)';
  }
}

async function handleTemplateUpload(event, docType) {
  const file = event.target.files?.[0];
  if (!file) return;

  const isResume = docType === 'resume';
  const badgeId  = isResume ? 'resume-template-badge' : 'cl-template-badge';
  const textId   = isResume ? 'resume-upload-text'    : 'cl-upload-text';
  const phListId = isResume ? 'resume-placeholders'   : 'cl-placeholders';

  try {
    const ab = await fileToArrayBuffer(file);
    const { placeholders, warnings } = await validateTemplate(ab);

    // Store as base64 in settings
    const b64 = arrayBufferToBase64(ab);
    if (isResume) {
      settings.resumeTemplate = b64;
    } else {
      settings.coverLetterTemplate = b64;
    }
    await chrome.storage.sync.set({ providerSettings: settings });

    // Update UI
    $(badgeId).classList.remove('hidden');
    $(textId).textContent = `${file.name} uploaded ✓ (click to replace)`;

    // Show placeholders
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
  } catch (e) {
    showToast(`❌ Template error: ${e.message}`);
  }
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
