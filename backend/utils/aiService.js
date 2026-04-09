/**
 * AI Service — complaint analysis using Google Gemini (if GEMINI_API_KEY is set)
 * Falls back to a rule-based engine when no key is present.
 */

const CATEGORIES = [
  'department', 'mess', 'classroom', 'hostel',
  'campus', 'ground', 'medical_aid_centre', 'others',
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// ─── Rule-based fallback ─────────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  mess: [
    'food', 'meal', 'lunch', 'dinner', 'breakfast', 'canteen', 'mess',
    'cook', 'kitchen', 'hygiene', 'utensil', 'plate', 'eating', 'dining',
    'taste', 'quality of food', 'expired', 'stale', 'dirty food',
  ],
  hostel: [
    'room', 'dorm', 'dormitory', 'hostel', 'accommodation', 'roommate',
    'bed', 'bathroom', 'toilet', 'shower', 'warden', 'door', 'lock',
    'window', 'ceiling', 'leak', 'fan', 'light bulb', 'electrical',
  ],
  classroom: [
    'class', 'lecture', 'teacher', 'professor', 'faculty', 'board',
    'projector', 'chair', 'desk', 'air conditioning', 'ac', 'lab',
    'library', 'seating', 'classroom', 'blackboard', 'whiteboard',
  ],
  campus: [
    'campus', 'college', 'road', 'pathway', 'street', 'parking',
    'gate', 'security', 'garden', 'lawn', 'tree', 'wifi', 'internet',
    'network', 'building', 'infrastructure',
  ],
  ground: [
    'ground', 'playground', 'sports', 'field', 'court', 'gym',
    'basketball', 'football', 'cricket', 'badminton', 'tennis',
    'track', 'equipment', 'sport facility',
  ],
  medical_aid_centre: [
    'medical', 'health', 'sick', 'hospital', 'doctor', 'nurse',
    'medicine', 'first aid', 'ambulance', 'fever', 'injury',
    'health centre', 'clinic', 'aid', 'emergency', 'ill',
  ],
  department: [
    'department', 'admin', 'office', 'fee', 'admission', 'document',
    'certificate', 'scholarship', 'management', 'principal', 'dean',
    'hod', 'registration', 'marks', 'result', 'exam', 'academic',
  ],
};

const PRIORITY_SIGNALS = {
  urgent: [
    'emergency', 'urgent', 'immediately', 'dangerous', 'fire', 'assault',
    'harassment', 'abuse', 'medical emergency', 'unconscious', 'attack',
    'threat', 'unsafe', 'fatal', 'critical', 'severe injury',
  ],
  high: [
    'broken', 'damaged', 'severe', 'serious', 'not working', 'major',
    'flooding', 'injury', 'pain', 'no water', 'no electricity', 'failing',
    'repeated', 'multiple times', 'days',
  ],
  low: [
    'suggestion', 'minor', 'small', 'feedback', 'improvement', 'kindly',
    'would like', 'request', 'inconvenient', 'slight',
  ],
};

const SENTIMENT_SIGNALS = {
  distressed: ['harassment', 'abuse', 'assault', 'threat', 'fear', 'unsafe', 'dangerous'],
  frustrated: ['again', 'repeatedly', 'still', 'no response', 'ignored', 'already', 'multiple times', 'disgusted'],
  urgent: ['emergency', 'immediately', 'urgent', 'asap', 'critical'],
};

function scoreText(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
}

function ruleBased(subject, description) {
  const combined = `${subject} ${description}`;

  // Category
  let bestCategory = 'others';
  let bestScore = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = scoreText(combined, kws);
    if (score > bestScore) { bestScore = score; bestCategory = cat; }
  }

  // Priority
  let priority = 'medium';
  if (scoreText(combined, PRIORITY_SIGNALS.urgent) > 0) priority = 'urgent';
  else if (scoreText(combined, PRIORITY_SIGNALS.high) > 0) priority = 'high';
  else if (scoreText(combined, PRIORITY_SIGNALS.low) > 0) priority = 'low';

  // Sentiment
  let sentiment = 'neutral';
  for (const [sent, signals] of Object.entries(SENTIMENT_SIGNALS)) {
    if (scoreText(combined, signals) > 0) { sentiment = sent; break; }
  }

  // Keywords — top nouns/phrases from description (simple word extraction)
  const stopWords = new Set([
    'the', 'is', 'are', 'was', 'were', 'a', 'an', 'and', 'or', 'but',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'this', 'that', 'it',
    'i', 'we', 'my', 'our', 'has', 'have', 'had', 'be', 'been', 'not',
    'no', 'do', 'does', 'did', 'by', 'from', 'as', 'so', 'if', 'about',
  ]);
  const words = description.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));
  const freq = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  // Summary — first sentence of description (fallback)
  const firstSentence = description.split(/[.!?]/)[0].trim();
  const summary = firstSentence.length > 10
    ? (firstSentence.length > 120 ? firstSentence.slice(0, 120) + '...' : firstSentence)
    : description.slice(0, 120);

  return { category: bestCategory, priority, sentiment, summary, keywords, source: 'rule-based' };
}

