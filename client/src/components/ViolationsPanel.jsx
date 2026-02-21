import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import {
    ShieldOff, MicOff, Upload, DownloadCloud, DollarSign, Shield,
    Clock, AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';

const PERIODS = [
    { label: 'Last Hour', value: '1h' },
    { label: '1 Day', value: '1d' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '1 Year', value: '365d' },
    { label: 'Lifetime', value: 'lifetime' },
];

const ACTION_META = {
    BAN: { label: 'Ban', icon: ShieldOff, color: 'text-red-400 border-red-500/30 bg-red-500/5' },
    UNBAN: { label: 'Unban', icon: Shield, color: 'text-green-400 border-green-500/30 bg-green-500/5' },
    MUTE: { label: 'Mute', icon: MicOff, color: 'text-orange-400 border-orange-500/30 bg-orange-500/5' },
    UNMUTE: { label: 'Unmute', icon: CheckCircle2, color: 'text-green-400 border-green-500/30 bg-green-500/5' },
    BLOCK_UPLOAD: { label: 'Upload Blocked', icon: Upload, color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' },
    UNBLOCK_UPLOAD: { label: 'Upload Restored', icon: CheckCircle2, color: 'text-green-400 border-green-500/30 bg-green-500/5' },
    BLOCK_CASHOUT: { label: 'Cashout Blocked', icon: DollarSign, color: 'text-purple-400 border-purple-500/30 bg-purple-500/5' },
    UNBLOCK_CASHOUT: { label: 'Cashout Restored', icon: CheckCircle2, color: 'text-green-400 border-green-500/30 bg-green-500/5' },
    BLOCK_DOWNLOAD: { label: 'Download Blocked', icon: DownloadCloud, color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' },
    UNBLOCK_DOWNLOAD: { label: 'Download Restored', icon: CheckCircle2, color: 'text-green-400 border-green-500/30 bg-green-500/5' },
};

const RESTRICTION_CURRENT = [
    { key: 'muted', label: 'Muted', icon: MicOff, expiryKey: 'mutedUntil', color: 'text-orange-400 border-orange-500/30 bg-orange-500/5' },
    { key: 'uploadBlocked', label: 'Upload Blocked', icon: Upload, expiryKey: 'uploadBlockedUntil', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' },
    { key: 'cashoutBlocked', label: 'Cashout Blocked', icon: DollarSign, expiryKey: 'cashoutBlockedUntil', color: 'text-purple-400 border-purple-500/30 bg-purple-500/5' },
    { key: 'downloadBlocked', label: 'Download Blocked', icon: DownloadCloud, expiryKey: 'downloadBlockedUntil', color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' },
];

const formatTimeLeft = (iso) => {
    if (!iso) return 'Permanent';
    const diff = new Date(iso) - new Date();
    if (diff <= 0) return 'Expired';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h left`;
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
};

const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ViolationsPanel({ currentUser }) {
    const [period, setPeriod] = useState('lifetime');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!currentUser?.uid) return;
        const fetch = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/api/users/admin/violations`, {
                    params: { uid: currentUser.uid, period }
                });
                setHistory(res.data);
            } catch (err) {
                console.error('Violations fetch failed', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [currentUser?.uid, period]);

    const restrictions = currentUser?.restrictions || {};
    const activeRestrictions = RESTRICTION_CURRENT.filter(r => restrictions[r.key]);

    return (
        <div className="space-y-8">
            {/* Active Restrictions */}
            <div>
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Active Restrictions
                </h3>
                {activeRestrictions.length === 0 ? (
                    <div className="flex items-center gap-3 p-5 glass-panel rounded-2xl border border-green-500/20">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <p className="text-sm text-green-400 font-mono">No active restrictions on your account.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeRestrictions.map(r => {
                            const Icon = r.icon;
                            const expiry = restrictions[r.expiryKey];
                            return (
                                <div key={r.key} className={`flex items-start gap-3 p-4 rounded-2xl border ${r.color}`}>
                                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-widest">{r.label}</p>
                                        <p className="text-[10px] font-mono mt-0.5 opacity-70 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {formatTimeLeft(expiry)}
                                        </p>
                                        {expiry && (
                                            <p className="text-[9px] font-mono opacity-50 mt-0.5">
                                                Expires {formatDate(expiry)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* History */}
            <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Violation History
                    </h3>
                    <div className="flex gap-1.5 flex-wrap">
                        {PERIODS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${period === p.value
                                        ? 'bg-white text-black border-white'
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-12 text-center text-[11px] text-gray-700 font-mono uppercase tracking-widest">
                        No violations in this period.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {history.map(v => {
                            const meta = ACTION_META[v.action] || { label: v.action, icon: AlertTriangle, color: 'text-gray-400 border-white/10 bg-white/5' };
                            const Icon = meta.icon;
                            return (
                                <div key={v.id} className={`flex items-start gap-4 p-4 rounded-2xl border ${meta.color}`}>
                                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-[11px] font-black uppercase tracking-widest">{meta.label}</p>
                                            {v.duration && (
                                                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-black/40 text-gray-500">
                                                    {v.duration}h
                                                </span>
                                            )}
                                            {v.expiresAt && (
                                                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-black/40 text-gray-500">
                                                    until {formatDate(v.expiresAt)}
                                                </span>
                                            )}
                                        </div>
                                        {v.reason && (
                                            <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">{v.reason}</p>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-gray-600 font-mono shrink-0">{formatDate(v.appliedAt)}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
