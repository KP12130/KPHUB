import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Terminal, Zap, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import useSound from '../hooks/useSound';

const GridChat = () => {
    const { currentUser } = useAuth();
    const { playSound } = useSound();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, user: 'SYSTEM', text: 'Live Grid Protocol online.', type: 'sys' },
        { id: 2, user: 'AETHER', text: 'Anyone seen the new ELITE modules?', type: 'msg' }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !currentUser) return;

        const newMsg = {
            id: Date.now(),
            user: currentUser.displayName || currentUser.username,
            text: input,
            type: 'msg'
        };

        setMessages(prev => [...prev, newMsg]);
        setInput('');
        playSound('click');

        // In a real app, this would be a WebSocket emit
        // axios.post('/api/chat', newMsg);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[1000]">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="w-80 h-96 glass-panel !bg-black/90 rounded-3xl overflow-hidden border border-neon-blue/30 shadow-[0_0_30px_rgba(0,212,255,0.15)] flex flex-col noise"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-neon-blue/5">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-neon-blue" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Global_Nexus_Chat</span>
                            </div>
                            <button onClick={() => { setIsOpen(false); playSound('click'); }} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {messages.map(msg => (
                                <div key={msg.id} className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${msg.type === 'sys' ? 'text-neon-purple' : 'text-neon-blue'}`}>
                                            [{msg.user}]
                                        </span>
                                        <span className="text-[8px] text-gray-700 font-mono">14:03</span>
                                    </div>
                                    <p className="text-xs text-gray-300 font-light leading-relaxed">
                                        {msg.text}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10 bg-black/40">
                            {currentUser ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Transmit signal..."
                                        className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-neon-blue outline-none transition-colors"
                                    />
                                    <button
                                        onClick={handleSend}
                                        className="p-2 bg-neon-blue text-black rounded-xl hover:bg-white transition-all shadow-[0_0_10px_rgba(0,212,255,0.3)]"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-[10px] text-gray-600 text-center font-mono uppercase tracking-widest py-2">
                                    Login_To_Join_Nexus
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        layoutId="chat-toggle"
                        onClick={() => { setIsOpen(true); playSound('unlock'); }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-14 h-14 bg-neon-blue text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.4)] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                        <MessageSquare className="w-6 h-6" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-purple rounded-full border-2 border-void animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GridChat;
