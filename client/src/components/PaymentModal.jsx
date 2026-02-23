import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle2, Lock, X, Loader } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, plan, price, onConfirm, isSubscription = false }) => {
    const [status, setStatus] = useState('IDLE'); // IDLE, PROCESSING, SUCCESS

    const handlePayment = () => {
        setStatus('PROCESSING');
        setTimeout(() => {
            setStatus('SUCCESS');
            setTimeout(() => {
                onConfirm(); // Trigger actual upgrade
                onClose();
                setStatus('IDLE');
            }, 1500);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-terminal border border-neon-green/30 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(57,255,20,0.1)]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                        <div className="flex items-center gap-2">
                            <CreditCard className="text-neon-green w-5 h-5" />
                            <h3 className="text-white font-black uppercase tracking-widest text-sm">Secure_Gateway</h3>
                        </div>
                        <button onClick={onClose}><X className="text-gray-500 hover:text-white w-5 h-5" /></button>
                    </div>

                    {/* Body */}
                    <div className="p-8">
                        {status === 'IDLE' && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <p className="text-gray-400 text-xs font-mono uppercase">Initializing Upgrade To</p>
                                    <h2 className="text-3xl font-black text-white mt-1">{plan}</h2>
                                    <p className="text-neon-green font-mono text-xl mt-2">${price || '0.00'} {isSubscription && <span className="text-xs text-gray-500">/ cycle</span>}</p>
                                </div>

                                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Card Number</label>
                                        <div className="relative">
                                            <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-void border border-gray-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-neon-green outline-none" required />
                                            <Lock className="w-4 h-4 text-gray-600 absolute right-3 top-3" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Expiry</label>
                                            <input type="text" placeholder="MM/YY" className="w-full bg-void border border-gray-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-neon-green outline-none" required />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">CVC</label>
                                            <input type="text" placeholder="123" className="w-full bg-void border border-gray-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-neon-green outline-none" required />
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full py-4 bg-neon-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-all mt-6 shadow-[0_0_20px_rgba(57,255,20,0.3)]">
                                        Confirm_Transaction
                                    </button>
                                </form>
                            </div>
                        )}

                        {status === 'PROCESSING' && (
                            <div className="py-12 text-center space-y-6">
                                <div className="relative w-16 h-16 mx-auto">
                                    <div className="absolute inset-0 border-4 border-gray-800 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-neon-green rounded-full border-t-transparent animate-spin" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black uppercase tracking-widest animate-pulse">Processing_Packet...</h3>
                                    <p className="text-gray-500 text-xs font-mono mt-2">Do not close the terminal.</p>
                                </div>
                            </div>
                        )}

                        {status === 'SUCCESS' && (
                            <div className="py-12 text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-neon-green rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_#39FF14]"
                                >
                                    <CheckCircle2 className="w-10 h-10 text-black" />
                                </motion.div>
                                <div>
                                    <h3 className="text-white font-black uppercase tracking-widest text-lg">Access_Granted</h3>
                                    <p className="text-gray-400 text-xs font-mono mt-2">Welcome to {plan} tier.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PaymentModal;
