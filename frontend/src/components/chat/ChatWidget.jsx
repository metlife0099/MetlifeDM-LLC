import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, Headset } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { chatApi } from '@/api/index.js';
import { toggleChat } from '@/store/index.js';
import { getAccessToken, getErrorMessage } from '@/api/client.js';
import { getSocketUrl } from '@/utils/socket.js';
import { cn } from '@/utils/format.js';
import { Spinner } from '@/components/ui/index.jsx';

const guestId = () => {
  let id = localStorage.getItem('mdm_guest');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('mdm_guest', id);
  }
  return id;
};

// Both the REST response and the live socket deliver the same messages
// (send → REST returns {message, botReply}; the server also emits
// 'message:new' for each over the socket). Merge through one place so a
// message can never be appended twice no matter which arrives first, and so
// the optimistic local echo gets replaced exactly once by the real one.
const mergeMessages = (prev, incoming) => {
  const list = (Array.isArray(incoming) ? incoming : [incoming]).filter(Boolean);
  let next = prev;
  for (const msg of list) {
    if (next.some((m) => m._id === msg._id)) continue;
    if (msg.senderType === 'user' || msg.senderType === 'guest') {
      next = next.filter((m) => !m._id.toString().startsWith('local-'));
    }
    next = [...next, msg];
  }
  return next;
};