// ─── Gemini AI ───────────────────────────────────────────────────────────────

async function geminiAnalyze(subject, description) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an AI assistant for a college student grievance portal. 
Analyze the following student complaint and respond ONLY with a valid JSON object—no markdown, no extra text.

Subject: "${subject}"
Description: "${description}"

Return this exact JSON structure:
{
  "category": "<one of: department, mess, classroom, hostel, campus, ground, medical_aid_centre, others>",
  "priority": "<one of: low, medium, high, urgent>",
  "sentiment": "<one of: neutral, frustrated, distressed, urgent>",
  "summary": "<one concise sentence (max 100 chars) describing the core issue>",
  "keywords": ["<keyword1>", "<keyword2>", "<keyword3>"]
}

Rules:
- category must exactly match one of the allowed values
- priority = urgent for safety/medical/harassment emergencies; high for major disruptions; low for minor suggestions; medium otherwise
- sentiment reflects the student's emotional tone
- summary is a neutral, factual one-liner of the problem
- keywords are 3 relevant nouns from the complaint`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if Gemini wraps output
  const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(jsonText);

  // Validate and sanitize
  if (!CATEGORIES.includes(parsed.category)) parsed.category = 'others';
  if (!PRIORITIES.includes(parsed.priority)) parsed.priority = 'medium';

  return { ...parsed, source: 'gemini' };
}

// ─── Chatbot ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_BASE = `You are a helpful assistant for a College Student Grievance Portal.

Your ONLY purpose is to assist users with questions related to this grievance portal.

You CAN help with:
- How to submit a complaint (go to "Submit Complaint" in the sidebar)
- How to track complaint status (login → "My Complaints" → click the complaint)
- Reporting facility issues: electricity, water, furniture, mess food, hostel, classroom, campus, ground, medical aid centre
- How to submit a service request (go to "Submit Request")
- Login or signup problems
- How to rate a resolved complaint
- Understanding complaint priorities (low / medium / high / urgent)
- Understanding SLA deadlines (how long the portal takes to resolve issues)
- Anonymous complaints (check the "Submit anonymously" option while submitting)
- Adding comments or attachments to a complaint
- Contacting admin or staff through the portal

STRICT RULES:
1. Answer ONLY questions related to this grievance portal.
2. If the question is completely unrelated to the portal, reply: "Sorry, I can only help with student grievance portal queries."
3. Do NOT answer general knowledge, coding, math, current events, or personal questions.
4. If unsure, say: "I don't have that information. Please contact the admin."
5. If the user says thanks/thank you/ty/tnx or similar, reply warmly: "You're welcome! 😊 It's my pleasure to assist you. Is there anything else I can help you with?"

BEHAVIOR:
- Keep answers short, clear, and friendly
- Guide step-by-step when needed
- Address the user by name when you know it
- If the user's message is unclear, ask a short follow-up question

EXAMPLES:
User: "Fan not working" → "Please go to Submit Complaint, select the relevant category, and describe the issue with your location details."
User: "How do I check status?" → "Login to the portal, go to 'My Complaints' in the sidebar, and click on your complaint to see the current status."
User: "Who is Elon Musk?" → "Sorry, I can only help with student grievance portal queries."
User: "thanks" → "You're welcome! 😊 It's my pleasure to assist you. Is there anything else I can help you with?"`;

/**
 * Build a personalized system prompt with live user context injected.
 */
function buildSystemPrompt(context = {}) {
  const { userName, userRole, department, complaints, staffStats, adminStats } = context;

  let lines = [SYSTEM_PROMPT_BASE, ''];

  if (userName || userRole) {
    let who = 'Current user:';
    if (userName) who += ` ${userName}`;
    if (userRole) who += ` (Role: ${userRole})`;
    if (department) who += `, Department: ${department}`;
    lines.push(who);
  }

  if (complaints) {
    lines.push(
      `This user's complaint stats: Total=${complaints.total}, Pending=${complaints.pending}, In Progress=${complaints.inProgress}, Resolved=${complaints.resolved}, Overdue=${complaints.overdue}.`,
      'If the user asks "how many complaints do I have" or similar, use these exact numbers to answer.'
    );
  }

  if (staffStats) {
    lines.push(
      `Staff workload: ${staffStats.assigned} open complaints assigned, ${staffStats.resolved} resolved by this staff member.`,
      'If staff asks about their workload, use these numbers.'
    );
  }

  if (adminStats) {
    lines.push(
      `ADMIN INSIGHT (confidential, share only when admin asks): Portal-wide: Total complaints=${adminStats.total}, Pending=${adminStats.pending}, In Progress=${adminStats.inProgress}, Resolved=${adminStats.resolved}, Overdue=${adminStats.overdue}, Total requests=${adminStats.totalRequests}, Pending requests=${adminStats.pendingRequests}, Active users=${adminStats.totalUsers}.`,
      'For role=admin: if they ask about portal stats, overview, or analytics, reply with these real numbers.'
    );
  }

  return lines.join('\n');
}

