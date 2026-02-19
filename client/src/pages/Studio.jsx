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
    DollarSign, BarChart3, PieChart, X, LifeBuoy, Mail, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AnalyticsChart from '../components/AnalyticsChart';
import PaymentModal from '../components/PaymentModal';
import Sentinel from '../components/Sentinel';

const GlassCard = ({ children, className = "" }) => (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

const SupportGrid = () => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTickets = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/support/tickets`);
            setTickets(res.data);
        } catch (err) {
            console.error("Support fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    if (isLoading) return <div className="text-center py-20 text-gray-500 font-mono text-[10px] animate-pulse">EXTRACTING_VERIFIED_DATA...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-neon-blue" /> Support_Grid_Telemetry
            </h3>

            {tickets.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {tickets.map((ticket, i) => (
                        <GlassCard key={i} className="group relative overflow-hidden border-white/5 hover:border-neon-blue/30 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2 flex-grow">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${ticket.type === 'BUG' ? 'bg-red-500/20 text-red-500' :
                                                ticket.type === 'REQUEST' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-purple-500/20 text-purple-500'
                                            }`}>
                                            {ticket.type}
                                        </span>
                                        <h4 className="font-bold text-white text-sm uppercase tracking-tight">{ticket.subject}</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-mono leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                                        {ticket.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-[9px] text-gray-500 font-mono uppercase">
                                        <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-neon-green" /> {ticket.userEmail}</span>
                                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                <div className="shrink-0 flex md:flex-col gap-2">
                                    <button className="px-4 py-2 bg-white/5 hover:bg-neon-blue hover:text-black text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all">
                                        Acknowledge
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <div className="glass-panel p-20 rounded-[2.5rem] text-center border border-gray-900 bg-terminal/30">
                    <LifeBuoy className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                    <p className="text-gray-600 font-mono text-xs uppercase tracking-widest leading-relaxed">
                        No verified transmissions detected in the last 12 grid cycles.
                    </p>
                </div>
            )}
        </div>
    );
};

const Studio = () => {
    const { currentUser } = useAuth();
    const [view, setView] = useState('DASHBOARD');
    const [projects, setProjects] = useState([]);
    const [isStudioLoading, setIsStudioLoading] = useState(true);
    const [stats, setStats] = useState({
        views: 0, downloads: 0, subs: 0, revenue: 0, adRevenue: 0, rep: 0
    });
    const [userTier, setUserTier] = useState('GHOST');
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [profileData, setProfileData] = useState({
        displayName: '', bio: '', website: '', location: '', githubUrl: '', twitterUrl: ''
    });
    const [quests, setQuests] = useState([
        { id: 1, title: 'DAILY_SYNC', desc: 'Initialize Studio interface for 24h cycle.', reward: 50, completed: false, icon: <Activity className="w-4 h-4" /> },
        { id: 2, title: 'SYSTEM_EXPANSION', desc: 'Deploy a new transmission to the grid.', reward: 200, completed: false, icon: <Plus className="w-4 h-4" /> },
        { id: 3, title: 'PULSE_DONOR', desc: 'Like 3 different projects in the discovery grid.', reward: 100, completed: false, icon: <Heart className="w-4 h-4" /> },
        { id: 4, title: 'STREAK_MAINTAINER', desc: 'Maintain a 3-day sync streak.', reward: 500, completed: false, icon: <Zap className="w-4 h-4" /> }
    ]);

    useEffect(() => {
        const fetchStudioData = async () => {
            if (!currentUser || !currentUser.username) return;

            try {
                const res = await axios.get(`${API_BASE}/api/users/profile/${currentUser.username}?viewerId=${currentUser.uid}`);
                const { user, projects } = res.data;
                setProjects(projects);
                setStats({
                    views: user.stats?.views || 0,
                    downloads: user.stats?.downloads || 0,
                    subs: user.followers?.length || 0,
                    revenue: user.stats?.balance || 0,
                    adRevenue: user.stats?.adRevenue || 0,
                    rep: user.stats?.reputation || 0,
                    history: []
                });
                setUserTier(user.tier || 'GHOST');
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
                    name: `Day ${i + 1}`,
                    views: Math.floor(Math.random() * (user.stats?.views || 100) / 7),
                    revenue: Math.floor(Math.random() * (user.stats?.balance || 100) / 7)
                }));
                let accViews = 0, accRev = 0;
                setStats(prev => ({
                    ...prev,
                    history: history.map(d => {
                        accViews += d.views;
                        accRev += d.revenue;
                        return { ...d, views: accViews, revenue: accRev };
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
                    <GlassCard className="space-y-6 sticky top-24">
                        <div className="flex items-center gap-4">
                            <img src={currentUser.photoURL} className="w-12 h-12 rounded-full border border-neon-green" />
                            <div>
                                <h2 className="font-black text-white leading-none">{currentUser.displayName}</h2>
                                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-800 text-gray-400 mt-1 inline-block`}>
                                    {userTier}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <MenuButton id="DASHBOARD" icon={LayoutDashboard} label="Command_Center" />
                            <MenuButton id="ANALYTICS" icon={PieChart} label="Data_Analytics" />
                            <MenuButton id="MONETIZATION" icon={DollarSign} label="Monetization" />
                            <MenuButton id="SUPPORT_GRID" icon={LifeBuoy} label="Support_Grid" />
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
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Total_Views', value: stats.views, icon: Eye, color: 'text-neon-blue' },
                                            { label: 'Downloads', value: stats.downloads, icon: Download, color: 'text-purple-500' },
                                            { label: 'Followers', value: stats.subs, icon: Users, color: 'text-yellow-500' },
                                            { label: 'Reputation', value: stats.rep, icon: Trophy, color: 'text-neon-green' }
                                        ].map((stat, i) => (
                                            <GlassCard key={i} className="flex flex-col items-center justify-center text-center p-4">
                                                <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                                                <span className="text-2xl font-black text-white">{stat.value}</span>
                                                <span className="text-[9px] text-gray-500 uppercase tracking-widest">{stat.label}</span>
                                            </GlassCard>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                            <Database className="w-5 h-5 text-neon-green" /> Active Protocols
                                        </h3>
                                        {projects.length > 0 ? (
                                            projects.map(project => (
                                                <div key={project.id} className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors group">
                                                    <div className="w-16 h-12 bg-gray-900 rounded-lg overflow-hidden shrink-0">
                                                        {project.screenshots?.[0] ? (
                                                            <img src={project.screenshots[0]} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-800"><Zap className="w-4 h-4 text-gray-600" /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <h4 className="font-bold text-white truncate">{project.title}</h4>
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
                                            ))
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

                            {view === 'SUPPORT_GRID' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <SupportGrid />
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

// SVG components to fix Activity icon if needed
const Activity = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

export default Studio;
