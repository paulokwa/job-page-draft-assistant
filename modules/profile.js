// modules/profile.js
// Reads and writes the structured user profile from chrome.storage.sync.

import { normalizeResumeContent } from './schema.js';

const PROFILE_KEY = 'userProfile';

export async function loadProfile() {
  const data = await chrome.storage.sync.get(PROFILE_KEY);
  return normalizeResumeContent(data[PROFILE_KEY] || {});
}

export async function saveProfile(profile) {
  await chrome.storage.sync.set({ [PROFILE_KEY]: profile });
}

/**
 * Converts the profile into a compact text block for injection into AI prompts.
 */
export function profileToPromptText(profile) {
  const p = profile.personalInfo;
  const lines = [];

  lines.push('=== USER PROFILE ===');
  lines.push(`Name: ${p.fullName || '(not provided)'}`);
  lines.push(`Email: ${p.email || '(not provided)'}`);
  lines.push(`Phone: ${p.phone || '(not provided)'}`);
  if (p.cityProvince) lines.push(`Location: ${p.cityProvince}`);
  if (p.linkedin)      lines.push(`LinkedIn: ${p.linkedin}`);
  if (p.portfolio)     lines.push(`Portfolio: ${p.portfolio}`);
  if (p.website)       lines.push(`Website: ${p.website}`);

  // Summary
  if (profile.summary) {
    lines.push(`\nSummary: ${profile.summary}`);
  }

  // Skills
  if (profile.skills?.length) {
    lines.push('\n--- Skills ---');
    lines.push(profile.skills.join(', '));
  }

  // Experience
  if (profile.experience?.length) {
    lines.push('\n--- Work Experience ---');
    profile.experience.forEach((exp, i) => {
      lines.push(`\nRole ${i + 1}: ${exp.jobTitle} at ${exp.employer} (${exp.startDate} - ${exp.endDate}) — ${exp.location}`);
      if (exp.bulletPoints?.length) {
        lines.push(`Responsibilities:\n- ${exp.bulletPoints.join('\n- ')}`);
      }
    });
  }

  // Education
  if (profile.education?.length) {
    lines.push('\n--- Education ---');
    profile.education.forEach(ed => {
      lines.push(`${ed.credential} — ${ed.institution} (${ed.dates})`);
      if (ed.notes?.length) lines.push(`Notes: ${ed.notes.join('; ')}`);
    });
  }

  // Projects
  if (profile.projects?.length) {
    lines.push('\n--- Projects ---');
    profile.projects.forEach(proj => {
      lines.push(`${proj.name} (${proj.role})`);
      if (proj.description) lines.push(proj.description);
      if (proj.technologies?.length) lines.push(`Tech: ${proj.technologies.join(', ')}`);
      if (proj.link) lines.push(`Link: ${proj.link}`);
    });
  }

  // Certifications
  if (profile.certifications?.length) {
    lines.push('\n--- Certifications ---');
    profile.certifications.forEach(cert => {
      lines.push(cert);
    });
  }

  lines.push('\n=== END USER PROFILE ===');
  return lines.join('\n');
}

