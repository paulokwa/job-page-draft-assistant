// dashboard/dashboard.js — Main dashboard controller

import { extractJobFields, detectSpecialInstructions } from '../modules/extraction.js';
import { generateResume, generateCoverLetter, reviseDraft, detectSpecialInstructionsAI } from '../modules/drafting.js';
import { loadProfile } from '../modules/profile.js';
import { fillTemplate, fileToArrayBuffer, downloadBlob, buildFilename, draftToDataMap, validateTemplate } from '../modules/template.js';

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  mode: 'both',             // 'resume' | 'cover-letter' | 'both'
  jobData: {
    jobTitle: '', company: '', location: '', sourceUrl: '', description: '',
  },
  originalDescription: '',  // snapshot for "regenerate from original"
  currentTab: 'resume',     // active tab
  drafts: { resume: '', 'cover-letter': '' },
  confirmed: false,
  settings: null,
  profile: null,
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
  instructionsContent:$('instructions-content'),
  btnExtractInstr:    $('btn-extract-instructions'),
  btnGenResume:       $('btn-gen-resume'),
  btnGenCL:           $('btn-gen-cover-letter'),
  btnGenBoth:         $('btn-gen-both'),
  genStatus:          $('gen-status'),
  genStatusText:      $('gen-status-text'),
  genError:           $('gen-error'),
  tabBtns:            document.querySelectorAll('.tab-btn'),
  tabPanels:          document.querySelectorAll('.tab-panel'),
  draftResumeEmpty:   $('draft-resume-empty'),
  draftResumeContent: $('draft-resume-content'),
  draftResumeText:    $('draft-resume-text'),
  draftCLEmpty:       $('draft-cl-empty'),
  draftCLContent:     $('draft-cl-content'),
  draftCLText:        $('draft-cl-text'),
  fieldRevision:      $('field-revision'),
  btnApplyChanges:    $('btn-apply-changes'),
  btnRegenerate:      $('btn-regenerate'),
  revisionStatus:     $('revision-status'),
  revisionStatusText: $('revision-status-text'),
  whatChanged:        $('what-changed'),
  whatChangedText:    $('what-changed-text'),
  btnConfirm:         $('btn-confirm'),
  btnSaveResume:      $('btn-save-resume'),
  btnSaveCL:          $('btn-save-cl'),
  btnSaveBoth:        $('btn-save-both'),
  confirmNotice:      $('confirm-notice'),
  filenamePreview:    $('filename-preview'),
  toast:              $('toast'),
  btnSettings:        $('btn-settings'),
  mockBanner:         $('mock-mode-banner'),
};

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  state.settings = await loadSettings();
  state.profile  = await loadProfile();

  // Show mock mode banner if active
  if (state.settings?.provider === 'mock') {
    dom.mockBanner.classList.remove('hidden');
  }

  // Load session data from background
  const session = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });
  applySession(session);

  // Wire up all events
  bindEvents();
}

function applySession(session) {
  if (!session) return;

  // Mode
  if (session.pendingMode) setMode(session.pendingMode);

  // Extracted content
  const raw = session.extractedData;
  if (!raw) return;

  const text = raw.selectedText || raw.pageText || '';
  const usedSelection = !!raw.selectedText;

  // Show source indicator
  if (usedSelection) {
    dom.selectionNotice.classList.remove('hidden');
    dom.sourceIndicator.textContent = '✦ From your selection';
    dom.sourceIndicator.className = 'card-hint source-selection';
  } else {
    dom.sourceIndicator.textContent = '✦ From page content';
    dom.sourceIndicator.className = 'card-hint source-page';
  }

  // Extract fields
  const url = session.sourceUrl || raw.url || '';
  const fields = extractJobFields(text, url);

  dom.fieldTitle.value    = fields.jobTitle;
  dom.fieldCompany.value  = fields.company;
  dom.fieldLocation.value = fields.location;
  dom.fieldUrl.value      = url;
  dom.fieldDesc.value     = text;

  state.jobData = { ...fields, sourceUrl: url, description: text };
  state.originalDescription = text;

  // Run heuristic special instructions immediately
  const hInstructions = detectSpecialInstructions(text);
  renderInstructions(hInstructions);
}

