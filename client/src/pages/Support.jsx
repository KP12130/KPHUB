import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Support = () => {
    const { currentUser } = useAuth();

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 max-w-7xl mx-auto flex flex-col items-center">
            {/* Header */}
            <header className="mb-20 text-center">
                <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase mb-4">
                    Assistance <span className="text-neon-blue">Hub_</span>
                </h1>
                <p className="text-gray-500 font-mono text-xs tracking-[0.3em] uppercase">Knowledge synchronization and glitch mitigation protocol.</p>
            </header>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl glass-panel p-12 rounded-[3rem] text-center space-y-8 border border-white/5 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent opacity-50" />

                <div className="w-20 h-20 bg-neon-blue/10 border border-neon-blue/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <MessageSquare className="w-10 h-10 text-neon-blue" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tight">Encountering_a_Glitch?</h2>
                    <p className="text-gray-500 font-mono text-xs leading-relaxed uppercase max-w-md mx-auto">
                        Our technical support has migrated to the Studio Environment for real-time synchronization. Create a dedicated transmission thread to resolve your issue.
                    </p>
                </div>

                <div className="pt-8">
                    {currentUser ? (
                        <Link
                            to="/studio?view=SUPPORT"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:bg-neon-blue transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(0,212,255,0.2)]"
                        >
                            <Send className="w-4 h-4" /> Open_Support_Link
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-void border border-gray-800 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:border-white transition-all active:scale-95"
                        >
                            <Lock className="w-4 h-4" /> Authenticate_To_Proceed
                        </Link>
                    )}
                </div>

                <p className="text-[9px] text-gray-700 font-mono uppercase tracking-widest pt-8">
                    Required Protocol: Active Studio session
                </p>
            </motion.div>
        </div>
    );
};

export default Support;
