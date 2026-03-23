// dashboard/dashboard.js — Main dashboard controller (Redesigned for HTML/PDF System)

import { extractJobFields } from '../modules/extraction.js';
import { generateResume, generateCoverLetter, reviseDraft } from '../modules/drafting.js';
import { loadProfile } from '../modules/profile.js';
import { renderDocument } from '../modules/renderer.js';
import { buildFilename, downloadBlob } from '../modules/template.js';
import { mapError } from '../modules/errorMapper.js';

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  jobData: {
    jobTitle: '', company: '', location: '', sourceUrl: '', description: '',
  },
  currentTab: 'resume',     // 'resume' | 'cover-letter'
  drafts: { resume: null, 'cover-letter': null }, // Now stores structured JSON
  
  // UI customization
  templateId: 'classic',
  accentColor: '#2563eb',
  spacingMode: 'standard',

  settings: null,
  profile: null,
  sourceResumeText: '',
  lastRunMode: null
};

// ── DOM refs ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const dom = {
  modeBadge:          $('mode-badge'),
  sourceIndicator:    $('source-indicator'),
  selectionNotice:    $('selection-notice'),
  fieldTitle:         $('field-job-title'),
  fieldCompany:       $('field-company'),
  fieldLocation:      $('field-location'),
  fieldUrl:           $('field-url'),
  fieldDesc:          $('field-job-desc'),
  
  btnGenResume:       $('btn-gen-resume'),
  btnGenCL:           $('btn-gen-cover-letter'),
  btnGenBoth:         $('btn-gen-both'),
  
  genStatus:          $('gen-status'),
  genStatusText:      $('gen-status-text'),
  genError:           $('gen-error'),
  genErrorMessage:    $('gen-error-message'),
  btnErrorRetry:      $('btn-error-retry'),
  btnErrorSettings:   $('btn-error-settings'),
  
  tabBtns:            document.querySelectorAll('.tab-btn'),
  tabPanels:          document.querySelectorAll('.tab-panel'),
  
  templateOptions:    document.querySelectorAll('.template-option'),
  colorDots:          document.querySelectorAll('.color-dot'),
  selectSpacing:      $('select-spacing'),
  
  previewResumeFrame: $('preview-resume-frame'),
  previewCLFrame:     $('preview-cl-frame'),
  draftResumeEmpty:   $('draft-resume-empty'),
  draftResumeContent: $('draft-resume-content'),
  draftCLEmpty:       $('draft-cl-empty'),
  draftCLContent:     $('draft-cl-content'),
  
  fieldRevision:      $('field-revision'),
  btnApplyChanges:    $('btn-apply-changes'),
  btnRegenerate:      $('btn-regenerate'),
  
  btnSavePdf:         document.getElementById('btn-save-pdf'),
  btnSaveResume:      $('btn-save-resume'),
  btnSaveCL:          $('btn-save-cl'),
  
  toast:              $('toast'),
  btnSettings:        $('btn-settings'),
  mockBanner:         $('mock-mode-banner'),
  settingsView:       $('settings-view'),
  btnCloseSettings:   $('btn-close-settings'),
};

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  state.settings = await loadSettings();
  state.profile  = await loadProfile();
  
  const localData = await chrome.storage.local.get(['sourceResumeText']);
  state.sourceResumeText = localData.sourceResumeText || '';

  if (state.settings?.provider === 'mock') {
    dom.mockBanner.classList.remove('hidden');
  }

  // Load session data
  loadSession();

  bindEvents();
  switchTab('resume');

  // Listen for data written by background script (context menu extraction)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'session' && (changes.extractedData || changes.pendingMode)) {
      loadSession();
    }
  });
}

function loadSession() {
  chrome.storage.session.get(null).then(applySession);
}

function applySession(session) {
  if (!session || !session.extractedData) {
    console.log('[JPDA] applySession: No data yet.');
    return;
  }

  const raw = session.extractedData;
  if (raw.error) {
    showToast(`⚠️ ${raw.error}`);
    return;
  }

  const text = raw.selectedText || raw.pageText || '';
  const url = session.sourceUrl || raw.url || '';
  const usedSelection = !!raw.selectedText;

  if (usedSelection) {
    dom.selectionNotice.classList.remove('hidden');
    dom.sourceIndicator.textContent = '✦ From your selection';
    dom.sourceIndicator.className = 'card-hint source-selection';
  } else {
    dom.sourceIndicator.textContent = '✦ From page content';
    dom.sourceIndicator.className = 'card-hint source-page';
  }

  const fields = extractJobFields(text, url);
  dom.fieldTitle.value    = fields.jobTitle;
  dom.fieldCompany.value  = fields.company;
  dom.fieldLocation.value = fields.location;
  dom.fieldUrl.value      = url;
  dom.fieldDesc.value     = text;

  state.jobData = { ...fields, sourceUrl: url, description: text };

  // If a specific mode was requested from context menu, highlight it
  if (session.pendingMode) {
    state.lastRunMode = session.pendingMode;
    // We don't auto-run to avoid consuming AI credits unintentionally, 
    // but we could pulse the button or similar.
  }
}

