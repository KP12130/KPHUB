import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap } from 'lucide-react';

const GridBroadcast = () => {
    const [broadcasts, setBroadcasts] = useState([]);

    useEffect(() => {
        const q = query(
            collection(db, 'broadcasts'),
            where('expiresAt', '>', new Date())
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const active = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by timestamp desc to show latest
            setBroadcasts(active.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
        }, () => { /* Silently handle permission errors */ });


        return () => unsubscribe();
    }, []);

    if (broadcasts.length === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
            <AnimatePresence>
                {broadcasts.slice(0, 1).map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="bg-neon-blue/90 backdrop-blur-md border-b border-white/20 px-4 py-2 flex items-center justify-center gap-4 shadow-[0_5px_30px_rgba(0,212,255,0.3)] pointer-events-auto"
                    >
                        <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-white animate-pulse" />
                            <span className="text-[10px] font-black text-black uppercase tracking-widest bg-white px-2 py-0.5 rounded">
                                Global_Broadcast
                            </span>
                        </div>
                        <p className="text-white font-black italic text-sm tracking-tight truncate max-w-2xl">
                            <span className="text-black/50 not-italic mr-2 font-mono">@{msg.username}:</span>
                            {msg.message}
                        </p>
                        <Zap className="w-4 h-4 text-yellow-400 fill-current" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default GridBroadcast;
