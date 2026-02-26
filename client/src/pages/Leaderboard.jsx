import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import { Trophy, Medal, Star, Shield, Code, User, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

const Leaderboard = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [auditLeaders, setAuditLeaders] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [votedProjectId, setVotedProjectId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('wealth'); // Default to wealth
    const [timeframe, setTimeframe] = useState('all-time'); // Default to all-time

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [repRes, auditRes, voteRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/leaderboard?sort=${activeTab}&timeframe=${timeframe}`),
                    axios.get(`${API_BASE}/api/reviews/leaderboard`),
                    axios.get(`${API_BASE}/api/voting/candidates?userId=${currentUser?.uid || ''}`)
                ]);
                setUsers(repRes.data);
                setAuditLeaders(auditRes.data || []);
                setCandidates(voteRes.data.candidates || []);
                setHasVoted(voteRes.data.hasVoted);
                setVotedProjectId(voteRes.data.votedProjectId);
            } catch (err) {
                console.error("Leaderboard fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, timeframe, currentUser]);

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />;
            case 1: return <Medal className="w-6 h-6 text-gray-300" />;
            case 2: return <Medal className="w-6 h-6 text-amber-600" />;
            default: return <span className="font-mono text-gray-500 font-bold">#{index + 1}</span>;
        }
    };

    const handleVote = async (projectId) => {
        if (!currentUser) return toast.error("Login required to vote.");
        if (hasVoted) return toast.error("You have already voted this month.");

        try {

            await axios.post(`${API_BASE}/api/voting/vote`, {
                userId: currentUser.uid,
                projectId
            });

            setHasVoted(true);
            setVotedProjectId(projectId);
            setCandidates(prev => prev.map(p => p.id === projectId ? { ...p, votes: (p.votes || 0) + 1 } : p));
            toast.success("VOTE CAST: Neural link established.");
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch (err) {
            toast.error(err.response?.data?.error || "Voting failed.");
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
                    The wealthiest architects and project overlords on the grid.
                </p>
            </div>

            {/* Voting Section */}
            <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Project Of The Month</h2>
                            <p className="text-xs text-gray-500 font-mono">Community Vote // Cycle: {new Date().toLocaleString('default', { month: 'long' }).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {candidates.map((project, i) => (
                        <div key={project.id} className={`group relative bg-terminal border ${votedProjectId === project.id ? 'border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.3)]' : 'border-gray-800 hover:border-gray-600'} rounded-xl overflow-hidden transition-all`}>
                            {/* Rank Badge */}
                            <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur text-white text-[10px] font-black px-2 py-0.5 rounded border border-white/10">
                                #{i + 1}
                            </div>

                            {/* Thumbnail */}
                            <div className="h-24 bg-gray-900 relative">
                                {project.thumbnail ? (
                                    <img src={project.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Code className="text-gray-700" /></div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-bold text-white text-sm truncate mb-1">{project.title}</h3>
                                <p className="text-[10px] text-gray-500 mb-3">by {project.author?.name || 'Unknown'}</p>

                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-mono text-neon-green">
                                        {project.votes || 0} VOTES
                                    </div>
                                    <button
                                        onClick={() => handleVote(project.id)}
                                        disabled={hasVoted}
                                        className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all ${votedProjectId === project.id
                                            ? 'bg-neon-green text-black'
                                            : 'bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                            }`}
                                    >
                                        {votedProjectId === project.id ? 'VOTED' : 'VOTE'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Reputation Leaderboard */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-4 px-4">
                        <div className="flex items-center gap-2">
                            {activeTab === 'reputation' ? <Star className="text-neon-green w-5 h-5" /> : <Crown className="text-yellow-400 w-5 h-5" />}
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">
                                {activeTab === 'reputation' ? 'Top Architects' : 'Grid Overlords'}
                            </h2>
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 gap-2">
                            <div className="flex bg-black/40 p-0.5 rounded-md border border-white/5 mr-4">
                                <button
                                    onClick={() => setTimeframe('all-time')}
                                    className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${timeframe === 'all-time' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    All-Time
                                </button>
                                <button
                                    onClick={() => setTimeframe('monthly')}
                                    className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${timeframe === 'monthly' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Monthly
                                </button>
                            </div>
                            <button
                                onClick={() => setActiveTab('reputation')}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reputation' ? 'bg-neon-green text-black shadow-[0_0_10px_rgba(57,255,20,0.3)]' : 'text-gray-500 hover:text-white'}`}
                            >
                                Reputation
                            </button>
                            <button
                                onClick={() => setActiveTab('wealth')}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'wealth' ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'text-gray-500 hover:text-white'}`}
                            >
                                Wealth
                            </button>
                        </div>
                    </div>

                    <div className="bg-terminal border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="divide-y divide-gray-900">
                            {users.map((user, index) => {
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
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-2xl font-black text-yellow-400 font-mono">{(user.stats?.kpcBalance || 0).toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-600 uppercase">KPC Credits</p>
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