function setMode(mode) {
  state.mode = mode;
  const labels = { resume: 'Resume', 'cover-letter': 'Cover Letter', both: 'Resume + Cover Letter' };
  const classes = { resume: 'mode-resume', 'cover-letter': 'mode-cover-letter', both: 'mode-both' };
  dom.modeBadge.textContent = labels[mode] || 'Draft';
  dom.modeBadge.className = `mode-badge ${classes[mode] || 'mode-both'}`;

  // Highlight the relevant generate button
  [dom.btnGenResume, dom.btnGenCL, dom.btnGenBoth].forEach(b => b.style.boxShadow = '');
  if (mode === 'resume')       dom.btnGenResume.focus();
  if (mode === 'cover-letter') dom.btnGenCL.focus();
  if (mode === 'both')         dom.btnGenBoth.focus();
}

// ── Events ────────────────────────────────────────────────────────────────
function bindEvents() {
  // Settings button
  dom.btnSettings.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
  });

  // Tab switching
  dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });

  // Generate buttons
  dom.btnGenResume.addEventListener('click', () => runGeneration('resume'));
  dom.btnGenCL.addEventListener('click',     () => runGeneration('cover-letter'));
  dom.btnGenBoth.addEventListener('click',   () => runGeneration('both'));

  // Extract instructions
  dom.btnExtractInstr.addEventListener('click', extractInstructionsWithAI);

  // Revision
  dom.btnApplyChanges.addEventListener('click', applyRevision);
  dom.btnRegenerate.addEventListener('click',   regenFromOriginal);

  // Confirm + Save
  dom.btnConfirm.addEventListener('click', confirmDraft);
  dom.btnSaveResume.addEventListener('click', () => saveDocs(['resume']));
  dom.btnSaveCL.addEventListener('click',     () => saveDocs(['cover-letter']));
  dom.btnSaveBoth.addEventListener('click',   () => saveDocs(['resume', 'cover-letter']));

  // Live sync job fields back to state
  dom.fieldTitle.addEventListener('input',    () => { state.jobData.jobTitle    = dom.fieldTitle.value; });
  dom.fieldCompany.addEventListener('input',  () => { state.jobData.company     = dom.fieldCompany.value; });
  dom.fieldLocation.addEventListener('input', () => { state.jobData.location    = dom.fieldLocation.value; });
  dom.fieldDesc.addEventListener('input',     () => { state.jobData.description = dom.fieldDesc.value; });
}

// ── Tab Switching ─────────────────────────────────────────────────────────
function switchTab(tab) {
  state.currentTab = tab;
  dom.tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  dom.tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));

  // Update revision buttons enabled state
  const hasDraft = !!state.drafts[tab];
  dom.btnApplyChanges.disabled = !hasDraft;
  dom.btnRegenerate.disabled   = !hasDraft;
}

// ── Generation ────────────────────────────────────────────────────────────
async function runGeneration(mode) {
  if (!validateForGeneration()) return;

  state.jobData.jobTitle    = dom.fieldTitle.value;
  state.jobData.company     = dom.fieldCompany.value;
  state.jobData.location    = dom.fieldLocation.value;
  state.jobData.description = dom.fieldDesc.value;

  setGenerating(true);
  resetConfirm();
  hideError();

  const toGenerate = mode === 'both' ? ['resume', 'cover-letter'] : [mode];

  try {
    for (const docType of toGenerate) {
      dom.genStatusText.textContent = docType === 'resume' ? 'Generating resume…' : 'Generating cover letter…';

      let draft;
      if (docType === 'resume') {
        draft = await generateResume(state.jobData, state.profile, state.settings);
      } else {
        draft = await generateCoverLetter(state.jobData, state.profile, state.settings);
      }

      state.drafts[docType] = draft;
      renderDraft(docType, draft);
    }

    // Switch to first generated tab
    switchTab(toGenerate[0]);
    enableRevisionButtons(true);

    // Try AI instruction detection now that we have settings
    extractInstructionsWithAI();

    showToast('✅ Draft generated successfully!');
  } catch (e) {
    showError(e.message || 'Generation failed. Please check your Settings.');
  } finally {
    setGenerating(false);
  }
}

