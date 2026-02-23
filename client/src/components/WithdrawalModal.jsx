import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight, ShoppingBag, Gamepad2, Dice6, Play, Mail, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const WithdrawalModal = ({ isOpen, onClose, isEmbedded = false }) => {
    const { currentUser, updateUser } = useAuth();
    const [giftCards, setGiftCards] = useState({});
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen || isEmbedded) {
            fetchGiftCards();
            if (currentUser?.email) setEmail(currentUser.email);
        }
    }, [isOpen, isEmbedded]);

    const fetchGiftCards = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/exchange/gift-cards`);
            setGiftCards(res.data);
        } catch (err) {
            toast.error("Failed to load rewards store.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = async (e) => {
        e.preventDefault();
        const card = giftCards[selectedCardId];

        if (!card) return toast.error("Please select a reward.");
        if (!email.includes('@')) return toast.error("Valid email required for digital delivery.");

        if ((currentUser.stats?.kpcBalance || 0) < card.cost) {
            return toast.error("Insufficient KPC for this reward.");
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/withdraw`, {
                uid: currentUser.uid,
                amount: card.cost,
                cardId: card.id,
                email: email,
                details: `Redeem ${card.label} to ${email}`
            });

            if (res.data.success) {
                toast.success("REDEMPTION_AUTHORIZED: Code will be sent via email.");
                updateUser({
                    stats: {
                        ...currentUser.stats,
                        kpcBalance: (currentUser.stats.kpcBalance || 0) - card.cost
                    }
                });
                if (!isEmbedded) onClose();
                setSelectedCardId(null);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Redemption failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const iconMap = {
        ShoppingBag,
        Gamepad2,
        Dice6,
        Play
    };

    const content = (
        <div className={`w-full ${isEmbedded ? '' : 'max-w-2xl glass-panel p-8 rounded-[2.5rem] border border-white/5 relative z-10 flex flex-col'}`}>
            {!isEmbedded && (
                <>
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon-purple/10 blur-[100px]" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neon-blue/10 blur-[100px]" />
                </>
            )}

            <div className="flex justify-between items-start mb-6 shrink-0">
                <div className="space-y-1">
                    <h3 className={`${isEmbedded ? 'text-xl' : 'text-3xl'} font-black text-white italic tracking-tighter uppercase`}>Reward_Vault</h3>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Exchange earned KPC for digital assets</p>
                </div>
                {!isEmbedded && (
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="mb-6 bg-void/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase">Total_Credits_Available</p>
                        <p className={`${isEmbedded ? 'text-lg' : 'text-xl'} font-black text-white`}>{(currentUser.stats?.kpcBalance || 0).toLocaleString()} <span className="text-xs text-gray-400">KPC</span></p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-mono text-gray-600 uppercase">Offboarding Status</p>
                    <p className="text-[10px] font-black text-neon-green uppercase tracking-tighter flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-3 h-3" /> Secure_Link_Active
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex-grow flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
                </div>
            ) : (
                <div className={`flex-grow ${isEmbedded ? '' : 'overflow-y-auto custom-scrollbar pr-2 mb-6'}`}>
                    <div className={`grid grid-cols-1 ${isEmbedded ? 'md:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                        {Object.values(giftCards).map((card) => {
                            const Icon = iconMap[card.icon] || ShoppingBag;
                            const isAffordable = (currentUser.stats?.kpcBalance || 0) >= card.cost;
                            const isSelected = selectedCardId === card.id;

                            return (
                                <button
                                    key={card.id}
                                    onClick={() => setSelectedCardId(card.id)}
                                    disabled={!isAffordable}
                                    className={`relative p-5 rounded-3xl border transition-all text-left flex flex-col gap-4 group ${isSelected
                                        ? 'bg-neon-blue/20 border-neon-blue shadow-[0_0_20px_rgba(0,212,255,0.15)]'
                                        : !isAffordable
                                            ? 'bg-void/40 border-white/5 opacity-50 grayscale cursor-not-allowed'
                                            : 'bg-void/60 border-white/10 hover:border-neon-blue/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className={`p-3 rounded-2xl bg-white/5 group-hover:bg-neon-blue/10 transition-colors ${isSelected ? 'bg-neon-blue/10 text-neon-blue' : 'text-gray-400'}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-neon-blue" />}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black uppercase text-sm">{card.label}</h4>
                                        <p className="text-[10px] text-gray-500 font-mono mt-1">{card.company}</p>
                                    </div>
                                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-xs font-black text-neon-blue">{card.cost.toLocaleString()} KPC</span>
                                        {!isAffordable && <span className="text-[8px] font-bold text-red-500/50 uppercase">Insufficient</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <form onSubmit={handleRedeem} className="mt-8 pt-6 border-t border-white/5 space-y-4 shrink-0">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Delivery_Channel</label>
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter recipient email..."
                            className="w-full bg-void border border-white/5 focus:border-neon-blue/50 rounded-2xl px-5 py-4 text-sm font-mono text-white placeholder:text-gray-800 outline-none transition-all"
                            required
                        />
                        <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    </div>
                </div>

                <div className="flex items-center gap-3 text-yellow-500/60 p-3 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 mb-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-[9px] leading-tight font-medium uppercase tracking-tight">Gift card codes are delivered digitally to the email provided within 12-24 neural cycles.</p>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !selectedCardId}
                    className="w-full py-5 bg-neon-blue text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,212,255,0.2)] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                >
                    {isSubmitting ? (
                        <>ENCRYPTING_CODE...</>
                    ) : (
                        <>Redeem_Reward <ArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </form>
        </div>
    );

    if (isEmbedded) return content;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-void/90 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-2xl glass-panel p-8 rounded-[2.5rem] border border-white/5 relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {content}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WithdrawalModal;
