import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { aiService } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import agentBotSrc from '../../assets/agent-bot.svg';

// ─── Role-based quick prompts ────────────────────────────────────────────────
const ROLE_QUICK_PROMPTS = {
  student: [
    'How many complaints do I have?',
    'How to submit a complaint?',
    'How to track my complaint?',
    'Submit anonymous complaint',
  ],
  admin: [
    'Show portal stats',
    'How to assign a complaint?',
    'How to manage users?',
    'View analytics',
  ],
  staff: [
    'How to resolve a complaint?',
    'Show my workload',
    'How to add evidence?',
    'How to update complaint status?',
  ],
  warden: [
    'How to resolve a hostel complaint?',
    'Show my workload',
    'How to add evidence?',
    'What is SLA?',
  ],
  caretaker: [
    'Show my workload',
    'How to resolve a complaint?',
    'How to add evidence?',
    'Contact admin',
  ],
  parent: [
    "View my child's complaints",
    'How to track complaint status?',
    'What categories exist?',
    'Contact admin',
  ],
  default: [
    'How to submit a complaint?',
    'How to track my complaint?',
    'How to submit a request?',
    'Login / signup issues',
  ],
};

// ─── Contextual quick-reply chips after a bot message ─────────────────────
function getContextualReplies(botText, userRole) {
  const lower = botText.toLowerCase();
  const chips = [];

  if (lower.includes('submit') && lower.includes('complaint')) {
    chips.push('Set it as anonymous?', 'What priority should I set?');
  }
  if (lower.includes('status') || lower.includes('track')) {
    chips.push('What does "in progress" mean?', 'When will it be resolved?');
  }
  if (lower.includes('login') || lower.includes('password')) {
    chips.push('How to register?');
  }
  if (lower.includes('sla') || lower.includes('deadline')) {
    chips.push('What if SLA is breached?');
  }
  if (lower.includes('category') || lower.includes('priority')) {
    chips.push('How to submit a complaint?');
  }
  if ((userRole === 'admin') && lower.includes('assign')) {
    chips.push('How to manage users?');
  }
  if (lower.includes('resolve') || lower.includes('evidence')) {
    chips.push('How to add a comment?');
  }

  return chips.slice(0, 3);
}

// ─── Thanks detection (handled client-side for instant response) ─────────────
const THANKS_RE = /\b(thanks|thank you|thank u|thankyou|thx|tnx|ty|tysm|thnx|thnks|cheers|appreciated|great help|helped me)\b/i;

function getThanksReply(firstName) {
  const who = firstName ? `, ${firstName}` : '';
  return `You're welcome${who}! 😊 It's my pleasure to assist you.\nIs there anything else I can help you with?`;
}

