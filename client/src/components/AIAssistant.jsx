import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, X, Sparkles, Loader } from 'lucide-react';

const AIAssistant = ({ project }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `Greetings, Architect. I am KPHUB-Core, the system assistant. How can I assist you with analyzing "${project?.title || 'this system'}" today?` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        // Simulation logic for AI
        setTimeout(() => {
            let response = "";
            const query = userMsg.toLowerCase();

            if (query.includes('install') || query.includes('how to run')) {
                response = `To execute ${project?.title || 'this system'}, follow the standard grid protocols: 
                1. Pull the repository. 
                2. Install dependencies via "npm install". 
                3. Run the development environment with "npm run dev". 
                The architect has specified this as a ${project?.category || 'uncategorized'} system.`;
            } else if (query.includes('who') || query.includes('author')) {
                response = `This system was engineered by @${project?.author?.username || 'Redacted'}. They are a ${project?.author?.tier || 'GHOST'} tier citizen with a reputation of ${project?.author?.stats?.reputation || 0} points.`;
            } else if (query.includes('private') || query.includes('security')) {
                response = project?.isPrivate
                    ? "Warning: This system is under Private Protocol. Access is strictly logged."
                    : "This system is Public Domain. Open access authorized.";
            } else if (query.includes('hello') || query.includes('hi')) {
                response = "Connection established. I am monitoring the data stream of this transmission. Ask me anything about its architecture.";
            } else {
                response = `Analyzing metadata for "${project?.title || 'this system'}"... It appears to be a ${project?.category || 'standard'} project with ${project?.stats?.likes || 0} pulses and ${project?.stats?.downloads || 0} active downloads. Is there a specific protocol you want me to explain?`;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-neon-green text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_#39FF14] z-50 hover:scale-110 transition-transform"
                >
                    <Bot className="w-8 h-8" />
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-8 right-8 w-80 md:w-96 h-[500px] bg-terminal border border-neon-green/30 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="p-4 bg-neon-green/10 border-b border-neon-green/20 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-neon-green" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">KPHUB_Core_Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-mono leading-relaxed ${m.role === 'user'
                                        ? 'bg-neon-blue/10 border border-neon-blue/30 text-neon-blue rounded-tr-none'
                                        : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1 opacity-50">
                                            {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                            <span className="text-[8px] font-black uppercase tracking-tighter">{m.role}</span>
                                        </div>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 text-neon-green p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                        <Loader className="w-3 h-3 animate-spin" />
                                        <span className="text-[8px] font-black uppercase tracking-widest animate-pulse">Syncing...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 bg-void/50 border-t border-white/5 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Enter_Query..."
                                className="flex-grow bg-void border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:border-neon-green outline-none font-mono"
                            />
                            <button type="submit" className="p-2 bg-neon-green text-black rounded-xl hover:bg-white transition-all">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistant;
