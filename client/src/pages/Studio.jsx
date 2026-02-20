import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { API_BASE } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Database, MessageSquare, Settings,
    MoreVertical, Eye, Download, Heart, Trash2, Edit3,
    Lock, Globe, Shield, CreditCard, TrendingUp, Users,
    CheckCircle2, AlertCircle, Plus, Zap, Star, Trophy, Activity,
    DollarSign, BarChart3, PieChart, X, LifeBuoy, Mail, Clock, Send
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AnalyticsChart from '../components/AnalyticsChart';
import PaymentModal from '../components/PaymentModal';
import Sentinel from '../components/Sentinel';
import SupportChat from '../components/SupportChat';
import SupportChatAdmin from '../components/SupportChatAdmin';

const GlassCard = ({ children, className = "" }) => (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

const Studio = () => {
    const { currentUser } = useAuth();
    const [searchParams] = useSearchParams();
    const initialView = searchParams.get('view') || 'DASHBOARD';
    const [view, setView] = useState(initialView);
    const [projects, setProjects] = useState([]);
    const [isStudioLoading, setIsStudioLoading] = useState(true);
    const [stats, setStats] = useState({
        views: 0, downloads: 0, subs: 0, revenue: 0, adRevenue: 0, rep: 0, xp: 0
    });
    const [userTier, setUserTier] = useState('GHOST');
    const [userLevel, setUserLevel] = useState(1);
    const [allFlares, setAllFlares] = useState({});
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [profileData, setProfileData] = useState({
        displayName: '', bio: '', website: '', location: '', githubUrl: '', twitterUrl: ''
    });
    const [quests, setQuests] = useState([
        { id: 1, title: 'DAILY_SYNC', desc: 'Initialize Studio interface for 24h cycle.', reward: 50, completed: false, icon: <Activity className="w-10 h-10" /> },
        { id: 2, title: 'SYSTEM_EXPANSION', desc: 'Deploy a new transmission to the grid.', reward: 200, completed: false, icon: <Plus className="w-10 h-10" /> },
        { id: 3, title: 'PULSE_DONOR', desc: 'Like 3 different projects in the discovery grid.', reward: 100, completed: false, icon: <Heart className="w-10 h-10" /> },
        { id: 4, title: 'STREAK_MAINTAINER', desc: 'Maintain a 3-day sync streak.', reward: 500, completed: false, icon: <Zap className="w-10 h-10" /> }
    ]);

    useEffect(() => {
        const fetchStudioData = async () => {
            if (!currentUser || !currentUser.username) return;

            try {
                const [profileRes, flaresRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/users/profile/${currentUser.username}?viewerId=${currentUser.uid}`),
                    axios.get(`${API_BASE}/api/exchange/flares`)
                ]);

                const { user, projects } = profileRes.data;
                setProjects(projects);
                setAllFlares(flaresRes.data);

                const currentXp = user.stats?.xp || 0;
                setStats({
                    views: user.stats?.views || 0,
                    downloads: user.stats?.downloads || 0,
                    subs: user.followers?.length || 0,
                    revenue: user.stats?.balance || 0,
                    adRevenue: user.stats?.adRevenue || 0,
                    rep: user.stats?.reputation || 0,
                    xp: currentXp,
                    history: []
                });

                setUserTier(user.tier || 'GHOST');
                setUserLevel(Math.floor(Math.sqrt(currentXp / 100)) || 1);

                setProfileData({
                    displayName: user.name || currentUser.displayName || '',
                    bio: user.bio || '',
                    website: user.website || '',
                    location: user.location || '',
                    githubUrl: user.githubUrl || '',
                    twitterUrl: user.twitterUrl || ''
                });

                const completed = user.completedQuests || [];
                setQuests(prev => prev.map(q => ({ ...q, completed: completed.includes(q.id) })));

                const history = Array.from({ length: 7 }, (_, i) => ({
                    name: `D_${i + 1}`,
                    views: Math.floor((user.stats?.views || 0) * (0.5 + Math.random() * 0.5) / 7),
                    revenue: ((user.stats?.balance || 0) * (0.5 + Math.random() * 0.5) / 7)
                }));

                let accViews = 0, accRev = 0;
                setStats(prev => ({
                    ...prev,
                    history: history.map(d => {
                        accViews += d.views;
                        accRev += d.revenue;
                        return { ...d, views: accViews, revenue: Number(accRev.toFixed(2)) };
                    })
                }));

            } catch (err) {
                console.error("Studio fetch failed", err);
                toast.error("Failed to sync Studio data.");
            } finally {
                setIsStudioLoading(false);
            }
        };
        fetchStudioData();
    }, [currentUser?.username, currentUser?.uid]);

    const handleClaimQuest = async (quest) => {
        if (quest.completed) return;
        try {
            const res = await axios.post(`${API_BASE}/api/users/quests/complete`, {
                uid: currentUser.uid, questId: quest.id
            });
            if (res.data.success) {
                setStats(prev => ({ ...prev, rep: res.data.newReputation }));
                setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, completed: true } : q));
                toast.success(`COMPLETED: ${quest.title} (+${quest.reward} REP)`);
                confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
            }
        } catch (err) {
            toast.error("Claim failed.");
        }
    };

    const handleSaveProfile = async () => {
        try {
            await axios.put(`${API_BASE}/api/users/${currentUser.uid}`, profileData);
            toast.success("Profile Matrix Updated.");
        } catch (err) {
            toast.error("Update Failed.");
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm("CONFIRM DELETION: This action is irreversible.")) return;
        try {
            await axios.delete(`${API_BASE}/api/projects/${projectId}?userId=${currentUser.uid}`);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            toast.success("Project Eradicated.");
        } catch (err) {
            toast.error("Deletion Failed.");
        }
    };

    const [transactions, setTransactions] = useState([]);
    const [isLedgerLoading, setIsLedgerLoading] = useState(false);

    useEffect(() => {
        const fetchLedger = async () => {
            if (view !== 'TRANSACTIONS' || !currentUser) return;
            setIsLedgerLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/api/exchange/ledger/${currentUser.uid}`);
                setTransactions(res.data);
            } catch (err) {
                console.error("Ledger fetch failed", err);
            } finally {
                setIsLedgerLoading(false);
            }
        };
        fetchLedger();
    }, [view, currentUser]);

    if (isStudioLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
                <span className="text-neon-purple font-mono text-xs animate-pulse tracking-widest">LOADING_STUDIO_ENV...</span>
            </div>
        </div>
    );

    const MenuButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setView(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold uppercase tracking-wide text-xs group ${view === id
                ? 'bg-neon-green text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <Icon className={`w-4 h-4 ${view === id ? 'text-black' : 'text-gray-500 group-hover:text-neon-green'}`} />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen py-10 px-4 md:px-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
                {/* SIDEBAR */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassCard className="space-y-6 sticky top-24 overflow-hidden">
                        {/* XP Border line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(stats.xp % (userLevel * 100)) / (userLevel * 100) * 100}%` }}
                                className="h-full bg-neon-green"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={currentUser.photoURL} className="w-14 h-14 rounded-full border-2 border-neon-green/30" />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-terminal border border-neon-green/30 rounded-lg flex items-center justify-center text-[10px] font-black text-neon-green">
                                    {userLevel}
                                </div>
                            </div>
                            <div>
                                <h2 className="font-black text-white leading-none text-lg flex items-center gap-2">
                                    <span style={currentUser.activeFlare ? Object.fromEntries(allFlares[currentUser.activeFlare]?.style.split(';').filter(s => s).map(s => s.split(':').map(x => x.trim()))) : {}}>
                                        {currentUser.displayName}
                                    </span>
                                    {currentUser.stats?.verified && <CheckCircle2 className="w-4 h-4 text-neon-blue" />}
                                </h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded bg-gray-900 text-gray-400`}>
                                        {userTier}
                                    </span>
                                    <span className="text-[8px] font-mono text-neon-green uppercase tracking-widest">{stats.xp.toLocaleString()} XP</span>
                                </div>
                            </div>
                        </div>

                        {/* XP Bar Detail */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-black uppercase text-gray-500 tracking-widest">
                                <span>Lvl_{userLevel}</span>
                                <span>NEXT_SYNC: {(userLevel * 100) - (stats.xp % (userLevel * 100))} XP</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stats.xp % (userLevel * 100)) / (userLevel * 100) * 100}%` }}
                                    className="h-full bg-neon-green shadow-[0_0_10px_#39FF14]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <MenuButton id="DASHBOARD" icon={LayoutDashboard} label="Command_Center" />
                            <MenuButton id="ANALYTICS" icon={PieChart} label="Data_Analytics" />
                            <MenuButton id="MONETIZATION" icon={DollarSign} label="Monetization" />
                            <MenuButton
                                id="SUPPORT"
                                icon={LifeBuoy}
                                label={currentUser.username === 'grid_admin' ? 'Support_Grid' : 'Support_Link'}
                            />
                            <MenuButton id="TRANSACTIONS" icon={CreditCard} label="Financial_Ledger" />
                            <MenuButton id="SENTINEL" icon={Shield} label="Sentinel_HUD" />
                            <MenuButton id="SETTINGS" icon={Settings} label="Config_Settings" />
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <Link to="/upload" className="w-full py-3 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs">
                                <Plus className="w-4 h-4 text-neon-green" /> New_Project
                            </Link>
                        </div>
                    </GlassCard>
                </div>

                {/* MAIN CONTENT Area */}
                <div className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {view === 'DASHBOARD' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        <GlassCard className="flex flex-col items-center justify-center text-center p-4 hover:border-neon-blue/30 transition-colors">
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-neon-blue/10 rounded-xl mb-3">
                                                <Eye className="w-5 h-5 text-neon-blue" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">{stats.views}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Visits_</span>
                                        </GlassCard>
                                        <GlassCard className="flex flex-col items-center justify-center text-center p-4 hover:border-neon-green/30 transition-colors">
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-neon-green/10 rounded-xl mb-3">
                                                <Download className="w-5 h-5 text-neon-green" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">{stats.downloads}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Syncs_</span>
                                        </GlassCard>
                                        <GlassCard className="flex flex-col items-center justify-center text-center p-4 hover:border-neon-purple/30 transition-colors">
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-neon-purple/10 rounded-xl mb-3">
                                                <Users className="w-5 h-5 text-neon-purple" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">{stats.subs}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Orbitals_</span>
                                        </GlassCard>
                                        <GlassCard className="flex flex-col items-center justify-center text-center p-4 hover:border-yellow-500/30 transition-colors">
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-yellow-500/10 rounded-xl mb-3">
                                                <Trophy className="w-5 h-5 text-yellow-500" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">{stats.rep}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Reputation_</span>
                                        </GlassCard>
                                        <GlassCard className="flex flex-col items-center justify-center text-center p-4 hover:border-neon-blue/30 transition-colors">
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-neon-blue/10 rounded-xl mb-3">
                                                <DollarSign className="w-5 h-5 text-neon-blue" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">{currentUser.stats?.kpcBalance?.toLocaleString() || 0}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">KPC_Credits_</span>
                                        </GlassCard>
                                        <GlassCard className="flex flex-col items-center justify-center text-center p-4 hover:border-neon-green/30 transition-colors">
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-neon-green/10 rounded-xl mb-3">
                                                <TrendingUp className="w-5 h-5 text-neon-green" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">${stats.adRevenue.toFixed(2)}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Ad_Protocol_</span>
                                        </GlassCard>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                            <Database className="w-5 h-5 text-neon-green" /> Active Protocols
                                        </h3>
                                        {projects.length > 0 ? (
                                            projects.map((project, idx) => {
                                                const isBoosted = project.boostedUntil && new Date(project.boostedUntil) > new Date();
                                                const boostRemaining = isBoosted ? Math.ceil((new Date(project.boostedUntil) - new Date()) / (1000 * 60 * 60)) : 0;

                                                return (
                                                    <div key={project.id || `proj-${idx}`} className={`glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all group border ${isBoosted ? 'border-neon-green/30 shadow-[0_0_15px_#39FF1433]' : 'border-white/5'}`}>
                                                        <div className="w-16 h-12 bg-gray-900 rounded-lg overflow-hidden shrink-0 relative">
                                                            {project.screenshots?.[0] ? (
                                                                <img src={project.screenshots[0]} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-800"><Zap className="w-4 h-4 text-gray-600" /></div>
                                                            )}
                                                            {isBoosted && <div className="absolute inset-0 bg-neon-green/10 animate-pulse" />}
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-white truncate">{project.title}</h4>
                                                                {isBoosted && (
                                                                    <span className="text-[8px] bg-neon-green text-black px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-1">
                                                                        <Zap className="w-2 h-2 fill-current" /> {boostRemaining}h
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono mt-1">
                                                                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {project.stats?.likes || 0}</span>
                                                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {project.stats?.views || 0}</span>
                                                                <span className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">{project.category}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Link to={`/edit/${project.id}`} className="p-2 hover:bg-neon-blue/20 text-gray-400 hover:text-neon-blue rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></Link>
                                                            <button onClick={() => handleDeleteProject(project.id)} className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="glass-panel p-8 rounded-xl text-center">
                                                <p className="text-gray-500 font-mono text-sm mb-4">No active protocols deployed.</p>
                                                <Link to="/upload" className="inline-block px-6 py-2 bg-white/5 hover:bg-neon-green hover:text-black text-white border border-white/10 rounded-lg transition-all uppercase text-xs font-bold tracking-widest">
                                                    Deploy_First_System
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-yellow-500" /> Daily Objectives
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {quests.map(quest => (
                                                <GlassCard key={quest.id} className={`flex items-center gap-4 relative overflow-hidden ${quest.completed ? 'opacity-50' : ''}`}>
                                                    <div className={`p-3 rounded-xl ${quest.completed ? 'bg-neon-green text-black' : 'bg-white/5 text-gray-400'}`}>
                                                        {quest.completed ? <CheckCircle2 className="w-5 h-5" /> : quest.icon}
                                                    </div>
                                                    <div className="flex-grow">
                                                        <h4 className={`font-bold text-sm ${quest.completed ? 'text-neon-green line-through' : 'text-white'}`}>{quest.title}</h4>
                                                        <p className="text-[10px] text-gray-500">{quest.desc}</p>
                                                    </div>
                                                    {!quest.completed && (
                                                        <button onClick={() => handleClaimQuest(quest)} className="absolute right-4 px-3 py-1 bg-white/10 hover:bg-neon-green hover:text-black text-white text-[9px] font-black uppercase tracking-widest rounded transition-colors">
                                                            Claim
                                                        </button>
                                                    )}
                                                </GlassCard>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {view === 'TRANSACTIONS' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                            <CreditCard className="w-8 h-8 text-neon-blue" />
                                            Financial_Ledger
                                        </h2>
                                        <div className="text-xs font-mono text-gray-500">REALTIME_TRANSACTION_FEED</div>
                                    </div>

                                    <GlassCard className="p-0 overflow-hidden">
                                        {isLedgerLoading ? (
                                            <div className="p-20 text-center space-y-4">
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block"><Activity className="w-10 h-10 text-neon-blue" /></motion.div>
                                                <p className="text-gray-500 font-mono text-xs uppercase animate-pulse">Scanning transaction matrix...</p>
                                            </div>
                                        ) : transactions.length > 0 ? (
                                            <div className="divide-y divide-white/5">
                                                {transactions.map(tx => (
                                                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-3 rounded-xl ${tx.amount > 0 ? 'bg-neon-green/10 text-neon-green' : 'bg-red-500/10 text-red-500'}`}>
                                                                {tx.amount > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingUp className="w-5 h-5 rotate-180" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-white text-sm uppercase tracking-wider">{tx.type.replace(/_/g, ' ')}</h4>
                                                                <p className="text-[10px] text-gray-500 font-mono">
                                                                    {new Date(tx.timestamp?.toDate ? tx.timestamp.toDate() : tx.timestamp).toLocaleString()}
                                                                    {tx.recipientName && ` // TO: @${tx.recipientName}`}
                                                                    {tx.donorName && ` // FROM: @${tx.donorName}`}
                                                                    {tx.item && ` // ITEM: ${tx.item}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className={`text-xl font-black font-mono ${tx.amount > 0 ? 'text-neon-green' : 'text-red-500'}`}>
                                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} KPC
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-20 text-center space-y-4">
                                                <AlertCircle className="w-12 h-12 text-gray-800 mx-auto" />
                                                <p className="text-xs text-gray-600 font-mono uppercase">Ledger is empty. No financial activity detected.</p>
                                            </div>
                                        )}
                                    </GlassCard>
                                </div>
                            )}

                            {view === 'ANALYTICS' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <GlassCard className="h-[400px]">
                                            <AnalyticsChart data={stats.history || []} label="Views" dataKey="views" color="#39FF14" />
                                        </GlassCard>
                                        <GlassCard className="h-[400px]">
                                            <AnalyticsChart data={stats.history || []} label="Revenue" dataKey="revenue" color="#A855F7" />
                                        </GlassCard>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <GlassCard>
                                            <h3 className="text-lg font-black text-white mb-4">Ad Revenue</h3>
                                            <div className="text-4xl font-black text-neon-green mb-2">${stats.adRevenue.toFixed(2)}</div>
                                            <p className="text-xs text-gray-500 font-mono">Generated from Discovery Grid placement.</p>
                                        </GlassCard>
                                        <GlassCard>
                                            <h3 className="text-lg font-black text-white mb-4">Direct Support</h3>
                                            <div className="text-4xl font-black text-purple-500 mb-2">${stats.revenue.toFixed(2)}</div>
                                            <p className="text-xs text-gray-500 font-mono">Donations from community members.</p>
                                        </GlassCard>
                                    </div>
                                </div>
                            )}

                            {view === 'MONETIZATION' && (
                                <div className="space-y-8">
                                    <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 blur-[100px] rounded-full pointer-events-none" />
                                        <div>
                                            <h2 className="text-3xl font-black text-white mb-2">Current Tier: <span className="text-neon-purple">{userTier}</span></h2>
                                            <p className="text-gray-400 text-sm max-w-md">Upgrade to unlock advanced analytics, priority indexing, and custom profile styling.</p>
                                        </div>
                                        <button
                                            onClick={() => { setIsPaymentOpen(true); setSelectedPlan('ELITE'); }}
                                            className="px-8 py-4 bg-neon-purple text-white font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                        >
                                            Upgrade_System
                                        </button>
                                    </GlassCard>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {['GHOST', 'ELITE', 'ARCHITECT'].map((tier, i) => (
                                            <div key={tier} className={`glass-panel p-6 rounded-2xl border ${tier === userTier ? 'border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.2)]' : 'border-white/5'} flex flex-col`}>
                                                <h3 className="text-xl font-black text-white mb-4">{tier}</h3>
                                                <ul className="space-y-3 flex-grow mb-6">
                                                    <li className="flex items-center gap-2 text-xs text-gray-300"><CheckCircle2 className="w-3 h-3 text-neon-green" /> Basic Uploads</li>
                                                    {i > 0 && <li className="flex items-center gap-2 text-xs text-gray-300"><CheckCircle2 className="w-3 h-3 text-neon-green" /> Priority Indexing</li>}
                                                    {i > 1 && <li className="flex items-center gap-2 text-xs text-gray-300"><CheckCircle2 className="w-3 h-3 text-neon-green" /> API Access</li>}
                                                </ul>
                                                <button disabled={tier === userTier} className="w-full py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase text-xs rounded-lg transition-colors">
                                                    {tier === userTier ? 'Active' : 'Select'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {view === 'SETTINGS' && (
                                <GlassCard className="max-w-2xl mx-auto space-y-6">
                                    <h2 className="text-2xl font-black text-white mb-6">Profile Configuration</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Display Name</label>
                                            <input
                                                type="text"
                                                value={profileData.displayName}
                                                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-neon-green outline-none transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Location</label>
                                            <input
                                                type="text"
                                                value={profileData.location}
                                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-neon-green outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Bio / Status</label>
                                        <textarea
                                            rows="3"
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-neon-green outline-none transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">GitHub URL</label>
                                            <input
                                                type="url"
                                                value={profileData.githubUrl}
                                                onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-neon-green outline-none transition-colors"
                                                placeholder="https://github.com/..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Twitter / X</label>
                                            <input
                                                type="url"
                                                value={profileData.twitterUrl}
                                                onChange={(e) => setProfileData({ ...profileData, twitterUrl: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-neon-green outline-none transition-colors"
                                                placeholder="https://x.com/..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex justify-end">
                                        <button
                                            onClick={handleSaveProfile}
                                            className="px-8 py-3 bg-neon-green text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-colors shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                                        >
                                            Save_Changes
                                        </button>
                                    </div>
                                </GlassCard>
                            )}

                            {view === 'SENTINEL' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                                                <Shield className="w-10 h-10 text-neon-blue" />
                                                Sentinel_Protocol
                                            </h2>
                                            <p className="text-gray-500 font-mono text-sm mt-2">Security automation & perimeter defense intelligence.</p>
                                        </div>
                                    </div>
                                    <Sentinel />
                                </motion.div>
                            )}

                            {view === 'SUPPORT' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {currentUser.username === 'grid_admin' ? (
                                        <SupportChatAdmin />
                                    ) : (
                                        <SupportChat currentUser={currentUser} />
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Payment Modal */}
            {isPaymentOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative">
                        <button onClick={() => setIsPaymentOpen(false)} className="absolute -top-12 right-0 text-white hover:text-red-500"><X className="w-8 h-8" /></button>
                        <PaymentModal
                            plan={selectedPlan}
                            onClose={() => setIsPaymentOpen(false)}
                            onSuccess={() => {
                                setIsPaymentOpen(false);
                                setUserTier(selectedPlan);
                                toast.success("UPGRADE SUCCESSFUL: Welcome to the elite.");
                                confetti();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Studio;
