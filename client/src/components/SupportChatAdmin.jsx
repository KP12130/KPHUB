import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Send, Clock, CheckCircle2,
    AlertCircle, X, Loader2, LifeBuoy, Mail, ExternalLink, Trash2,
    Activity, Lock, Shield, Paperclip, Bell, BellOff, Zap
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc
} from 'firebase/firestore';

const AdminThreadItem = React.memo(({ chat, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${isActive
            ? 'bg-white/5 border-neon-blue/30'
            : 'border-white/5 hover:border-white/10'
            }`}
    >
        <div className="flex justify-between items-start gap-2 mb-1">
            <h4 className={`text-[11px] font-bold truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {chat.subject}
            </h4>
            {!chat.responded && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            )}
        </div>
        <div className="flex items-center justify-between">
            <span className="text-[7px] text-gray-500 font-mono truncate max-w-[80px]">
                {chat.userEmail}
            </span>
            <span className="text-[7px] text-gray-600 font-mono italic">
                {new Date(chat.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    </button>
));

const AdminMessageItem = React.memo(({ msg }) => (
    <div className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] space-y-1 ${msg.sender === 'admin' ? 'items-end' : 'items-start'} flex flex-col`}>
            <div className={`px-4 py-3 rounded-2xl text-[11px] leading-relaxed font-mono ${msg.sender === 'admin'
                ? 'bg-neon-blue text-black font-bold'
                : 'bg-white/5 border border-white/10 text-white'
                }`}>
                {msg.text}
                {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {msg.attachments.map((at, i) => (
                            at.type === 'image' ? (
                                <img key={i} src={at.url} alt="attachment" className="max-w-full rounded-lg border border-white/10" />
                            ) : (
                                <a key={i} href={at.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/40 transition-all text-[10px]">
                                    <Paperclip className="w-3 h-3 text-neon-blue" />
                                    <span className="truncate max-w-[150px]">{at.name}</span>
                                </a>
                            )
                        ))}
                    </div>
                )}
            </div>
            <span className="text-[7px] text-gray-600 font-mono uppercase">
                {msg.sender === 'admin' ? 'ARCHITECT' : 'CLIENT'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    </div>
));

const SupportChatAdmin = ({ isOpen = true }) => {
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMessageLoading, setIsMessageLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [statusFilter, setStatusFilter] = useState('OPEN'); // 'OPEN' or 'CLOSED'
    const [uploading, setUploading] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const fileInputRef = useRef(null);
    const lastMsgCountRef = useRef(0);

    const templates = [
        { id: 1, label: "Greeting", text: "Hello! Architect here. How can I assist you with the grid today?" },
        { id: 2, label: "Cache Fix", text: "Please try clearing your browser cache and refreshing the Studio. This usually resolves synchronization glitches." },
        { id: 3, label: "Resolved", text: "I have resolved the issue from the backend. Please verify on your side." },
        { id: 4, label: "Closing", text: "We haven't heard back from you, so we are closing this transmission. Feel free to initialize a new link if needed." }
    ];

    const scrollRef = useRef(null);

    const activeChat = React.useMemo(() =>
        chats.find(c => c.id === activeChatId),
        [chats, activeChatId]
    );

    const fetchChats = React.useCallback(async () => {
        if (!isOpen || document.hidden) return;
        try {
            const res = await axios.get(`${API_BASE}/api/support/tickets`, {
                params: { status: statusFilter }
            });
            const ticketList = res.data;
            setChats(ticketList);
            if (activeChatId && !ticketList.find(c => c.id === activeChatId) && statusFilter === 'OPEN') {
                setActiveChatId(null);
            }
        } catch (err) {
            console.error("Admin chats fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, isOpen, activeChatId]);

    useEffect(() => {
        if (!isOpen) return;
        fetchChats();
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, [fetchChats, isOpen]);

    const playNotificationSound = () => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play();
        } catch (e) {
            console.warn("Sound play failed", e);
        }
    };

    const fetchMessages = React.useCallback(async () => {
        if (!activeChatId || !isOpen || document.hidden) return;
        try {
            const res = await axios.get(`${API_BASE}/api/support/chat/${activeChatId}/messages`);
            const msgs = res.data;

            if (msgs.length > lastMsgCountRef.current && msgs.length > 0) {
                const latest = msgs[msgs.length - 1];
                if (latest.sender === 'user' && soundEnabled) {
                    playNotificationSound();
                }
            }
            lastMsgCountRef.current = msgs.length;
            setMessages(msgs);
        } catch (err) {
            console.error("Admin messages fetch error:", err);
        } finally {
            setIsMessageLoading(false);
        }
    }, [activeChatId, isOpen, soundEnabled]);

    useEffect(() => {
        if (!activeChatId || !isOpen) return;
        setIsMessageLoading(true);
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [fetchMessages, activeChatId, isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && pendingAttachments.length === 0) || isSending) return;

        setIsSending(true);
        try {
            await axios.post(`${API_BASE}/api/support/chat/${activeChatId}/message`, {
                text: newMessage,
                sender: 'admin',
                attachments: pendingAttachments
            });
            setNewMessage('');
            setPendingAttachments([]);
            fetchMessages();
        } catch (err) {
            toast.error("Transmission failed.");
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${API_BASE}/api/support/upload`, formData);
            setPendingAttachments(prev => [...prev, {
                name: file.name,
                url: res.data.url,
                type: file.type.startsWith('image/') ? 'image' : 'file'
            }]);
        } catch (err) {
            toast.error("File upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleCloseChat = React.useCallback(async (chatId) => {
        const reason = window.prompt("REASON FOR TERMINATION (Optional):", "Issue Resolved.");
        if (reason === null) return;

        try {
            await axios.post(`${API_BASE}/api/support/close`, {
                ticketId: chatId,
                reason: reason.trim() || 'Session closed by Administrator.'
            });
            toast.success("Session closed.");
            setActiveChatId(null);
            fetchChats();
        } catch (err) {
            toast.error("Termination failed.");
        }
    }, [fetchChats]);

    if (isLoading) return <div className="text-center py-20 font-mono text-[10px] text-gray-500">Loading admin panel...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
            <div className="lg:col-span-1 border-r border-white/5 pr-6 space-y-6 flex flex-col">
                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 px-1">
                        <Activity className="w-4 h-4 text-neon-green" /> Support Grid
                    </h3>

                    <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                        <button
                            onClick={() => setStatusFilter('OPEN')}
                            className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${statusFilter === 'OPEN' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setStatusFilter('CLOSED')}
                            className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${statusFilter === 'CLOSED' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            Archived
                        </button>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <span className="text-[8px] font-bold text-gray-600 uppercase">Sound Alert</span>
                        <button
                            onClick={() => setSoundEnabled(prev => !prev)}
                            className={`p-1 rounded transition-all ${soundEnabled ? 'text-neon-blue' : 'text-gray-700'}`}
                        >
                            {soundEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-none">
                    {chats.length === 0 ? (
                        <div className="text-[10px] text-gray-600 font-mono italic text-center py-10">Grid is clear. No active transmissions.</div>
                    ) : (
                        chats.map(chat => (
                            <AdminThreadItem
                                key={chat.id}
                                chat={chat}
                                isActive={activeChatId === chat.id}
                                onClick={() => setActiveChatId(chat.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
                {activeChat ? (
                    <div className="flex flex-col h-full bg-black/20 rounded-2xl border border-white/5">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-white italic uppercase tracking-widest text-sm">{activeChat.subject}</h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-[9px] text-neon-blue font-mono">{activeChat.userEmail}</p>
                                    <div className="w-1 h-1 rounded-full bg-gray-800" />
                                    <p className="text-[9px] text-gray-600 font-mono">ID: {activeChat.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`mailto:${activeChat.userEmail}?subject=Re: ${activeChat.subject}`}
                                    className="p-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-lg transition-all"
                                    title="External Mailto Relay"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                                {activeChat.status === 'OPEN' ? (
                                    <button
                                        onClick={() => handleCloseChat(activeChat.id)}
                                        className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                        title="Close Transmission"
                                    >
                                        <Lock className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <div className="px-3 py-1 bg-gray-800 border border-white/5 text-[8px] font-black text-gray-500 uppercase rounded-lg">
                                        Terminated
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            ref={scrollRef}
                            className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/5"
                        >
                            {isMessageLoading && messages.length === 0 ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-neon-blue animate-spin opacity-20" />
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <AdminMessageItem key={msg.id || idx} msg={msg} />
                                ))
                            )}
                        </div>

                        {activeChat.status === 'OPEN' ? (
                            <div className="p-4 bg-void border-t border-white/5 space-y-3">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {templates.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setNewMessage(t.text)}
                                            className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-bold text-gray-500 hover:text-neon-blue hover:border-neon-blue/30 transition-all uppercase flex items-center gap-1"
                                        >
                                            <Zap className="w-2.5 h-2.5" /> {t.label}
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handleSendMessage} className="relative">
                                    <input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Enter admin response..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-24 text-[11px] text-white font-mono placeholder:text-gray-700 outline-none focus:border-neon-blue transition-colors"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="p-2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            <Paperclip className="w-4 h-4" />
                                        </button>
                                        <button
                                            disabled={(!newMessage.trim() && pendingAttachments.length === 0) || isSending}
                                            className="p-2 text-neon-blue hover:text-white transition-colors disabled:opacity-30"
                                        >
                                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </form>

                                {pendingAttachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {pendingAttachments.map((at, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] text-gray-400">
                                                <Paperclip className="w-3 h-3" />
                                                <span>{at.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="text-gray-600 hover:text-red-500"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 bg-void border-t border-white/5 text-center">
                                <p className="text-[10px] text-gray-600 font-mono uppercase italic tracking-widest">
                                    Transmission terminated. Protocol archived.
                                </p>
                                {activeChat.closeReason && (
                                    <p className="text-[9px] text-neon-blue font-mono mt-1 opacity-60">
                                        Reason: {activeChat.closeReason}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-20">
                        <Shield className="w-20 h-20 text-gray-700" />
                        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Select transmission to process.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportChatAdmin;
