// dashboard/dashboard.js — Main dashboard controller

import { extractJobFields, detectSpecialInstructions } from '../modules/extraction.js';
import { generateResume, generateCoverLetter, reviseDraft, detectSpecialInstructionsAI, generateHtmlResume, generateHtmlCoverLetter } from '../modules/drafting.js';
import { loadProfile } from '../modules/profile.js';
import { fillTemplate, fileToArrayBuffer, downloadBlob, buildFilename, draftToDataMap, validateTemplate } from '../modules/template.js';
import { generateSmartDocument } from '../modules/templateInterpreter.js';
import { mapError } from '../modules/errorMapper.js';

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
  docSettings: null,
  profile: null,
  sourceResumeText: '',
  sourceResumeTemplate: null,
  lastRunMode: null         // to support Retry
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
  genErrorMessage:    $('gen-error-message'),
  btnErrorRetry:      $('btn-error-retry'),
  btnErrorSettings:   $('btn-error-settings'),
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
  settingsView:       $('settings-view'),
  btnCloseSettings:   $('btn-close-settings'),
  settingsFrame:      $('settings-frame'),
  riskWarning:        $('risk-warning'),
  riskLevel:          $('risk-level'),
  riskMessage:        $('risk-message'),
};

const state_templates = {
  resume: null, // { ab, analysis }
  cl: null      // { ab, analysis }
};

// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  state.settings = await loadSettings();
  state.profile  = await loadProfile();
  
  const localData = await chrome.storage.local.get(['sourceResumeText', 'sourceResumeTemplate']);
  state.sourceResumeText = localData.sourceResumeText || '';
  state.sourceResumeTemplate = localData.sourceResumeTemplate || null;

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

  // If there's a pending mode from the context menu, trigger generation automatically
  if (session.pendingMode && text) {
    // Clear pending mode so it doesn't loop
    chrome.storage.session.remove('pendingMode').catch(() => {});
    
    // Slight delay to let UI settle before kicking off generation
    setTimeout(() => {
      runGeneration(session.pendingMode);
    }, 100);
  }
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
  // Listen for background script updates (e.g. from context menu while panel is open)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SESSION_UPDATED') {
      chrome.runtime.sendMessage({ type: 'GET_SESSION' }).then(session => {
        applySession(session);
      });
    }
  });

  // Listen for settings changes across tabs to update the mock banner and templates dynamically
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.providerSettings) {
      state.settings = changes.providerSettings.newValue;
      const isMock = state.settings?.provider === 'mock';
      dom.mockBanner.classList.toggle('hidden', !isMock);
    }
    if (area === 'local') {
      if (changes.sourceResumeTemplate) state.sourceResumeTemplate = changes.sourceResumeTemplate.newValue;
      if (changes.sourceResumeText)     state.sourceResumeText     = changes.sourceResumeText.newValue;
      
      // Clear cached analysis if specific templates change
      if (changes.resumeTemplate)       state_templates.resume = null;
      if (changes.coverLetterTemplate)  state_templates.cl     = null;
    }

  });

  // Settings buttons
  dom.btnSettings.addEventListener('click', () => {
    dom.settingsView.classList.add('visible');
  });

  dom.btnCloseSettings.addEventListener('click', async () => {
    dom.settingsView.classList.remove('visible');
    // Reload local state in case settings were changed in the overlay
    state.settings = await loadSettings();
    state.profile  = await loadProfile();
    const isMock = state.settings?.provider === 'mock';
    dom.mockBanner.classList.toggle('hidden', !isMock);
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
  document.getElementById('btn-gen-resume-ai').addEventListener('click', () => runGeneration('resume', true));
  
  dom.btnGenCL.addEventListener('click',     () => runGeneration('cover-letter'));
  document.getElementById('btn-gen-cl-ai').addEventListener('click', () => runGeneration('cover-letter', true));
  
  dom.btnGenBoth.addEventListener('click',   () => runGeneration('both'));
  document.getElementById('btn-gen-both-ai').addEventListener('click', () => runGeneration('both', true));

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

  // Error area buttons
  dom.btnErrorRetry.addEventListener('click', () => {
    if (state.lastRunMode) runGeneration(state.lastRunMode);
  });
  dom.btnErrorSettings.addEventListener('click', () => {
    dom.settingsView.classList.add('visible');
  });

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
async function runGeneration(mode, isAutopilot = false) {
  if (!await validateForGeneration(mode)) return;

  state.jobData.jobTitle    = dom.fieldTitle.value;
  state.jobData.company     = dom.fieldCompany.value;
  state.jobData.location    = dom.fieldLocation.value;
  state.jobData.description = dom.fieldDesc.value;
  state.lastRunMode = mode;
  state.isAutopilot = isAutopilot; // track this for saving

  setGenerating(true);
  resetConfirm();
  hideError();
  dom.riskWarning.classList.add('hidden');

  const toGenerate = mode === 'both' ? ['resume', 'cover-letter'] : [mode];

  try {
    // 1. Analyze templates if available
    await analyzeActiveTemplates(toGenerate);

    for (const docType of toGenerate) {
      dom.genStatusText.textContent = docType === 'resume' ? 'Generating resume…' : 'Generating cover letter…';

      const templateData = docType === 'resume' ? state_templates.resume : state_templates.cl;
      const templateMap = templateData?.analysis?.structureMap || null;

      let rawDraft;
      if (isAutopilot) {
         if (docType === 'resume') {
           rawDraft = await generateHtmlResume(state.jobData, state.profile, state.settings, state.sourceResumeText);
         } else {
           rawDraft = await generateHtmlCoverLetter(state.jobData, state.profile, state.settings, state.sourceResumeText);
         }
         // Clean up markdown wrapping if the AI accidentally included it
         rawDraft = rawDraft.replace(/^```html/i, '').replace(/```$/i, '').trim();
         
         state.drafts[docType] = { isHtml: true, html: rawDraft };
         
         // For HTML, we render it directly in the pre block (or an iframe, but pre is safer for now if we use innerHTML on a wrapper)
         const container = docType === 'resume' ? dom.draftResumeText : dom.draftCLText;
         const wrapper = docType === 'resume' ? dom.draftResumeContent : dom.draftCLContent;
         const empty   = docType === 'resume' ? dom.draftResumeEmpty : dom.draftCLEmpty;

         empty.classList.add('hidden');
         wrapper.classList.remove('hidden');

         container.innerHTML = rawDraft; 
         // Add some padding/background to the container to make the HTML pop
         container.style.backgroundColor = '#fff';
         container.style.padding = '20px';
         container.style.borderRadius = '8px';
         container.style.color = '#333';
      } else {
        if (docType === 'resume') {
          rawDraft = await generateResume(state.jobData, state.profile, state.settings, state.sourceResumeText, templateMap);
        } else {
          rawDraft = await generateCoverLetter(state.jobData, state.profile, state.settings, state.sourceResumeText);
        }

        // Try to parse JSON robustly
        const parsed = tryParseJson(rawDraft);
        if (parsed) {
          state.drafts[docType] = parsed;
          renderDraft(docType, formatDraftForDisplay(docType, parsed));
        }
      }
    }
    
    // Switch to first generated tab
    switchTab(toGenerate[0]);
    enableRevisionButtons(true);
    extractInstructionsWithAI();
    showToast('✅ Draft generated successfully!');
  } catch (e) {
    showError(e);
  } finally {
    setGenerating(false);
  }
}

async function analyzeActiveTemplates(types) {
  const { analyzeTemplate } = await import('../modules/templateInterpreter.js');
  
  for (const type of types) {
    const templateKey = type === 'resume' ? 'resumeTemplate' : 'coverLetterTemplate';
    const localData = await chrome.storage.local.get([templateKey]);
    let templateB64 = localData[templateKey] || state.sourceResumeTemplate;

    if (templateB64) {
      const ab = base64ToArrayBuffer(templateB64);
      const analysis = await analyzeTemplate(ab);
      state_templates[type === 'resume' ? 'resume' : 'cl'] = { ab, analysis };
      
      if (analysis.risk.level !== 'low') {
        showRiskWarning(analysis.risk);
      }
    }
  }
}

function showRiskWarning(risk) {
  dom.riskLevel.textContent = risk.level.toUpperCase() + ' RISK';
  dom.riskMessage.textContent = risk.message;
  dom.riskWarning.classList.remove('hidden');
}

function formatDraftForDisplay(docType, parsed) {
  if (docType === 'resume') {
    return [
      `SUMMARY: ${parsed.summary}`,
      `SKILLS: ${parsed.skills.join(', ')}`,
      '\nEXPERIENCE:',
      ...parsed.workExperience.map(exp => `- ${exp.title} at ${exp.company} (${exp.dates})\n  ${exp.bullets.join('\n  ')}`)
    ].join('\n');
  } else {
    return [
      parsed.greeting,
      '',
      ...parsed.paragraphs,
      '',
      parsed.closing,
      parsed.signOff
    ].join('\n');
  }
}

async function validateForGeneration(mode) {
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

  // Template check (only if not mock)
  if (!isMock) {
    const toCheck = mode === 'both' ? ['resume', 'cover-letter'] : [mode];
    const localData = await chrome.storage.local.get(['resumeTemplate', 'coverLetterTemplate', 'sourceResumeTemplate']);
    
    // Diagnostic check for "missing" templates
    const missing = [];
    for (const type of toCheck) {
      const template = type === 'resume' ? localData.resumeTemplate : localData.coverLetterTemplate;
      const hasTemplate = !!template;
      const hasFallback = !!localData.sourceResumeTemplate;
      
      if (!hasTemplate && !hasFallback) {
         missing.push(type === 'resume' ? 'Resume Template' : 'Cover Letter Template');
      }
    }

    if (missing.length > 0) {
      showError(`Missing required .docx template for: ${missing.join(', ')}. Please upload a .docx template OR a Source Resume in ⚙ Settings.`);
      return false;
    }
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
    const rawRevised = await reviseDraft(currentDraft, request, docType, state.jobData, state.profile, state.settings);
    
    const parsed = tryParseJson(rawRevised);
    if (parsed) {
      state.drafts[docType] = parsed;
      renderDraft(docType, formatDraftForDisplay(docType, parsed));
    } else {
      console.warn('Revision AI failed to return valid JSON, falling back to raw text');
      state.drafts[docType] = rawRevised;
      renderDraft(docType, rawRevised);
    }


    resetConfirm();

    // Simple "what changed" note
    dom.whatChangedText.textContent = `Applied: "${request}"`;
    dom.whatChanged.classList.remove('hidden');
    dom.fieldRevision.value = '';
    showToast('✅ Draft revised!');
  } catch (e) {
    showError(e);
    // Revision errors also show the error panel, but don't clear the draft area
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
    
    // Check if this is an AI Autopilot HTML draft
    if (draft.isHtml) {
      const filename = buildFilename(pattern, { ...state.jobData, docType: typeLabel }).replace('.docx', '.html');
      // Wrap it in a basic HTML5 boilerplate to ensure it renders correctly on standalone open
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${filename}</title>
</head>
<body style="background: #f0f2f5; padding: 40px; font-family: sans-serif; display: flex; justify-content: center;">
  <div style="background: white; padding: 40px; max-width: 800px; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px;">
    ${draft.html}
  </div>
</body>
</html>`;
      const blob = new Blob([fullHtml], { type: 'text/html' });
      downloadBlob(blob, filename);
      showToast(`💾 Saved HTML: ${filename}`);
      continue;
    }

    // Standard DOCX Flow
    const filename  = buildFilename(pattern, { ...state.jobData, docType: typeLabel });

    // Try using stored template
    const templateKey = docType === 'resume' ? 'resumeTemplate' : 'coverLetterTemplate';
    const localData = await chrome.storage.local.get([templateKey, 'sourceResumeTemplate']);

    let templateB64 = localData[templateKey];

    // Fallback: If no specific design template is uploaded, use the Source Resume as the layout wrapper.
    if (!templateB64) {
      templateB64 = localData.sourceResumeTemplate;
      if (templateB64) {
        showToast(`ℹ️ No specific Template found. Using your Source Resume as the DOCX template.`);
      }
    }


    if (templateB64) {
      try {
        // Load PizZip + Docxtemplater lazily — avoids CSP eval() at page load
        await loadDocxLibs();
        const ab       = base64ToArrayBuffer(templateB64);
        
        const mode = state.docSettings?.templateMode || 'smart';
        let blob;
        
        if (mode === 'smart') {
          const mapping = (state.docSettings?.templateMapping || {})[docType] || {};
          
          // Use standard structure keys if no custom mapping exists
          const finalMapping = { ...mapping };
          if (docType === 'resume' && !Object.keys(finalMapping).length) {
            // Heuristic default mapping for standard sections
            const analysis = state_templates.resume?.analysis;
            if (analysis?.headings) {
               analysis.headings.forEach(h => {
                 const low = h.toLowerCase().trim();
                 if (low.includes('summary') || low.includes('profile') || low.includes('about')) finalMapping[h] = 'summary';
                 if (low.includes('skills') || low.includes('competencies') || low.includes('expertise') || low.includes('technical')) finalMapping[h] = 'skills';
                 if (low.includes('experience') || low.includes('employment') || low.includes('history') || low.includes('work')) finalMapping[h] = 'workExperience';
                 if (low.includes('education') || low.includes('academic') || low.includes('school')) finalMapping[h] = 'education';
                 if (low.includes('cert') || low.includes('licens') || low.includes('train')) finalMapping[h] = 'certifications';
               });
            }
          } else if (docType === 'cover-letter' && !Object.keys(finalMapping).length) {
             const analysis = state_templates.cl?.analysis;
             if (analysis?.headings) {
               analysis.headings.forEach(h => {
                 const low = h.toLowerCase().trim();
                 if (low.includes('dear') || low.includes('greeting') || low.includes('to whom')) finalMapping[h] = 'greeting';
                 if (analysis.headings.length < 3) finalMapping[h] = 'paragraphs';
               });
             }
             if (!Object.keys(finalMapping).length && analysis?.headings?.[0]) {
               finalMapping[analysis.headings[0]] = 'paragraphs';
             }
          }



          blob = await generateSmartDocument(ab, finalMapping, draft);
        } else {
          // Legacy advanced placeholders
          const dataMap  = draftToDataMap(draft, state.profile, state.jobData, docType);
          blob = await fillTemplate(ab, dataMap);
        }

        downloadBlob(blob, filename);
        showToast(`💾 Saved: ${filename}`);
        continue;
      } catch (e) {
        showToast(`⚠️ Template error: ${e.message}. Saving as plain .txt instead.`);
      }
    } else {
      showToast(`⚠️ No .docx Template or Source Resume uploaded. Saving as plain .txt.`);
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

function showError(err) {
  const { message, action } = mapError(err);
  dom.genErrorMessage.textContent = `⚠️ ${message}`;
  
  // Show/hide relevant buttons based on recommended action
  dom.btnErrorRetry.classList.toggle('hidden', action !== 'retry');
  dom.btnErrorSettings.classList.toggle('hidden', action !== 'settings');
  
  dom.genError.classList.remove('hidden');
  
  // Also clear generating state just in case
  setGenerating(false);
  setRevising(false);
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
  const data = await chrome.storage.sync.get(['providerSettings', 'docSettings']);
  state.docSettings = data.docSettings || { templateMode: 'smart' };
  return data.providerSettings || null;
}

// ── Utilities ─────────────────────────────────────────────────────────────

/**
 * Lazily injects pizzip.js and docxtemplater.js as global script tags.
 * Called only when the user actually saves a .docx — not at page load.
 * This avoids the CSP eval() violation that the webpack bundles trigger
 * when parsed eagerly by the browser.
 */
let _libsLoaded = false;
function loadDocxLibs() {
  if (_libsLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const inject = (src) => new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload  = res;
      s.onerror = () => rej(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
    inject(chrome.runtime.getURL('lib/pizzip.js'))
      .then(() => inject(chrome.runtime.getURL('lib/docxtemplater.js')))
      .then(() => { _libsLoaded = true; resolve(); })
      .catch(reject);
  });
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Cleans AI response text and attempts to parse as JSON.
 * Fixes common AI errors like markdown blocks, trailing commas, or leading/trailing commentary.
 */
function tryParseJson(text) {
  if (!text) return null;
  
  let cleaned = text.trim();
  // Remove markdown blocks
  cleaned = cleaned.replace(/```json\n?|```/g, '').trim();
  
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt basic repairs
    try {
      // Remove trailing commas before closing braces/brackets
      let repaired = cleaned
        .replace(/,\s*([\}\]])/g, '$1')
        // Try to find the first '{' and last '}' to strip any surrounding text
        .match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      
      if (repaired) {
        return JSON.parse(repaired[0]);
      }
    } catch (e2) {
      return null;
    }
  }
  return null;
}

// ── Boot ──────────────────────────────────────────────────────────────────
init().catch(console.error);
