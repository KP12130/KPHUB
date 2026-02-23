import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Zap, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, Box, Layers, Cpu, Globe } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import PaymentModal from './PaymentModal';

const ForgeStore = ({ isEmbedded = false }) => {
    const { currentUser, updateUser } = useAuth();
    const [bundles, setBundles] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    useEffect(() => {
        const fetchBundles = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/exchange/bundles`);
                setBundles(res.data);
            } catch (err) {
                console.error("Failed to load bundles", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBundles();
    }, []);

    const handleInitialSelect = (bundleId) => {
        setSelectedBundle(bundleId);
        setIsPaymentOpen(true);
    };

    const handleConfirmPurchase = async () => {
        if (!currentUser) return;

        try {
            const res = await axios.post(`${API_BASE}/api/exchange/buy-kpc`, {
                uid: currentUser.uid,
                bundleId: selectedBundle
            });

            if (res.data.success) {
                toast.success(`Acquisition Successful! Credits channeled.`);
                updateUser({
                    stats: {
                        ...currentUser.stats,
                        kpcBalance: (currentUser.stats?.kpcBalance || 0) + bundles[selectedBundle].amount
                    }
                });
            }
        } catch (err) {
            toast.error("Packet transmission failed. Credit forge offline.");
        }
    };

    const getIcon = (id) => {
        const iconClass = "w-8 h-8";
        switch (id) {
            case 'STARTER': return <Box className={`${iconClass} text-neon-blue`} />;
            case 'PULSE': return <Layers className={`${iconClass} text-neon-green`} />;
            case 'MATRIX': return <Cpu className={`${iconClass} text-neon-purple`} />;
            case 'OVERLORD': return <Sparkles className={`${iconClass} text-yellow-500`} />;
            case 'NEXUS': return <Globe className={`${iconClass} text-white`} />;
            default: return <Zap className={`${iconClass} text-white`} />;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-green"></div>
        </div>
    );

    return (
        <div className={`w-full ${isEmbedded ? '' : 'pt-24 max-w-7xl mx-auto pb-20 px-4'}`}>
            {!isEmbedded && (
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                        Pulse_<span className="text-neon-green">Forge</span>
                    </h1>
                    <p className="text-gray-500 font-mono text-sm max-w-2xl mx-auto">
                        Aquire high-density <span className="text-neon-green">KPC Credits</span> to accelerate your grid influence.
                    </p>
                </div>
            )}

            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isEmbedded ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-5'} gap-4`}>
                {Object.entries(bundles).map(([id, data]) => (
                    <div
                        key={id}
                        className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-neon-green/30 transition-all flex flex-col group bg-black/40 backdrop-blur-md"
                    >
                        <div className="mb-4 flex justify-center">
                            <div className="p-3 bg-white/5 rounded-xl group-hover:bg-neon-green/10 transition-colors duration-300">
                                {getIcon(id)}
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <h3 className="text-sm font-black text-white italic tracking-tighter uppercase mb-1">{data.label}</h3>
                            <p className="text-xl font-black text-neon-green">{data.amount.toLocaleString()} <span className="text-[10px] text-gray-500">KPC</span></p>
                            <p className="text-[10px] font-mono text-gray-600">${data.price}</p>
                        </div>

                        <button
                            onClick={() => handleInitialSelect(id)}
                            className="mt-auto w-full py-2 bg-white/5 hover:bg-neon-green hover:text-black border border-white/10 hover:border-neon-green rounded-lg font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all"
                        >
                            Acquire <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                plan={bundles[selectedBundle]?.label}
                price={bundles[selectedBundle]?.price}
                onConfirm={handleConfirmPurchase}
            />
        </div>
    );
};

export default ForgeStore;
