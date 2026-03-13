// modules/profile.js
// Reads and writes the structured user profile from chrome.storage.sync.

const PROFILE_KEY = 'userProfile';

export const DEFAULT_PROFILE = {
  personal: {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    linkedin: '',
    portfolio: '',
  },
  summaries: [
    { label: 'General', text: '' },
    { label: 'Customer Service', text: '' },
    { label: 'Case Management', text: '' },
    { label: 'Technical', text: '' },
    { label: 'Public Sector', text: '' },
  ],
  skills: [],          // string[]
  experience: [],      // { title, company, dates, location, bullets, tags }[]
  education: [],       // { degree, school, year, notes }[]
  certifications: [],  // { name, issuer, year, doNotClaim }[]
  doNotClaimNotes: '', // free text global constraints
};

export async function loadProfile() {
  const data = await chrome.storage.sync.get(PROFILE_KEY);
  return data[PROFILE_KEY] ? mergeWithDefaults(data[PROFILE_KEY]) : { ...DEFAULT_PROFILE };
}

export async function saveProfile(profile) {
  await chrome.storage.sync.set({ [PROFILE_KEY]: profile });
}

function mergeWithDefaults(saved) {
  return {
    ...DEFAULT_PROFILE,
    ...saved,
    personal: { ...DEFAULT_PROFILE.personal, ...(saved.personal || {}) },
    summaries: saved.summaries?.length ? saved.summaries : DEFAULT_PROFILE.summaries,
    skills: saved.skills || [],
    experience: saved.experience || [],
    education: saved.education || [],
    certifications: saved.certifications || [],
    doNotClaimNotes: saved.doNotClaimNotes || '',
  };
}

/**
 * Converts the profile into a compact text block for injection into AI prompts.
 */
export function profileToPromptText(profile) {
  const p = profile.personal;
  const lines = [];

  lines.push('=== USER PROFILE ===');
  lines.push(`Name: ${p.fullName || '(not provided)'}`);
  lines.push(`Email: ${p.email || '(not provided)'}`);
  lines.push(`Phone: ${p.phone || '(not provided)'}`);
  if (p.address)   lines.push(`Location: ${p.address}`);
  if (p.linkedin)  lines.push(`LinkedIn: ${p.linkedin}`);
  if (p.portfolio) lines.push(`Portfolio: ${p.portfolio}`);

  // Summaries
  const nonEmptySummaries = profile.summaries.filter(s => s.text.trim());
  if (nonEmptySummaries.length) {
    lines.push('\n--- Professional Summaries ---');
    nonEmptySummaries.forEach(s => lines.push(`[${s.label}] ${s.text.trim()}`));
  }

  // Skills
  if (profile.skills.length) {
    lines.push('\n--- Skills ---');
    lines.push(profile.skills.join(', '));
  }

  // Experience
  if (profile.experience.length) {
    lines.push('\n--- Work Experience ---');
    profile.experience.forEach((exp, i) => {
      lines.push(`\nRole ${i + 1}: ${exp.title} at ${exp.company} (${exp.dates}) — ${exp.location}`);
      if (exp.bullets) lines.push(`Responsibilities:\n${exp.bullets}`);
      if (exp.tags?.length) lines.push(`Sector tags: ${exp.tags.join(', ')}`);
    });
  }

  // Education
  if (profile.education.length) {
    lines.push('\n--- Education ---');
    profile.education.forEach(ed => {
      lines.push(`${ed.degree} — ${ed.school} (${ed.year})${ed.notes ? '; ' + ed.notes : ''}`);
    });
  }

  // Certifications
  if (profile.certifications.length) {
    lines.push('\n--- Certifications ---');
    profile.certifications.forEach(cert => {
      const note = cert.doNotClaim ? ' [DO NOT CLAIM unless explicitly requested]' : '';
      lines.push(`${cert.name} — ${cert.issuer} (${cert.year})${note}`);
    });
  }

  // Do not claim notes
  if (profile.doNotClaimNotes?.trim()) {
    lines.push('\n--- Important Restrictions ---');
    lines.push(profile.doNotClaimNotes.trim());
  }

  lines.push('\n=== END USER PROFILE ===');
  return lines.join('\n');
}
