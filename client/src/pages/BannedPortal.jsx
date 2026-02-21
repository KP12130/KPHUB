import React, { useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, AlertOctagon, Clock, Calendar } from 'lucide-react';
import SupportChat from '../components/SupportChat';
import axios from 'axios';
import { API_BASE } from '../api';

const BannedPortal = () => {
    const { currentUser, logout, updateUser } = useAuth();
    const uid = currentUser?.uid;

    // Poll the backend every 15s — if ban expired, backend auto-clears and returns tier FREE
    useEffect(() => {
        if (!uid) return;

        // Persist that we are currently banned so Dashboard can later detect the lift
        const r = currentUser?.restrictions || {};
        sessionStorage.setItem(`last_known_r_${uid}`, JSON.stringify({
            muted: !!r.muted,
            uploadBlocked: !!r.uploadBlocked,
            cashoutBlocked: !!r.cashoutBlocked,
            downloadBlocked: !!r.downloadBlocked,
            ban: true
        }));

        const check = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/users/${uid}`);
                if (res.data.tier !== 'BANNED') {
                    updateUser(res.data);
                }
            } catch (err) { /* ignore */ }
        };
        check();
        const interval = setInterval(check, 15000);
        return () => clearInterval(interval);
    }, [uid]);

    const banExpiry = currentUser?.restrictions?.banExpiry;
    const banReason = currentUser?.banReason;

    const timeLeft = useMemo(() => {
        if (!banExpiry) return null;
        const diff = new Date(banExpiry) - new Date();
        if (diff <= 0) return 'Expired';
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        if (d > 0) return `${d}d ${h}h remaining`;
        if (h > 0) return `${h}h ${m}m remaining`;
        return `${m}m remaining`;
    }, [banExpiry]);

    const bannedAt = currentUser?.bannedAt
        ? new Date(currentUser.bannedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : null;

    return (
        <div className="min-h-screen bg-void flex flex-col items-center justify-center p-4 relative overflow-hidden scanlines noise">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-500/5 rounded-full blur-[150px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-5xl z-10 flex border border-red-500/20 bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)]" style={{ height: '85vh', maxHeight: '700px' }}>

                {/* Left Side: Ban Notice */}
                <div className="w-1/3 p-8 border-r border-red-500/20 bg-red-950/20 flex flex-col justify-between overflow-y-auto">
                    <div>
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6">
                            <AlertOctagon className="w-8 h-8 text-red-500 animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Access_Denied</h1>
                        <p className="text-xs text-red-400 font-mono uppercase tracking-widest mb-6">User Tier: BANNED</p>

                        <div className="space-y-3 text-sm text-gray-400 leading-relaxed font-mono">
                            <p>Your connection to the grid has been severed due to protocol violations.</p>
                            <p>Contact the <span className="text-red-500 font-bold">Architects</span> to appeal your suspension.</p>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl">
                                <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Registered ID</p>
                                <p className="text-xs text-white truncate">{currentUser?.uid}</p>
                            </div>

                            {bannedAt && (
                                <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-red-500/60 shrink-0" />
                                    <div>
                                        <p className="text-[9px] text-gray-600 uppercase tracking-widest">Banned On</p>
                                        <p className="text-xs text-white">{bannedAt}</p>
                                    </div>
                                </div>
                            )}

                            {banExpiry ? (
                                <div className="p-4 bg-red-500/5 border border-red-500/30 rounded-xl flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                                    <div>
                                        <p className="text-[9px] text-gray-600 uppercase tracking-widest">Temporary Ban</p>
                                        <p className="text-sm font-black text-red-400">{timeLeft}</p>
                                        <p className="text-[9px] text-gray-600 mt-0.5">
                                            Expires {new Date(banExpiry).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl">
                                    <p className="text-[9px] text-gray-600 uppercase tracking-widest">Duration</p>
                                    <p className="text-xs text-red-400 font-black mt-0.5">Permanent</p>
                                </div>
                            )}

                            {banReason && (
                                <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl">
                                    <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Reason</p>
                                    <p className="text-xs text-gray-300 leading-relaxed">{banReason}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 hover:text-red-400 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sever_Connection
                    </button>
                </div>

                {/* Right Side: Support Chat */}
                <div className="w-2/3 p-6 bg-gradient-to-br from-black/40 to-black/80 flex flex-col min-h-0">
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Appeal_Terminal
                        </h2>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <SupportChat currentUser={currentUser} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BannedPortal;