// ── Events ────────────────────────────────────────────────────────────────
function bindEvents() {
  // Settings
  dom.btnSettings.addEventListener('click', () => dom.settingsView.classList.add('visible'));
  dom.btnCloseSettings.addEventListener('click', async () => {
    dom.settingsView.classList.remove('visible');
    state.settings = await loadSettings();
    state.profile  = await loadProfile();
    dom.mockBanner.classList.toggle('hidden', state.settings?.provider !== 'mock');
  });

  // Tabs
  dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Template Selection
  dom.templateOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      dom.templateOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      state.templateId = opt.dataset.template;
      updatePreviews();
    });
  });

  // Accent Color
  dom.colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      dom.colorDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      state.accentColor = dot.dataset.color;
      updatePreviews();
    });
  });

  // Spacing
  dom.selectSpacing.addEventListener('change', () => {
    state.spacingMode = dom.selectSpacing.value;
    updatePreviews();
  });

  // Generation
  dom.btnGenResume.addEventListener('click', () => runGeneration('resume'));
  dom.btnGenCL.addEventListener('click', () => runGeneration('cover-letter'));
  dom.btnGenBoth.addEventListener('click', () => runGeneration('both'));

  // Revision
  dom.btnApplyChanges.addEventListener('click', applyRevision);
  dom.btnRegenerate.addEventListener('click', () => runGeneration(state.currentTab));

  // Export
  dom.btnSavePdf.addEventListener('click', () => savePdf(['resume', 'cover-letter']));
  dom.btnSaveResume.addEventListener('click', () => savePdf(['resume']));
  dom.btnSaveCL.addEventListener('click', () => savePdf(['cover-letter']));

  // Error Retry
  dom.btnErrorRetry.addEventListener('click', () => {
    if (state.lastRunMode) runGeneration(state.lastRunMode);
  });

  // Sync inputs
  dom.fieldTitle.addEventListener('input', () => state.jobData.jobTitle = dom.fieldTitle.value);
  dom.fieldCompany.addEventListener('input', () => state.jobData.company = dom.fieldCompany.value);
  dom.fieldLocation.addEventListener('input', () => state.jobData.location = dom.fieldLocation.value);
  dom.fieldDesc.addEventListener('input', () => state.jobData.description = dom.fieldDesc.value);
}

// ── Core Logic ────────────────────────────────────────────────────────────

async function runGeneration(mode) {
  if (!await validateForGeneration(mode)) return;

  state.lastRunMode = mode;
  setGenerating(true);
  hideError();

  const toGenerate = mode === 'both' ? ['resume', 'cover-letter'] : [mode];

  try {
    for (const type of toGenerate) {
      dom.genStatusText.textContent = `Tailoring ${type === 'resume' ? 'resume' : 'cover letter'}...`;
      
      let raw;
      if (type === 'resume') {
        raw = await generateResume(state.jobData, state.profile, state.settings, state.sourceResumeText);
      } else {
        raw = await generateCoverLetter(state.jobData, state.profile, state.settings, state.sourceResumeText);
      }

      const parsed = tryParseJson(raw);
      if (parsed) {
        state.drafts[type] = parsed;
      } else {
        throw new Error(`AI returned invalid content format for ${type}.`);
      }
    }

    updatePreviews();
    switchTab(toGenerate[0]);
    showToast('✨ Drafts ready!');
  } catch (e) {
    showError(e);
  } finally {
    setGenerating(false);
  }
}

