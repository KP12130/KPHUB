import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, Users, ShieldAlert, BarChart3, Database } from 'lucide-react';

const Economy = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/exchange/stats`);
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch economy stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto pb-20">
            <div className="mb-12">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(0,212,255,0.3)] mb-2">
                    Economy_Monitor
                </h1>
                <p className="text-gray-500 font-mono text-sm max-w-2xl">
                    Real-time visualization of the Grid's financial protocol. Monitoring circulation, burn rate, and capital flow.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* Total Circulating */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6 border border-neon-blue/20 bg-neon-blue/5 rounded-3xl"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-neon-blue/10 rounded-xl flex items-center justify-center border border-neon-blue/30">
                            <Activity className="w-5 h-5 text-neon-blue" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Circulation</span>
                    </div>
                    <div className="text-3xl font-black text-white">{stats?.totalCreditsInCirculation?.toLocaleString() || 0}</div>
                    <div className="text-[10px] text-neon-blue font-mono mt-1 uppercase tracking-tighter italic">Total_Credits_Held</div>
                </motion.div>

                {/* Total Burned */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="glass-panel p-6 border border-neon-purple/20 bg-neon-purple/5 rounded-3xl"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-neon-purple/10 rounded-xl flex items-center justify-center border border-neon-purple/30">
                            <Zap className="w-5 h-5 text-neon-purple" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Burn_Rate</span>
                    </div>
                    <div className="text-3xl font-black text-white">{stats?.totalBurned?.toLocaleString() || 0}</div>
                    <div className="text-[10px] text-neon-purple font-mono mt-1 uppercase tracking-tighter italic">Total_KPC_Expended</div>
                </motion.div>

                {/* Total Volume */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-panel p-6 border border-neon-green/20 bg-neon-green/5 rounded-3xl"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-neon-green/10 rounded-xl flex items-center justify-center border border-neon-green/30">
                            <TrendingUp className="w-5 h-5 text-neon-green" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Market_Volume</span>
                    </div>
                    <div className="text-3xl font-black text-white">{stats?.totalVolume?.toLocaleString() || 0}</div>
                    <div className="text-[10px] text-neon-green font-mono mt-1 uppercase tracking-tighter italic">Aggregated_Flow</div>
                </motion.div>

                {/* Total Citizens */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-panel p-6 border border-white/5 bg-white/5 rounded-3xl"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active_Citizens</span>
                    </div>
                    <div className="text-3xl font-black text-white">{stats?.totalUsers?.toLocaleString() || 0}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-tighter italic">System_Participants</div>
                </motion.div>
            </div>

            {/* Analysis Shards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="glass-panel p-8 rounded-3xl border border-white/5">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                        <ShieldAlert className="w-4 h-4 text-neon-blue" />
                        System_Vitals
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                            <div>
                                <h4 className="text-xs font-black text-white uppercase mb-1 tracking-wider">Protocol Integrity</h4>
                                <p className="text-[10px] text-gray-500 font-mono italic">Consensus verification across all nodes.</p>
                            </div>
                            <span className="text-neon-green font-black text-sm uppercase">NOMINAL</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                            <div>
                                <h4 className="text-xs font-black text-white uppercase mb-1 tracking-wider">Inflation Guard</h4>
                                <p className="text-[10px] text-gray-500 font-mono italic">KPC supply automated regulation.</p>
                            </div>
                            <span className="text-neon-blue font-black text-sm uppercase">ACTIVE</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                            <div>
                                <h4 className="text-xs font-black text-white uppercase mb-1 tracking-wider">Market Liquidity</h4>
                                <p className="text-[10px] text-gray-500 font-mono italic">Simulation of atomic peer-to-peer exchange.</p>
                            </div>
                            <span className="text-white font-black text-sm uppercase">STABLE</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-xs font-black text-white uppercase mb-1 tracking-wider">Protocol Version</h4>
                                <p className="text-[10px] text-gray-500 font-mono italic">System core build.</p>
                            </div>
                            <span className="text-gray-500 font-mono text-sm uppercase">{stats?.protocolVersion}</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-neon-blue/20 bg-neon-blue/5 overflow-hidden relative">
                    <div className="absolute -right-20 -bottom-20 opacity-5">
                        <BarChart3 className="w-80 h-80" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2 flex items-center gap-3 relative z-10">
                        <Database className="w-4 h-4 text-neon-blue" />
                        Grid_Forecasting
                    </h3>
                    <p className="text-[10px] text-neon-blue font-mono mb-8 uppercase tracking-widest relative z-10">Predictive analysis for the next cycle.</p>

                    <div className="space-y-8 relative z-10">
                        <div className="p-4 bg-void border border-white/10 rounded-2xl">
                            <div className="flex justify-between mb-2">
                                <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Projected_Burn</span>
                                <span className="text-neon-purple text-xs font-black">+14.2%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full">
                                <div className="h-full w-[65%] bg-neon-purple" />
                            </div>
                        </div>
                        <div className="p-4 bg-void border border-white/10 rounded-2xl">
                            <div className="flex justify-between mb-2">
                                <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Citizen_Growth</span>
                                <span className="text-neon-blue text-xs font-black">+8.5%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full">
                                <div className="h-full w-[45%] bg-neon-blue" />
                            </div>
                        </div>
                        <div className="p-4 bg-void border border-white/10 rounded-2xl">
                            <div className="flex justify-between mb-2">
                                <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Resource_Equilibrium</span>
                                <span className="text-neon-green text-xs font-black">STABLE</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full">
                                <div className="h-full w-[90%] bg-neon-green" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Economy;
