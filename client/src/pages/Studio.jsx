import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { API_BASE } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Database, MessageSquare, Settings,
    MoreVertical, Eye, Download, Heart, Trash2, Edit3,
    Lock, Globe, Shield, ShieldOff, CreditCard, TrendingUp, Users,
    CheckCircle2, AlertCircle, Plus, Zap, Star, Trophy, Activity, ArrowRight,
    DollarSign, BarChart3, PieChart, X, LifeBuoy, Mail, Clock, Send, ShoppingBag
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AnalyticsChart from '../components/AnalyticsChart';
import PaymentModal from '../components/PaymentModal';
import Sentinel from '../components/Sentinel';
import SupportChat from '../components/SupportChat';
import SupportChatAdmin from '../components/SupportChatAdmin';
import ViolationsPanel from '../components/ViolationsPanel';
import ForgeStore from '../components/ForgeStore';

const GlassCard = ({ children, className = "" }) => (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

const Studio = () => {
    const { currentUser, updateUser, setIsRedemptionOpen } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialView = searchParams.get('view') || 'DASHBOARD';
    const [view, setView] = useState(initialView);
    const [projects, setProjects] = useState([]);
    const [isStudioLoading, setIsStudioLoading] = useState(true);
    const [stats, setStats] = useState({
        views: 0, downloads: 0, subs: 0, revenue: 0, adRevenue: 0
    });
    const [userTier, setUserTier] = useState('GHOST');
    const [userLevel, setUserLevel] = useState(1);
    const [allFlares, setAllFlares] = useState({});
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [profileData, setProfileData] = useState({
        username: '', displayName: '', bio: '', website: '', location: '', githubUrl: '', twitterUrl: ''
    });
    const [rankDefs, setRankDefs] = useState({});
    const [purchasing, setPurchasing] = useState(null);
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
                const [profileRes, flaresRes, ranksRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/users/profile/${currentUser.username}?viewerId=${currentUser.uid}`),
                    axios.get(`${API_BASE}/api/exchange/flares`),
                    axios.get(`${API_BASE}/api/exchange/ranks`)
                ]);

                const { user, projects } = profileRes.data;
                setProjects(projects);
                setAllFlares(flaresRes.data);
                setRankDefs(ranksRes.data);

                const currentXp = user.stats?.xp || 0;
                setStats({
                    views: user.stats?.views || 0,
                    downloads: user.stats?.downloads || 0,
                    subs: user.followers?.length || 0,
                    revenue: user.stats?.balance || 0,
                    adRevenue: user.stats?.adRevenue || 0,
                    history: []
                });

                setUserTier(user.tier || 'GHOST');

                setProfileData({
                    username: user.username || currentUser.username || '',
                    displayName: user.displayName || user.name || currentUser.displayName || '',
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
    }, [currentUser?.uid]);

    const handleClaimQuest = async (quest) => {
        if (quest.completed) return;
        try {
            const res = await axios.post(`${API_BASE}/api/users/quests/complete`, {
                uid: currentUser.uid, questId: quest.id
            });
            if (res.data.success) {
                setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, completed: true } : q));
                toast.success(`COMPLETED: ${quest.title} (+${quest.reward} KPC)`);
                confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
            }
        } catch (err) {
            toast.error("Claim failed.");
        }
    };

    const handleSaveProfile = async () => {
        try {
            const updatePayload = {
                uid: currentUser.uid,
                ...profileData,
                socials: {
                    github: profileData.githubUrl,
                    twitter: profileData.twitterUrl,
                    website: profileData.website
                }
            };
            await axios.put(`${API_BASE}/api/users/${currentUser.uid}`, updatePayload);

            // Update AuthContext locally — avoids a full re-fetch cascade
            updateUser({
                username: profileData.username,
                displayName: profileData.displayName,
                bio: profileData.bio,
                location: profileData.location,
                githubUrl: profileData.githubUrl,
                twitterUrl: profileData.twitterUrl,
            });
            toast.success("Profile saved.");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Update Failed.");
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
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (currentUser?.restrictions?.cashoutBlocked) {
            return toast.error("🏦 CASHOUT_BLOCKED — Financial withdrawals are restricted. Contact Support.", { duration: 5000 });
        }
        const amt = parseFloat(withdrawAmount);
        if (isNaN(amt) || amt < 10) return toast.error("Minimum withdrawal is $10.");
        if (amt > (currentUser.stats?.balance || 0)) return toast.error("Insufficient USD Balance.");

        setIsWithdrawing(true);
        try {
            const res = await axios.post(`${API_BASE}/api/users/withdraw`, { uid: currentUser.uid, amount: amt });
            toast.success(res.data.message);
            setWithdrawAmount('');
            // Trigger an auth refresh to sync the new balance
            if (window.refreshAuthUser) window.refreshAuthUser(currentUser.uid);
        } catch (err) {
            toast.error(err.response?.data?.error || "Withdrawal request failed.");
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleRankPurchase = async (rankId) => {
        const rank = rankDefs[rankId];
        if (!window.confirm(`Initialize ${rankId} Protocol? This will deduct ${rank.kpcPrice} KPC from your balance.`)) return;

        setPurchasing(rankId);
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/purchase`, {
                uid: currentUser.uid,
                rankId
            });
            toast.success(res.data.message);
            confetti();
            // Refresh user data
            const userRes = await axios.get(`${API_BASE}/api/users/${currentUser.uid}`);
            updateUser(userRes.data);
            setUserTier(userRes.data.tier);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Purchase failed.');
        } finally {
            setPurchasing(null);
        }
    };

    const handleToggleRenewal = async (autoRenew) => {
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/toggle-renewal`, {
                uid: currentUser.uid,
                autoRenew
            });
            toast.success(res.data.message);
            updateUser({ autoRenew });
        } catch (err) {
            toast.error('Failed to update renewal preference.');
        }
    };

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
                <span className="text-neon-purple font-mono text-xs animate-pulse tracking-widest">Loading Studio...</span>
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
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5" />

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={currentUser.photoURL} className="w-14 h-14 rounded-full border-2 border-neon-green/30" />
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
                                </div>
                            </div>
                        </div>


                        <div className="space-y-2">
                            <MenuButton id="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
                            <MenuButton id="ANALYTICS" icon={PieChart} label="Analytics" />
                            <MenuButton id="MONETIZATION" icon={Database} label="Ranks" />
                            <MenuButton
                                id="SUPPORT"
                                icon={LifeBuoy}
                                label={currentUser.username === 'grid_admin' ? 'Support Grid' : 'Support'}
                            />
                            <MenuButton id="TRANSACTIONS" icon={CreditCard} label="Transactions" />
                            <MenuButton id="SENTINEL" icon={Shield} label="Sentinel" />
                            <MenuButton id="REWARDS" icon={ShoppingBag} label="Rewards" />
                            <MenuButton id="VIOLATIONS" icon={ShieldOff} label="Violations" />
                            <MenuButton id="SETTINGS" icon={Settings} label="Settings" />
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <Link to="/upload" className="w-full py-3 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs">
                                <Plus className="w-4 h-4 text-neon-green" /> New Project
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
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Views</span>
                                        </GlassCard>
                                        <GlassCard className="flex flex-col items-center justify-center text-center p-4 hover:border-neon-green/30 transition-colors">
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-neon-green/10 rounded-xl mb-3">
                                                <Download className="w-5 h-5 text-neon-green" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">{stats.downloads}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Downloads</span>
                                        </GlassCard>
                                        <GlassCard className="flex flex-col items-center justify-center text-center p-4 hover:border-neon-purple/30 transition-colors">
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-neon-purple/10 rounded-xl mb-3">
                                                <Users className="w-5 h-5 text-neon-purple" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">{stats.subs}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Followers</span>
                                        </GlassCard>
                                        <GlassCard className="flex flex-col items-center justify-center text-center p-4 hover:border-yellow-500/30 transition-colors">
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-yellow-500/10 rounded-xl mb-3">
                                                <Heart className="w-5 h-5 text-yellow-500" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">{currentUser.stats?.likesReceived || 0}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Pulses Received</span>
                                        </GlassCard>
                                        <GlassCard
                                            onClick={() => navigate('/forge')}
                                            className="flex flex-col items-center justify-center text-center p-4 border border-white/5 hover:border-neon-blue/50 transition-all cursor-pointer group"
                                        >
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-neon-blue/10 rounded-xl mb-3 group-hover:bg-neon-blue/20 transition-colors">
                                                <DollarSign className="w-5 h-5 text-neon-blue" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">{currentUser.stats?.kpcBalance?.toLocaleString() || 0}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">KPC Credits</span>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="w-3 h-3 text-neon-blue" />
                                            </div>
                                        </GlassCard>
                                        <GlassCard
                                            onClick={() => setView('REWARDS')}
                                            className="flex flex-col items-center justify-center text-center p-4 border border-white/5 hover:border-neon-green/50 transition-all cursor-pointer group"
                                        >
                                            <motion.div whileHover={{ scale: 1.1 }} className="p-3 bg-neon-green/10 rounded-xl mb-3 group-hover:bg-neon-green/20 transition-colors">
                                                <TrendingUp className="w-5 h-5 text-neon-green" />
                                            </motion.div>
                                            <span className="text-2xl font-black text-white">${stats.adRevenue.toFixed(2)}</span>
                                            <span className="text-[8px] font-mono text-gray-500 uppercase">Redeem_Earnings</span>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-3 h-3 text-neon-green" />
                                            </div>
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
                                                    Deploy First Project
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            )}

                            {view === 'TRANSACTIONS' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div>
                                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                                <CreditCard className="w-8 h-8 text-neon-blue" />
                                                Financial Ledger
                                            </h2>
                                            <div className="text-xs font-mono text-gray-500">Transaction History</div>
                                        </div>
                                        <form onSubmit={handleWithdraw} className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                                            <input
                                                type="number"
                                                min="10"
                                                placeholder="Amount (Min 10)"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                className="bg-transparent border-none text-white font-mono text-sm w-36 focus:ring-0 px-2 outline-none"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isWithdrawing}
                                                className="px-4 py-2 bg-white/10 hover:bg-neon-blue hover:text-black text-neon-blue font-black uppercase text-xs tracking-widest rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {isWithdrawing ? 'Processing...' : 'Withdraw'}
                                            </button>
                                        </form>
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
                                    <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 relative overflow-hidden border-neon-purple/20">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 blur-[100px] rounded-full pointer-events-none" />
                                        <div>
                                            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Clearance_Level: <span className="text-neon-purple">{userTier}</span></h2>
                                            <p className="text-gray-400 text-sm max-w-md font-mono uppercase text-[10px]">Upgrade your technical tier to unlock advanced analytics and elite grid roles.</p>
                                        </div>
                                    </GlassCard>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {Object.entries(rankDefs).map(([id, rank]) => {
                                            const isOwned = userTier === id;
                                            const canAfford = (currentUser?.stats?.kpcBalance || 0) >= rank.kpcPrice;
                                            const isPurchasing = purchasing === id;

                                            // Downgrade Protection UI
                                            const currentRankWeight = rankDefs[userTier]?.weight || 0;
                                            const isLowerTier = rank.weight < currentRankWeight;

                                            return (
                                                <div key={id} className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col ${isOwned ? 'border-neon-green shadow-[0_0_20px_rgba(57,255,20,0.1)] bg-neon-green/5' : 'border-white/5 hover:border-white/10'}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{id}</h3>
                                                        {isOwned && <span className="text-[8px] font-black text-neon-green border border-neon-green/30 px-2 py-0.5 rounded uppercase">Active</span>}
                                                    </div>

                                                    {isOwned && (
                                                        <div className="mb-4 space-y-2">
                                                            <div className="flex justify-between items-center text-[8px] font-mono text-gray-500 uppercase">
                                                                <span>Next Renewal</span>
                                                                <span className="text-white">
                                                                    {currentUser.membershipExpires
                                                                        ? new Date(currentUser.membershipExpires).toLocaleDateString()
                                                                        : 'LEGACY / PENDING'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[8px] font-mono text-gray-500 uppercase">Auto-Renew</span>
                                                                <button
                                                                    onClick={() => handleToggleRenewal(!currentUser.autoRenew)}
                                                                    className={`px-2 py-1 rounded text-[7px] font-black uppercase transition-all ${currentUser.autoRenew ? 'bg-neon-green text-black' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}
                                                                >
                                                                    {currentUser.autoRenew ? 'ENABLED' : 'DISABLED'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <ul className="space-y-3 flex-grow mb-8">
                                                        <li className="flex items-start gap-2 text-[10px] text-gray-400 font-mono uppercase">
                                                            <CheckCircle2 className="w-3 h-3 text-neon-green shrink-0 mt-0.5" />
                                                            {rank.description}
                                                        </li>
                                                        <li className="pt-4 border-t border-white/5 mt-auto">
                                                            <div className="flex flex-wrap gap-1">
                                                                {rank.roles?.map(role => (
                                                                    <span key={role} className="px-1.5 py-0.5 bg-neon-blue/10 border border-neon-blue/30 rounded text-[7px] text-neon-blue font-mono font-bold uppercase">
                                                                        {role}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </li>
                                                    </ul>
                                                    <button
                                                        onClick={() => handleRankPurchase(id)}
                                                        disabled={isOwned || isLowerTier || !canAfford || !!purchasing}
                                                        className={`w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${isOwned
                                                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 cursor-default'
                                                            : isLowerTier
                                                                ? 'bg-gray-900 text-gray-700 border border-white/5 cursor-not-allowed opacity-50'
                                                                : canAfford
                                                                    ? 'bg-white text-black hover:bg-neon-green shadow-xl cursor-pointer'
                                                                    : 'bg-gray-900 text-gray-600 border border-white/5 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        {isPurchasing ? <Activity className="w-4 h-4 animate-spin" /> : isOwned ? 'CURRENT_PROTOCOL' : isLowerTier ? 'LOWER_CLEARANCE_LOCKED' : `${rank.kpcPrice} KPC / MONTH`}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {view === 'SETTINGS' && (
                                <GlassCard className="max-w-2xl mx-auto space-y-6">
                                    <h2 className="text-2xl font-black text-white mb-6">Profile Configuration</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Username / ID</label>
                                                {currentUser?.lastUsernameChange && (
                                                    (() => {
                                                        const lastChange = currentUser.lastUsernameChange;
                                                        const lastDate = lastChange._seconds ? new Date(lastChange._seconds * 1000) : new Date(lastChange);
                                                        const days = Math.ceil(14 - (new Date() - lastDate) / (1000 * 60 * 60 * 24));
                                                        return days > 0 ? (
                                                            <span className="text-[9px] font-bold text-neon-blue uppercase animate-pulse">Cooldown: {days}d left</span>
                                                        ) : null;
                                                    })()
                                                )}
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-xs">@</span>
                                                <input
                                                    type="text"
                                                    value={profileData.username}
                                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 pl-7 text-white focus:border-neon-green outline-none transition-colors font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Display Name</label>
                                            <input
                                                type="text"
                                                value={profileData.displayName}
                                                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-neon-green outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Location</label>
                                            <input
                                                type="text"
                                                value={profileData.location}
                                                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-neon-green outline-none transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Website</label>
                                            <input
                                                type="text"
                                                value={profileData.website}
                                                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-neon-green outline-none transition-colors"
                                                placeholder="https://..."
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
                                            Save Changes
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
                                                Sentinel Protocol
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
                            {view === 'VIOLATIONS' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                                            <ShieldOff className="w-10 h-10 text-red-500" />
                                            Violation_Log
                                        </h2>
                                        <p className="text-gray-500 font-mono text-sm mt-2">Your account restriction history and active enforcement status.</p>
                                    </div>
                                    <GlassCard>
                                        <ViolationsPanel currentUser={currentUser} />
                                    </GlassCard>
                                </motion.div>
                            )}
                            {view === 'REWARDS' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase flex items-center gap-4">
                                                <ShoppingBag className="w-10 h-10 text-neon-purple" />
                                                Reward_Vault
                                            </h2>
                                            <p className="text-gray-500 font-mono text-sm mt-2">Exchange earned KPC for digital assets and collectibles.</p>
                                        </div>
                                    </div>

                                    <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-1 border border-white/5">
                                        <WithdrawalModal
                                            isOpen={true}
                                            onClose={() => setView('DASHBOARD')}
                                            isEmbedded={true}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Payment Modal */}
            {
                isPaymentOpen && (
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
                )
            }
        </div >
    );
};

export default Studio;