function validateForGeneration() {
  const isMock = state.settings?.provider === 'mock';

  if (!state.settings?.provider) {
    showError('AI provider is not configured. Please open ⚙ Settings and set up your provider and API key.');
    return false;
  }
  if (!dom.fieldDesc.value.trim()) {
    showError('Job description is empty. Please ensure the job page content was captured, or paste it manually.');
    return false;
  }
  // In mock mode we allow an empty profile so the full workflow can be tested
  if (!isMock && !state.profile?.personal?.fullName) {
    showError('Your profile is missing. Please open ⚙ Settings and fill in your profile before generating.');
    return false;
  }
  return true;
}

function renderDraft(docType, text) {
  if (docType === 'resume') {
    dom.draftResumeEmpty.classList.add('hidden');
    dom.draftResumeContent.classList.remove('hidden');
    dom.draftResumeText.textContent = text;
  } else {
    dom.draftCLEmpty.classList.add('hidden');
    dom.draftCLContent.classList.remove('hidden');
    dom.draftCLText.textContent = text;
  }
}

// ── Instructions ──────────────────────────────────────────────────────────
async function extractInstructionsWithAI() {
  const text = dom.fieldDesc.value;
  if (!text) return;

  // Heuristic first (fast, always works)
  const hInstructions = detectSpecialInstructions(text);

  // AI enhancement if settings are available
  if (state.settings?.provider) {
    try {
      const aiInstructions = await detectSpecialInstructionsAI(text, state.settings);
      const combined = mergeInstructions(hInstructions, aiInstructions);
      renderInstructions(combined);
      return;
    } catch {
      // Fall back to heuristic
    }
  }
  renderInstructions(hInstructions);
}

function mergeInstructions(heuristic, ai) {
  const seen = new Set(heuristic.map(s => s.toLowerCase()));
  const merged = [...heuristic];
  ai.forEach(item => {
    const key = item.toLowerCase();
    if (!seen.has(key)) { merged.push(item); seen.add(key); }
  });
  return merged;
}

function renderInstructions(instructions) {
  if (!instructions.length) {
    dom.instructionsContent.innerHTML = '<p class="muted">No special application instructions detected.</p>';
    return;
  }
  const ul = document.createElement('ul');
  instructions.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
  dom.instructionsContent.innerHTML = '';
  dom.instructionsContent.appendChild(ul);
}

// ── Revision ──────────────────────────────────────────────────────────────
async function applyRevision() {
  const request = dom.fieldRevision.value.trim();
  if (!request) { showToast('⚠️ Please type a revision request first.'); return; }

  const docType = state.currentTab;
  const currentDraft = state.drafts[docType];
  if (!currentDraft) { showToast('⚠️ Generate a draft first.'); return; }

  setRevising(true);
  dom.whatChanged.classList.add('hidden');

  try {
    const revised = await reviseDraft(currentDraft, request, docType, state.jobData, state.profile, state.settings);
    state.drafts[docType] = revised;
    renderDraft(docType, revised);
    resetConfirm();

    // Simple "what changed" note
    dom.whatChangedText.textContent = `Applied: "${request}"`;
    dom.whatChanged.classList.remove('hidden');
    dom.fieldRevision.value = '';
    showToast('✅ Draft revised!');
  } catch (e) {
    showToast(`❌ Revision failed: ${e.message}`);
  } finally {
    setRevising(false);
  }
}

async function regenFromOriginal() {
  if (!state.originalDescription) return;
  dom.fieldDesc.value = state.originalDescription;
  state.jobData.description = state.originalDescription;
  runGeneration(state.currentTab);
}

