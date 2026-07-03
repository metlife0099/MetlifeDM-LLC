import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { chatApi } from '@/api/index.js';
import { toggleChat } from '@/store/index.js';
import { getErrorMessage } from '@/api/client.js';
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

export default function ChatWidget() {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.ui.chatOpen);
  const user = useSelector((s) => s.auth.user);

  const [chatId, setChatId] = useState(() => localStorage.getItem('mdm_chat') || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [started, setStarted] = useState(false);
  const bodyRef = useRef(null);
  const enabled = import.meta.env.VITE_ENABLE_CHAT !== 'false';

  /* Start / restore chat on first open */
  useEffect(() => {
    if (!open || started || !enabled) return;
    (async () => {
      try {
        if (chatId) {
          // Existing chat — load messages
          const { data } = await chatApi.getMessages(chatId);
          setMessages(data || []);
        } else {
          const { chat } = await chatApi.start({
            guestSessionId: user ? undefined : guestId(),
            guestName: user ? undefined : 'Guest',
          });
          localStorage.setItem('mdm_chat', chat._id);
          setChatId(chat._id);
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
        guestSessionId: user ? undefined : guestId(),
      });
      setMessages((m) => {
        const filtered = m.filter((x) => !x._id.toString().startsWith('local-'));
        const next = [...filtered, message];
        if (botReply) next.push(botReply);
        return next;
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  if (!enabled) return null;

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
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[380px] h-[560px] max-h-[calc(100vh-3rem)] bg-ivory-soft border border-hairline shadow-[0_32px_80px_-20px_rgba(10,23,48,0.35)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-ink text-ivory px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 grid place-items-center bg-ultra rounded-full">
                  <Sparkles size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-sm font-medium">MetlifeDM AI</div>
                  <div className="text-mono text-[0.65rem] uppercase tracking-widest text-ivory/50">
                    Online · typically replies instantly
                  </div>
                </div>
              </div>
              <button onClick={() => dispatch(toggleChat(false))} aria-label="Close">
                <X size={18} strokeWidth={1.25} />
              </button>
            </div>

            {/* Body */}
            <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m._id}
                  className={cn(
                    'flex',
                    m.senderType === 'user' || m.senderType === 'guest' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] px-4 py-2.5 text-sm rounded-2xl leading-relaxed',
                      m.senderType === 'user' || m.senderType === 'guest'
                        ? 'bg-ink text-ivory rounded-br-sm'
                        : m.senderType === 'bot'
                          ? 'bg-white text-ink border border-hairline rounded-bl-sm'
                          : 'bg-ultra-tint text-ink rounded-bl-sm'
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
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
                onKeyDown={(e) => e.key === 'Enter' && !sending && send()}
                placeholder="Ask about SEO, pricing, timelines…"
                className="flex-1 bg-transparent text-sm placeholder:text-slate focus:outline-none"
                disabled={sending}
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
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
