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

If information needed for a section is missing from the profile or source resume, omit that section or write a generic placeholder note rather than fabricating content. Accuracy and honesty are non-negotiable.`;

function buildSourceTruthBlock(profileText, sourceResumeText) {
  const blocks = [];
  if (sourceResumeText) {
    blocks.push('=== USER SOURCE RESUME (GROUND TRUTH) ===');
    blocks.push(sourceResumeText);
    blocks.push('=== END SOURCE RESUME ===');
    blocks.push('');
  }
  blocks.push('=== USER PROFILE DATA ===');
  blocks.push(profileText);
  blocks.push('=== END USER PROFILE ===');
  return blocks.join('\\n');
}

const JSON_OUTPUT_INSTRUCTION = `OUTPUT FORMAT:
Your final response must be valid JSON ONLY. No markdown code blocks, no preamble, no trailing text.
Follow this schema exactly:`;

// ── Resume Generation ─────────────────────────────────────────────────────

export async function generateResume(jobData, profile, settings, sourceResumeText = '', templateMap = null) {
  if (isMock(settings)) return generateMockResume(jobData, profile, sourceResumeText);
  const profileText = profileToPromptText(profile);
  const truthBlock = buildSourceTruthBlock(profileText, sourceResumeText);

  const systemPrompt = [
    'You are an expert resume writer helping a job seeker tailor their resume to a specific job posting.',
    HALLUCINATION_GUARD,
    'You must return a structured JSON object containing only the tailored content for the resume sections.',
    'Do not include formatting or markdown. The output will be injected into a Word document template.',
    'Constrain length to fit a standard resume layout. Each bullet point should be concise and impact-oriented.',
  ].join('\n\n');

  const resumeSchema = {
    summary: "A 3-4 sentence professional summary tailored to the job.",
    skills: ["Skill 1", "Skill 2", "..."],
    workExperience: [
      {
        title: "Tailored Job Title",
        company: "Company Name",
        dates: "Date Range",
        bullets: ["Bullet 1", "Bullet 2", "..."]
      }
    ],
    education: [
      {
        degree: "Degree Name",
        school: "School Name",
        year: "Year"
      }
    ],
    certifications: ["Cert 1", "Cert 2", "..."]
  };

  const userPrompt = [
    `JOB TITLE: ${jobData.jobTitle}`,
    `EMPLOYER: ${jobData.company}`,
    `=== JOB DESCRIPTION ===\n${jobData.description}\n=== END JOB DESCRIPTION ===`,
    '',
    truthBlock,
    '',
    'TASK: Write tailored resume content for this job based solely on the source resume & user profile.',
    '',
    JSON_OUTPUT_INSTRUCTION,
    JSON.stringify(resumeSchema, null, 2),
    '',
    templateMap ? `TEMPLATE CONSTRAINTS:\n${JSON.stringify(templateMap, null, 2)}` : '',
  ].join('\n');

  return callAI(systemPrompt, userPrompt, settings);
}

// ── Cover Letter Generation ───────────────────────────────────────────────

export async function generateCoverLetter(jobData, profile, settings, sourceResumeText = '') {
  if (isMock(settings)) return generateMockCoverLetter(jobData, profile, sourceResumeText);
  const profileText = profileToPromptText(profile);
  const truthBlock = buildSourceTruthBlock(profileText, sourceResumeText);

  const systemPrompt = [
    'You are an expert cover letter writer.',
    HALLUCINATION_GUARD,
    'Return a structured JSON object containing the greetings and body paragraphs.',
    'Write in a professional but natural tone.',
  ].join('\n\n');

  const coverLetterSchema = {
    greeting: "Dear [Hiring Manager Name or 'Hiring Manager'],",
    paragraphs: [
      "Intro paragraph...",
      "Body paragraph 1...",
      "Body paragraph 2...",
      "Closing paragraph..."
    ],
    closing: "Sincerely,",
    signOff: "Full Name"
  };

  const userPrompt = [
    `JOB TITLE: ${jobData.jobTitle}`,
    `EMPLOYER: ${jobData.company}`,
    `=== JOB DESCRIPTION ===\n${jobData.description}\n=== END JOB DESCRIPTION ===`,
    '',
    truthBlock,
    '',
    'TASK: Write a tailored cover letter for this job.',
    '',
    JSON_OUTPUT_INSTRUCTION,
    JSON.stringify(coverLetterSchema, null, 2),
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
  
  const draftStr = typeof currentDraft === 'object' ? JSON.stringify(currentDraft, null, 2) : currentDraft;

  const systemPrompt = [
    `You are revising a ${docType === 'resume' ? 'resume' : 'cover letter'} structured JSON based on user feedback.`,
    HALLUCINATION_GUARD,
    'Return the COMPLETE revised JSON object. Do not add fields not present in the original schema.',
    'Maintain valid JSON format.',
  ].join('\n\n');

  const userPrompt = [
    '=== JOB DESCRIPTION (for context) ===',
    jobData.description,
    '=== END JOB DESCRIPTION ===',
    '',
    profileText,
    '',
    `=== CURRENT ${docType.toUpperCase()} JSON DRAFT ===`,
    draftStr,
    `=== END CURRENT DRAFT ===`,
    '',
    `USER REVISION REQUEST: "${revisionRequest}"`,
    '',
    'Apply the changes and return the full updated JSON.',
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
