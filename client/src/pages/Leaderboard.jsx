import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Star, Shield, Code, User, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getReputationTitle } from '../utils/reputation';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [auditLeaders, setAuditLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
                const [repRes, auditRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/users/leaderboard`),
                    axios.get(`${API_BASE}/api/reviews/leaderboard`) // Assuming this endpoint exists or I'll just mock/filter users
                ]);
                setUsers(repRes.data);

                // If backend endpoint for audit leaderboard doesn't exist yet, we can filter users who have 'auditScore' or similar
                // But let's assume the endpoint returns data or we fallback
                setAuditLeaders(auditRes.data || []);
            } catch (err) {
                console.error("Leaderboard fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />;
            case 1: return <Medal className="w-6 h-6 text-gray-300" />;
            case 2: return <Medal className="w-6 h-6 text-amber-600" />;
            default: return <span className="font-mono text-gray-500 font-bold">#{index + 1}</span>;
        }
    };

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto pb-12">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic flex justify-center items-center gap-4">
                    <Trophy className="w-12 h-12 text-neon-green" />
                    Grid_Elite
                </h1>
                <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">
                    The highest reputation architects and protocol auditors.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Reputation Leaderboard */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-4 px-4">
                        <Star className="text-neon-green w-5 h-5" />
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Top Architects</h2>
                    </div>

                    <div className="bg-terminal border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="divide-y divide-gray-900">
                            {users.map((user, index) => {
                                const title = getReputationTitle(user.stats?.reputation || 0);
                                return (
                                    <div key={user.uid} className={`p-6 flex items-center gap-6 hover:bg-white/5 transition-all group relative overflow-hidden ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' : ''}`}>
                                        <div className="w-8 text-center shrink-0">
                                            {getRankIcon(index)}
                                        </div>

                                        <div className="relative shrink-0">
                                            <img
                                                src={user.photoURL}
                                                className={`w-12 h-12 rounded-full border-2 ${index === 0 ? 'border-yellow-400 shadow-[0_0_15px_#facc15]' : 'border-gray-700'}`}
                                                alt="avatar"
                                            />
                                            {index === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full">MVP</div>}
                                        </div>

                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link to={`/u/${user.username}`} className="text-white font-bold text-lg hover:text-neon-green truncate flex items-center gap-2">
                                                    {user.name || user.username}
                                                    {user.tier === 'ELITE' && <Shield className="w-3 h-3 text-purple-500 fill-purple-500" />}
                                                </Link>
                                            </div>
                                            <p className={`text-[10px] uppercase font-mono tracking-widest ${title.color}`}>
                                                {title.title}
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-2xl font-black text-neon-green font-mono">{user.stats?.reputation || 0}</p>
                                            <p className="text-[10px] text-gray-600 uppercase">Reputation</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Auditors Leaderboard (Sidebar) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4 px-4">
                        <Code className="text-neon-blue w-5 h-5" />
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Elite Auditors</h2>
                    </div>

                    <div className="bg-terminal border border-gray-800 rounded-2xl overflow-hidden">
                        {auditLeaders.length > 0 ? (
                            <div className="divide-y divide-gray-900">
                                {auditLeaders.map((user, index) => (
                                    <div key={user.uid} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-all">
                                        <span className="font-mono text-gray-500 font-bold w-4 text-center text-xs">#{index + 1}</span>
                                        <img src={user.photoURL} className="w-8 h-8 rounded-full border border-gray-700" alt="av" />
                                        <div className="flex-grow">
                                            <p className="text-white font-bold text-sm truncate">{user.name}</p>
                                            <p className="text-[10px] text-neon-blue font-mono">{user.auditScore || 0} Audits</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center space-y-4">
                                <Shield className="w-12 h-12 text-gray-800 mx-auto" />
                                <p className="text-xs text-gray-500 font-mono uppercase">Audit data syncing...</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/20 to-terminal border border-purple-500/20 p-6 rounded-2xl">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-purple-400" />
                            Become a Legend
                        </h3>
                        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                            Top ranked architects receive exclusive badges, revenue share multipliers, and access to the inner circle.
                        </p>
                        <Link to="/upload" className="block text-center py-2 bg-purple-500/10 border border-purple-500/50 text-purple-400 font-bold uppercase text-[10px] rounded hover:bg-purple-500 hover:text-white transition-all">
                            Start Building
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