const RULE_BASED_RESPONSES = [
  {
    patterns: ['submit', 'file', 'raise', 'new complaint', 'new request', 'report', 'how to complain'],
    reply: 'To submit a complaint: Login → click "Submit Complaint" in the sidebar → fill in the category, subject, and description → optionally attach files → click Submit. Your complaint will be assigned an SLA deadline automatically.',
  },
  {
    patterns: ['track', 'status', 'check complaint', 'where is my', 'progress'],
    reply: 'To track your complaint: Login → go to "My Complaints" in the sidebar → click on any complaint to see its current status, assigned staff, and any updates or comments.',
  },
  {
    patterns: ['login', 'sign in', 'cant login', "can't login", 'password', 'forgot'],
    reply: 'If you cannot login, double-check your email and password. If you forgot your password, contact your portal admin to reset your account.',
  },
  {
    patterns: ['register', 'sign up', 'new account', 'create account'],
    reply: 'Students and parents can self-register on the portal. Click "Register" on the login page, fill in your details, and select your role (Student or Parent).',
  },
  {
    patterns: ['anonymous', 'hide name', 'identity'],
    reply: 'Yes! When submitting a complaint, check the "Submit anonymously" option. Your name will be hidden from staff, but the admin can still see it for security purposes.',
  },
  {
    patterns: ['attach', 'photo', 'image', 'file', 'upload', 'evidence'],
    reply: 'You can attach up to 3 files (images, PDFs, or documents, max 5MB each) while submitting a complaint. Just click the file upload field in the form.',
  },
  {
    patterns: ['rate', 'rating', 'feedback', 'review'],
    reply: 'Once your complaint is marked as Resolved, you can rate it 1–5 stars and leave feedback. Open the complaint → scroll to the bottom → submit your rating.',
  },
  {
    patterns: ['sla', 'deadline', 'how long', 'days'],
    reply: 'Each complaint category has an SLA (Service Level Agreement) deadline. If the issue is not resolved by that date, it is marked overdue. Urgent issues have shorter SLA windows.',
  },
  {
    patterns: ['priority', 'urgent', 'high', 'low', 'medium'],
    reply: 'Complaint priorities: Low (minor issues), Medium (regular issues), High (major disruptions), Urgent (safety/medical/harassment emergencies). You can set priority when submitting.',
  },
  {
    patterns: ['category', 'mess', 'hostel', 'classroom', 'campus', 'ground', 'medical', 'department'],
    reply: 'Available complaint categories: Mess, Hostel, Classroom, Campus, Ground, Medical Aid Centre, Department, Others. Choose the one that best matches your issue.',
  },
  {
    patterns: ['comment', 'communicate', 'contact staff'],
    reply: 'You can add comments to your complaint to communicate with the assigned staff. Open your complaint → scroll to the Comments section → type and submit your message.',
  },
  {
    patterns: ['service request', 'facility', 'new facility'],
    reply: 'For service requests (e.g. new furniture, maintenance), go to "Submit Request" in the sidebar. These are separate from complaints and have their own tracking.',
  },
  {
    patterns: ['notification', 'alert', 'update', 'email'],
    reply: 'You will receive in-app notifications when your complaint status changes. Hostel complaints also trigger an email to the warden team automatically.',
  },
  {
    patterns: ['admin', 'contact', 'support'],
    reply: 'For issues not handled by the portal, please contact your college admin directly. Admin can also manage user accounts and assign complaints to staff.',
  },
];

const THANKS_RE = /\b(thanks|thank you|thank u|thankyou|thx|tnx|ty|tysm|thnx|thnks|cheers|appreciated|great help|helped me)\b/i;
const OUT_OF_SCOPE_REPLY = 'Sorry, I can only help with student grievance portal queries.';

