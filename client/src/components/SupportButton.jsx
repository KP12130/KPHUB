import React, { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const SupportButton = ({ receiverUid, projectTitle, projectId, className = "" }) => {
    const { currentUser, updateUser } = useAuth();
    const [isSupporting, setIsSupporting] = useState(false);
    const [showAmountSelect, setShowAmountSelect] = useState(false);

    const amounts = [500, 1000, 5000, 10000];

    const handleSupport = async (amount) => {
        if (!currentUser) return toast.error("ACCESS_DENIED: Please login to support creators.");
        if (currentUser.uid === receiverUid) return toast.error("ERROR: Cannot support yourself.");
        if ((currentUser.stats?.kpcBalance || 0) < amount) {
            return toast.error("LOW_CREDITS: Acquire more KPC at the Forge.");
        }

        setIsSupporting(true);
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/support-creator`, {
                senderUid: currentUser.uid,
                receiverUid,
                amount,
                projectId,
                projectTitle
            });

            if (res.data.success) {
                toast.success(`TRANSMITTED: ${amount} KPC sent to creator.`);
                updateUser({
                    stats: {
                        ...(currentUser?.stats || {}),
                        kpcBalance: (currentUser?.stats?.kpcBalance || 0) - amount
                    }
                });
                setShowAmountSelect(false);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Transmission failure.");
        } finally {
            setIsSupporting(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setShowAmountSelect(!showAmountSelect)}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-pink-500 hover:text-white transition-all group"
            >
                <Heart className={`w-3 h-3 ${isSupporting ? 'animate-pulse' : 'group-hover:scale-110'} transition-transform`} />
                Support_Creator
            </button>

            <AnimatePresence>
                {showAmountSelect && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100]"
                            onClick={() => setShowAmountSelect(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-full mb-3 left-0 z-[101] glass-panel p-4 rounded-2xl border border-white/5 shadow-2xl min-w-[200px]"
                        >
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3">Select_Support_Packet</p>
                            <div className="grid grid-cols-2 gap-2">
                                {amounts.map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => handleSupport(amt)}
                                        disabled={isSupporting}
                                        className="py-2 bg-white/5 hover:bg-neon-green hover:text-black rounded-lg text-[10px] font-black transition-all border border-white/5 disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                        {isSupporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <>{amt.toLocaleString()} KPC</>}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/5">
                                <p className="text-[7px] font-mono text-gray-600 uppercase text-center">Protocol: 15% Platform Commission Applied</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupportButton;
