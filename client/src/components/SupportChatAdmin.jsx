import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Send, Clock, CheckCircle2,
    AlertCircle, X, Loader2, LifeBuoy, Mail, ExternalLink, Trash2
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';

const SupportChatAdmin = () => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMessageLoading, setIsMessageLoading] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const scrollRef = useRef(null);

    useEffect(() => {
        fetchChats();
        const chatInterval = setInterval(fetchChats, 30000); // 30s poll for new chats
        return () => clearInterval(chatInterval);
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.id);
            const interval = setInterval(() => fetchMessages(activeChat.id, true), 5000);
            return () => clearInterval(interval);
        }
    }, [activeChat?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchChats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/support/tickets`);
            setChats(res.data);
        } catch (err) {
            console.error("Chat sync error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (chatId, isPolling = false) => {
        if (!isPolling) setIsMessageLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/support/chat/${chatId}/messages`);
            setMessages(res.data);
        } catch (err) {
            console.error("Message sync error");
        } finally {
            if (!isPolling) setIsMessageLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const res = await axios.post(`${API_BASE}/api/support/chat/${activeChat.id}/message`, {
                text: newMessage,
                sender: 'admin'
            });
            setMessages([...messages, res.data.message]);
            setNewMessage('');
            fetchChats(); // Refresh to update "responded" status
        } catch (err) {
            toast.error("Transmission failed.");
        } finally {
            setIsSending(false);
        }
    };

    const handleCloseChat = async (chatId) => {
        if (!window.confirm("Terminate this support session?")) return;
        try {
            await axios.post(`${API_BASE}/api/support/close`, { ticketId: chatId });
            toast.success("SESSION_TERMINATED");
            setActiveChat(null);
            fetchChats();
        } catch (err) {
            toast.error("Termination failed.");
        }
    };

    if (isLoading) return <div className="text-center py-20 font-mono text-[10px] text-gray-500">ACCESSING_ADMIN_CORE...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
            {/* Sidebar: Chat List */}
            <div className="lg:col-span-1 border-r border-white/5 pr-6 space-y-6 flex flex-col">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-neon-green" /> Support_Grid
                    </h3>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-none">
                    {chats.length === 0 ? (
                        <div className="text-[10px] text-gray-600 font-mono italic text-center py-10">Grid is clear. No active transmissions.</div>
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
                                <button
                                    onClick={() => handleCloseChat(activeChat.id)}
                                    className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                    title="Close Transmission"
                                >
                                    <Lock className="w-4 h-4" />
                                </button>
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
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={msg.id || idx}
                                        className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] space-y-1 ${msg.sender === 'admin' ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <div className={`px-4 py-3 rounded-2xl text-[11px] leading-relaxed font-mono ${msg.sender === 'admin'
                                                    ? 'bg-white text-black font-bold'
                                                    : 'bg-white/5 border border-white/10 text-white'
                                                }`}>
                                                {msg.text}
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
                                    placeholder="Enter admin response..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-[11px] text-white font-mono placeholder:text-gray-700 outline-none focus:border-neon-blue transition-colors"
                                />
                                <button
                                    disabled={!newMessage.trim() || isSending}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neon-blue hover:text-white transition-colors disabled:opacity-30"
                                >
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                        </form>
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