// ── Confirm & Save ────────────────────────────────────────────────────────
function confirmDraft() {
  state.confirmed = true;
  dom.btnConfirm.disabled    = true;
  dom.btnSaveResume.disabled = false;
  dom.btnSaveCL.disabled     = false;
  dom.btnSaveBoth.disabled   = false;
  dom.confirmNotice.textContent = '✅ Draft confirmed. Ready to save.';
  dom.confirmNotice.style.color = 'var(--success)';
  dom.confirmNotice.style.borderColor = 'rgba(34,197,94,0.3)';

  // Show filename preview
  const pattern = state.settings?.filenamePattern || '{docType} - {company} - {jobTitle}';
  const previewResume = buildFilename(pattern, { ...state.jobData, docType: 'Resume' });
  const previewCL     = buildFilename(pattern, { ...state.jobData, docType: 'Cover Letter' });
  dom.filenamePreview.textContent = `${previewResume}  |  ${previewCL}`;
  dom.filenamePreview.classList.remove('hidden');

  showToast('✅ Draft confirmed — you can now save.');
}

function resetConfirm() {
  state.confirmed = false;
  dom.btnConfirm.disabled    = false;
  dom.btnSaveResume.disabled = true;
  dom.btnSaveCL.disabled     = true;
  dom.btnSaveBoth.disabled   = true;
  dom.confirmNotice.textContent = 'Review your draft, then confirm before saving.';
  dom.confirmNotice.style.color = '';
  dom.confirmNotice.style.borderColor = '';
  dom.filenamePreview.classList.add('hidden');
}

async function saveDocs(docTypes) {
  if (!state.confirmed) { showToast('⚠️ Please confirm the draft before saving.'); return; }

  const pattern  = state.settings?.filenamePattern || '{docType} - {company} - {jobTitle}';
  const settings = state.settings || {};

  for (const docType of docTypes) {
    const draft = state.drafts[docType];
    if (!draft) {
      showToast(`⚠️ No ${docType} draft to save.`);
      continue;
    }

    const typeLabel = docType === 'resume' ? 'Resume' : 'Cover Letter';
    const filename  = buildFilename(pattern, { ...state.jobData, docType: typeLabel });

    // Try using stored template
    const templateKey = docType === 'resume' ? 'resumeTemplate' : 'coverLetterTemplate';
    const templateB64 = settings[templateKey];

    if (templateB64) {
      try {
        const ab       = base64ToArrayBuffer(templateB64);
        const dataMap  = draftToDataMap(draft, state.profile, state.jobData, docType);
        const blob     = await fillTemplate(ab, dataMap);
        downloadBlob(blob, filename);
        showToast(`💾 Saved: ${filename}`);
        continue;
      } catch (e) {
        showToast(`⚠️ Template error: ${e.message}. Saving as plain .txt instead.`);
      }
    }

    // Fallback: plain text blob
    const blob = new Blob([draft], { type: 'text/plain' });
    const txtName = filename.replace('.docx', '.txt');
    downloadBlob(blob, txtName);
    showToast(`💾 Saved (no template): ${txtName}`);
  }
}

// ── UI State Helpers ──────────────────────────────────────────────────────
function setGenerating(on) {
  dom.genStatus.classList.toggle('hidden', !on);
  [dom.btnGenResume, dom.btnGenCL, dom.btnGenBoth].forEach(b => b.disabled = on);
}

function setRevising(on) {
  dom.revisionStatus.classList.toggle('hidden', !on);
  dom.btnApplyChanges.disabled = on;
}

function enableRevisionButtons(on) {
  dom.btnApplyChanges.disabled = !on;
  dom.btnRegenerate.disabled   = !on;
  dom.btnConfirm.disabled      = !on;
}

function showError(msg) {
  dom.genError.textContent = `⚠️ ${msg}`;
  dom.genError.classList.remove('hidden');
}
function hideError() { dom.genError.classList.add('hidden'); }

let toastTimer;
function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  dom.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 3000);
}

// ── Settings Loader ───────────────────────────────────────────────────────
async function loadSettings() {
  const data = await chrome.storage.sync.get('providerSettings');
  return data.providerSettings || null;
}

// ── Utilities ─────────────────────────────────────────────────────────────
function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ── Boot ──────────────────────────────────────────────────────────────────
init().catch(console.error);
