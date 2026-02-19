import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Star, Trophy, ArrowRight, CheckCircle2, AlertCircle, ShoppingCart, LayoutDashboard, Globe, Radio, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const NexusExchange = () => {
    const { currentUser, updateUser } = useAuth();
    const [ranks, setRanks] = useState({});
    const [flares, setFlares] = useState({});
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [processingFlare, setProcessingFlare] = useState(null);
    const [processingVerify, setProcessingVerify] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [processingBroadcast, setProcessingBroadcast] = useState(false);

    const GlassCard = ({ children, className = "" }) => (
        <div className={`glass-panel rounded-2xl p-6 ${className}`}>
            {children}
        </div>
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ranksRes, flaresRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/exchange/ranks`),
                    axios.get(`${API_BASE}/api/exchange/flares`)
                ]);
                setRanks(ranksRes.data);
                setFlares(flaresRes.data);
            } catch (err) {
                console.error("Failed to load exchange data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePurchase = async (rankId) => {
        if (!currentUser) return toast.error("Identity unknown. Login to access the exchange.");
        const rank = ranks[rankId];
        if (currentUser.stats?.kpcBalance < rank.kpcPrice) {
            return toast.error("INSUFFICIENT_KPC_CREDITS: Sync more data or complete quests.");
        }
        setPurchasing(rankId);
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/purchase`, { uid: currentUser.uid, rankId });
            if (res.data.success) {
                toast.success(`Success! Identity upgraded to ${rankId}.`);
                updateUser({ tier: rankId, stats: { ...currentUser.stats, kpcBalance: currentUser.stats.kpcBalance - rank.kpcPrice } });
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Transaction aborted.");
        } finally { setPurchasing(null); }
    };

    const handleBuyFlare = async (flareId) => {
        if (!currentUser) return toast.error("Login required.");
        const flare = flares[flareId];
        if (currentUser.stats?.kpcBalance < flare.kpcPrice) return toast.error("Insufficient KPC.");

        setProcessingFlare(flareId);
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/buy-flare`, { uid: currentUser.uid, flareId });
            if (res.data.success) {
                toast.success(`${flare.label} unlocked!`);
                updateUser({
                    activeFlare: flareId,
                    unlockedFlares: [...(currentUser.unlockedFlares || []), flareId],
                    stats: { ...currentUser.stats, kpcBalance: currentUser.stats.kpcBalance - flare.kpcPrice }
                });
            }
        } catch (err) { toast.error(err.response?.data?.error || "Flare sync failed."); }
        finally { setProcessingFlare(null); }
    };

    const handleApplyVerification = async () => {
        if (!currentUser) return;
        if (currentUser.stats?.kpcBalance < 25000) return toast.error("25,000 KPC required for audit.");

        setProcessingVerify(true);
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/verify`, { uid: currentUser.uid });
            if (res.data.success) {
                toast.success("Audit initiated. Verification pending.");
                updateUser({ verificationPending: true, stats: { ...currentUser.stats, kpcBalance: currentUser.stats.kpcBalance - 25000 } });
            }
        } catch (err) { toast.error(err.response?.data?.error || "Audit request failed."); }
        finally { setProcessingVerify(false); }
    };

    const handleBroadcast = async () => {
        if (!currentUser) return;
        if (!broadcastMsg.trim()) return toast.error("Transmission packet empty.");
        if (currentUser.stats?.kpcBalance < 50000) return toast.error("Insufficient KPC for global broadcast.");

        setProcessingBroadcast(true);
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/broadcast`, { uid: currentUser.uid, message: broadcastMsg });
            if (res.data.success) {
                toast.success("BROADCAST_PROTOCOLS_ENGAGED: Message live on the grid.");
                setBroadcastMsg('');
                updateUser({ stats: { ...currentUser.stats, kpcBalance: currentUser.stats.kpcBalance - 50000 } });
            }
        } catch (err) { toast.error(err.response?.data?.error || "Broadcast failure."); }
        finally { setProcessingBroadcast(false); }
    };

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(57,255,20,0.3)]">
                        Nexus_Exchange
                    </h1>
                    <p className="text-gray-500 font-mono text-sm">Convert your <span className="text-neon-green">KPC Credits</span> into grid-wide privileges.</p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Link to="/economy" className="glass-panel px-6 py-3 border border-white/5 hover:border-neon-blue/30 rounded-xl flex items-center gap-3 transition-all group">
                        <BarChart3 className="w-5 h-5 text-gray-500 group-hover:text-neon-blue" />
                        <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest">Grid_Economy</span>
                    </Link>

                    <div className="glass-panel p-4 rounded-2xl border border-neon-green/20 bg-neon-green/5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-neon-green" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available_Balance</p>
                            <div className="flex items-center gap-3">
                                <p className="text-2xl font-black text-white">{currentUser?.stats?.kpcBalance?.toLocaleString() || 0} <span className="text-neon-green">KPC</span></p>
                                <Link to="/forge" className="px-3 py-1 bg-neon-green/10 border border-neon-green/20 rounded-lg text-[10px] font-black text-neon-green uppercase hover:bg-neon-green hover:text-black transition-all">
                                    GET_MORE
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ranks Section */}
            <div className="mb-16">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.5em] mb-8 border-l-2 border-neon-blue pl-4">System_Privileges</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {Object.entries(ranks).map(([id, data]) => (
                        <div key={id} className={`glass-panel p-8 rounded-3xl border transition-all relative overflow-hidden group ${currentUser?.tier === id ? 'border-neon-green shadow-[0_0_30px_rgba(57,255,20,0.1)]' : 'border-white/5 hover:border-white/20'}`}>
                            {currentUser?.tier === id && (
                                <div className="absolute top-4 right-4 bg-neon-green text-black px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">ACTIVE_PROTOCOL</div>
                            )}
                            <div className="mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${id === 'PRO' ? 'bg-neon-blue/10 text-neon-blue' : id === 'ELITE' ? 'bg-neon-purple/10 text-neon-purple' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    {id === 'PRO' ? <Shield className="w-8 h-8" /> : id === 'ELITE' ? <Star className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
                                </div>
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">{data.label}</h3>
                                <p className="text-gray-400 text-xs font-mono leading-relaxed">{data.description}</p>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center text-sm font-black">
                                    <span className="text-gray-500 uppercase tracking-tighter">Cost_</span>
                                    <span className="text-white">{data.kpcPrice.toLocaleString()} KPC</span>
                                </div>
                                <button
                                    onClick={() => handlePurchase(id)}
                                    disabled={currentUser?.tier === id || purchasing === id || (currentUser?.stats?.kpcBalance < data.kpcPrice)}
                                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${currentUser?.tier === id ? 'bg-white/5 text-gray-500' : 'bg-neon-green text-black hover:scale-[1.02]'}`}
                                >
                                    {purchasing === id ? 'COMMITTING...' : currentUser?.tier === id ? 'ALREADY_ACTIVE' : 'Initialize_Upgrade'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cosmetics Section */}
            <div className="mb-16">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.5em] mb-8 border-l-2 border-neon-purple pl-4">Indentity_Flares</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {Object.entries(flares).map(([id, data]) => (
                        <div key={id} className={`glass-panel p-8 rounded-3xl border border-white/5 hover:border-neon-purple/30 transition-all flex flex-col`}>
                            <div className="mb-6">
                                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-2" style={{ textShadow: data.style.includes('text-shadow') ? '0 0 10px currentColor' : 'none' }}>{data.label}</h3>
                                <div className="p-4 bg-black/40 rounded-xl mb-4 font-mono text-center text-lg font-black" style={{ ...Object.fromEntries(data.style.split(';').filter(s => s).map(s => s.split(':').map(x => x.trim()))) }}>
                                    @{currentUser?.username || 'SYSTEM_GHOST'}
                                </div>
                            </div>
                            <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center text-sm font-black">
                                    <span className="text-gray-500 uppercase tracking-tighter">Cost_</span>
                                    <span className="text-white">{data.kpcPrice.toLocaleString()} KPC</span>
                                </div>
                                <button
                                    onClick={() => handleBuyFlare(id)}
                                    disabled={currentUser?.unlockedFlares?.includes(id) || processingFlare === id || (currentUser?.stats?.kpcBalance < data.kpcPrice)}
                                    className="w-full py-4 bg-neon-purple/10 border border-neon-purple/30 text-neon-purple rounded-xl font-black uppercase tracking-widest text-xs hover:bg-neon-purple hover:text-black transition-all"
                                >
                                    {processingFlare === id ? 'SYNCING...' : currentUser?.unlockedFlares?.includes(id) ? 'UNLOCKED' : 'Acquire_Flare'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Broadcast Section */}
            <div className="mb-16">
                <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.5em] mb-8 border-l-2 border-neon-blue pl-4">Broadcast_Protocols</h2>
                <GlassCard className="p-8 border-neon-blue/20 bg-neon-blue/5">
                    <div className="flex flex-col lg:flex-row gap-8 items-center">
                        <div className="w-16 h-16 bg-neon-blue/10 rounded-2xl flex items-center justify-center shrink-0 border border-neon-blue/30">
                            <Radio className="w-8 h-8 text-neon-blue animate-pulse" />
                        </div>
                        <div className="space-y-1 flex-grow">
                            <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Global Grid Broadcast</h4>
                            <p className="text-gray-400 text-xs font-mono max-w-xl">
                                Transmit a high-priority message to every terminal on the grid for 60 minutes.
                            </p>
                        </div>
                        <div className="flex-grow w-full max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="ENTER_TRANSMISSION_PACKET..."
                                    value={broadcastMsg}
                                    onChange={(e) => setBroadcastMsg(e.target.value.substring(0, 100))}
                                    className="w-full bg-void border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono placeholder:text-gray-700 outline-none focus:border-neon-blue transition-colors"
                                />
                                <span className="absolute right-3 top-3 text-[8px] font-mono text-gray-500">{broadcastMsg.length}/100</span>
                            </div>
                        </div>
                        <div className="shrink-0 text-center lg:text-right">
                            <div className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest">Fee: 50,000 KPC</div>
                            <button
                                onClick={handleBroadcast}
                                disabled={processingBroadcast || !broadcastMsg.trim() || (currentUser?.stats?.kpcBalance < 50000)}
                                className="px-8 py-3 bg-neon-blue text-black rounded-xl font-black uppercase text-xs tracking-widest transition-all hover:scale-105"
                            >
                                {processingBroadcast ? 'TRANSMITTING...' : 'Initialize_Broadast'}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Verification Section */}
            <div className="mt-16 glass-panel p-8 rounded-3xl border border-neon-blue/20 bg-neon-blue/5">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 bg-neon-blue/10 rounded-2xl flex items-center justify-center shrink-0 border border-neon-blue/30">
                        <CheckCircle2 className={`w-10 h-10 ${currentUser?.stats?.verified ? 'text-neon-green' : 'text-neon-blue'} animate-pulse`} />
                    </div>
                    <div className="space-y-2 text-center md:text-left flex-grow">
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter">System Verification</h4>
                        <p className="text-gray-400 text-sm font-mono leading-relaxed max-w-2xl">
                            Elite architects can undergo a central protocol audit. Verification grants a permanent badge, priority grid ranking, and exklusive metadata access.
                        </p>
                        {currentUser?.stats?.verified ? (
                            <span className="inline-block bg-neon-green text-black px-3 py-1 rounded text-[10px] font-black uppercase mt-2">ID_VERIFIED_NOMINAL</span>
                        ) : currentUser?.verificationPending ? (
                            <span className="inline-block bg-neon-blue/20 text-neon-blue px-3 py-1 rounded text-[10px] font-black uppercase mt-2">AUDIT_IN_PROGRESS</span>
                        ) : (
                            <span className="inline-block bg-white/5 text-gray-500 px-3 py-1 rounded text-[10px] font-black uppercase mt-2 font-mono">25,000 KPC FEE</span>
                        )}
                    </div>
                    {!currentUser?.stats?.verified && !currentUser?.verificationPending && (
                        <button
                            onClick={handleApplyVerification}
                            disabled={processingVerify || currentUser?.stats?.kpcBalance < 25000}
                            className="md:ml-auto px-8 py-3 bg-neon-blue text-black rounded-xl font-black uppercase text-xs tracking-widest transition-all hover:scale-105"
                        >
                            {processingVerify ? 'INITIATING...' : 'Request_Audit'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NexusExchange;
