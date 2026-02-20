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

const GlassCard = ({ children, className = "" }) => (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

const SupportChat = ({ currentUser }) => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
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

    useEffect(() => {
        if (!currentUser?.uid) return;

        const q = query(
            collection(db, 'support_tickets'),
            where('userId', '==', currentUser.uid),
            where('status', '==', viewMode === 'ACTIVE' ? 'OPEN' : 'CLOSED')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort in memory by lastActivity
            ticketList.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

            setChats(ticketList);
            if (ticketList.length > 0 && !activeChat) {
                setActiveChat(ticketList[0]);
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Chats listener error:", err);
            toast.error("Real-time sync failed.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser?.uid, viewMode]);

    useEffect(() => {
        if (!activeChat?.id) return;

        const msgQuery = query(
            collection(db, 'support_tickets', activeChat.id, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(msgQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setIsMessageLoading(false);
        }, (err) => {
            console.error("Messages listener error:", err);
            setIsMessageLoading(false);
        });

        return () => unsubscribe();
    }, [activeChat?.id]);

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
            await axios.post(`${API_BASE}/api/support/chat/${activeChat.id}/message`, {
                text: newMessage,
                sender: 'user',
                attachments: pendingAttachments
            });
            setNewMessage('');
            setPendingAttachments([]);
            // No manual refresh needed, listener handles it🦾
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
            setPendingAttachments([...pendingAttachments, {
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

    const handleCloseChat = async (chatId) => {
        if (!window.confirm("Close this support transmission?")) return;
        try {
            await axios.post(`${API_BASE}/api/support/close`, { ticketId: chatId });
            toast.success("TRANSMISSION_CLOSED");
            setActiveChat(null);
            // Listener handles cleanup🦾
        } catch (err) {
            toast.error("Failed to close transmission.");
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!subject.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_BASE}/api/support/submit`, {
                subject,
                userEmail: currentUser.email || 'unknown@grid.nexus',
                userId: currentUser.uid,
                type: 'REQUEST'
            });

            toast.success("TICKET_INITIALIZED: Thread created.");
            setIsModalOpen(false);
            setSubject('');
            // Listener handles selection🦾
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to initialize protocol.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="text-center py-20 animate-pulse font-mono text-[10px] text-gray-500">SYNCING_SUPPORT_MATRIX...</div>;

    const modalContent = (
        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full max-w-md glass-panel p-8 rounded-[2.5rem] border border-white/10 relative shadow-2xl"
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-all z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center space-y-4 mb-8">
                            <div className="w-16 h-16 bg-neon-blue/10 border border-neon-blue/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 text-neon-blue" />
                            </div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">New_Support_Protocol</h3>
                            <p className="text-[10px] text-gray-500 font-mono uppercase">Provide subject telemetry to initialize link.</p>
                        </div>

                        <form onSubmit={handleCreateTicket} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[8px] font-bold text-gray-600 uppercase ml-1">Transmission_Subject</label>
                                <input
                                    autoFocus
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Brief summary of glitch (e.g. Login Loop)"
                                    className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-[10px] text-white font-mono placeholder:text-gray-800 outline-none focus:border-neon-blue transition-colors"
                                />
                            </div>

                            <button
                                disabled={isSubmitting || !subject.trim()}
                                className="w-full h-14 bg-neon-blue text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'INITIALIZING...' : 'Establish_Link'}
                            </button>

                            <p className="text-center text-[7px] text-gray-700 font-mono uppercase">
                                Active Ticket Limit: 2/user
                            </p>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px] relative">
            {/* Sidebar: Chat List */}
            <div className="lg:col-span-1 border-r border-white/5 pr-6 space-y-6 flex flex-col">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-neon-blue" /> My_Threads
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE')}
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
                            <button
                                key={chat.id}
                                onClick={() => setActiveChat(chat)}
                                className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${activeChat?.id === chat.id
                                    ? 'bg-white/5 border-neon-blue/30'
                                    : 'border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <h4 className={`text-[11px] font-bold truncate ${activeChat?.id === chat.id ? 'text-white' : 'text-gray-400'}`}>
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
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
                {activeChat ? (
                    <div className="flex flex-col h-full bg-black/20 rounded-2xl border border-white/5">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-white italic uppercase tracking-widest text-sm">{activeChat.subject}</h3>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {activeChat.id}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {activeChat.status === 'OPEN' && (
                                    <>
                                        <span className="flex items-center gap-1.5 text-[8px] font-black text-neon-green uppercase tracking-[0.2em] bg-neon-green/10 px-3 py-1 rounded-full animate-pulse">
                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-green" /> Live_Sync
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

                        {/* Messages */}
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
                                    <div
                                        key={msg.id || idx}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
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
                                ))
                            )}
                        </div>

                        {/* Input */}
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
                                        onClick={() => fileInputRef.current.click()}
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

                            {/* Pending Attachments */}
                            {pendingAttachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 px-2">
                                    {pendingAttachments.map((at, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] text-gray-400">
                                            <Paperclip className="w-3 h-3" />
                                            <span>{at.name}</span>
                                            <button
                                                onClick={() => setPendingAttachments(pendingAttachments.filter((_, idx) => idx !== i))}
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

            {/* Render Modal via Portal */}
            {typeof window === 'object' && createPortal(modalContent, document.body)}
        </div>
    );
};

export default SupportChat;
