import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, MessageSquare, ShieldOff, MicOff, Upload, DownloadCloud, DollarSign, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import SupportChat from './SupportChat';
import { useAuth } from '../context/AuthContext';

const RESTRICTION_META = {
    muted: { label: 'Muted', icon: MicOff, detail: 'You cannot comment, like, or interact.', expiryKey: 'mutedUntil' },
    uploadBlocked: { label: 'Upload Blocked', icon: Upload, detail: 'You cannot upload new projects.', expiryKey: 'uploadBlockedUntil' },
    cashoutBlocked: { label: 'Cashout Blocked', icon: DollarSign, detail: 'You cannot withdraw your balance.', expiryKey: 'cashoutBlockedUntil' },
    downloadBlocked: { label: 'Download Blocked', icon: DownloadCloud, detail: 'You cannot download project files.', expiryKey: 'downloadBlockedUntil' },
};

const formatExpiry = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (d < new Date()) return null;
    const diff = Math.round((d - new Date()) / 60000);
    if (diff < 60) return `${diff}m remaining`;
    if (diff < 1440) return `${Math.round(diff / 60)}h remaining`;
    return `${Math.round(diff / 1440)}d remaining`;
};

// Storage Helpers
const seenKey = (uid, key) => `restriction_seen_${key}_${uid}`;
const markSeen = (uid, keys) => keys.forEach(k => sessionStorage.setItem(seenKey(uid, k), '1'));
const isSeen = (uid, key) => sessionStorage.getItem(seenKey(uid, key)) === '1';
const clearSeen = (uid, key) => sessionStorage.removeItem(seenKey(uid, key));

const getStoredMini = (uid) => {
    try {
        const val = sessionStorage.getItem(`last_known_r_${uid}`);
        return val ? JSON.parse(val) : null;
    } catch { return null; }
};
const setStoredMini = (uid, r) => sessionStorage.setItem(`last_known_r_${uid}`, JSON.stringify(r));

