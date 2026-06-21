import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getConversations,
  getMessages,
  sendMessageWithFiles,
  deleteMessage,
  searchUsers,
  getAllUsers,
  findOrCreateDirect,
} from '../../api/messaging.api';

/* ─── Types ─────────────────────────────────────────────── */
type UserMini = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  avatar: string | null;
};

type LastMessage = {
  id: string;
  body: string;
  sender_name: string;
  created_at: string;
};

type Conversation = {
  id: string;
  conv_type: 'DIRECT' | 'GROUP';
  title: string;
  display_name: string;
  participants: UserMini[];
  last_message: LastMessage | null;
  unread_count: number;
  updated_at: string;
};

type Attachment = {
  id: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  download_url: string;
};

type Message = {
  id: string;
  body: string;
  sender: UserMini;
  is_mine: boolean;
  is_deleted: boolean;
  created_at: string;
  attachments: Attachment[];
};

/* ─── Helpers ────────────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  const cls = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div className={`${cls} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function MessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [userResults, setUserResults] = useState<UserMini[]>([]);
  const [allUsers, setAllUsers] = useState<UserMini[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* fetch conversations */
  const fetchConversations = () => {
    getConversations()
      .then(res => setConversations(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  };

  useEffect(() => {
    fetchConversations();
    getAllUsers().then(res => {
      const data = res.data;
      setAllUsers(Array.isArray(data) ? data : (data.results ?? []));
    }).catch(() => {});
  }, []);

  /* fetch messages when active conv changes + polling every 8s */
  useEffect(() => {
    if (!activeConv) return;
    setLoadingMsgs(true);
    getMessages(activeConv.id)
      .then(res => setMessages(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));

    const interval = setInterval(() => {
      getMessages(activeConv.id)
        .then(res => setMessages(res.data.results ?? res.data))
        .catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, [activeConv?.id]);

  /* polling conversations list every 15s */
  useEffect(() => {
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  /* scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* user search debounce */
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (search.length < 2) { setUserResults([]); return; }
    setSearchingUsers(true);
    searchTimeout.current = setTimeout(() => {
      searchUsers(search)
        .then(res => {
          const data = res.data;
          setUserResults(Array.isArray(data) ? data : (data.results ?? []));
        })
        .catch(() => setUserResults([]))
        .finally(() => setSearchingUsers(false));
    }, 350);
  }, [search]);

  /* displayed users in dropdown: search results or all users filtered locally */
  const displayedUsers = search.length >= 2
    ? userResults
    : allUsers.filter(u =>
        search.length === 0 ||
        u.full_name.toLowerCase().includes(search.toLowerCase())
      );

  const handleSelectConv = (conv: Conversation) => {
    setActiveConv(conv);
    setSearch('');
    setUserResults([]);
    // mark as read locally
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
    );
  };

  const handleStartDirect = async (u: UserMini) => {
    try {
      const res = await findOrCreateDirect(u.id);
      const conv: Conversation = res.data;
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      setActiveConv(conv);
      setSearch('');
      setUserResults([]);
      setSearchFocused(false);
    } catch {}
  };

  const handleSend = async () => {
    if ((!input.trim() && files.length === 0) || !activeConv || sending) return;
    const body = input.trim();
    const attachments = [...files];
    setInput('');
    setFiles([]);
    setSending(true);
    try {
      const res = await sendMessageWithFiles(activeConv.id, body, attachments);
      setMessages(prev => [...prev, res.data]);
      fetchConversations();
    } catch {
      setInput(body);
      setFiles(attachments);
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileIcon = (mime: string) => {
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return '📊';
    if (mime.includes('word') || mime.includes('document')) return '📝';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('zip')) return '🗜️';
    return '📎';
  };

  const handleDelete = async (msgId: string) => {
    setDeletingId(msgId);
    try {
      await deleteMessage(msgId);
      setMessages(prev =>
        prev.map(m => m.id === msgId ? { ...m, is_deleted: true, body: 'Message supprimé' } : m)
      );
    } catch {} finally {
      setDeletingId(null);
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.display_name.toLowerCase().includes(convSearch.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">

      {/* ── Sidebar: Conversations ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-gray-50">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-gray-900">Messages</h2>
              {totalUnread > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>

          {/* New conversation button */}
          <div className="relative">
            <button
              onClick={() => setSearchFocused(f => !f)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouvelle conversation
            </button>

          {/* User search results */}
          {searchFocused && (
            <div className="mt-1.5 bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden z-10 max-h-60 overflow-y-auto">
              {/* Search input inside dropdown */}
              <div className="px-3 py-2 border-b border-gray-100">
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              {searchingUsers ? (
                <p className="text-xs text-gray-400 px-3 py-2.5">Recherche...</p>
              ) : displayedUsers.length === 0 ? (
                <p className="text-xs text-gray-400 px-3 py-2.5">Aucun résultat</p>
              ) : (
                displayedUsers.map(u => (
                  <button
                    key={u.id}
                    onMouseDown={() => handleStartDirect(u)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar name={u.full_name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{u.full_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{u.role}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          </div>
        </div>
        <div className="px-4 py-2 border-b border-gray-200 bg-white">
          <input
            value={convSearch}
            onChange={e => setConvSearch(e.target.value)}
            placeholder="Filtrer les conversations..."
            className="w-full px-2.5 py-1.5 text-xs bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600 placeholder-gray-400"
          />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="space-y-0 divide-y divide-gray-50">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
              <svg className="w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xs text-gray-400">Aucune conversation</p>
              <p className="text-[11px] text-gray-300 mt-1">Recherchez un utilisateur pour commencer</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white ${
                    activeConv?.id === conv.id ? 'bg-white border-r-2 border-blue-500 shadow-sm' : ''
                  }`}
                >
                  <Avatar name={conv.display_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[13px] truncate ${conv.unread_count > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {conv.display_name}
                      </p>
                      {conv.last_message && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {timeAgo(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-[11px] text-gray-400 truncate">
                        {conv.last_message?.body || 'Aucun message'}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-blue-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main: Messages ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">Sélectionnez une conversation</p>
            <p className="text-xs text-gray-400 mt-1">ou recherchez un utilisateur pour commencer</p>
          </div>
        ) : (
          <>
            {/* Conv header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white">
              <Avatar name={activeConv.display_name} />
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{activeConv.display_name}</p>
                <p className="text-[11px] text-gray-400">
                  {activeConv.conv_type === 'GROUP'
                    ? `${activeConv.participants.length} participants`
                    : activeConv.participants.find(p => p.id !== user?.id)?.role || ''}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-[#f0f2f5]">
              {loadingMsgs ? (
                <div className="space-y-3 pt-2">
                  {[1,2,3].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''} animate-pulse`}>
                      <div className={`h-8 rounded-2xl bg-gray-200 ${i % 2 === 0 ? 'w-40' : 'w-52'}`} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-xs text-gray-400">Aucun message. Dites bonjour 👋</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const prevMsg = messages[idx - 1];
                    const showDate = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                    const showSender = !msg.is_mine && (!prevMsg || prevMsg.sender.id !== msg.sender.id);

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-[10px] text-gray-400 font-medium">
                              {new Date(msg.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                        )}
                        <div className={`flex items-end gap-2 ${msg.is_mine ? 'justify-end' : 'justify-start'} group`}>
                          {!msg.is_mine && (
                            <div className="w-6 flex-shrink-0">
                              {showSender && <Avatar name={msg.sender.full_name} size="sm" />}
                            </div>
                          )}
                          <div className={`max-w-[65%] ${msg.is_mine ? 'items-end' : 'items-start'} flex flex-col`}>
                            {showSender && !msg.is_mine && (
                              <p className="text-[10px] text-gray-400 mb-1 ml-1">{msg.sender.full_name}</p>
                            )}
                            <div className="relative flex items-end gap-1.5">
                              {msg.is_mine && !msg.is_deleted && (
                                <button
                                  onClick={() => handleDelete(msg.id)}
                                  disabled={deletingId === msg.id}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 flex-shrink-0 mb-0.5"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                              <div className={`rounded-2xl text-[13px] leading-relaxed break-words overflow-hidden ${
                                  msg.is_deleted
                                    ? 'bg-gray-200 text-gray-400 italic text-xs px-3.5 py-2'
                                    : msg.is_mine
                                    ? 'bg-blue-500 text-white rounded-br-sm shadow-sm'
                                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm'
                                }`}
                              >
                                {msg.body && <p className="px-3.5 py-2">{msg.body}</p>}
                                {/* Attachments */}
                                {!msg.is_deleted && msg.attachments?.length > 0 && (
                                  <div className={`space-y-1 px-2 pb-2 ${msg.body ? 'pt-0' : 'pt-2'}`}>
                                    {msg.attachments.map(att => (
                                      <a
                                        key={att.id}
                                        href={att.download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                                          msg.is_mine
                                            ? 'bg-blue-400/40 hover:bg-blue-400/60 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                      >
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                        </svg>
                                        <span className="truncate max-w-[160px]">{att.original_name}</span>
                                        <span className={`flex-shrink-0 ${msg.is_mine ? 'text-blue-200' : 'text-gray-400'}`}>
                                          {att.file_size < 1024 ? `${att.file_size}B` : att.file_size < 1048576 ? `${Math.round(att.file_size/1024)}KB` : `${(att.file_size/1048576).toFixed(1)}MB`}
                                        </span>
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className={`text-[10px] text-gray-400 mt-0.5 ${msg.is_mine ? 'text-right' : 'text-left ml-1'}`}>
                              {timeAgo(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              {/* File previews */}
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 text-xs">
                      <span>{fileIcon(f.type)}</span>
                      <span className="text-blue-700 font-medium max-w-[120px] truncate">{f.name}</span>
                      <span className="text-blue-400">{formatSize(f.size)}</span>
                      <button onClick={() => removeFile(i)} className="text-blue-400 hover:text-red-500 ml-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                {/* File attach button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.zip,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un fichier"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <div className="flex-1 bg-white border border-gray-300 rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all shadow-sm">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder="Écrivez un message..."
                    rows={1}
                    className="w-full bg-transparent text-[13px] text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-28"
                    style={{ lineHeight: '1.5' }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && files.length === 0) || sending}
                  className="w-9 h-9 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                >
                  {sending ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 translate-x-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne · Max 5 fichiers (10 MB chacun)</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
