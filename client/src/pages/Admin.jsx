import React, { useState, useEffect } from 'react';
import {
    Shield, Lock, Terminal, Activity, LifeBuoy, Mail,
    Clock, CheckCircle2, Send, ArrowLeft, LogOut, Loader2,
    AlertCircle, Check, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import SupportChatAdmin from '../components/SupportChatAdmin';

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

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'ACTIVE') setIsAuthenticated(true);
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchTickets();
    }, [isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (loginData.user === ADMIN_USER && loginData.pass === ADMIN_PASS) {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session', 'ACTIVE');
            toast.success("SYSTEM_AUTHENTICATED: Welcome, Architect.");
        } else {
            toast.error("INVALID_PROTOCOL: Access Denied.");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_session');
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

    const [activeTab, setActiveTab] = useState('SUPPORT');
    const [pendingVerifications, setPendingVerifications] = useState([]);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (isAuthenticated && activeTab === 'VERIFICATION') fetchPendingVerifications();
    }, [isAuthenticated, activeTab]);

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

    if (!isAuthenticated) {
        // ... (existing login UI)
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
                    <button onClick={activeTab === 'SUPPORT' ? fetchTickets : fetchPendingVerifications} className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                        <Loader2 className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Sync_Data
                    </button>
                    <button onClick={handleLogout} className="px-6 py-3 border border-red-500/30 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                        <LogOut className="w-3 h-3" /> Terminate_Session
                    </button>
                </div>
            </header>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('SUPPORT')}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'SUPPORT' ? 'bg-neon-blue text-black shadow-[0_0_20px_rgba(0,212,255,0.4)]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                    Support_Transmissions
                </button>
                <button
                    onClick={() => setActiveTab('VERIFICATION')}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'VERIFICATION' ? 'bg-neon-green text-black shadow-[0_0_20px_rgba(57,255,20,0.4)]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                    Identity_Audits
                </button>
            </div>

            <div className="space-y-6">
                {activeTab === 'SUPPORT' ? (
                    <SupportChatAdmin />
                ) : (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                            <Shield className="text-neon-green" /> Pending_Citizen_Audits
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingVerifications.length > 0 ? (
                                pendingVerifications.map(user => (
                                    <GlassCard key={user.id} className="relative group overflow-hidden border border-white/5 hover:border-neon-green/30 transition-all">
                                        <div className="flex items-center gap-4 mb-6">
                                            <img src={user.photoURL} className="w-12 h-12 rounded-full border border-white/10" />
                                            <div>
                                                <h3 className="font-black text-white uppercase text-sm tracking-widest">{user.username}</h3>
                                                <p className="text-[10px] text-gray-500 font-mono tracking-tighter truncate max-w-[150px]">{user.id}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-6 text-[10px] font-mono">
                                            <div className="bg-white/5 p-2 rounded-lg">
                                                <p className="text-gray-500 uppercase">REP_INDEX</p>
                                                <p className="text-neon-green font-bold">{user.stats?.reputation || 0}</p>
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
            </div>
        </div>
    );
};

export default Admin;
