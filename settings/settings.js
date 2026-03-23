// settings/settings.js — Settings page controller (Redesigned for HTML-First System)

import { extractProfileFromResume, extractTextFromDocx, fileToArrayBuffer } from '../modules/extraction.js';
import { loadProfile, saveProfile } from '../modules/profile.js';
import { callAI } from '../modules/provider.js';
import { mapError } from '../modules/errorMapper.js';

// ── State ─────────────────────────────────────────────────────────────────
let profile = null;
let settings = {};
let docSettings = {};

const PROVIDER_MODELS = {
  mock: ['mock-basic'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-pro', 'gemini-1.5-pro'],
  ollama: ['llama3', 'mistral', 'gemma', 'phi3']
};

const DEFAULT_MODELS = {
  mock: 'mock-basic',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
  ollama: 'llama3'
};

const $ = id => document.getElementById(id);

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('embed') === 'true') document.body.classList.add('embedded');

  // Load saved data
  const stored = await chrome.storage.sync.get(['providerSettings', 'docSettings']);
  settings = stored.providerSettings || {};
  docSettings = stored.docSettings || { templateMode: 'smart' };
  profile = await loadProfile();

  // Populate sections
  populateProviderSection(settings);
  populateDocSection(docSettings);
  populateProfile(profile);
  await populateSourceStatus();

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      $(`section-${btn.dataset.section}`).classList.add('active');
    });
  });

  // Wiring
  $('btn-save-provider').addEventListener('click', saveProvider);
  $('btn-save-documents').addEventListener('click', saveDocuments);
  $('btn-save-profile').addEventListener('click', saveProfileData);
  
  $('sel-provider').addEventListener('change', () => updateProviderVisibility(true));
  $('sel-model').addEventListener('change', () => {
    $('inp-custom-model').classList.toggle('hidden', $('sel-model').value !== 'custom');
  });
  
  $('inp-filename-pattern').addEventListener('input', updateFilenamePreview);
  $('btn-test-provider').addEventListener('click', testConnection);
  $('inp-source-resume').addEventListener('change', handleSourceResumeUpload);

  // Dynamic lists
  $('btn-add-exp').addEventListener('click',  () => addExperienceEntry());
  $('btn-add-edu').addEventListener('click',  () => addEducationEntry());
  $('btn-add-cert').addEventListener('click', () => addCertEntry());

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
  $('group-apikey').classList.toggle('hidden', isMock || p === 'ollama' || !p);
  $('group-endpoint').classList.toggle('hidden', p !== 'ollama');
  $('provider-test-area').style.display = isMock ? 'none' : '';
  updateModelDropdown(p, providerChanged);
}

function updateModelDropdown(provider, providerChanged) {
  if (!provider) return;
  const selModel = $('sel-model');
  const inpCustom = $('inp-custom-model');
  const currentVal = providerChanged ? DEFAULT_MODELS[provider] : (settings.modelName || DEFAULT_MODELS[provider]);
  
  selModel.innerHTML = '';
  (PROVIDER_MODELS[provider] || []).forEach(m => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = m;
    if (m === currentVal) opt.selected = true;
    selModel.appendChild(opt);
  });
  
  const customOpt = document.createElement('option');
  customOpt.value = 'custom'; customOpt.textContent = 'Custom...';
  selModel.appendChild(customOpt);
}

async function saveProvider() {
  const provider = $('sel-provider').value;
  const modelVal = $('sel-model').value;
  settings = {
    ...settings,
    provider,
    apiKey: $('inp-apikey').value.trim(),
    modelName: modelVal === 'custom' ? $('inp-custom-model').value.trim() : modelVal,
    endpoint:  $('inp-endpoint').value.trim(),
    simulateFailure: $('sel-simulate-failure').value,
  };
  await chrome.storage.sync.set({ providerSettings: settings });
  showToast('✅ AI settings saved');
}

async function testConnection() {
  const result = $('test-result');
  const provider = $('sel-provider').value;
  if (provider === 'mock') {
    result.textContent = '✅ Mock Mode — no connection needed!';
    return;
  }
  result.textContent = '⏳ Testing…';
  try {
    const response = await callAI('You are a test assistant.', 'Reply with: "Connected"', settings);
    result.textContent = response ? '✅ Connected!' : '❌ Empty response';
  } catch (e) {
    result.textContent = `❌ Failed: ${mapError(e).message}`;
  }
}

// ── Document Section ──────────────────────────────────────────────────────
function populateDocSection(d) {
  if (d.defaultType) $('sel-default-type').value = d.defaultType;
  if (d.filenamePattern) $('inp-filename-pattern').value = d.filenamePattern;
  updateFilenamePreview();
}

function updateFilenamePreview() {
  const pattern = $('inp-filename-pattern').value || '{docType} - {company} - {jobTitle}';
  const today = new Date().toISOString().slice(0, 10);
  const sub = (t, docType) => t
    .replace(/\{jobTitle\}/gi, 'Role')
    .replace(/\{company\}/gi,  'Company')
    .replace(/\{date\}/gi,     today)
    .replace(/\{docType\}/gi,  docType)
    + '.pdf';
  $('filename-preview-1').textContent = sub(pattern, 'Resume');
  $('filename-preview-2').textContent = sub(pattern, 'Cover Letter');
}

