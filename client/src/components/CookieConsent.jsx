import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X } from 'lucide-react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('kphub_cookie_consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('kphub_cookie_consent', 'accepted');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-12 md:w-[400px] z-[100]"
                >
                    <div className="glass-panel p-6 rounded-3xl border border-neon-blue/20 bg-black/80 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-neon-blue" />

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center shrink-0">
                                <Shield className="w-5 h-5 text-neon-blue" />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Privacy_Protocol_Acknowledged</h4>
                                <p className="text-gray-400 font-mono text-[10px] leading-relaxed uppercase">
                                    This node utilizes cookies to maintain session health and optimize grid performance. By continuing your uplink, you authorize these tracking protocols.
                                </p>
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={handleAccept}
                                        className="px-6 py-2 bg-neon-blue text-black font-black uppercase tracking-widest text-[9px] rounded-lg hover:bg-white transition-all flex items-center gap-2"
                                    >
                                        <Check className="w-3 h-3" /> Authorize_Cookies
                                    </button>
                                    <button
                                        onClick={() => setIsVisible(false)}
                                        className="px-4 py-2 text-gray-500 hover:text-white font-mono text-[9px] uppercase tracking-widest transition-colors"
                                    >
                                        Dismiss_
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
