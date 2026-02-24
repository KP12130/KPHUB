import React, { useState } from 'react';
import { Heart, Loader2, PlaySquare } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const SupportButton = ({ receiverUid, projectTitle, projectId, className = "" }) => {
    const { currentUser } = useAuth();
    const [isSupporting, setIsSupporting] = useState(false);

    const handleSupport = async () => {
        if (!currentUser) return toast.error("ACCESS_DENIED: Please login to support creators.");
        if (currentUser.uid === receiverUid) return toast.error("ERROR: Cannot support yourself.");

        setIsSupporting(true);
        toast.success("Initializing AD_PROTOCOL... Please wait.");

        // Simulate watching an ad (3 seconds delay)
        setTimeout(async () => {
            try {
                const res = await axios.post(`${API_BASE}/api/exchange/support-ad`, {
                    viewerUid: currentUser.uid,
                    receiverUid,
                    projectId,
                    projectTitle
                });

                if (res.data.success) {
                    toast.success(`TRANSMITTED: 10 KPC sent to creator via system ad! 💸`);
                }
            } catch (err) {
                toast.error(err.response?.data?.error || "Transmission failure.");
            } finally {
                setIsSupporting(false);
            }
        }, 3000);
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={handleSupport}
                disabled={isSupporting}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-pink-500 hover:text-white transition-all group disabled:opacity-50"
            >
                {isSupporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <PlaySquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
                {isSupporting ? 'Streaming_Ad...' : 'Watch_Ad_to_Support'}
            </button>
        </div>
    );
};

export default SupportButton;
