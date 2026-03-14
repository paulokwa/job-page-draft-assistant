// modules/mock.js
// Simulated AI responses for Mock Mode (no API calls required).

// ── Utility ───────────────────────────────────────────────────────────────

function delay(ms = 600) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getName(profile) {
  return profile?.personal?.fullName || '[Your Name]';
}

function getSkills(profile) {
  const skills = profile?.skills || [];
  // Return up to 5 skills, falling back to generic ones
  const base = [
    'Client communication',
    'Case documentation',
    'Problem solving',
    'Technical troubleshooting',
    'Stakeholder support',
  ];
  return skills.length >= 3 ? skills.slice(0, 5) : base;
}

// ── Mock Resume ────────────────────────────────────────────────────────────

export async function generateMockResume(jobData, profile, sourceResumeText) {
  await delay(700);

  const name     = getName(profile);
  const email    = profile?.personal?.email    || 'your.email@example.com';
  const phone    = profile?.personal?.phone    || '(000) 000-0000';
  const address  = profile?.personal?.address  || 'Your City, Province';
  const linkedin = profile?.personal?.linkedin || '';
  const skills   = getSkills(profile);
  const jobTitle = jobData.jobTitle || 'the advertised position';
  const company  = jobData.company  || 'your organization';

  // Pull first experience for Work Experience section
  const exp = profile?.experience?.[0];
  const expBlock = exp
    ? `${exp.title} — ${exp.company} (${exp.dates || 'Dates'})
${exp.bullets || '• Managed client files and maintained accurate documentation.\n• Collaborated with multidisciplinary teams to support service delivery.\n• Responded to inquiries and resolved concerns professionally.'}`
    : `Support Specialist — Previous Employer (2020 – Present)
• Managed client files and maintained accurate documentation.
• Collaborated with multidisciplinary teams to support service delivery.
• Responded to inquiries and resolved concerns professionally.`;

  // Pull education
  const edu = profile?.education?.[0];
  const eduLine = edu
    ? `${edu.degree} — ${edu.school}${edu.year ? ` (${edu.year})` : ''}`
    : 'Degree / Diploma — Institution Name';

  return `${name}
${email} | ${phone} | ${address}${linkedin ? ` | ${linkedin}` : ''}

PROFESSIONAL SUMMARY
Experienced professional with a background in client services, communication, and stakeholder support. Skilled at handling complex requests, maintaining clear documentation, and contributing effectively to team goals. Seeking to bring these strengths to the ${jobTitle} role at ${company}.

CORE SKILLS
${skills.map(s => `• ${s}`).join('\n')}

WORK EXPERIENCE
${expBlock}

EDUCATION
${eduLine}

[MOCK MODE — This is a simulated draft. Switch to a real AI provider to generate a fully tailored resume.]
${sourceResumeText ? '[✅ Source Resume detected and used as primary factual basis.]' : ''}`;
}

// ── Mock Cover Letter ──────────────────────────────────────────────────────

export async function generateMockCoverLetter(jobData, profile, sourceResumeText) {
  await delay(600);

  const name    = getName(profile);
  const jobTitle = jobData.jobTitle || '[Job Title]';
  const company  = jobData.company  || '[Company]';
  const today    = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  return `${today}

Dear Hiring Manager,

I am pleased to submit my application for the ${jobTitle} position at ${company}. My background in client support, communication, and problem-solving aligns well with the responsibilities described in your posting.

In previous roles I have worked closely with clients and internal teams to resolve issues efficiently, while maintaining accurate documentation and clear communication across all stakeholder groups. I take pride in delivering consistent, high-quality service and adapting quickly to changing priorities.

I would welcome the opportunity to contribute these skills to the team at ${company} and am confident I can make a meaningful impact from day one.

Thank you for considering my application. I look forward to the opportunity to discuss how my experience aligns with your needs.

Sincerely,
${name}

[MOCK MODE — This is a simulated draft. Switch to a real AI provider to generate a fully tailored cover letter.]
${sourceResumeText ? '[✅ Source Resume detected and used as primary factual basis.]' : ''}`;
}

// ── Mock Revision ──────────────────────────────────────────────────────────

const REVISION_PHRASES = {
  formal: [
    'I am writing to formally express my interest',
    'I would be honoured to bring my expertise',
    'Please find enclosed my qualifications for consideration.',
  ],
  shorten: null,   // handled specially
  informal: [
    "I'd love to join your team",
    "I'm excited about this opportunity",
  ],
  customer: [
    'extensive background in customer-facing roles',
    'deep commitment to client satisfaction',
    'proven ability to de-escalate challenging situations',
  ],
  emphasize: [
    'My strongest asset is my ability to communicate clearly and empathetically.',
    'I excel in environments that require precision and client focus.',
  ],
};

export async function mockReviseDraft(currentDraft, revisionRequest, docType) {
  await delay(500);

  const req = revisionRequest.toLowerCase();

  // Shorten: trim the draft by roughly 20%
  if (req.includes('shorten') || req.includes('shorter') || req.includes('brief') || req.includes('concise')) {
    const lines = currentDraft.split('\n').filter(Boolean);
    const keep  = Math.max(8, Math.floor(lines.length * 0.75));
    return lines.slice(0, keep).join('\n') +
      '\n\n[MOCK MODE — Draft shortened as requested.]';
  }

  // Lengthen
  if (req.includes('longer') || req.includes('expand') || req.includes('elaborate') || req.includes('detail')) {
    return currentDraft +
      '\n\nAdditional context: Throughout my career I have consistently demonstrated a commitment to excellence, adaptability, and collaborative problem-solving. I believe strongly in continuous improvement and actively seek opportunities to develop new skills that support organizational goals.\n\n[MOCK MODE — Draft expanded as requested.]';
  }

  // Make more formal
  if (req.includes('formal') || req.includes('professional')) {
    return currentDraft.replace(
      /I'm|I'd|I've|can't|won't|don't/g,
      m => m.replace("'", '') === 'Im' ? 'I am' : m.replace("'", ' ')
    ).replace(/excited about/g, 'enthusiastic about')
      .replace(/love to/g, 'welcome the opportunity to') +
      '\n\n[MOCK MODE — Tone made more formal.]';
  }

  // Emphasize customer service
  if (req.includes('customer') || req.includes('client') || req.includes('service')) {
    const insertion = '\nMy extensive background in customer-facing roles has equipped me with the empathy, patience, and problem-solving skills necessary to deliver exceptional service in every interaction.\n';
    const lines = currentDraft.split('\n');
    const insertIdx = Math.floor(lines.length * 0.4);
    lines.splice(insertIdx, 0, insertion);
    return lines.join('\n') + '\n\n[MOCK MODE — Customer service experience emphasised.]';
  }

  // Generic fallback — append a note
  return currentDraft +
    `\n\n[MOCK MODE — Revision applied: "${revisionRequest}". In real mode the AI would make targeted changes throughout the document.]`;
}
