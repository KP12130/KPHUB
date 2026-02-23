import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield, Lock, Terminal, Activity, LifeBuoy, Mail,
    Clock, CheckCircle2, Send, ArrowLeft, LogOut, Loader2,
    AlertCircle, Check, ExternalLink, Users, Slash, Globe, Trophy, Plus,
    Calendar, DollarSign, Gift, Star, X
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import SupportChatAdmin from '../components/SupportChatAdmin';
import ModerationPanel from '../components/ModerationPanel';
import SecurityPanel from '../components/SecurityPanel';

// CREDENTIALS
const ADMIN_USER = "grid_admin";
const ADMIN_PASS = "kL9#mP2$vR5!xT8*zQ1^";

const GlassCard = ({ children, className = "" }) => (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginData, setLoginData] = useState({ user: '', pass: '' });
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [respondingTo, setRespondingTo] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [banIdentifier, setBanIdentifier] = useState('');
    const [banReason, setBanReason] = useState('');
    const [isBanning, setIsBanning] = useState(false);

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        const token = sessionStorage.getItem('admin_token');
        if (session === 'ACTIVE') {
            setIsAuthenticated(true);
            if (token) setLoginData(prev => ({ ...prev, pass: token }));
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchTickets();
    }, [isAuthenticated]);

    const [activeTab, setActiveTab] = useState('SUPPORT'); // SUPPORT, VERIFICATION, USER_MANAGEMENT, NEXUS_MANAGER
    const [hackathons, setHackathons] = useState([]);
    const [isNexusLoading, setIsNexusLoading] = useState(false);
    const [newHack, setNewHack] = useState({ title: '', description: '', reward: '', entryFee: 0, durationDays: 7, image: '' });
    const [selectedHackId, setSelectedHackId] = useState(null);
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [payoutRequests, setPayoutRequests] = useState([]);

    useEffect(() => {
        if (isAuthenticated && activeTab === 'VERIFICATION') fetchPendingVerifications();
        if (isAuthenticated && activeTab === 'NEXUS_MANAGER') fetchHackathons();
        if (isAuthenticated && activeTab === 'PAYOUTS') fetchPayoutRequests();
    }, [isAuthenticated, activeTab]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (loginData.user === ADMIN_USER && loginData.pass === ADMIN_PASS) {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session', 'ACTIVE');
            sessionStorage.setItem('admin_token', loginData.pass);
            toast.success("SYSTEM_AUTHENTICATED: Welcome, Architect.");
        } else {
            toast.error("INVALID_PROTOCOL: Access Denied.");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_session');
        sessionStorage.removeItem('admin_token');
        setLoginData({ user: '', pass: '' });
        toast.success("SESSION_TERMINATED");
    };

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/support/tickets`);
            setTickets(res.data);
        } catch (err) {
            toast.error("Data extraction failure.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingVerifications = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/exchange/admin/pending-verifications`);
            setPendingVerifications(res.data);
        } catch (err) {
            toast.error("Verification data sync failure.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendResponse = async (ticketId) => {
        if (!responseText.trim()) {
            toast.error("Protocol requires response data.");
            return;
        }

        setIsSending(true);
        try {
            const res = await axios.post(`${API_BASE}/api/support/respond`, {
                ticketId,
                responseText
            });

            if (res.data.warning) {
                toast.error(res.data.message, { duration: 6000 });
            } else {
                toast.success("RESPONSE_TRANSMITTED: User notified.");
            }

            setRespondingTo(null);
            setResponseText('');
            fetchTickets();
        } catch (err) {
            toast.error("Transmission failed. Use Direct_Email_Relay instead.");
        } finally {
            setIsSending(false);
        }
    };

    const handleVerifyAction = async (uid, action) => {
        const feedback = action === 'REJECT' ? window.prompt("REJECTION_REASON:", "Insufficient grid presence.") : null;
        if (action === 'REJECT' && feedback === null) return;

        setIsVerifying(true);
        try {
            await axios.post(`${API_BASE}/api/exchange/admin/verify-action`, { uid, action, feedback });
            toast.success(`VERIFICATION_${action}: Citizen protocol updated.`);
            fetchPendingVerifications();
        } catch (err) {
            toast.error("Audit action failed.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePayoutAction = async (requestId, action) => {
        const feedback = (action === 'REJECT' || action === 'REFUND') ? window.prompt(`${action}_REASON:`, "Information mismatch.") : null;
        if ((action === 'REJECT' || action === 'REFUND') && feedback === null) return;

        setIsLoading(true);
        try {
            await axios.post(`${API_BASE}/api/exchange/admin/payout-action`, { requestId, action, feedback });
            toast.success(`PAYOUT_${action}: Request updated.`);
            fetchPayoutRequests();
        } catch (err) {
            toast.error("Payout action failure.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBanUser = async (e) => {
        e.preventDefault();
        if (!banIdentifier.trim()) return;
        setIsBanning(true);
        try {
            await axios.post(`${API_BASE}/api/users/admin/ban`, {
                identifier: banIdentifier,
                reason: banReason,
                adminToken: loginData.pass
            });
            toast.success(`SEVERED: Entity ${banIdentifier} has been isolated.`);
            setBanIdentifier('');
            setBanReason('');
        } catch (err) {
            toast.error(err.response?.data?.error || "Ban execution failed.");
        } finally {
            setIsBanning(false);
        }
    };

    const fetchHackathons = async () => {
        setIsNexusLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/hackathons`);
            setHackathons(res.data);
        } catch (err) {
            toast.error("Nexus sync failure.");
        } finally {
            setIsNexusLoading(false);
        }
    };

    const handleCreateHack = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/api/hackathons/admin/create`, { ...newHack, adminToken: loginData.pass });
            toast.success("EVENT_AUTHORIZED: Nexus updated.");
            setNewHack({ title: '', description: '', reward: '', entryFee: 0, durationDays: 7, image: '' });
            fetchHackathons();
        } catch (err) {
            toast.error("Deployment failed.");
        }
    };

    const handlePayout = async (hackathonId, winnerId, amount) => {
        if (!window.confirm(`CONFIRM_PAYOUT: Transfer ${amount} KPC to ${winnerId}?`)) return;
        try {
            await axios.post(`${API_BASE}/api/hackathons/admin/payout`, {
                hackathonId, winnerId, amount, adminToken: loginData.pass
            });
            toast.success("REWARD_TRANSMITTED");
            fetchHackathons();
        } catch (err) {
            toast.error(err.response?.data?.error || "Transaction failure.");
        }
    };

    const handleEndEvent = async (id) => {
        if (!window.confirm("FORCE_TERMINATION: End this event immediately?")) return;
        try {
            await axios.post(`${API_BASE}/api/hackathons/admin/end`, {
                hackathonId: id, adminToken: loginData.pass
            });
            toast.success("EVENT_TERMINATED");
            fetchHackathons();
        } catch (err) {
            toast.error("Termination failed.");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-void p-4">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-neon-blue/10 border border-neon-blue/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-10 h-10 text-neon-blue animate-pulse" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Operations_Grid</h1>
                        <p className="text-gray-600 font-mono text-[10px] uppercase tracking-widest mt-2">Restricted Security Perimeter</p>
                    </div>

                    <form onSubmit={handleLogin} className="glass-panel p-8 rounded-[2.5rem] border border-gray-900 space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-bold text-gray-600 uppercase ml-1">Identity_Token</label>
                            <input
                                type="text"
                                value={loginData.user}
                                onChange={(e) => setLoginData({ ...loginData, user: e.target.value })}
                                placeholder="USERNAME"
                                className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-[10px] text-white font-mono placeholder:text-gray-800 outline-none focus:border-neon-blue transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-bold text-gray-600 uppercase ml-1">Access_Key</label>
                            <input
                                type="password"
                                value={loginData.pass}
                                onChange={(e) => setLoginData({ ...loginData, pass: e.target.value })}
                                placeholder="PASSWORD"
                                className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-[10px] text-white font-mono placeholder:text-gray-800 outline-none focus:border-neon-blue transition-colors"
                            />
                        </div>
                        <button className="w-full h-14 bg-neon-blue text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all">
                            Initialize_Link
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-12">
                <div>
                    <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                        <Activity className="w-12 h-12 text-neon-blue" />
                        Admin_Grid
                    </h1>
                    <p className="text-gray-500 font-mono text-xs tracking-[0.3em] uppercase mt-2">System command & support orchestration.</p>
                </div>
                <div className="flex gap-4">
                    {['SUPPORT', 'VERIFICATION', 'PAYOUTS'].includes(activeTab) && (
                        <button onClick={() => {
                            if (activeTab === 'SUPPORT') fetchTickets();
                            if (activeTab === 'VERIFICATION') fetchPendingVerifications();
                            if (activeTab === 'PAYOUTS') fetchPayoutRequests();
                        }} className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                            <Loader2 className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Sync_Data
                        </button>
                    )}
                    <button onClick={handleLogout} className="px-6 py-3 border border-red-500/30 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                        <LogOut className="w-3 h-3" /> Terminate_Session
                    </button>
                </div>
            </header>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('PAYOUTS')}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'PAYOUTS' ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                    Redemption_Queue
                </button>
                <button
                    onClick={() => setActiveTab('SECURITY_IP')}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'SECURITY_IP' ? 'bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                    Security_&_IPs
                </button>
            </div>

            {activeTab === 'SUPPORT' && (
                <SupportChatAdmin />
            )}

            {activeTab === 'VERIFICATION' && (
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <Shield className="text-neon-green" /> Pending_Citizen_Audits
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingVerifications.length > 0 ? (
                            pendingVerifications.map(user => (
                                <GlassCard key={user.id} className="relative group overflow-hidden border border-white/5 hover:border-neon-green/30 transition-all">
                                    <div className="flex items-center gap-4 mb-6">
                                        <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-full border border-white/10" />
                                        <div>
                                            <h3 className="font-black text-white uppercase text-sm tracking-widest">{user.username}</h3>
                                            <p className="text-[10px] text-gray-500 font-mono tracking-tighter truncate max-w-[150px]">{user.id}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-6 text-[10px] font-mono">
                                        <div className="bg-white/5 p-2 rounded-lg">
                                            <p className="text-gray-500 uppercase">KPC_BALANCE</p>
                                            <p className="text-neon-green font-bold">{user.stats?.kpcBalance || 0}</p>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded-lg">
                                            <p className="text-gray-500 uppercase">SYS_UPLOADS</p>
                                            <p className="text-neon-blue font-bold">{user.stats?.uploads || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleVerifyAction(user.id, 'APPROVE')}
                                            disabled={isVerifying}
                                            className="flex-1 py-3 bg-neon-green/20 text-neon-green hover:bg-neon-green hover:text-black transition-all rounded-xl font-black uppercase text-[10px] tracking-widest"
                                        >
                                            Authorize
                                        </button>
                                        <button
                                            onClick={() => handleVerifyAction(user.id, 'REJECT')}
                                            disabled={isVerifying}
                                            className="flex-1 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-xl font-black uppercase text-[10px] tracking-widest"
                                        >
                                            Deny_Access
                                        </button>
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-dashed border-white/5">
                                <CheckCircle2 className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">No pending audits in the verification queue.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'USER_MANAGEMENT' && (
                <ModerationPanel />
            )}

            {activeTab === 'SECURITY_IP' && (
                <SecurityPanel />
            )}

            {activeTab === 'PAYOUTS' && (
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <Trophy className="text-yellow-500" /> Pending_Reward_Redemptions
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {payoutRequests.length > 0 ? (
                            payoutRequests.map(req => (
                                <GlassCard key={req.id} className="border border-white/5 hover:border-yellow-500/30 transition-all flex flex-col md:flex-row gap-6">
                                    <div className="flex-grow space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-black uppercase text-sm tracking-widest">@{req.username}</h3>
                                                <p className="text-[10px] text-gray-500 font-mono tracking-tighter truncate max-w-[200px]">{req.id}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-void border border-white/5 rounded-2xl">
                                            <p className="text-[8px] font-bold text-gray-600 uppercase mb-2">Redemption_Data</p>
                                            <p className="text-xs font-mono text-gray-300 break-all">{req.details}</p>
                                            {req.cardId && (
                                                <div className="mt-2 pt-2 border-t border-white/5 flex gap-4">
                                                    <div>
                                                        <p className="text-[8px] text-gray-500 uppercase">Card_ID</p>
                                                        <p className="text-[10px] font-black text-neon-blue uppercase">{req.cardId}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] text-gray-500 uppercase">Target_Email</p>
                                                        <p className="text-[10px] font-black text-white">{req.email || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-full md:w-48 flex flex-col justify-between pt-2">
                                        <div className="text-right mb-4">
                                            <p className="text-[10px] font-black text-gray-500 uppercase">Amount_Requested</p>
                                            <p className="text-2xl font-black text-yellow-500">{req.amount.toLocaleString()} <span className="text-xs">KPC</span></p>
                                            {req.userSnapshot && (
                                                <div className="mt-2 text-[8px] font-mono text-gray-600 uppercase">
                                                    <p>Audit_Snapshot:</p>
                                                    <p>UNIFIED_KPC: {req.userSnapshot.kpcBalance}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => handlePayoutAction(req.id, 'APPROVE')}
                                                disabled={isLoading}
                                                className="w-full py-2 bg-neon-green text-black font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-white transition-all shadow-lg"
                                            >
                                                Fulfill_&_Settle
                                            </button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handlePayoutAction(req.id, 'REJECT')}
                                                    disabled={isLoading}
                                                    className="flex-1 py-2 bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handlePayoutAction(req.id, 'REFUND')}
                                                    disabled={isLoading}
                                                    className="flex-1 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black uppercase text-[9px] tracking-widest rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                                                >
                                                    Refund
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-dashed border-white/5">
                                <DollarSign className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">The payout queue is currently empty.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'NEXUS_MANAGER' && (
                <div className="space-y-12">
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Creation Form */}
                        <GlassCard className="lg:col-span-1 border border-white/5">
                            <h2 className="text-xl font-black text-white uppercase italic mb-6 flex items-center gap-2">
                                <Plus className="text-purple-500" /> Deploy_Event
                            </h2>
                            <form onSubmit={handleCreateHack} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-600 uppercase">Event_Title</label>
                                    <input type="text" value={newHack.title} onChange={e => setNewHack({ ...newHack, title: e.target.value })} className="admin-input w-full" placeholder="e.g. NEON_CITY_BUILDER" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-600 uppercase">Description</label>
                                    <textarea value={newHack.description} onChange={e => setNewHack({ ...newHack, description: e.target.value })} className="admin-input w-full h-24" placeholder="Event briefing..." required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold text-gray-600 uppercase">Entry_Fee (KPC)</label>
                                        <input type="number" value={newHack.entryFee} onChange={e => setNewHack({ ...newHack, entryFee: e.target.value })} className="admin-input w-full" placeholder="0" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold text-gray-600 uppercase">Duration (Days)</label>
                                        <input type="number" value={newHack.durationDays} onChange={e => setNewHack({ ...newHack, durationDays: e.target.value })} className="admin-input w-full" placeholder="7" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-gray-600 uppercase">Reward_Label</label>
                                    <input type="text" value={newHack.reward} onChange={e => setNewHack({ ...newHack, reward: e.target.value })} className="admin-input w-full" placeholder="e.g. 50,000 KPC + Badge" required />
                                </div>
                                <button className="w-full py-4 bg-purple-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white hover:text-black transition-all shadow-lg">
                                    Authorize_Deployment
                                </button>
                            </form>
                        </GlassCard>

                        {/* Active Events List */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-2">
                                <Trophy className="text-neon-green" /> Managed_Nexus_Events
                            </h2>
                            <div className="space-y-4">
                                {hackathons.map(h => (
                                    <GlassCard key={h.id} className={`border transition-all ${selectedHackId === h.id ? 'border-purple-500 bg-purple-500/5' : 'border-white/5 hover:border-white/10'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                    {h.title}
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${h.status === 'ACTIVE' ? 'bg-neon-green/10 text-neon-green' : 'bg-gray-800 text-gray-500'}`}>
                                                        {h.status}
                                                    </span>
                                                </h3>
                                                <p className="text-[10px] text-gray-500 font-mono mt-1">{h.submissions?.length || 0} Submissions | {h.participants?.length || 0} Participants</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {h.status === 'ACTIVE' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEndEvent(h.id); }}
                                                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                        title="End Event"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedHackId(selectedHackId === h.id ? null : h.id)}
                                                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                                                >
                                                    {selectedHackId === h.id ? <X /> : <Star />}
                                                </button>
                                            </div>
                                        </div>

                                        {selectedHackId === h.id && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Incoming_Submissions</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {h.submissions?.length > 0 ? h.submissions.map((s, idx) => (
                                                        <div key={idx} className="bg-void p-4 rounded-xl border border-gray-900 flex flex-col justify-between">
                                                            <div>
                                                                <h4 className="text-white font-bold text-xs truncate">{s.projectTitle}</h4>
                                                                <p className="text-[10px] text-gray-600 font-mono italic">Creator: {s.userId}</p>
                                                            </div>
                                                            <div className="mt-4 flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const amt = window.prompt("REWARD_AMOUNT (KPC):", "10000");
                                                                        if (amt) handlePayout(h.id, s.userId, amt);
                                                                    }}
                                                                    className="flex-1 py-2 bg-neon-green/10 text-neon-green text-[9px] font-black uppercase tracking-tighter rounded-lg hover:bg-neon-green hover:text-black transition-all"
                                                                >
                                                                    Grant_Reward
                                                                </button>
                                                                <Link to={`/project/${s.projectId}?tab=CODE`} className="p-2 border border-white/10 rounded-lg text-gray-500 hover:text-white" title="Launch Explorer"><ExternalLink className="w-3 h-3" /></Link>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="col-span-full py-10 text-center text-[10px] text-gray-700 font-mono uppercase">Silence on the grid.</div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default Admin;
