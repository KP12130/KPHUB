import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import { ShieldAlert, ShieldOff, AlertTriangle, Volume2, VolumeX, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonLoader from './SkeletonLoader';

const getEventMeta = (action, revoked) => {
    if (revoked) {
        return {
            icon: <ShieldOff className="w-4 h-4 text-green-400" />,
            label: 'restriction lifted',
            color: 'text-green-400',
            bg: 'bg-green-500/10'
        };
    }
    switch (action) {
        case 'BAN':
            return { icon: <ShieldAlert className="w-4 h-4 text-red-500" />, label: 'was banned', color: 'text-red-400', bg: 'bg-red-500/10' };
        case 'MUTE':
            return { icon: <VolumeX className="w-4 h-4 text-orange-400" />, label: 'was muted', color: 'text-orange-400', bg: 'bg-orange-500/10' };
        case 'ANTI_CHEAT_STRIKE':
            return { icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />, label: 'got an anti-cheat strike', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
        case 'PROFANITY_STRIKE':
            return { icon: <Volume2 className="w-4 h-4 text-pink-400" />, label: 'got a profanity strike', color: 'text-pink-400', bg: 'bg-pink-500/10' };
        case 'TIER_CHANGE':
            return { icon: <Star className="w-4 h-4 text-neon-blue" />, label: 'received a rank change', color: 'text-neon-blue', bg: 'bg-neon-blue/10' };
        default:
            return { icon: <ShieldAlert className="w-4 h-4 text-gray-500" />, label: 'received a moderation action', color: 'text-gray-400', bg: 'bg-gray-800' };
    }
};

const timeAgo = (isoStr) => {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
};

const ActivityFeed = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/activity`);
            setEvents(res.data);
        } catch (err) {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-terminal border border-gray-900 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-sm rounded-full animate-pulse" />
                        <ShieldAlert className="w-4 h-4 text-red-400 relative" />
                    </div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase italic">Grid_Events</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <div className="w-1 h-1 rounded-full bg-red-500/30" />
                    <div className="w-1 h-1 rounded-full bg-red-500/10" />
                </div>
            </div>

            <div className="p-2">
                {loading ? (
                    <SkeletonLoader type="activity" count={5} />
                ) : (
                    <div className="space-y-1">
                        <AnimatePresence initial={false}>
                            {events.length > 0 ? (
                                events.map((evt, idx) => {
                                    const meta = getEventMeta(evt.action, evt.revoked);
                                    return (
                                        <motion.div
                                            key={evt.id || idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            layout
                                            className="p-4 rounded-2xl hover:bg-white/5 transition-all group relative border border-transparent hover:border-gray-800"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 p-2 rounded-lg ${meta.bg} shrink-0`}>
                                                    {meta.icon}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <div className="text-[11px] leading-relaxed">
                                                        <Link
                                                            to={`/u/${evt.username}`}
                                                            className="text-neon-green hover:text-white font-black uppercase tracking-tighter transition-colors"
                                                        >
                                                            {evt.username}
                                                        </Link>
                                                        <span className={`mx-1.5 italic font-mono opacity-80 text-[10px] ${meta.color}`}>
                                                            {meta.label}
                                                        </span>
                                                    </div>
                                                    {evt.reason && (
                                                        <p className="text-[9px] text-gray-600 font-mono truncate mt-0.5">
                                                            {evt.reason}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <Clock className="w-2.5 h-2.5 text-gray-800" />
                                                        <span className="text-[8px] text-gray-700 font-mono uppercase tracking-widest">
                                                            {timeAgo(evt.appliedAt)}
                                                        </span>
                                                        <div className="h-[1px] flex-grow bg-gradient-to-r from-gray-900 to-transparent" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-8 text-[10px] text-gray-700 italic font-mono text-center uppercase tracking-[0.2em]"
                                >
                                    Grid is quiet. All clear.
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
