import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Box, HardDrive, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const InfrastructureManager = () => {
    const { currentUser, updateUser } = useAuth();
    const [slots, setSlots] = useState(0);
    const [storageMB, setStorageMB] = useState(0);
    const [period, setPeriod] = useState('MONTHLY');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const SLOT_COST = 1500;
    const STORAGE_TIERS = {
        MONTHLY: { '1000': 100, '10000': 800, '100000': 6000, base: 10 },
        YEARLY: { '1000': 1000, '10000': 8000, '100000': 60000, base: 100 },
        LIFETIME: { '1000': 5000, '10000': 40000, '100000': 300000, base: 500 }
    };

    const getStorageCost = (mb, p) => {
        const tier = STORAGE_TIERS[p];
        if (!tier) return 0;
        let unitCost = tier.base;
        if (mb >= 100000) unitCost = tier['100000'] / 1000;
        else if (mb >= 10000) unitCost = tier['10000'] / 100;
        else if (mb >= 1000) unitCost = tier['1000'] / 10;
        return Math.ceil((mb / 100) * unitCost);
    };

    const storageCost = getStorageCost(storageMB, period);
    const totalCost = (slots * SLOT_COST) + storageCost;
    const canAfford = (currentUser?.stats?.kpcBalance || 0) >= totalCost;

    const handleUpgrade = async () => {
        if (totalCost === 0) return toast.error("Select an upgrade level.");
        if (!canAfford) return toast.error("Insufficient KPC balance.");

        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/buy-infrastructure`, {
                uid: currentUser.uid,
                slots,
                storageMB,
                period
            });

            if (res.data.success) {
                toast.success("INFRASTRUCTURE_EXPANDED: Grid capacity updated.");

                const stats = currentUser.stats || {};
                const newStats = {
                    ...stats,
                    kpcBalance: (stats.kpcBalance || 0) - totalCost,
                    extraSlots: (stats.extraSlots || 0) + slots
                };

                if (storageMB > 0) {
                    if (period === 'LIFETIME') {
                        newStats.extraStorageLifetimeMB = (stats.extraStorageLifetimeMB || 0) + storageMB;
                    } else {
                        newStats.extraStorageSubMB = (stats.extraStorageSubMB || 0) + storageMB;
                        // Expiry is handled by server, we'll let the next auth refresh sync it or just update balance
                    }
                }

                updateUser({ stats: newStats });
                setSlots(0);
                setStorageMB(0);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Upgrade failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden bg-black/20">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Box className="w-32 h-32 text-neon-blue" />
            </div>

            <div className="mb-8">
                <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Infra_Upgrades</h3>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Expand your grid allocation and transmission bandwidth</p>
            </div>

            <div className="space-y-10">
                {/* Duration/Period Selector */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    {['MONTHLY', 'YEARLY', 'LIFETIME'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white text-black shadow-xl scale-[1.02]' : 'text-gray-500 hover:text-white'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Slots Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue">
                                <Box className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-white uppercase">Project_Upload_Slots</h4>
                                <p className="text-[8px] font-mono text-gray-600 uppercase">Current Extra: {currentUser?.stats?.extraSlots || 0}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-neon-blue">+{slots}</span>
                            <span className="text-[10px] text-gray-500 ml-1">SLOTS</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        value={slots}
                        onChange={(e) => setSlots(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-neon-blue transition-all"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-gray-700 uppercase">
                        <span>Original Capacity</span>
                        <span>+20 Slots Max Burst</span>
                    </div>
                </div>

                {/* Storage Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-neon-purple/10 rounded-lg text-neon-purple">
                                <HardDrive className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-white uppercase">Payload_Capacity</h4>
                                <p className="text-[8px] font-mono text-gray-600 uppercase">
                                    Current Extra: {(currentUser?.stats?.extraStorageLifetimeMB || 0) + (Date.now() < (currentUser?.stats?.extraStorageExpiry || 0) ? (currentUser?.stats?.extraStorageSubMB || 0) : 0)} MB
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-neon-purple">
                                {storageMB < 1000 ? `${storageMB} MB` : `${(storageMB / 1000).toFixed(1)} GB`}
                            </span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100000"
                        step="100"
                        value={storageMB}
                        onChange={(e) => setStorageMB(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-neon-purple transition-all"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-gray-700 uppercase">
                        <span>100MB units</span>
                        <span>100GB Max Node</span>
                    </div>
                </div>

                {/* Summary & Purchase */}
                <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center text-neon-green">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase">Total_Upgrade_Cost</p>
                                <p className="text-xl font-black text-white">{totalCost.toLocaleString()} <span className="text-xs text-gray-400">KPC</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-mono text-gray-600 uppercase">Current Balance</p>
                            <p className={`text-xs font-black uppercase ${canAfford ? 'text-neon-green' : 'text-red-500'}`}>
                                {(currentUser?.stats?.kpcBalance || 0).toLocaleString()} KPC
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-neon-blue/60 p-3 bg-neon-blue/5 rounded-2xl border border-neon-blue/10 mb-6">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <p className="text-[9px] leading-tight font-medium uppercase tracking-tight">These upgrades are permanent and linked to your grid coordinate (UUID). Capacity is allocated instantly.</p>
                    </div>

                    <button
                        onClick={handleUpgrade}
                        disabled={isSubmitting || totalCost === 0 || !canAfford}
                        className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neon-green hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <>SYNCHRONIZING_GRID...</>
                        ) : (
                            <>Authorize_Expansion <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InfrastructureManager;