export default function ChatWidget() {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.ui.chatOpen);
  const user = useSelector((s) => s.auth.user);

  const [chatId, setChatId] = useState(() => localStorage.getItem('mdm_chat') || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [started, setStarted] = useState(false);
  // Seed from cache so a page reload renders the correct mode instantly,
  // instead of flashing "AI assistant" while the status fetch is in flight.
  const [chatStatus, setChatStatusRaw] = useState(() => localStorage.getItem('mdm_chat_status') || 'bot');
  const [switching, setSwitching] = useState(false);
  const bodyRef = useRef(null);
  const enabled = import.meta.env.VITE_ENABLE_CHAT !== 'false';

  // The customer can freely switch between AI and Admin (and back) at any
  // time before the conversation is resolved — only ignore a missing/falsy
  // value (e.g. a failed status fetch), never overwrite with a real one.
  const applyChatStatus = (next) => {
    if (!next) return;
    localStorage.setItem('mdm_chat_status', next);
    setChatStatusRaw(next);
  };

  /* Start / restore chat on first open */
  useEffect(() => {
    if (!open || started || !enabled) return;
    (async () => {
      try {
        if (chatId) {
          // Existing chat — load messages. Always send guestSessionId: a
          // chat started before login (or before logout) is still owned by
          // this browser's persisted guest identity, independent of whether
          // the visitor happens to be authenticated on this particular request.
          const [{ data }, statusRes] = await Promise.all([
            chatApi.getMessages(chatId, { guestSessionId: guestId() }),
            chatApi.getStatus(chatId, { guestSessionId: guestId() }).catch(() => null),
          ]);
          setMessages(data || []);
          applyChatStatus(statusRes?.status);
        } else {
          const { chat } = await chatApi.start({
            guestSessionId: guestId(),
            guestName: user ? undefined : 'Guest',
          });
          localStorage.setItem('mdm_chat', chat._id);
          setChatId(chat._id);
          applyChatStatus(chat.status || 'bot');
          setMessages([
            {
              _id: 'welcome',
              senderType: 'bot',
              content: "Hi 👋 I'm MetlifeDM's AI assistant. What can I help you grow today?",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        setStarted(true);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    })();
  }, [open, chatId, started, user, enabled]);

  /* Live updates: join this chat's room so admin replies, AI handoffs, and
     status changes made from the admin panel show up without a reload. */
  useEffect(() => {
    if (!chatId || !open || !enabled) return;
    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token: getAccessToken() || undefined, guestSessionId: guestId() },
      transports: ['websocket', 'polling'],
    });

    socket.emit('chat:join', { chatId });
    const onMessage = (msg) => {
      const belongsHere = msg.chat === chatId || msg.chat?.toString?.() === chatId;
      if (!belongsHere) return;
      setMessages((prev) => mergeMessages(prev, msg));
    };
    const onStatus = ({ status }) => applyChatStatus(status);
    const onAssigned = () => applyChatStatus('active');
    socket.on('message:new', onMessage);
    socket.on('chat:status', onStatus);
    socket.on('chat:assigned', onAssigned);

    return () => {
      socket.emit('chat:leave', { chatId });
      socket.off('message:new', onMessage);
      socket.off('chat:status', onStatus);
      socket.off('chat:assigned', onAssigned);
      socket.disconnect();
    };
  }, [chatId, open, enabled]);

  /* Auto-scroll on new messages */
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content || !chatId) return;
    setInput('');
    setMessages((m) => [
      ...m,
      { _id: `local-${Date.now()}`, senderType: 'user', content, createdAt: new Date().toISOString() },
    ]);
    setSending(true);
    try {
      const { message, botReply } = await chatApi.sendMessage(chatId, {
        content,
        guestSessionId: guestId(),
      });
      // The socket may have already delivered these same messages —
      // mergeMessages skips anything with an _id we already have.
      setMessages((m) => mergeMessages(m, [message, botReply]));
    } catch (e) {
      toast.error(getErrorMessage(e));
      setMessages((m) => m.filter((x) => !x._id.toString().startsWith('local-')));
    } finally {
      setSending(false);
    }
  };

  const askAdmin = async () => {
    if (!chatId || chatStatus !== 'bot' || switching) return;
    setSwitching(true);
    try {
      await chatApi.requestHuman(chatId, { guestSessionId: guestId() });
      applyChatStatus('queued');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSwitching(false);
    }
  };

  const askAI = async () => {
    if (!chatId || chatStatus === 'bot' || chatStatus === 'resolved' || switching) return;
    setSwitching(true);
    try {
      await chatApi.requestAI(chatId, { guestSessionId: guestId() });
      applyChatStatus('bot');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSwitching(false);
    }
  };

  if (!enabled) return null;

  const isResolved = chatStatus === 'resolved';
  const headerCopy =
    chatStatus === 'active'
      ? { label: 'Admin', sub: "You're chatting with our team" }
      : chatStatus === 'queued'
        ? { label: 'Waiting for Admin', sub: 'Connecting you with our team…' }
        : isResolved
          ? { label: 'Conversation resolved', sub: 'Thanks for chatting with us' }
          : { label: 'MetlifeDM AI', sub: 'Online · typically replies instantly' };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => dispatch(toggleChat())}
        aria-label="Open chat"
        className={cn(
          'fixed bottom-6 right-6 z-40 w-14 h-14 grid place-items-center rounded-full transition-all duration-300',
          'bg-ink text-ivory hover:bg-ultra shadow-[0_16px_40px_-12px_rgba(10,23,48,0.5)] hover:scale-105',
          open && 'scale-0 opacity-0 pointer-events-none'
        )}
      >
        <MessageSquare size={20} strokeWidth={1.5} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-ultra rounded-full animate-pulse" />
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            // Scrolling anywhere over the widget (header, toggle bar, composer)
            // must never leak through to the page behind it. The message
            // list itself scrolls natively — only block wheel events that
            // land outside that one scrollable region.
            onWheel={(e) => {
              if (!bodyRef.current?.contains(e.target)) e.preventDefault();
            }}
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[380px] h-[560px] max-h-[calc(100vh-3rem)] bg-ivory-soft border border-hairline shadow-[0_32px_80px_-20px_rgba(10,23,48,0.35)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-ink text-ivory px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 grid place-items-center bg-ultra rounded-full">
                  {chatStatus === 'bot' ? <Sparkles size={16} strokeWidth={1.5} /> : <Headset size={16} strokeWidth={1.5} />}
                </div>
                <div>
                  <div className="text-sm font-medium">{headerCopy.label}</div>
                  <div className="text-mono text-[0.65rem] uppercase tracking-widest text-ivory/50">
                    {headerCopy.sub}
                  </div>
                </div>
              </div>
              <button onClick={() => dispatch(toggleChat(false))} aria-label="Close">
                <X size={18} strokeWidth={1.25} />
              </button>
            </div>

            {/* AI / Admin switcher — click either pill to switch modes */}
            {!isResolved && (
              <div className="flex items-center gap-1.5 px-5 py-2.5 bg-ivory border-b border-hairline">
                <button
                  type="button"
                  onClick={askAI}
                  disabled={chatStatus === 'bot' || switching}
                  className={cn(
                    'px-3 py-1.5 text-mono text-[0.65rem] uppercase tracking-widest rounded-full border transition-colors',
                    chatStatus === 'bot'
                      ? 'bg-ink text-ivory border-ink cursor-default'
                      : 'border-hairline text-slate hover:border-ink hover:text-ink cursor-pointer disabled:opacity-50'
                  )}
                >
                  AI assistant
                </button>
                <button
                  type="button"
                  onClick={askAdmin}
                  disabled={chatStatus !== 'bot' || switching}
                  className={cn(
                    'px-3 py-1.5 text-mono text-[0.65rem] uppercase tracking-widest rounded-full border transition-colors',
                    chatStatus !== 'bot'
                      ? 'bg-ink text-ivory border-ink cursor-default'
                      : 'border-hairline text-slate hover:border-ink hover:text-ink cursor-pointer disabled:opacity-50'
                  )}
                >
                  {switching ? 'Connecting…' : 'Ask Admin'}
                </button>
              </div>
            )}

            {/* Body */}
            <div ref={bodyRef} className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3 scrollbar-thin">
              {messages.map((m) => {
                if (m.senderType === 'system') {
                  return (
                    <div key={m._id} className="flex justify-center">
                      <div className="text-mono text-[0.65rem] uppercase tracking-widest text-slate text-center px-3 py-1.5 bg-sand/50 rounded-full">
                        {m.content}
                      </div>
                    </div>
                  );
                }
                const isCustomer = m.senderType === 'user' || m.senderType === 'guest';
                const isAgent = m.senderType === 'agent';
                return (
                  <div key={m._id} className={cn('flex', isCustomer ? 'justify-end' : 'justify-start')}>
                    <div className="max-w-[85%]">
                      {!isCustomer && (
                        <div className="text-mono text-[0.6rem] uppercase tracking-widest text-slate mb-1 px-1">
                          {isAgent ? (m.senderName || 'Admin') : 'AI'}
                        </div>
                      )}
                      <div
                        className={cn(
                          'px-4 py-2.5 text-sm rounded-2xl leading-relaxed',
                          isCustomer
                            ? 'bg-ink text-ivory rounded-br-sm'
                            : isAgent
                              ? 'bg-ultra-tint text-ink border border-ultra/25 rounded-bl-sm'
                              : 'bg-white text-ink border border-hairline rounded-bl-sm'
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 bg-white text-ink border border-hairline rounded-2xl rounded-bl-sm">
                    <Spinner size={14} className="text-ultra" />
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-hairline p-3 flex items-center gap-2 bg-ivory-soft">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !sending && !isResolved && send()}
                placeholder={isResolved ? 'This conversation has been resolved' : 'Ask about SEO, pricing, timelines…'}
                className="flex-1 bg-transparent text-sm placeholder:text-slate focus:outline-none disabled:opacity-50"
                disabled={sending || isResolved}
              />
              <button
                onClick={send}
                disabled={sending || isResolved || !input.trim()}
                className="w-9 h-9 grid place-items-center bg-ink text-ivory hover:bg-ultra disabled:opacity-30 transition-colors rounded-full"
                aria-label="Send"
              >
                <Send size={14} strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
