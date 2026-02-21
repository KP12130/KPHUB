import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap, Activity, Users, Star } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';

const Ticker = () => {
    const [activities, setActivities] = useState([
        "SYSTEM: Grid standing by...",
        "DECRYPTING: Sector 7 protocols...",
        "MAINFRAME ONLINE: Welcome to KPHUB"
    ]);
    const [memberCount, setMemberCount] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const syncData = async () => {
            try {
                // Fetch recent projects and member count in parallel
                const [projRes, countRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/projects?limit=5`),
                    axios.get(`${API_BASE}/api/users/count`)
                ]);

                if (!isMounted) return;

                const recent = projRes.data.map(p => `NEW UPLOAD: ${p.author.username} deployed "${p.title}"`);

                const mocks = [
                    "GRID PULSE: Reputation influx detected in Neo-Tokyo",
                    "SECURITY ALERT: ELITE tier usage rising...",
                    "MARKET WATCH: Node modules trending high",
                    "SYNC SUCCESS: Binary integrity 99.9%"
                ];

                setActivities([...recent, ...mocks].sort(() => Math.random() - 0.5));
                setMemberCount(countRes.data.count);

            } catch (err) {
                console.error("Ticker sync failed", err.message);
            }
        };

        syncData();
        const interval = setInterval(syncData, 180000); // 3 minutes
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="w-full bg-void border-b border-neon-green/10 flex items-center h-8 overflow-hidden z-40">
            <div className="flex items-center gap-2 px-4 bg-neon-green/5 h-full border-r border-neon-green/20">
                <Radio className="w-3 h-3 text-neon-green animate-pulse" />
                <span className="text-[10px] font-black text-neon-green uppercase tracking-widest whitespace-nowrap">Global Feed</span>
            </div>

            <div className="flex-grow relative flex items-center overflow-hidden">
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: "-100%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="flex gap-12 items-center whitespace-nowrap pl-4"
                >
                    {activities.map((act, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                            <span className="text-neon-blue font-bold">●</span> {act}
                        </div>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {activities.map((act, i) => (
                        <div key={`dup-${i}`} className="flex items-center gap-2 text-gray-500 font-mono text-[9px] uppercase tracking-wider">
                            <span className="text-neon-blue font-bold">●</span> {act}
                        </div>
                    ))}
                </motion.div>
            </div>

            <div className="px-4 border-l border-white/5 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-mono">
                    <Activity className="w-2.5 h-2.5" /> 1.2 GB/s
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-neon-green font-mono">
                    <Users className="w-2.5 h-2.5" /> {memberCount !== null ? memberCount.toLocaleString() : '---'} Members
                </div>
            </div>
        </div>
    );
};

export default Ticker;