export default function RestrictionBanner({ currentUser }) {
    const { refreshUser } = useAuth();
    const uid = currentUser?.uid;

    const [supportOpen, setSupportOpen] = useState(false);
    const [liftedNotices, setLiftedNotices] = useState([]);
    const [unseenKeys, setUnseenKeys] = useState([]); // Keys that need acknowledgement
    const [bannerHidden, setBannerHidden] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const expiryTimersRef = useRef([]);
    const prevRMiniRef = useRef(null);

    const r = currentUser?.restrictions || {};
    const rMini = useMemo(() => ({
        muted: !!r.muted,
        uploadBlocked: !!r.uploadBlocked,
        cashoutBlocked: !!r.cashoutBlocked,
        downloadBlocked: !!r.downloadBlocked,
        ban: currentUser?.tier === 'BANNED'
    }), [r.muted, r.uploadBlocked, r.cashoutBlocked, r.downloadBlocked, currentUser?.tier]);

    const active = Object.entries(RESTRICTION_META).filter(([key]) => r[key]);

    // 1. Initial unseen calculation & Expiry Timers
    useEffect(() => {
        if (!uid) return;

        // Calculate initial unseen
        const initialUnseen = active
            .filter(([key]) => sessionStorage.getItem(seenKey(uid, key)) !== '1')
            .map(([key]) => key);
        setUnseenKeys(initialUnseen);

        // Timers
        expiryTimersRef.current.forEach(t => clearTimeout(t));
        expiryTimersRef.current = [];
        Object.entries(RESTRICTION_META).forEach(([key, meta]) => {
            const iso = r[meta.expiryKey];
            if (!iso) return;
            const msLeft = new Date(iso) - new Date();
            if (msLeft > 0 && msLeft < 24 * 3600 * 1000) {
                expiryTimersRef.current.push(setTimeout(() => refreshUser(uid), msLeft + 1500));
            }
        });
        return () => expiryTimersRef.current.forEach(t => clearTimeout(t));
    }, [uid, r.mutedUntil, r.uploadBlockedUntil, r.cashoutBlockedUntil, r.downloadBlockedUntil]);

    // 2. Change Detection (Persistent through storage)
    useEffect(() => {
        if (!uid) return;

        // Read directly from storage to determine if this is a fresh session
        const prevStr = sessionStorage.getItem(`last_known_r_${uid}`);

        if (!prevStr) {
            // First ever load for this UID in this session snippet.
            // Just initialize storage to current state, do NOT trigger popups.
            setStoredMini(uid, rMini);
            return;
        }

        const prev = JSON.parse(prevStr);
        let updatedStorage = false;

        // Check for lifted
        const newlyLifted = [];
        if (prev.muted && !rMini.muted) { newlyLifted.push('Mute'); sessionStorage.removeItem(seenKey(uid, 'muted')); updatedStorage = true; }
        if (prev.uploadBlocked && !rMini.uploadBlocked) { newlyLifted.push('Upload Block'); sessionStorage.removeItem(seenKey(uid, 'uploadBlocked')); updatedStorage = true; }
        if (prev.downloadBlocked && !rMini.downloadBlocked) { newlyLifted.push('Download Block'); sessionStorage.removeItem(seenKey(uid, 'downloadBlocked')); updatedStorage = true; }
        if (prev.cashoutBlocked && !rMini.cashoutBlocked) { newlyLifted.push('Cashout Block'); sessionStorage.removeItem(seenKey(uid, 'cashoutBlocked')); updatedStorage = true; }
        if (prev.ban && !rMini.ban) { newlyLifted.push('Account Ban'); updatedStorage = true; }

        if (newlyLifted.length > 0) {
            setLiftedNotices(prevStatus => [...new Set([...prevStatus, ...newlyLifted])]);
            setBannerHidden(false);
        }

        // Check for new
        const newlyAdded = [];
        Object.keys(RESTRICTION_META).forEach(key => {
            if (!prev[key] && rMini[key]) { newlyAdded.push(key); updatedStorage = true; }
        });

        if (newlyAdded.length > 0) {
            newlyAdded.forEach(k => sessionStorage.removeItem(seenKey(uid, k)));
            setUnseenKeys(prevStatus => [...new Set([...prevStatus, ...newlyAdded])]);
            setBannerHidden(false);
        }

        // Only update storage if something actually changed between renders
        // to prevent unnecessary cycles
        if (updatedStorage) {
            setStoredMini(uid, rMini);
        }

        setStoredMini(uid, rMini);
    }, [uid, rMini]);

    const acknowledge = () => {
        if (dontShowAgain) {
            unseenKeys.forEach(k => sessionStorage.setItem(seenKey(uid, k), '1'));
        }
        setUnseenKeys([]);
    };

    const liftedPopup = liftedNotices.length > 0 && createPortal(
        <div className="fixed inset-0 z-[201] flex items-start justify-center pt-24 px-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md bg-[#0a0a0a] border border-green-500/40 rounded-[2rem] shadow-[0_0_40px_rgba(34,197,94,0.15)] overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-green-500/20 bg-green-950/20">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <div className="flex-1">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Restriction Lifted</h2>
                        <p className="text-[10px] text-green-400 font-mono mt-0.5 uppercase tracking-widest">Access has been restored</p>
                    </div>
                    <button onClick={() => setLiftedNotices([])} className="p-1.5 text-gray-600 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-2">
                    {liftedNotices.map(label => (
                        <div key={label} className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                            <p className="text-[11px] font-black text-white uppercase tracking-widest">{label} — Expired / Revoked</p>
                        </div>
                    ))}
                </div>
                <div className="px-6 pb-6 text-center">
                    <button onClick={() => setLiftedNotices([])} className="w-full py-4 bg-green-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-400 transition-all font-mono">
                        Acknowledge_Update
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );

    const supportModal = supportOpen && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl h-[80vh] glass-panel rounded-[2rem] border border-red-500/20 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Appeal_Terminal</h2>
                    <button onClick={() => setSupportOpen(false)} className="p-2 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 min-h-0 p-6 overflow-hidden"><SupportChat currentUser={currentUser} isOpen={supportOpen} /></div>
            </div>
        </div>,
        document.body
    );

    if (!uid) return null;

    // Filter unseenKeys to ensure we only show the red popup for currently ACTIVE restrictions
    const activeUnseen = unseenKeys.filter(k => active.some(([aK]) => aK === k));

    // Show Overlay if there are active restrictions that haven't been acknowledged
    if (activeUnseen.length > 0) {
        return createPortal(
            <>
                <div className="fixed inset-0 z-[200] backdrop-blur-md bg-black/60 pointer-events-none" />
                <div className="fixed inset-0 z-[203] flex items-start justify-center pt-24 px-4 pointer-events-none">
                    <div className="pointer-events-auto w-full max-w-lg bg-[#0a0a0a] border border-red-500/40 rounded-[2rem] shadow-[0_0_60px_rgba(239,68,68,0.2)] overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-5 border-b border-red-500/20 bg-red-950/30">
                            <ShieldOff className="w-5 h-5 text-red-500 shrink-0" />
                            <div className="flex-1">
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">Account Restrictions Applied</h2>
                                <p className="text-[10px] text-red-400 font-mono mt-0.5 uppercase tracking-widest">System access has been partially limited</p>
                            </div>
                            <button onClick={acknowledge} className="p-1.5 text-gray-600 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6 space-y-3">
                            {active.filter(([key]) => activeUnseen.includes(key)).map(([key, meta]) => {
                                const Icon = meta.icon;
                                const t = formatExpiry(r[meta.expiryKey]);
                                return (
                                    <div key={key} className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                                        <Icon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-black text-white uppercase tracking-widest">{meta.label}</p>
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{meta.detail}</p>
                                            {t ? <p className="text-[9px] text-red-400 font-mono mt-1">⏱ {t}</p>
                                                : <p className="text-[9px] text-red-500/60 font-mono mt-1">⏱ Permanent</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="px-6 pb-6 space-y-4">
                            <label className="flex items-center gap-2 cursor-pointer group w-fit">
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${dontShowAgain ? 'bg-red-500 border-red-500 text-white' : 'border-gray-600 group-hover:border-gray-400'}`}>
                                    {dontShowAgain && <CheckSquare className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono group-hover:text-gray-300 transition-colors uppercase tracking-widest mt-0.5">Do not show this warning again</span>
                                <input type="checkbox" className="hidden" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
                            </label>

                            <div className="flex gap-3">
                                <button onClick={() => setSupportOpen(true)} className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <MessageSquare className="w-3.5 h-3.5" /> Support
                                </button>
                                <button onClick={acknowledge} className="flex-1 py-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all font-mono">
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {supportModal}
                {liftedPopup}
            </>,
            document.body
        );
    }

    // Default Banner
    if (active.length === 0 || bannerHidden) return liftedPopup || null;
    return createPortal(
        <>
            <div className="fixed top-0 left-0 right-0 z-50 bg-red-950/90 border-b border-red-500/30 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="flex-1 text-[11px] font-mono text-red-300 uppercase tracking-wide">
                    <span className="font-black text-red-400">Restrictions: </span>
                    {active.map(([, m]) => m.label).join(' · ')}
                </p>
                <button onClick={() => setSupportOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-[9px] font-black text-white uppercase tracking-widest hover:bg-white/20 transition-all shrink-0">
                    <MessageSquare className="w-3 h-3" /> Appeal
                </button>
                <button onClick={() => setBannerHidden(true)} className="p-1.5 text-red-500 hover:text-white shrink-0"><X className="w-4 h-4" /></button>
            </div>
            {supportModal}
            {liftedPopup}
        </>,
        document.body
    );
}