function ruleChatResponse(message, context = {}) {
  const lower = message.toLowerCase();
  const { userName, userRole, complaints, staffStats, adminStats } = context;
  const firstName = userName ? userName.split(' ')[0] : null;

  // Thanks detection — instant warm reply
  if (THANKS_RE.test(lower)) {
    const who = firstName ? `, ${firstName}` : '';
    return `You're welcome${who}! 😊 It's my pleasure to assist you.\nIs there anything else I can help you with?`;
  }

  // Greeting with personalization
  if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(lower)) {
    const who = firstName ? ` ${firstName}` : '';
    return `Hello${who}! 👋 I'm your Grievance Portal assistant. How can I help you today?`;
  }

  // Student/parent: real complaint count data
  if (complaints && /\b(my complaint|how many complaint|complaint count|total complaint|complaint status)\b/i.test(lower)) {
    const name = firstName ? `, ${firstName}` : '';
    return `Here's your complaint summary${name}:\n📋 Total: ${complaints.total}\n⏳ Pending: ${complaints.pending}\n🔄 In Progress: ${complaints.inProgress}\n✅ Resolved: ${complaints.resolved}${complaints.overdue > 0 ? `\n⚠️ Overdue: ${complaints.overdue}` : ''}`;
  }

  // Staff: workload data
  if (staffStats && /\b(assigned|workload|my task|how many assigned|open complaint)\b/i.test(lower)) {
    return `Your workload:\n📌 Open & Assigned: ${staffStats.assigned}\n✅ Resolved by you: ${staffStats.resolved}`;
  }

  // Admin insight (hidden feature)
  if (adminStats && /\b(portal stat|overview|total complaint|pending complaint|overdue|analytics|dashboard stat|all complaint|how many complaint)\b/i.test(lower)) {
    return `📊 Portal Overview (Admin):\n• Total Complaints: ${adminStats.total}\n• Pending: ${adminStats.pending}\n• In Progress: ${adminStats.inProgress}\n• Resolved: ${adminStats.resolved}\n• Overdue: ${adminStats.overdue}\n• Total Requests: ${adminStats.totalRequests}\n• Active Users: ${adminStats.totalUsers}`;
  }

  // Role-specific: staff resolve flow
  if (['staff', 'warden', 'caretaker'].includes(userRole) && /\b(resolve|close|update status)\b/i.test(lower)) {
    return 'To resolve a complaint: Open the complaint → click "Update Status" → choose "Resolved" → add a resolution note → optionally attach evidence → submit.';
  }

  // Role-specific: admin assignment
  if (userRole === 'admin' && /\b(assign|staff assignment)\b/i.test(lower)) {
    return 'To assign a complaint: Open the complaint → click "Assign Staff" → select a staff member → confirm. The staff member will receive a notification.';
  }

  if (userRole === 'admin' && /\b(create user|add staff|new user)\b/i.test(lower)) {
    return 'To add a staff account: Go to "User Management" in the sidebar → click "Add User" → fill in the details and assign role.';
  }

  // Generic rule-based patterns
  for (const { patterns, reply } of RULE_BASED_RESPONSES) {
    if (patterns.some((p) => lower.includes(p))) return reply;
  }

  // Out-of-scope detection
  const oosSignals = [
    'cricket', 'football', 'bollywood', 'movie', 'song', 'actor', 'actress',
    'stock', 'bitcoin', 'crypto', 'weather', 'news', 'politics', 'recipe',
    'code', 'programming', 'math', 'science', 'history', 'geography',
    'who is', 'what is the capital', 'how to cook', 'elon', 'modi', 'trump',
  ];
  if (oosSignals.some((s) => lower.includes(s))) return OUT_OF_SCOPE_REPLY;

  return "I'm not sure about that. Could you rephrase your question? I can help with submitting complaints, tracking status, login issues, and general portal usage.";
}

async function geminiChat(message, history, context = {}) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: buildSystemPrompt(context),
  });

  // Build conversation history for Gemini (max last 10 turns to save tokens)
  const recentHistory = history.slice(-10);
  const geminiHistory = recentHistory.map((msg) => ({
    role: msg.role === 'bot' ? 'model' : 'user',
    parts: [{ text: msg.text }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(message);
  return result.response.text().trim();
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Analyze a complaint's subject + description.
 * Returns: { category, priority, sentiment, summary, keywords, source }
 */
async function analyzeComplaint(subject, description) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiAnalyze(subject, description);
    } catch (err) {
      console.warn('[AI] Gemini failed, falling back to rule-based:', err.message);
    }
  }
  return ruleBased(subject, description);
}

/**
 * Chat with the portal assistant.
 * context: { userName, userRole, department, complaints?, staffStats?, adminStats? }
 */
async function chatWithBot(message, history = [], context = {}) {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiChat(message, history, context);
    } catch (err) {
      console.warn('[AI] Gemini chat failed, falling back to rule-based:', err.message);
    }
  }
  return ruleChatResponse(message, context);
}

module.exports = { analyzeComplaint, chatWithBot };
