import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Terminal, ArrowRight, Zap, Trophy,
    LayoutDashboard, User, Globe, HelpCircle, X,
    ChevronRight, Command
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useSound from '../hooks/useSound';

const CommandPalette = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { playSound } = useSound();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);

    const commands = [
        { id: 'dashboard', title: 'Navigate: Studio', icon: LayoutDashboard, action: () => navigate('/studio'), section: 'SYSTEM' },
        { id: 'leaderboard', title: 'Navigate: Leaderboard', icon: Trophy, action: () => navigate('/leaderboard'), section: 'SYSTEM' },
        { id: 'explore', title: 'Navigate: Explore', icon: Globe, action: () => navigate('/explore'), section: 'SYSTEM' },
        { id: 'support', title: 'Navigate: Support', icon: HelpCircle, action: () => navigate('/support'), section: 'SYSTEM' },
    ];

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
            playSound('unlock');
        }
    }, [isOpen, playSound]);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults(commands);
                return;
            }
            setIsLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/projects?search=${query}&limit=5`);
                const projectResults = res.data.map(p => ({
                    id: p.id,
                    title: `Project: ${p.title}`,
                    icon: Zap,
                    action: () => navigate(`/project/${p.id}`),
                    section: 'PROJECTS',
                    author: p.author?.username
                }));
                setResults([...commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase())), ...projectResults]);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeout = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeout);
    }, [query, navigate]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % (results.length || 1));
            playSound('hover');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % (results.length || 1));
            playSound('hover');
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[selectedIndex]) {
                playSound('success');
                results[selectedIndex].action();
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1001] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-void/80 backdrop-blur-sm pointer-events-auto"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="w-full max-w-2xl glass-panel !bg-black/80 rounded-3xl overflow-hidden border border-neon-green/30 shadow-[0_0_50px_rgba(57,255,20,0.15)] pointer-events-auto noise"
                        onKeyDown={handleKeyDown}
                    >
                        {/* Header / Input */}
                        <div className="p-6 border-b border-white/10 flex items-center gap-4">
                            <Terminal className="w-6 h-6 text-neon-green" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Execute command or search grid..."
                                className="flex-grow bg-transparent border-none text-white text-xl font-mono placeholder-gray-700 focus:ring-0 outline-none"
                            />
                            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                <Command className="w-3 h-3 text-gray-500" />
                                <span className="text-[10px] text-gray-500 font-bold">K</span>
                            </div>
                        </div>

                        {/* Search Progress */}
                        {isLoading && (
                            <div className="h-1 bg-neon-green/10 overflow-hidden">
                                <motion.div
                                    className="h-full bg-neon-green"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                />
                            </div>
                        )}

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((res, i) => (
                                        <div
                                            key={`${res.section}-${res.id}-${i}`}
                                            onClick={() => { playSound('success'); res.action(); onClose(); }}
                                            onMouseEnter={() => setSelectedIndex(i)}
                                            className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${i === selectedIndex
                                                    ? 'bg-neon-green/10 border border-neon-green/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]'
                                                    : 'border border-transparent hover:bg-white/5'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-xl ${i === selectedIndex ? 'bg-neon-green text-black' : 'bg-white/5 text-gray-400'}`}>
                                                <res.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-grow">
                                                <div className={`text-sm font-black tracking-tight ${i === selectedIndex ? 'text-white' : 'text-gray-400'}`}>
                                                    {res.title}
                                                </div>
                                                <div className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mt-0.5">
                                                    {res.section} {res.author && `// @${res.author}`}
                                                </div>
                                            </div>
                                            {i === selectedIndex && (
                                                <motion.div layoutId="arrow" initial={{ x: -10 }} animate={{ x: 0 }}>
                                                    <ChevronRight className="w-5 h-5 text-neon-green" />
                                                </motion.div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="text-gray-600 font-mono text-xs uppercase tracking-[0.3em]">
                                        No_Results_Found_In_Matrix
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><ArrowRight className="w-2.5 h-2.5" /> Navigate</span>
                                <span className="flex items-center gap-1"><ChevronRight className="w-2.5 h-2.5" /> Select</span>
                            </div>
                            <div>
                                System_v3.0_Nexus
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
