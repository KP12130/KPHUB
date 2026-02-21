import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, ShieldAlert, ShieldCheck, Search, ShieldBan, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE } from '../api';

const GlassCard = ({ children, className = "" }) => (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
        {children}
    </div>
);

const SecurityPanel = () => {
    const [bannedIps, setBannedIps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [ipToBan, setIpToBan] = useState('');
    const [banReason, setBanReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchBannedIps();
    }, []);

    const fetchBannedIps = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/security/banned-ips`);
            setBannedIps(res.data.bannedIps || []);
        } catch (err) {
            toast.error("Failed to fetch firewall rules.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBanIp = async (e) => {
        e.preventDefault();
        if (!ipToBan.trim()) return toast.error("IP address required.");

        setIsSubmitting(true);
        try {
            await axios.post(`${API_BASE}/api/security/ban-ip`, {
                ip: ipToBan,
                reason: banReason || 'Admin Action / Suspicious Activity'
            });
            toast.success(`FIREWALL_UPDATED: ${ipToBan} isolated.`);
            setIpToBan('');
            setBanReason('');
            fetchBannedIps();
        } catch (err) {
            toast.error("Failed to inject firewall rule.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnbanIp = async (ip) => {
        if (!window.confirm(`Lift firewall restriction for ${ip}?`)) return;

        try {
            await axios.post(`${API_BASE}/api/security/unban-ip`, { ip });
            toast.success(`RESTRICTION_LIFTED: ${ip} restored.`);
            fetchBannedIps();
        } catch (err) {
            toast.error("Failed to remove firewall rule.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-yellow-500" />
                        Firewall_Controls
                    </h2>
                    <p className="text-xs text-gray-500 font-mono tracking-widest uppercase mt-1">Network Level Isolation Protocol</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submit New Ban */}
                <GlassCard className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <ShieldBan className="w-5 h-5 text-red-500" />
                        <h3 className="font-black text-white uppercase tracking-widest text-sm">Inject_Firewall_Rule</h3>
                    </div>

                    <form onSubmit={handleBanIp} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Target IPv4/IPv6 Address</label>
                            <input
                                type="text"
                                placeholder="e.g. 192.168.1.1 or ::1"
                                value={ipToBan}
                                onChange={(e) => setIpToBan(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-yellow-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Reason (Optional)</label>
                            <input
                                type="text"
                                placeholder="Botting, spam, etc."
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-yellow-500 outline-none transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors font-black uppercase tracking-widest rounded-xl text-xs flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldBan className="w-4 h-4" />}
                            Execute_Ban
                        </button>
                    </form>
                </GlassCard>

                {/* Banned IPs List */}
                <GlassCard className="lg:col-span-2 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <Search className="w-5 h-5 text-gray-500" />
                            <h3 className="font-black text-white uppercase tracking-widest text-sm">Active_Blacklist ({bannedIps.length})</h3>
                        </div>
                        <button onClick={fetchBannedIps} className="text-[10px] uppercase font-bold text-gray-500 hover:text-white transition-colors">
                            Refresh
                        </button>
                    </div>

                    <div className="flex-grow overflow-auto pr-2 space-y-3">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                            </div>
                        ) : bannedIps.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                                <ShieldCheck className="w-12 h-12 text-gray-800" />
                                <span className="font-mono text-xs uppercase">No active firewall rules.</span>
                            </div>
                        ) : (
                            bannedIps.map((ip) => (
                                <div key={ip} className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl group hover:border-red-500/40 transition-colors">
                                    <div className="flex items-center gap-4 text-white font-mono text-sm">
                                        <ShieldBan className="w-4 h-4 text-red-500" />
                                        {ip}
                                    </div>
                                    <button
                                        onClick={() => handleUnbanIp(ip)}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Lift Ban"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default SecurityPanel;