async function saveDocuments() {
  docSettings.defaultType = $('sel-default-type').value;
  docSettings.filenamePattern = $('inp-filename-pattern').value.trim();
  await chrome.storage.sync.set({ docSettings });
  showToast('✅ Document settings saved');
}

// ── Source Resume & Profile ───────────────────────────────────────────────
async function populateSourceStatus() {
  const localData = await chrome.storage.local.get(['sourceResumeName']);
  if (localData.sourceResumeName) {
    $('source-upload-text').textContent = `${localData.sourceResumeName} uploaded ✓`;
    $('source-resume-active-bar').textContent = `📄 Active Source: ${localData.sourceResumeName}`;
    $('source-resume-active-bar').classList.remove('hidden');
  }
}

// Dynamically loads pizzip.js as a global script (needed for DOCX parsing)
function loadPizZip() {
  if (typeof PizZip !== 'undefined') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '../lib/pizzip.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load PizZip library.'));
    document.head.appendChild(s);
  });
}

// Reads a PDF file's text content using FileReader (works for text-based PDFs)
function extractTextFromPdf(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const bytes = new Uint8Array(e.target.result);
      // Pull raw text strings from PDF bytes (basic approach — good enough for AI parsing)
      let text = '';
      for (let i = 0; i < bytes.length - 1; i++) {
        const c = bytes[i];
        if (c >= 32 && c < 127) {
          text += String.fromCharCode(c);
        } else if (c === 10 || c === 13) {
          text += '\n';
        }
      }
      // Filter out short/garbage lines of PDF binary noise
      const cleaned = text.split('\n')
        .filter(line => line.trim().length > 3)
        .join('\n');
      resolve(cleaned);
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file.'));
    reader.readAsArrayBuffer(file);
  });
}

async function handleSourceResumeUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const statusEl = $('profile-autofill-status');
  statusEl.textContent = '📄 Reading file...';
  statusEl.classList.remove('hidden');

  try {
    let plainText = '';
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.name.toLowerCase().endsWith('.docx');

    if (isDocx) {
      statusEl.textContent = '📄 Loading DOCX parser...';
      await loadPizZip();
      const ab = await fileToArrayBuffer(file);
      plainText = await extractTextFromDocx(ab);
    } else if (isPdf) {
      statusEl.textContent = '📄 Reading PDF...';
      plainText = await extractTextFromPdf(file);
    } else {
      throw new Error('Unsupported file type. Please upload a .docx or .pdf file.');
    }

    if (!plainText || plainText.trim().length < 50) {
      throw new Error('Could not extract enough text from the file. Please try a different format.');
    }

    await chrome.storage.local.set({
      sourceResumeText: plainText,
      sourceResumeName: file.name
    });

    $('source-upload-text').textContent = `${file.name} uploaded ✓`;
    $('source-resume-active-bar').textContent = `📄 Active Source: ${file.name}`;
    $('source-resume-active-bar').classList.remove('hidden');

    showToast('✅ Resume uploaded. Starting AI auto-fill...');
    
    if (settings.provider && settings.provider !== 'mock') {
      statusEl.textContent = '🤖 AI is analyzing your resume to auto-fill your profile...';
      const extractedData = await extractProfileFromResume(plainText, settings);
      
      profile = {
        ...profile,
        personalInfo: { ...profile.personalInfo, ...(extractedData.personalInfo || extractedData.personal || {}) },
        skills: extractedData.skills || profile.skills,
        experience: extractedData.experience || profile.experience,
        education: extractedData.education || profile.education,
        certifications: extractedData.certifications || profile.certifications,
      };
      
      populateProfile(profile);
      statusEl.textContent = '✨ Profile fields auto-filled! Review and click "Save Profile" below.';
    } else {
      statusEl.textContent = '✅ Resume text saved. Configure an AI provider in Settings to enable auto-fill.';
    }
  } catch (e) {
    statusEl.textContent = `❌ Error: ${e.message}`;
    showToast('❌ Upload failed');
  }
}


function populateProfile(p) {
  $('p-name').value      = p.personalInfo?.fullName  || '';
  $('p-email').value     = p.personalInfo?.email     || '';
  $('p-phone').value     = p.personalInfo?.phone     || '';
  $('p-address').value   = p.personalInfo?.cityProvince || '';
  $('p-linkedin').value  = p.personalInfo?.linkedin  || '';
  $('p-portfolio').value = p.personalInfo?.portfolio || '';
  $('p-skills').value    = (p.skills || []).join('\n');
  $('p-do-not-claim').value = p.doNotClaimNotes || '';

  renderSummaries(p.summaries || []);
  $('experience-list').innerHTML = '';
  (p.experience || []).forEach(exp => addExperienceEntry(exp));
  $('education-list').innerHTML = '';
  (p.education || []).forEach(edu => addEducationEntry(edu));
  $('certifications-list').innerHTML = '';
  (p.certifications || []).forEach(cert => addCertEntry(cert));
}

