'use client';

import { useState, useRef, useEffect } from 'react';
import { getCookie, setCookie } from '@/lib/cookies';
import { renderMarkdown } from '@/lib/markdown';
import { ChatMessage, ChatMode, Conversation } from '@/lib/types';

const COOKIE_KEY = 'nova_conversations';
const COOKIE_MAX_BYTES = 3500; // aman di bawah batas ~4KB browser

function newConversation(): Conversation {
  return { id: crypto.randomUUID(), title: 'Percakapan baru', messages: [] };
}

function loadConversations(): Conversation[] {
  const raw = getCookie(COOKIE_KEY);
  if (!raw) return [newConversation()];
  try {
    const parsed = JSON.parse(raw) as Conversation[];
    return parsed.length ? parsed : [newConversation()];
  } catch {
    return [newConversation()];
  }
}

// Simpan ke cookie, buang percakapan paling lama kalau kelebihan ukuran.
// Mengembalikan true kalau ada yang harus dibuang (untuk kasih tahu user).
function persistConversations(list: Conversation[]): { saved: Conversation[]; trimmed: boolean } {
  let working = [...list];
  let trimmed = false;
  while (working.length > 1 && encodeURIComponent(JSON.stringify(working)).length > COOKIE_MAX_BYTES) {
    working = working.slice(0, -1); // buang yang paling lama (di posisi terakhir)
    trimmed = true;
  }
  setCookie(COOKIE_KEY, JSON.stringify(working));
  return { saved: working, trimmed };
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
    setActiveId(loaded[0].id);
    setReady(true);
  }, []);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length, loading]);

  function commit(updated: Conversation[]) {
    const { saved, trimmed } = persistConversations(updated);
    setConversations(saved);
    if (trimmed) {
      setNotice('Beberapa percakapan lama dihapus otomatis karena batas ukuran cookie tercapai.');
      setTimeout(() => setNotice(''), 4000);
    }
    if (!saved.find((c) => c.id === activeId)) {
      setActiveId(saved[0].id);
    }
  }

  function updateActive(messages: ChatMessage[], title?: string) {
    const updated = conversations.map((c) =>
      c.id === active.id ? { ...c, messages, title: title ?? c.title } : c
    );
    commit(updated);
  }

  async function handleSend() {
    if (!input.trim() || loading || !active) return;
    setError('');
    const promptText = input.trim();
    const userMsg: ChatMessage = { role: 'user', content: promptText, mode };
    const newMessages = [...active.messages, userMsg];
    const title = active.messages.length === 0 ? promptText.slice(0, 30) : undefined;
    updateActive(newMessages, title);
    setInput('');
    setLoading(true);

    try {
      if (mode === 'image') {
        const res = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Gagal membuat gambar.');
        } else {
          updateActive([...newMessages, { role: 'assistant', content: data.imageUrl, mode: 'image' }]);
        }
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages
              .filter((m) => m.mode !== 'image')
              .map(({ role, content }) => ({ role, content })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Terjadi kesalahan.');
        } else {
          updateActive([...newMessages, { role: 'assistant', content: data.reply, mode: 'chat' }]);
        }
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  function handleNewChat() {
    const c = newConversation();
    commit([c, ...conversations]);
    setActiveId(c.id);
  }

  function handleDelete(id: string) {
    const updated = conversations.filter((c) => c.id !== id);
    commit(updated.length ? updated : [newConversation()]);
  }

  if (!ready || !active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-900 text-gray-400">
        Memuat...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 shrink-0 bg-base-800 border-r border-base-700 flex flex-col">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 rounded-lg border border-base-600 px-3 py-2 text-sm hover:bg-base-700 transition"
          >
            + Percakapan baru
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center rounded-lg text-sm transition ${
                c.id === active.id ? 'bg-base-700 text-white' : 'text-gray-400 hover:bg-base-700/60'
              }`}
            >
              <button onClick={() => setActiveId(c.id)} className="flex-1 text-left truncate px-3 py-2">
                {c.title}
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="hidden group-hover:block pr-2 text-gray-500 hover:text-red-400"
                title="Hapus percakapan"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-base-700">
          <p className="text-xs text-gray-500">
            Riwayat chat tersimpan di cookie browser ini saja — tidak ada login, tidak ada server database.
          </p>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {active.messages.length === 0 && (
              <div className="text-center mt-20">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-fuchsia-500 text-3xl font-bold mb-4">
                  N
                </div>
                <h2 className="text-xl font-semibold">Ada yang bisa dibantu?</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Ngobrol bebas, minta bantuan coding, atau buat gambar — pilih mode di bawah.
                </p>
              </div>
            )}

            {active.messages.map((m, i) => (
              <div key={i} className={`flex mb-5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 prose-chat ${
                    m.role === 'user'
                      ? 'bg-accent-600 text-white rounded-br-sm'
                      : 'bg-base-700 text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {m.mode === 'image' && m.role === 'assistant' ? (
                    <img src={m.content} alt="Gambar hasil AI" className="rounded-xl max-w-full" />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start mb-5">
                <div className="bg-base-700 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            {error && <div className="text-center text-sm text-red-400 mb-4">{error}</div>}
            {notice && <div className="text-center text-xs text-yellow-400 mb-4">{notice}</div>}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-base-700 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setMode('chat')}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  mode === 'chat'
                    ? 'bg-accent-600 border-accent-600 text-white'
                    : 'border-base-600 text-gray-400 hover:bg-base-700'
                }`}
              >
                💬 Chat / Coding
              </button>
              <button
                onClick={() => setMode('image')}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  mode === 'image'
                    ? 'bg-accent-600 border-accent-600 text-white'
                    : 'border-base-600 text-gray-400 hover:bg-base-700'
                }`}
              >
                🎨 Buat Gambar
              </button>
            </div>

            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={mode === 'image' ? 'Deskripsikan gambar yang mau dibuat...' : 'Tulis pesan atau minta bantuan coding...'}
                className="flex-1 resize-none rounded-xl bg-base-700 border border-base-600 px-4 py-3 text-sm outline-none focus:border-accent-500 max-h-40"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="rounded-xl bg-gradient-to-r from-accent-600 to-fuchsia-600 px-5 py-3 text-sm font-medium disabled:opacity-40"
              >
                Kirim
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              Nova AI bisa saja membuat kesalahan. Periksa kembali informasi penting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
