'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { getMessages, sendMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

export default function MessagesPage({ params }: { params: Promise<{ uid: string }> }) {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealerId = searchParams.get('dealer');

  const [uid, setUid] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    params.then(p => setUid(p.uid));
  }, [params]);

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
    }
  }, [loading, token, router]);

  // Load messages
  const loadMessages = async () => {
    if (!token || !uid) return;
    try {
      const data = await getMessages(uid, token) as { messages?: Message[] } | Message[];
      const msgs = Array.isArray(data) ? data : (data as { messages?: Message[] }).messages ?? [];
      setMessages(msgs);
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (token && uid) {
      loadMessages();
      // Poll every 5 seconds for new messages
      pollRef.current = setInterval(loadMessages, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, uid]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !token || !uid || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      await sendMessage(uid, { recipient_id: dealerId ?? '', body: content }, token);
      await loadMessages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send message');
      setText(content); // restore on failure
    } finally {
      setSending(false);
    }
  }

  if (loading || (fetching && !fetchError)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center max-w-md w-full shadow-sm">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Couldn&apos;t Load Chat</h2>
            <p className="text-sm text-gray-500 mb-6">{fetchError}</p>
            <Link
              href="/my-offers"
              className="inline-flex items-center gap-2 bg-[#003087] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#002070] transition-colors"
            >
              <ChevronLeft size={16} /> Back to My Offers
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f7fa]">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col px-4 py-6" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/my-offers/${uid}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#003087] transition-colors"
          >
            <ChevronLeft size={16} /> Back to Offer
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#003087]/10 flex items-center justify-center">
              <MessageSquare size={16} className="text-[#003087]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Offer Chat</p>
              {dealerId && (
                <p className="text-xs text-gray-400">Dealer ID: {dealerId}</p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <MessageSquare size={36} className="text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">Start the conversation below.</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id || msg.sender_role === user?.role;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-[#003087] text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 px-1">
                          <Clock size={10} />
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
              disabled={sending}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="flex items-center justify-center w-10 h-10 bg-[#003087] text-white rounded-xl hover:bg-[#002070] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={16} />
              }
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
