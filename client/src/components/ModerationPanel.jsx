import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import {
    Search, Loader2, ShieldOff, Shield, MicOff, Mic,
    Upload, DownloadCloud, DollarSign, Users, Clock, CheckCircle2
} from 'lucide-react';

const PRESETS = [
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '24h', hours: 24 },
    { label: '3d', hours: 72 },
    { label: '7d', hours: 168 },
    { label: '∞', hours: 0 },
];

const CARDS = [
    {
        key: 'ban',
        label: 'Ban',
        desc: 'Full access revocation. User is isolated to the Banned Portal.',
        applyAction: 'BAN',
        revokeAction: 'UNBAN',
        isActive: (u) => u?.tier === 'BANNED',
        expiry: (u) => u?.restrictions?.banExpiry,
        color: { border: 'border-red-500/40', bg: 'bg-red-950/20', badge: 'bg-red-500/10 text-red-400 border-red-500/30', applyBtn: 'bg-red-500 hover:bg-red-400 text-black', icon: 'text-red-500' },
        ApplyIcon: ShieldOff,
        RevokeIcon: Shield,
    },
    {
        key: 'mute',
        label: 'Mute',
        desc: 'Prevents commenting, liking, and interacting with content.',
        applyAction: 'MUTE',
        revokeAction: 'UNMUTE',
        isActive: (u) => u?.restrictions?.muted,
        expiry: (u) => u?.restrictions?.mutedUntil,
        color: { border: 'border-orange-500/40', bg: 'bg-orange-950/20', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', applyBtn: 'bg-orange-500 hover:bg-orange-400 text-black', icon: 'text-orange-400' },
        ApplyIcon: MicOff,
        RevokeIcon: Mic,
    },
    {
        key: 'upload',
        label: 'Block Upload',
        desc: 'Prevents user from deploying new projects to the grid.',
        applyAction: 'BLOCK_UPLOAD',
        revokeAction: 'UNBLOCK_UPLOAD',
        isActive: (u) => u?.restrictions?.uploadBlocked,
        expiry: (u) => u?.restrictions?.uploadBlockedUntil,
        color: { border: 'border-yellow-500/40', bg: 'bg-yellow-950/20', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', applyBtn: 'bg-yellow-500 hover:bg-yellow-400 text-black', icon: 'text-yellow-400' },
        ApplyIcon: Upload,
        RevokeIcon: Upload,
    },
    {
        key: 'cashout',
        label: 'Block Cashout',
        desc: 'Prevents user from withdrawing their KPC balance.',
        applyAction: 'BLOCK_CASHOUT',
        revokeAction: 'UNBLOCK_CASHOUT',
        isActive: (u) => u?.restrictions?.cashoutBlocked,
        expiry: (u) => u?.restrictions?.cashoutBlockedUntil,
        color: { border: 'border-purple-500/40', bg: 'bg-purple-950/20', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', applyBtn: 'bg-purple-500 hover:bg-purple-400 text-white', icon: 'text-purple-400' },
        ApplyIcon: DollarSign,
        RevokeIcon: DollarSign,
    },
    {
        key: 'download',
        label: 'Block Download',
        desc: 'Prevents user from downloading project source files.',
        applyAction: 'BLOCK_DOWNLOAD',
        revokeAction: 'UNBLOCK_DOWNLOAD',
        isActive: (u) => u?.restrictions?.downloadBlocked,
        expiry: (u) => u?.restrictions?.downloadBlockedUntil,
        color: { border: 'border-blue-500/40', bg: 'bg-blue-950/20', badge: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30', applyBtn: 'bg-neon-blue hover:bg-blue-300 text-black', icon: 'text-neon-blue' },
        ApplyIcon: DownloadCloud,
        RevokeIcon: DownloadCloud,
    },
];

const formatExpiry = (iso) => {
    if (!iso) return 'Permanent';
    const d = new Date(iso);
    const now = new Date();
    if (d < now) return 'Expired';
    const diff = Math.round((d - now) / 60000);
    if (diff < 60) return `${diff}m left`;
    if (diff < 1440) return `${Math.round(diff / 60)}h left`;
    return `${Math.round(diff / 1440)}d left`;
};

function RestrictionCard({ card, userInfo, onAction, isActing }) {
    const [selectedPreset, setSelectedPreset] = useState(5); // default ∞
    const [customHours, setCustomHours] = useState('');
    const [reason, setReason] = useState('');
    const isCustom = selectedPreset === null;
    const active = card.isActive(userInfo);
    const expiry = card.expiry(userInfo);
    const c = card.color;
    const ApplyIcon = card.ApplyIcon;
    const RevokeIcon = card.RevokeIcon;

    const getDuration = () => {
        if (selectedPreset !== null) return PRESETS[selectedPreset].hours || undefined;
        return customHours ? parseFloat(customHours) : undefined;
    };

    const loading = isActing === card.applyAction || isActing === card.revokeAction;

    return (
        <div className={`rounded-[2rem] border ${c.border} ${active ? c.bg : 'bg-white/[0.02]'} flex flex-col overflow-hidden transition-all`}>
            {/* Header */}
            <div className="p-6 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <ApplyIcon className={`w-5 h-5 ${c.icon}`} />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">{card.label}</h3>
                    </div>
                    {active ? (
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${c.badge}`}>
                            ACTIVE {expiry ? `· ${formatExpiry(expiry)}` : '· Permanent'}
                        </span>
                    ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10 text-gray-600 bg-white/5">
                            INACTIVE
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-gray-500 font-mono leading-relaxed">{card.desc}</p>
            </div>

            {/* Duration presets */}
            <div className="px-6 pb-4">
                <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Duration</p>
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                    {PRESETS.map((p, i) => (
                        <button
                            key={i}
                            onClick={() => { setSelectedPreset(i); }}
                            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedPreset === i && !isCustom
                                ? `${c.badge} border-current`
                                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setSelectedPreset(null)}
                    className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isCustom ? `${c.badge}` : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                        }`}
                >
                    Custom (hours)
                </button>
                {isCustom && (
                    <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        placeholder="e.g. 48"
                        value={customHours}
                        onChange={e => setCustomHours(e.target.value)}
                        className="mt-2 w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-gray-500 transition-colors"
                    />
                )}
                {/* Reason */}
                <textarea
                    rows={2}
                    placeholder="Reason (optional)"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="mt-3 w-full bg-black/40 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-gray-700 outline-none focus:border-gray-500 transition-colors resize-none"
                />
            </div>

            {/* CTAs */}
            <div className="mt-auto p-4 pt-0 grid grid-cols-2 gap-3">
                <button
                    onClick={() => onAction(card.revokeAction, getDuration(), reason)}
                    disabled={!active || !!isActing}
                    className="py-3 rounded-2xl border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                    {loading && isActing === card.revokeAction ? <Loader2 className="w-3 h-3 animate-spin" /> : <RevokeIcon className="w-3 h-3" />}
                    Revoke
                </button>
                <button
                    onClick={() => onAction(card.applyAction, getDuration(), reason)}
                    disabled={active || !!isActing}
                    className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2 ${c.applyBtn}`}
                >
                    {loading && isActing === card.applyAction ? <Loader2 className="w-3 h-3 animate-spin" /> : <ApplyIcon className="w-3 h-3" />}
                    Apply
                </button>
            </div>
        </div>
    );
}

export default function ModerationPanel() {
    const [identifier, setIdentifier] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const [isFetching, setIsFetching] = useState(false);
    const [isActing, setIsActing] = useState(null);

    const searchUser = async (e) => {
        e.preventDefault();
        if (!identifier.trim()) return;
        setIsFetching(true);
        setUserInfo(null);
        try {
            const res = await axios.get(`${API_BASE}/api/users/admin/user-info`, { params: { identifier } });
            setUserInfo(res.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'User not found.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleAction = async (action, duration, reason) => {
        if (!userInfo) return;
        setIsActing(action);
        try {
            await axios.post(`${API_BASE}/api/users/admin/moderate`, {
                identifier: userInfo.uid,
                action,
                reason: reason || undefined,
                duration: duration || undefined,
            });
            toast.success(`${action.replace(/_/g, ' ')} applied to @${userInfo.username}`);
            const updated = await axios.get(`${API_BASE}/api/users/admin/user-info`, { params: { identifier: userInfo.uid } });
            setUserInfo(updated.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Action failed.');
        } finally {
            setIsActing(null);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                <Users className="text-red-500" /> Moderation_Grid
            </h2>

            {/* Search */}
            <form onSubmit={searchUser} className="flex gap-3 max-w-2xl">
                <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="Email, UID, or @username"
                    className="flex-grow bg-black/40 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-gray-700 outline-none focus:border-neon-blue transition-colors"
                />
                <button
                    type="submit"
                    disabled={isFetching || !identifier.trim()}
                    className="px-6 py-3 bg-neon-blue text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Locate
                </button>
            </form>

            {/* User Identity Card */}
            {userInfo && (
                <>
                    <div className="flex items-center gap-4 p-5 glass-panel rounded-2xl border border-white/10 max-w-2xl">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-white uppercase tracking-widest">@{userInfo.username}</p>
                            <p className="text-[10px] text-gray-500 font-mono truncate">{userInfo.email}</p>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-2">
                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${userInfo.tier === 'BANNED'
                                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                                : 'bg-white/5 border-white/10 text-gray-400'
                                }`}>
                                {userInfo.tier}
                            </span>
                            {userInfo.lastKnownIp && (
                                <span className="text-[9px] text-gray-500 font-mono flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/5">
                                    <Shield className="w-3 h-3 text-yellow-500" />
                                    {userInfo.lastKnownIp}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Restriction Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {CARDS.map(card => (
                            <RestrictionCard
                                key={card.key}
                                card={card}
                                userInfo={userInfo}
                                onAction={handleAction}
                                isActing={isActing}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