// ─── Role-based welcome message ───────────────────────────────────────────────
function buildWelcomeMessage(user) {
  if (!user) {
    return "Hi! 👋 I'm your Grievance Portal assistant.\nHow can I help you today?";
  }
  const name = user.name?.split(' ')[0] || 'there';
  const roleMessages = {
    student: `Hi ${name}! 👋 I'm your Grievance Portal assistant.\nAsk me about complaints, tracking status, or portal usage.`,
    admin: `Hello ${name}! 👋 I'm your Portal Assistant.\nYou can ask me about portal stats, complaint management, or user administration.`,
    staff: `Hi ${name}! 👋 I'm here to help you.\nAsk me how to resolve complaints, update statuses, or add evidence.`,
    warden: `Hi ${name}! 👋 I'm your Portal Assistant.\nAsk me about hostel complaints, resolution steps, or SLA deadlines.`,
    caretaker: `Hi ${name}! 👋 I'm here to help you.\nAsk me about your assigned complaints or how to resolve them.`,
    hod: `Hello ${name}! 👋 I'm your Portal Assistant.\nAsk me about viewing complaints or departmental updates.`,
    parent: `Hi ${name}! 👋 I'm your Grievance Portal assistant.\nI can help you track your child's complaints or navigate the portal.`,
  };
  return roleMessages[user.role] || `Hi ${name}! 👋 I'm your Grievance Portal assistant. How can I help you today?`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ChatBot = () => {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || null;

  const initialMsg = {
    role: 'bot',
    text: buildWelcomeMessage(user),
    quickReplies: [],
  };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([initialMsg]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const windowRef = useRef(null);

  // draggable position (left/top in px). null means use CSS defaults.
  const [pos, setPos] = useState(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  // Typewriter state
  const [animState, setAnimState] = useState({ idx: -1, text: '' });
  const animRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── Typewriter effect: fires when a new message is added ──────────────────
  useEffect(() => {
    const lastIdx = messages.length - 1;
    if (lastIdx < 0) return;
    const last = messages[lastIdx];
    if (last.role !== 'bot') return;

    clearInterval(animRef.current);
    setAnimState({ idx: lastIdx, text: '' });

    let i = 0;
    const fullText = last.text;
    animRef.current = setInterval(() => {
      i++;
      const slice = fullText.slice(0, i);
      setAnimState({ idx: lastIdx, text: slice });
      if (i >= fullText.length) {
        clearInterval(animRef.current);
        setAnimState({ idx: -1, text: '' });
      }
    }, 14);

    return () => clearInterval(animRef.current);
  }, [messages.length]);

  // ── Scroll to bottom on new message or animation frame ───────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [animState.text, loading]);

  // ── Focus input when opened ───────────────────────────────────────────────
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // initialize position when opened first time
  useEffect(() => {
    if (!open || pos) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const defaultWidth = 360;
    const defaultHeight = 420;
    const left = Math.max(12, w - defaultWidth - 28);
    const top = Math.max(48, h - defaultHeight - 120);
    setPos({ left, top });
    
  }, [open]);

  // ── Drag: store latest handler in ref to avoid stale closures ───────────
  const dragHandlerRef = useRef(null);
  dragHandlerRef.current = { pos, setPos };

  const onDragStart = useCallback((e) => {
    // Don't start drag if the click target is a button inside the header
    if (e.target.closest('button')) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = {
      dragging: true,
      startX: clientX,
      startY: clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };

    const onMove = (ev) => {
      if (!dragState.current.dragging) return;
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const newLeft = Math.max(8, Math.min(window.innerWidth - 200, dragState.current.startLeft + cx - dragState.current.startX));
      const newTop = Math.max(8, Math.min(window.innerHeight - 120, dragState.current.startTop + cy - dragState.current.startY));
      dragHandlerRef.current.setPos({ left: newLeft, top: newTop });
      ev.preventDefault();
    };

    const onEnd = () => {
      dragState.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed, quickReplies: [] };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');

    // Handle thanks instantly on the client — no API round-trip
    if (THANKS_RE.test(trimmed)) {
      const quickReplies = ROLE_QUICK_PROMPTS[user?.role] || ROLE_QUICK_PROMPTS.default;
      setMessages([...updatedMessages, {
        role: 'bot',
        text: getThanksReply(firstName),
        quickReplies,
      }]);
      return;
    }

    setLoading(true);
    const history = messages.map((m) => ({ role: m.role, text: m.text }));

    try {
      const res = await aiService.chat(trimmed, history);
      const reply = res.data.reply;
      const quickReplies = getContextualReplies(reply, user?.role);
      setMessages([...updatedMessages, { role: 'bot', text: reply, quickReplies }]);
    } catch {
      setMessages([...updatedMessages, {
        role: 'bot',
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        quickReplies: [],
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, user, firstName]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = () => {
    clearInterval(animRef.current);
    setAnimState({ idx: -1, text: '' });
    setMessages([{ ...initialMsg }]);
    setInput('');
  };

  const quickPrompts = ROLE_QUICK_PROMPTS[user?.role] || ROLE_QUICK_PROMPTS.default;
  const isTyping = animState.idx !== -1;
  const isIdle = !loading && !isTyping;

  return createPortal(
    <>
      {/* Floating action button */}
      <button
        className={`chatbot-fab ${open ? 'chatbot-fab--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle chatbot"
        title="Portal Assistant"
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <img src={agentBotSrc} alt="Assistant" style={{ width: 32, height: 32, borderRadius: 8 }} />
        )}
        {!open && <span className="chatbot-fab__dot" />}
      </button>

      {open && (
        <div
          ref={windowRef}
          className="chatbot-window"
          style={pos ? { left: `${pos.left}px`, top: `${pos.top}px`, right: 'auto', bottom: 'auto' } : {}}
        >
          {/* Header — drag handle */}
          <div
            className="chatbot-header"
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            style={{ cursor: 'grab', userSelect: 'none' }}
          >
            <div className="chatbot-header__info">
              <span className="chatbot-header__avatar">
                <img src={agentBotSrc} alt="Assistant" className="chatbot-avatar-img" />
              </span>
              <div>
                <p className="chatbot-header__name">Portal Assistant</p>
                <p className="chatbot-header__status">
                  {loading || isTyping ? 'Typing…' : 'Online • Always here to help'}
                </p>
              </div>
            </div>
            <div className="chatbot-header__actions">
              <button className="chatbot-icon-btn" onClick={handleClear} title="Clear chat">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
              <button className="chatbot-icon-btn" onClick={() => setOpen(false)} title="Close">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => {
              const isAnimatingThis = animState.idx === i;
              const displayText = isAnimatingThis ? animState.text : msg.text;
              const isLastBotMsg = msg.role === 'bot' && i === messages.length - 1 && isIdle;

              return (
                <div key={i}>
                  <div className={`chatbot-msg chatbot-msg--${msg.role}`}>
                    {msg.role === 'bot' && (
                      <span className="chatbot-msg__avatar">
                        <img src={agentBotSrc} alt="Assistant" className="chatbot-avatar-img" />
                      </span>
                    )}
                    <div className="chatbot-msg__bubble">
                      {displayText.split('\n').map((line, j, arr) => (
                        <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                      ))}
                      {isAnimatingThis && <span className="chatbot-cursor">▌</span>}
                    </div>
                  </div>

                  {isLastBotMsg && msg.quickReplies?.length > 0 && (
                    <div className="chatbot-chips">
                      {msg.quickReplies.map((q) => (
                        <button key={q} className="chatbot-chip" onClick={() => sendMessage(q)}>{q}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="chatbot-msg chatbot-msg--bot">
                <span className="chatbot-msg__avatar">
                  <img src={agentBotSrc} alt="Assistant" className="chatbot-avatar-img" />
                </span>
                <div className="chatbot-msg__bubble chatbot-msg__bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Initial quick prompts */}
          {messages.length === 1 && isIdle && (
            <div className="chatbot-quick-prompts">
              {quickPrompts.map((q) => (
                <button key={q} className="chatbot-quick-btn" onClick={() => sendMessage(q)}>{q}</button>
              ))}
            </div>
          )}

          {/* User role badge */}
          {user && messages.length === 1 && (
            <div className="chatbot-role-badge">
              Logged in as <strong>{user.name}</strong> · <span className="chatbot-role-tag">{user.role}</span>
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input-row">
            <textarea
              ref={inputRef}
              className="chatbot-input"
              placeholder="Ask me about the portal…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              maxLength={500}
              disabled={loading}
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              title="Send"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default ChatBot;
