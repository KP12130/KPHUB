import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Send, Clock, CheckCircle2,
    AlertCircle, Plus, X, Loader2, LifeBuoy, Paperclip, Archive
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

const ThreadItem = React.memo(({ chat, isActive, onClick }) => (
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
            <span className="text-[7px] text-gray-600 font-mono shrink-0">
                {new Date(chat.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
        <div className="flex items-center gap-2">
            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${chat.status === 'OPEN' ? 'bg-neon-green/10 text-neon-green' : 'bg-gray-800 text-gray-500'
                }`}>
                {chat.status}
            </span>
            {chat.responded && <CheckCircle2 className="w-2.5 h-2.5 text-neon-blue" />}
        </div>
    </button>
));

const MessageItem = React.memo(({ msg }) => (
    <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
            <div className={`px-4 py-3 rounded-2xl text-[11px] leading-relaxed font-mono ${msg.sender === 'user'
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

const CreateTicketModal = React.memo(({ isOpen, onClose, onSubmit, subject, setSubject, isSubmitting }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-void/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md glass-panel p-8 rounded-[2.5rem] border border-white/10 relative shadow-2xl"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-all z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-4 mb-8">
                    <div className="w-16 h-16 bg-neon-blue/10 border border-neon-blue/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-neon-blue" />
                    </div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">New Support Ticket</h3>
                    <p className="text-[10px] text-gray-500 font-mono uppercase">Provide subject telemetry to initialize link.</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[8px] font-bold text-gray-600 uppercase ml-1">Subject</label>
                        <input
                            autoFocus
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief summary of glitch (e.g. Login Loop)"
                            className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-[10px] text-white font-mono placeholder:text-gray-800 outline-none focus:border-neon-blue transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !subject.trim()}
                        className="w-full h-14 bg-neon-blue text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Ticket'}
                    </button>

                    <p className="text-center text-[7px] text-gray-700 font-mono uppercase">
                        Active Ticket Limit: 2/user
                    </p>
                </form>
            </motion.div>
        </div>,
        document.body
    );
});

const SupportChat = ({ currentUser, isOpen = true }) => {
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMessageLoading, setIsMessageLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [viewMode, setViewMode] = useState('ACTIVE'); // 'ACTIVE' or 'ARCHIVED'
    const [uploading, setUploading] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState([]);
    const fileInputRef = useRef(null);

    // New Ticket Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const scrollRef = useRef(null);

    const activeChat = React.useMemo(() =>
        chats.find(c => c.id === activeChatId),
        [chats, activeChatId]
    );

    const fetchChats = React.useCallback(async () => {
        if (!currentUser?.uid || !isOpen || document.hidden) return;
        try {
            const res = await axios.get(`${API_BASE}/api/support/my-chats`, {
                params: { userId: currentUser.uid, status: viewMode === 'ACTIVE' ? 'OPEN' : 'CLOSED' }
            });
            const ticketList = res.data;
            setChats(ticketList);
            if (ticketList.length > 0 && !activeChatId) {
                setActiveChatId(ticketList[0].id);
            }
        } catch (err) {
            console.error("Chat fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.uid, viewMode, isOpen, activeChatId]);

    useEffect(() => {
        if (!isOpen) return;
        fetchChats();
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, [fetchChats, isOpen]);

    const fetchMessages = React.useCallback(async () => {
        if (!activeChatId || !isOpen || document.hidden) return;
        try {
            const res = await axios.get(`${API_BASE}/api/support/chat/${activeChatId}/messages`);
            setMessages(res.data);
        } catch (err) {
            console.error("Messages fetch error:", err);
        } finally {
            setIsMessageLoading(false);
        }
    }, [activeChatId, isOpen]);

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
                sender: 'user',
                attachments: pendingAttachments
            });
            setNewMessage('');
            setPendingAttachments([]);
            fetchMessages(); // Immediate local update
        } catch (err) {
            toast.error("Message transmission failed.");
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
        if (!window.confirm("Close this support transmission?")) return;
        try {
            await axios.post(`${API_BASE}/api/support/close`, { ticketId: chatId });
            toast.success("Transmission closed.");
            setActiveChatId(null);
            fetchChats();
        } catch (err) {
            toast.error("Failed to close transmission.");
        }
    }, [fetchChats]);

    const handleCreateTicket = React.useCallback(async (e) => {
        e.preventDefault();
        if (!subject.trim()) return;

        setIsSubmitting(true);
        try {
            await axios.post(`${API_BASE}/api/support/submit`, {
                subject,
                userEmail: currentUser.email || 'unknown@grid.nexus',
                userId: currentUser.uid,
                type: 'REQUEST'
            });

            toast.success("Support ticket created.");
            setIsModalOpen(false);
            setSubject('');
            fetchChats();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to initialize protocol.");
        } finally {
            setIsSubmitting(false);
        }
    }, [subject, currentUser, fetchChats]);

    if (isLoading) return <div className="text-center py-20 animate-pulse font-mono text-[10px] text-gray-500">Loading support...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full relative">
            <div className="lg:col-span-1 border-r border-white/5 pr-6 space-y-6 flex flex-col">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-neon-blue" /> My Threads
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(prev => prev === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE')}
                            className={`p-1.5 rounded-lg border transition-all ${viewMode === 'ARCHIVED' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                            title={viewMode === 'ACTIVE' ? "View Archived" : "View Active"}
                        >
                            <Archive className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-1.5 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue rounded-lg hover:bg-neon-blue hover:text-black transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-none">
                    {chats.length === 0 ? (
                        <div className="text-[10px] text-gray-600 font-mono italic text-center py-10">No active transmissions.</div>
                    ) : (
                        chats.map(chat => (
                            <ThreadItem
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
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {activeChat.id}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {activeChat.status === 'OPEN' && (
                                    <>
                                        <span className="flex items-center gap-1.5 text-[8px] font-black text-neon-green uppercase tracking-[0.2em] bg-neon-green/10 px-3 py-1 rounded-full animate-pulse">
                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-green" /> Live
                                        </span>
                                        <button
                                            onClick={() => handleCloseChat(activeChat.id)}
                                            className="p-1.5 border border-white/5 text-gray-500 hover:text-red-500 hover:border-red-500/30 rounded-lg transition-all"
                                            title="Close Transmission"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
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
                            ) : messages.length === 0 ? (
                                <div className="text-center py-20 text-gray-600 font-mono text-[10px]">
                                    INITIAL_HANDSHAKE_COMPLETE. <br /> Describe your glitch payload below.
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <MessageItem key={msg.id || idx} msg={msg} />
                                ))
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-void border-t border-white/5">
                            <div className="relative">
                                <input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Transmit data to support grid..."
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
                                        className="p-2 text-gray-500 hover:text-white transition-colors disabled:opacity-30"
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
                            </div>

                            {pendingAttachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 px-2">
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
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-30">
                        <LifeBuoy className="w-20 h-20 text-gray-700" />
                        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Select synchronization thread to begin.</p>
                    </div>
                )}
            </div>

            <CreateTicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateTicket}
                subject={subject}
                setSubject={setSubject}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default SupportChat;
