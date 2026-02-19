import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Zap, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, Box, Layers, Cpu } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import PaymentModal from '../components/PaymentModal';

const PulseForge = () => {
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
                // Update local balance
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

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
        </div>
    );

    const getIcon = (id) => {
        switch (id) {
            case 'STARTER': return <Box className="w-10 h-10 text-neon-blue" />;
            case 'PULSE': return <Layers className="w-10 h-10 text-neon-green" />;
            case 'MATRIX': return <Cpu className="w-10 h-10 text-neon-purple" />;
            case 'OVERLORD': return <Sparkles className="w-10 h-10 text-yellow-500" />;
            default: return <Zap className="w-10 h-10 text-white" />;
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto pb-20">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                    Pulse_<span className="text-neon-green">Forge</span>
                </h1>
                <p className="text-gray-500 font-mono text-sm max-w-2xl mx-auto">
                    Aquire high-density <span className="text-neon-green">KPC Credits</span> to accelerate your grid influence and unlock elite protocols.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(bundles).map(([id, data]) => (
                    <motion.div
                        key={id}
                        whileHover={{ y: -5 }}
                        className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-neon-green/30 transition-all flex flex-col group bg-black/40 backdrop-blur-xl"
                    >
                        <div className="mb-6 flex justify-center">
                            <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                                {getIcon(id)}
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-1">{data.label}</h3>
                            <p className="text-3xl font-black text-neon-green mb-2">{data.amount.toLocaleString()} <span className="text-xs text-gray-400">KPC</span></p>
                            <p className="text-sm font-mono text-gray-500">${data.price}</p>
                        </div>

                        <button
                            onClick={() => handleInitialSelect(id)}
                            className="mt-auto w-full py-4 bg-white/5 hover:bg-neon-green hover:text-black border border-white/10 hover:border-neon-green rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-neon-green/20"
                        >
                            Acquire_Bundle <ArrowRight className="w-3 h-3" />
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className="mt-16 flex flex-col md:flex-row gap-8 items-center justify-center p-8 glass-panel border border-white/5 rounded-3xl">
                <div className="flex -space-x-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-2 border-black bg-gray-900 flex items-center justify-center shadow-xl">
                            <ShieldCheck className="w-6 h-6 text-neon-green" />
                        </div>
                    ))}
                </div>
                <div className="text-center md:text-left">
                    <h4 className="text-white font-black uppercase tracking-widest text-sm">Encrypted Terminal Processing</h4>
                    <p className="text-xs font-mono text-gray-500">All transactions are processed through secure matrix nodes. Instant fulfillment guaranteed.</p>
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                plan={bundles[selectedBundle]?.label}
                onConfirm={handleConfirmPurchase}
            />
        </div>
    );
};

export default PulseForge;
