import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Bug, HelpCircle, FileText, Send, CheckCircle2,
    AlertTriangle, ChevronDown, Search, Terminal, Mail, Lock, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Support = () => {
    const { currentUser } = useAuth();
    const [phase, setPhase] = useState('FORM'); // FORM, VERIFY, SUCCESS
    const [reportType, setReportType] = useState('BUG');
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        userEmail: currentUser?.email || ''
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [activeTicketId, setActiveTicketId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentUser?.email && !formData.userEmail) {
            setFormData(prev => ({ ...prev, userEmail: currentUser.email }));
        }
    }, [currentUser]);

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.description || !formData.userEmail) {
            toast.error("All protocols fields required.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_BASE}/api/support/submit`, {
                type: reportType,
                ...formData
            });
            setActiveTicketId(res.data.ticketId);
            setPhase('VERIFY');
            toast.success("VERIFICATION_INITIALIZED: Check your email.");
        } catch (err) {
            toast.error(err.response?.data?.error || "Transmission failure.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (verificationCode.length !== 6) {
            toast.error("Protocol requires 6-digit signature.");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(`${API_BASE}/api/support/verify`, {
                ticketId: activeTicketId,
                code: verificationCode
            });
            setPhase('SUCCESS');
            toast.success("IDENTITY_CONFIRMED: Report indexed.");
        } catch (err) {
            toast.error(err.response?.data?.error || "Verification failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const faqs = [
        { q: "HOW TO UPGRADE TIER?", a: "Navigate to Studio > Monetization and select an expansion protocol." },
        { q: "WHAT IS REPUTATION?", a: "REP measures your grid influence. Earn it by deploying systems and completing quests." },
        { q: "PRIVATE_SYSTEM_SECURITY?", a: "All transmissions are encrypted. We prioritize node integrity over data harvesting." }
    ];

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-20 text-center">
                <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase mb-4">
                    Assistance <span className="text-neon-blue">Hub_</span>
                </h1>
                <p className="text-gray-500 font-mono text-xs tracking-[0.3em] uppercase">Knowledge synchronization and glitch mitigation protocol.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left: FAQ & Status */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Grid Status */}
                    <div className="glass-panel p-8 rounded-[2.5rem] bg-terminal border border-gray-900 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Activity className="w-32 h-32" />
                        </div>
                        <h3 className="text-[10px] font-black text-neon-green uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Grid_Status_Telemetry
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { label: 'Mainframe', status: 'OPERATIONAL', color: 'bg-neon-green' },
                                { label: 'Index_Grid', status: 'OPERATIONAL', color: 'bg-neon-green' },
                                { label: 'AI_Assistant', status: 'DEGRADED', color: 'bg-yellow-500' },
                                { label: 'Payment_Node', status: 'OPERATIONAL', color: 'bg-neon-green' }
                            ].map(sys => (
                                <div key={sys.label} className="space-y-1">
                                    <p className="text-[8px] text-gray-600 font-mono uppercase">{sys.label}</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${sys.color} animate-pulse`} />
                                        <span className="text-[9px] text-white font-black">{sys.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-neon-blue uppercase tracking-[0.3em] flex items-center gap-2">
                            <Search className="w-4 h-4" /> Knowledge_Vault
                        </h3>
                        <div className="space-y-3">
                            {faqs.map((faq, i) => (
                                <details key={i} className="group glass-panel rounded-2xl border border-gray-900 bg-terminal/50 overflow-hidden transition-all">
                                    <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                                        <span className="text-xs font-black text-white italic uppercase tracking-widest">{faq.q}</span>
                                        <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition-transform" />
                                    </summary>
                                    <div className="p-6 pt-0 text-[11px] text-gray-400 font-mono leading-relaxed uppercase border-t border-white/5 bg-black/20">
                                        {faq.a}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Glitch Report Protocol */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-8 rounded-[2.5rem] bg-terminal border border-gray-900 sticky top-24">
                        <AnimatePresence mode="wait">
                            {phase === 'FORM' && (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Glitch_Report_Protocol
                                    </h3>

                                    {/* Type Toggle */}
                                    <div className="flex p-1 bg-void rounded-xl border border-gray-900">
                                        {['BUG', 'REQUEST', 'ACCESS'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setReportType(t)}
                                                className={`flex-grow py-2 text-[8px] font-black rounded-lg transition-all ${reportType === t ? 'bg-gray-800 text-white shadow-xl' : 'text-gray-600 hover:text-gray-400'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>

                                    <form onSubmit={handleInitialSubmit} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-bold text-gray-600 uppercase ml-1">Identity_Email</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 group-focus-within:text-neon-blue" />
                                                <input
                                                    type="email"
                                                    value={formData.userEmail}
                                                    onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                                                    placeholder="architecht@grid.node"
                                                    className="w-full bg-void border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-[10px] text-white font-mono placeholder:text-gray-800 outline-none focus:border-neon-blue transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-bold text-gray-600 uppercase ml-1">Transmission_Subject</label>
                                            <input
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                placeholder="Brief summary of extraction error..."
                                                className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-[10px] text-white font-mono placeholder:text-gray-800 outline-none focus:border-neon-blue transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[8px] font-bold text-gray-600 uppercase ml-1">Data_Payload</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={5}
                                                placeholder="Provide detailed glitch telemetry..."
                                                className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-[10px] text-white font-mono placeholder:text-gray-800 outline-none focus:border-neon-blue transition-colors resize-none"
                                            />
                                        </div>

                                        <button
                                            disabled={isSubmitting}
                                            className="w-full h-14 bg-neon-blue text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-white hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'INITIALIZING...' : <><Send className="w-3 h-3" /> Initialize_Protocol</>}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {phase === 'VERIFY' && (
                                <motion.div
                                    key="verify"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <button onClick={() => setPhase('FORM')} className="text-[8px] font-black text-gray-500 uppercase flex items-center gap-1 hover:text-white transition-colors">
                                        <ArrowLeft className="w-3 h-3" /> Back_To_Payload
                                    </button>

                                    <div className="text-center space-y-4 pt-4">
                                        <div className="w-16 h-16 bg-neon-blue/10 border border-neon-blue/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                            <Lock className="w-6 h-6 text-neon-blue animate-pulse" />
                                        </div>
                                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Identity_Required</h3>
                                        <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                                            A 6-digit confirmation key has been transmitted to <span className="text-white font-bold">{formData.userEmail}</span>.
                                        </p>
                                    </div>

                                    <form onSubmit={handleVerify} className="space-y-6">
                                        <input
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            className="w-full bg-void border border-gray-800 rounded-xl px-4 py-6 text-2xl text-center text-neon-blue font-black tracking-[0.5em] outline-none focus:border-neon-blue focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all"
                                        />

                                        <button
                                            disabled={isSubmitting}
                                            className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-neon-blue transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'VERIFYING...' : 'Confirm_Identity'}
                                        </button>

                                        <p className="text-center text-[8px] text-gray-700 font-mono uppercase">
                                            Expired? <button type="button" onClick={handleInitialSubmit} className="text-neon-blue hover:underline">Re-send_Protocol</button>
                                        </p>
                                    </form>
                                </motion.div>
                            )}

                            {phase === 'SUCCESS' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-12 text-center space-y-6"
                                >
                                    <div className="w-20 h-20 bg-neon-green/10 border border-neon-green/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(57,255,20,0.1)]">
                                        <CheckCircle2 className="w-10 h-10 text-neon-green" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Transmission_Complete</h3>
                                    <p className="text-[10px] text-gray-500 font-mono leading-relaxed px-4">
                                        Your glitch report has been successfully indexed. An administrator will review your payload in the next grid cycle.
                                    </p>
                                    <div className="pt-8">
                                        <button
                                            onClick={() => {
                                                setPhase('FORM');
                                                setFormData({ subject: '', description: '', userEmail: currentUser?.email || '' });
                                                setVerificationCode('');
                                            }}
                                            className="px-8 py-3 border border-gray-800 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white hover:border-gray-600 transition-all"
                                        >
                                            Return_To_Mainframe
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Support;

