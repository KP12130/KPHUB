import React, { useState, useEffect } from 'react';
import {
    Shield, Lock, Terminal, Activity, LifeBuoy, Mail,
    Clock, CheckCircle2, Send, ArrowLeft, LogOut, Loader2,
    AlertCircle, Check, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';

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

    const handleManualVerify = async (ticketId) => {
        try {
            await axios.post(`${API_BASE}/api/support/manual-verify`, { ticketId });
            toast.success("TICKET_VERIFIED: Identity protocol bypassed.");
            fetchTickets();
        } catch (err) {
            toast.error("Manual sync failed.");
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
                    <button onClick={fetchTickets} className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                        <Loader2 className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Sync_Data
                    </button>
                    <button onClick={handleLogout} className="px-6 py-3 border border-red-500/30 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                        <LogOut className="w-3 h-3" /> Terminate_Session
                    </button>
                </div>
            </header>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-neon-blue uppercase tracking-[0.3em] flex items-center gap-2">
                        <LifeBuoy className="w-4 h-4" /> Global_Transmissions_log
                    </h3>
                </div>

                {isLoading && tickets.length === 0 ? (
                    <div className="text-center py-40 text-gray-700 font-mono text-[10px] animate-pulse">EXTRACTING_GRID_DATA...</div>
                ) : tickets.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {tickets.map((ticket, i) => (
                            <GlassCard key={i} className={`group relative overflow-hidden border-white/5 hover:border-neon-blue/30 transition-all ${ticket.responded ? 'opacity-40' : !ticket.isVerified ? 'border-yellow-500/20' : ''}`}>
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-4 flex-grow">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${ticket.type === 'BUG' ? 'bg-red-500/20 text-red-500' :
                                                    ticket.type === 'REQUEST' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-purple-500/20 text-purple-500'
                                                    }`}>
                                                    {ticket.type}
                                                </span>
                                                <h4 className="font-bold text-white text-sm uppercase tracking-tight">{ticket.subject}</h4>

                                                {ticket.isVerified ? (
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-neon-green uppercase tracking-widest bg-neon-green/10 px-2 py-0.5 rounded">
                                                        <CheckCircle2 className="w-2 h-2" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded animate-pulse">
                                                        <AlertCircle className="w-2 h-2" /> Unverified_Wait
                                                    </span>
                                                )}

                                                {ticket.responded && (
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-neon-blue uppercase tracking-widest bg-neon-blue/10 px-2 py-0.5 rounded">
                                                        <Send className="w-2 h-2" /> Responded
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[10px] text-gray-400 font-mono leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                                                {ticket.description}
                                            </p>

                                            <div className="flex items-center gap-4 text-[9px] text-gray-500 font-mono uppercase">
                                                <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-neon-green" /> {ticket.userEmail}</span>
                                                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex flex-col gap-2">
                                            {/* Mailto Opener (Always available as fallback) */}
                                            <div className="flex flex-col gap-2">
                                                <a
                                                    href={`mailto:${ticket.userEmail}?subject=${encodeURIComponent(`Re: [SYSTEM_SYNC] Data Received: ${ticket.subject}`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-6 py-2 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all hover:bg-white hover:text-black flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink className="w-3 h-3" /> Direct_Email_Relay
                                                </a>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(ticket.userEmail);
                                                        toast.success("EMAIL_COPIED: Ready for manual relay.");
                                                    }}
                                                    className="px-6 py-2 border border-white/5 text-gray-500 text-[8px] font-black uppercase tracking-widest rounded-lg hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Mail className="w-3 h-3" /> Copy_Email_Only
                                                </button>
                                            </div>

                                            {ticket.isVerified ? (
                                                !ticket.responded && respondingTo !== ticket.id && (
                                                    <button
                                                        onClick={() => setRespondingTo(ticket.id)}
                                                        className="px-6 py-2 bg-neon-blue text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all hover:scale-105"
                                                    >
                                                        Process_Server_Reply
                                                    </button>
                                                )
                                            ) : (
                                                <button
                                                    onClick={() => handleManualVerify(ticket.id)}
                                                    className="px-6 py-2 bg-yellow-500 text-black text-[9px] font-black uppercase tracking-widest rounded-lg transition-all hover:bg-white"
                                                >
                                                    <Check className="w-3 h-3" /> Manual_Verify
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {respondingTo === ticket.id && (
                                        <div className="space-y-4 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4">
                                            <textarea
                                                value={responseText}
                                                onChange={(e) => setResponseText(e.target.value)}
                                                rows={5}
                                                placeholder="Enter response core text..."
                                                className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-[10px] text-white font-mono placeholder:text-gray-800 outline-none focus:border-neon-blue transition-colors resize-none"
                                            />
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => { setRespondingTo(null); setResponseText(''); }}
                                                    className="px-4 py-2 text-[8px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    disabled={isSending}
                                                    onClick={() => handleSendResponse(ticket.id)}
                                                    className="px-8 py-2 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-lg transition-all hover:bg-neon-blue flex items-center gap-2"
                                                >
                                                    {isSending ? 'DISPATCHING...' : <><Send className="w-3 h-3" /> Sync_Reply_Email</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {ticket.responded && ticket.adminResponse && (
                                        <div className="pt-4 border-t border-white/5">
                                            <p className="text-[8px] font-bold text-neon-green uppercase mb-2 ml-1">Archive_Response:</p>
                                            <div className="text-[9px] text-gray-500 font-mono italic bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                                                {ticket.adminResponse}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel p-20 rounded-[2.5rem] text-center border border-gray-900 bg-terminal/30">
                        <Shield className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                        <p className="text-gray-600 font-mono text-xs uppercase tracking-widest leading-relaxed">
                            No recent transmissions detected in the security perimeter.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