async function applyRevision() {
  const request = dom.fieldRevision.value.trim();
  if (!request) return;

  const docType = state.currentTab;
  if (!state.drafts[docType]) return;

  setGenerating(true, 'Refining draft...');
  try {
    const raw = await reviseDraft(state.drafts[docType], request, docType, state.jobData, state.profile, state.settings);
    const parsed = tryParseJson(raw);
    if (parsed) {
      state.drafts[docType] = parsed;
      updatePreviews();
      dom.fieldRevision.value = '';
      showToast('✅ Changes applied!');
    }
  } catch (e) {
    showError(e);
  } finally {
    setGenerating(false);
  }
}

function updatePreviews() {
  const options = {
    accentColor: state.accentColor,
    spacingMode: state.spacingMode
  };

  if (state.drafts.resume) {
    dom.draftResumeEmpty.classList.add('hidden');
    dom.draftResumeContent.classList.remove('hidden');
    const resumeData = {
      ...state.drafts.resume,
      personalInfo: state.profile.personalInfo
    };
    const html = renderDocument(state.templateId, 'resume', resumeData, options);
    injectToIframe(dom.previewResumeFrame, html);
    enableExportControls(true);
  }

  if (state.drafts['cover-letter']) {
    dom.draftCLEmpty.classList.add('hidden');
    dom.draftCLContent.classList.remove('hidden');
    // Map the draft to the expected format for cover letters
    const clData = {
      personalInfo: state.profile.personalInfo,
      content: state.drafts['cover-letter']
    };
    const html = renderDocument(state.templateId, 'cover-letter', clData, options);
    injectToIframe(dom.previewCLFrame, html);
    enableExportControls(true);
  }
}

function injectToIframe(iframe, html) {
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}

async function savePdf(types) {
  try {
    showToast('⚙️ Preparing PDF export...');
    await loadPdfLib();

    for (const type of types) {
      const frame = type === 'resume' ? dom.previewResumeFrame : dom.previewCLFrame;
      const draft = state.drafts[type];
      if (!draft || !frame) continue;

      const element = frame.contentDocument.querySelector('.page-preview');
      const typeLabel = type === 'resume' ? 'Resume' : 'Cover Letter';
      const filename = buildFilename('{docType} - {company} - {jobTitle}.pdf', { ...state.jobData, docType: typeLabel });

      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      showToast(`💾 Saved: ${filename}`);
    }
  } catch (e) {
    console.error('PDF Export Error:', e);
    showToast('❌ PDF export failed. Try printing the page manually.');
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function switchTab(tab) {
  state.currentTab = tab;
  dom.tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  dom.tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
  dom.btnApplyChanges.disabled = !state.drafts[tab];
  dom.btnRegenerate.disabled = !state.drafts[tab];
}

async function validateForGeneration(mode) {
  if (!state.settings?.provider) {
    showError('AI provider not configured. Go to Settings.');
    return false;
  }
  if (!dom.fieldDesc.value.trim()) {
    showError(new Error('no_job_desc'));
    return false;
  }
  if (state.settings?.provider !== 'mock' && !state.profile?.personalInfo?.fullName) {
    showError(new Error('no_profile'));
    return false;
  }
  return true;
}

function setGenerating(on, text = 'Generating…') {
  dom.genStatus.classList.toggle('hidden', !on);
  dom.genStatusText.textContent = text;
  [dom.btnGenResume, dom.btnGenCL, dom.btnGenBoth].forEach(b => b.disabled = on);
}

function showError(err) {
  console.error('[JPDA] Error:', err);
  const mapped = mapError(err);
  dom.genErrorMessage.textContent = `⚠️ ${mapped.message}`;
  dom.btnErrorRetry.classList.toggle('hidden', mapped.action !== 'retry');
  dom.btnErrorSettings.classList.toggle('hidden', mapped.action !== 'settings');
  dom.genError.classList.remove('hidden');
  setGenerating(false);
}

function hideError() { dom.genError.classList.add('hidden'); }

function enableExportControls(on) {
  dom.btnSavePdf.disabled = !on;
  dom.btnSaveResume.disabled = !on;
  dom.btnSaveCL.disabled = !on;
}

let toastTimer;
function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  dom.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 3000);
}

async function loadSettings() {
  const data = await chrome.storage.sync.get(['providerSettings']);
  return data.providerSettings || null;
}

function tryParseJson(str) {
  try {
    // Robust parsing: find the first { and last }
    const start = str.indexOf('{');
    const end = str.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(str.slice(start, end + 1));
  } catch {
    return null;
  }
}

let _pdfLibLoaded = false;
function loadPdfLib() {
  if (_pdfLibLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('lib/html2pdf.bundle.min.js');
    s.onload = () => { _pdfLibLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Start app
init();
