// modules/drafting.js
// Prompt construction and draft generation logic for resumes and cover letters.

import { callAI } from './provider.js';
import { profileToPromptText } from './profile.js';
import { generateMockResume, generateMockCoverLetter, mockReviseDraft } from './mock.js';

/** Returns true if the settings specify Mock Mode. */
const isMock = settings => settings?.provider === 'mock';

// ── Shared system prompt ─────────────────────────────────────────────────

const HALLUCINATION_GUARD = `CRITICAL RULE — HONESTY:
You must only use information explicitly provided in the user profile below.
Do NOT invent, assume, or embellish:
- qualifications or credentials not listed
- years of experience beyond what is stated
- certifications or licenses not listed
- software or tools not listed in the skills
- measurable achievements or statistics not supplied
- job titles or responsibilities not described

If information needed for a section is missing from the profile, omit that section or write a generic placeholder note rather than fabricating content. Accuracy and honesty are non-negotiable.`;

// ── Resume Generation ─────────────────────────────────────────────────────

export async function generateResume(jobData, profile, settings) {
  if (isMock(settings)) return generateMockResume(jobData, profile);
  const profileText = profileToPromptText(profile);

  const systemPrompt = [
    'You are an expert resume writer helping a job seeker tailor their resume to a specific job posting.',
    HALLUCINATION_GUARD,
    'Format the resume in clear plain text sections with proper headings.',
    'The output will be placed into a Word document template — do not add styling or markdown.',
    'Write compelling, truthful, and specific bullet points using the job posting as guidance.',
  ].join('\n\n');

  const userPrompt = [
    `JOB TITLE: ${jobData.jobTitle}`,
    `EMPLOYER: ${jobData.company}`,
    `LOCATION: ${jobData.location}`,
    `SOURCE URL: ${jobData.sourceUrl}`,
    '',
    '=== JOB DESCRIPTION ===',
    jobData.description,
    '=== END JOB DESCRIPTION ===',
    '',
    profileText,
    '',
    'TASK: Write a tailored resume for this job based solely on the user profile above.',
    'Structure it with these sections (omit any section for which no profile data exists):',
    '1. Contact Information',
    '2. Professional Summary (tailored to THIS specific job)',
    '3. Core Competencies / Skills (relevant to this posting)',
    '4. Work Experience (most relevant roles first, bullet points tailored to this job)',
    '5. Education',
    '6. Certifications (only if listed in profile and not marked do-not-claim)',
    '',
    'Output ONLY the resume content — no preamble, no commentary, no markdown formatting.',
  ].join('\n');

  return callAI(systemPrompt, userPrompt, settings);
}

// ── Cover Letter Generation ───────────────────────────────────────────────

export async function generateCoverLetter(jobData, profile, settings) {
  if (isMock(settings)) return generateMockCoverLetter(jobData, profile);
  const profileText = profileToPromptText(profile);
  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  const systemPrompt = [
    'You are an expert cover letter writer helping a job seeker create a tailored, human-sounding cover letter.',
    HALLUCINATION_GUARD,
    'Write in a professional but natural tone — avoid generic openers like "I am writing to express my interest".',
    'The letter should feel personal, confident, and specific to the role.',
    'Output plain text only. No markdown. No styling. The output slots into a Word template.',
  ].join('\n\n');

  const userPrompt = [
    `JOB TITLE: ${jobData.jobTitle}`,
    `EMPLOYER: ${jobData.company}`,
    `LOCATION: ${jobData.location}`,
    `DATE: ${today}`,
    '',
    '=== JOB DESCRIPTION ===',
    jobData.description,
    '=== END JOB DESCRIPTION ===',
    '',
    profileText,
    '',
    'TASK: Write a tailored cover letter for this specific job using the user profile above.',
    'Structure:',
    '- Date line',
    '- Greeting (use "Dear Hiring Manager," if no specific contact is known)',
    '- Opening paragraph: connect who they are to what the role needs (avoid clichés)',
    '- 2–3 body paragraphs: match their relevant experience to the job requirements',
    '- Closing paragraph: express genuine interest, reference next steps',
    '- Sign-off with the user\'s name',
    '',
    'Do NOT mention the hiring manager\'s name unless it appears in the job description.',
    'Output ONLY the cover letter body — no preamble, no commentary.',
  ].join('\n');

  return callAI(systemPrompt, userPrompt, settings);
}

// ── Draft Revision ─────────────────────────────────────────────────────────

/**
 * Revises the current draft based on a plain-English user request.
 * Does NOT start from scratch unless the user explicitly asks for a full rewrite.
 */
export async function reviseDraft(currentDraft, revisionRequest, docType, jobData, profile, settings) {
  if (isMock(settings)) return mockReviseDraft(currentDraft, revisionRequest, docType);
  const profileText = profileToPromptText(profile);

  const systemPrompt = [
    `You are revising a ${docType === 'resume' ? 'resume' : 'cover letter'} based on user feedback.`,
    HALLUCINATION_GUARD,
    'Revise only what the user asks. Preserve all other content.',
    'Do NOT start from scratch unless the user explicitly says "rewrite from scratch" or "start over".',
    'Output the complete revised document — not just the changed sections.',
    'Output ONLY the revised document content. No commentary, no preamble.',
  ].join('\n\n');

  const userPrompt = [
    '=== JOB DESCRIPTION (for context) ===',
    jobData.description,
    '=== END JOB DESCRIPTION ===',
    '',
    profileText,
    '',
    `=== CURRENT ${docType.toUpperCase()} DRAFT ===`,
    currentDraft,
    `=== END CURRENT DRAFT ===`,
    '',
    `USER REVISION REQUEST: "${revisionRequest}"`,
    '',
    'Apply the requested changes to the draft above and return the complete revised document.',
  ].join('\n');

  return callAI(systemPrompt, userPrompt, settings);
}

// ── Special Instructions Extraction via AI ────────────────────────────────

/**
 * Optional: use AI to enhance/verify special instruction detection.
 * Falls back gracefully if no instructions found.
 */
export async function detectSpecialInstructionsAI(jobDescription, settings) {
  // Skip AI call entirely in mock mode — heuristic results are sufficient.
  if (isMock(settings)) return [];
  const systemPrompt = [
    'You are scanning a job description for unusual or specific application instructions.',
    'Return ONLY a numbered list of special instructions found.',
    'Include: email submission addresses, deadlines, reference/competition numbers, required attachments, subject line requirements, salary requirements, document formatting instructions.',
    'If nothing unusual is found, respond with exactly: NONE',
    'Be concise. One item per line.',
  ].join('\n');

  const userPrompt = `Scan this job posting for special application instructions:\n\n${jobDescription}`;

  try {
    const result = await callAI(systemPrompt, userPrompt, settings);
    if (!result || result.trim().toUpperCase() === 'NONE') return [];
    return result.split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
  } catch {
    return []; // Don't fail silently — just return empty
  }
}