// Summaries / Experience / Education Helpers (Simplified)
function renderSummaries(summaries) {
  const container = $('summaries-list');
  container.innerHTML = '';
  summaries.forEach((s, i) => {
    const row = document.createElement('div');
    row.innerHTML = `<input type="text" value="${escHtml(s.label)}" class="summary-label-input" style="width:120px" /> 
                     <textarea class="summary-text-input" rows="2" style="flex:1">${escHtml(s.text)}</textarea> 
                     <button onclick="this.parentElement.remove()">✕</button>`;
    row.style.display = 'flex'; row.style.gap = '8px'; row.style.marginBottom = '8px';
    container.appendChild(row);
  });
}

function addExperienceEntry(data = {}) {
  const div = document.createElement('div');
  div.className = 'exp-entry card';
  div.style.marginBottom = '12px';
  const roleTitle = data.jobTitle || data.title || '';
  const employer = data.employer || data.company || '';
  const dates = data.dates || (data.startDate ? `${data.startDate} - ${data.endDate || ''}` : '');
  const bullets = Array.isArray(data.bulletPoints) ? data.bulletPoints.join('\n') : (data.bullets || '');

  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:8px">
      <input type="text" class="exp-title" value="${escHtml(roleTitle)}" placeholder="Job Title" style="font-weight:bold" />
      <button onclick="this.closest('.exp-entry').remove()" class="btn-remove">✕</button>
    </div>
    <div class="form-grid-2">
      <input type="text" class="exp-company" value="${escHtml(employer)}" placeholder="Company" />
      <input type="text" class="exp-dates" value="${escHtml(dates)}" placeholder="Dates" />
    </div>
    <textarea class="exp-bullets" rows="3" placeholder="Bullets" style="margin-top:8px">${escHtml(bullets)}</textarea>
  `;
  $('experience-list').appendChild(div);
}

function addEducationEntry(data = {}) {
  const div = document.createElement('div');
  div.className = 'edu-entry card';
  div.style.marginBottom = '12px';
  const degree = data.credential || data.degree || '';
  const school = data.institution || data.school || '';

  div.innerHTML = `
    <div style="display:flex; justify-content:space-between">
      <input type="text" class="edu-degree" value="${escHtml(degree)}" placeholder="Degree" style="font-weight:bold" />
      <button onclick="this.closest('.edu-entry').remove()" class="btn-remove">✕</button>
    </div>
    <input type="text" class="edu-school" value="${escHtml(school)}" placeholder="School" />
  `;
  $('education-list').appendChild(div);
}

function addCertEntry(data = {}) {
  const div = document.createElement('div');
  div.className = 'cert-entry card';
  div.style.marginBottom = '12px';
  div.innerHTML = `
    <div style="display:flex; justify-content:space-between">
      <input type="text" class="cert-name" value="${escHtml(data.name)}" placeholder="Cert Name" style="font-weight:bold" />
      <button onclick="this.closest('.cert-entry').remove()" class="btn-remove">✕</button>
    </div>
    <input type="text" class="cert-issuer" value="${escHtml(data.issuer)}" placeholder="Issuer" />
  `;
  $('certifications-list').appendChild(div);
}

async function saveProfileData() {
  const readList = (sel, mapFn) => [...document.querySelectorAll(sel)].map(mapFn);
  profile = {
    personalInfo: { 
      fullName:     $('p-name').value, 
      email:        $('p-email').value, 
      phone:        $('p-phone').value, 
      cityProvince: $('p-address').value, 
      linkedin:     $('p-linkedin').value, 
      portfolio:    $('p-portfolio').value 
    },
    summaries: readList('.summary-label-input', (el, i) => ({ label: el.value, text: document.querySelectorAll('.summary-text-input')[i].value })),
    skills: $('p-skills').value.split('\n').filter(Boolean),
    experience: readList('.exp-entry', el => ({ 
      jobTitle: el.querySelector('.exp-title').value, 
      employer: el.querySelector('.exp-company').value, 
      dates:    el.querySelector('.exp-dates').value, // normalizeResumeContent handles splitting this into start/end
      bulletPoints: el.querySelector('.exp-bullets').value.split('\n').filter(Boolean)
    })),
    education: readList('.edu-entry', el => ({ 
      credential:  el.querySelector('.edu-degree').value, 
      institution: el.querySelector('.edu-school').value 
    })),
    certifications: readList('.cert-entry', el => ({ 
      name:   el.querySelector('.cert-name').value, 
      issuer: el.querySelector('.cert-issuer').value 
    })),
    doNotClaimNotes: $('p-do-not-claim').value
  };
  await saveProfile(profile);
  showToast('✅ Profile saved');
}

// Helpers
let toastTimer;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show'); t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init().catch(console.error);
