import React, { useState } from 'react';
import { X, Heart, Zap, CreditCard } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api';

const DonationModal = ({ targetUser, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const [amount, setAmount] = useState(10);
    const [loading, setLoading] = useState(false);

    const handleDonate = async () => {
        if (!currentUser) {
            toast.error("Login required to initiate transfer.");
            return;
        }

        if ((currentUser.stats?.kpcBalance || 0) < amount) {
            toast.error("Insufficient KPC for transfer.");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/donate/${targetUser.uid}`, {
                donorId: currentUser.uid,
                amount
            });

            if (res.data.success) {
                toast.success(`TRANSFER COMPLETE: ${amount.toLocaleString()} KPC sent.`);
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#39FF14', '#ffffff', '#00d4ff']
                });
                onSuccess && onSuccess();
                onClose();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Transfer Failed: Insufficient funds or network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-terminal border border-neon-green/30 rounded-2xl p-8 max-w-sm w-full relative shadow-[0_0_50px_rgba(57,255,20,0.15)]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon-green/30 shadow-[0_0_20px_rgba(57,255,20,0.1)]">
                        <Zap className="w-8 h-8 text-neon-green fill-current" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">KPC_TRANSFER</h2>
                    <p className="text-gray-400 text-[10px] font-mono mt-2 leading-relaxed">
                        Transmitting credits to <span className="text-neon-green">@{targetUser.username}</span>.
                    </p>
                    <div className="mt-3 inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">Balance:</span>
                        <span className="text-[10px] font-black text-white">{currentUser?.stats?.kpcBalance?.toLocaleString() || 0} KPC</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    {[500, 1000, 5000, 10000].map((val) => (
                        <button
                            key={val}
                            onClick={() => setAmount(val)}
                            className={`py-3 px-4 rounded-xl font-bold font-mono text-sm transition-all border ${amount === val
                                ? 'bg-neon-green text-black border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.4)]'
                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-1">
                                <Zap className="w-3 h-3" /> {val}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleDonate}
                        disabled={loading}
                        className="w-full py-3 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'PROCESSING...' : 'INITIATE_TRANSFER'}
                    </button>
                    <p className="text-[9px] text-center text-gray-600 font-mono">
                        *Transaction is instant and irreversible. Platform fee: 0%.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DonationModal;
