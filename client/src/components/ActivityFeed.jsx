import React, { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { Activity, Clock, Zap, MessageCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from './SkeletonLoader';

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = async () => {
        try {

            const res = await axios.get(`${API_BASE}/api/activity`);
            setActivities(res.data);
        } catch (err) {
            console.error("Activity fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, 30000); // Check every 30s for more "liveness"
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'upload': return <Zap className="w-4 h-4 text-neon-green fill-neon-green/20" />;
            case 'comment': return <MessageCircle className="w-4 h-4 text-neon-blue fill-neon-blue/20" />;
            case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />;
            default: return <Activity className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="bg-terminal border border-gray-900 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="absolute inset-0 bg-neon-green/20 blur-sm rounded-full animate-pulse" />
                        <Clock className="w-4 h-4 text-neon-green relative" />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase italic">Live Activity</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-neon-green" />
                    <div className="w-1 h-1 rounded-full bg-neon-green/30" />
                    <div className="w-1 h-1 rounded-full bg-neon-green/10" />
                </div>
            </div>

            <div className="p-2">
                {loading ? (
                    <SkeletonLoader type="activity" count={5} />
                ) : (
                    <div className="space-y-1">
                        <AnimatePresence initial={false}>
                            {activities.length > 0 ? (
                                activities.map((act, idx) => (
                                    <motion.div
                                        key={act.id || idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                        className="p-4 rounded-2xl hover:bg-white/5 transition-all group relative border border-transparent hover:border-gray-800"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 bg-gray-900/50 p-2 rounded-lg group-hover:bg-void transition-colors">
                                                {getIcon(act.type)}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="text-[11px] leading-relaxed">
                                                    <Link to={`/u/${act.userName}`} className="text-neon-green hover:text-white font-black uppercase tracking-tighter transition-colors">
                                                        {act.userName}
                                                    </Link>
                                                    <span className="text-gray-500 mx-1.5 lowercase italic font-mono opacity-60">
                                                        {act.type === 'upload' ? 'deployed a discovery' : act.type === 'like' ? 'liked a project' : 'commented on'}
                                                    </span>
                                                    <Link to={`/project/${act.targetId}`} className="text-white hover:text-neon-blue font-bold tracking-tight transition-colors block">
                                                        {act.targetName}
                                                    </Link>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[8px] text-gray-700 font-mono uppercase tracking-widest">
                                                        {act.createdAt ? new Date(act.createdAt._seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                    </span>
                                                    <div className="h-[1px] flex-grow bg-gradient-to-r from-gray-900 to-transparent" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-8 text-[10px] text-gray-700 italic font-mono text-center uppercase tracking-[0.2em]"
                                >
                                    Scanning for signals...
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
