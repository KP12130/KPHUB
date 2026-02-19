import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle, Shield, AlertTriangle, Zap, Search,
    ChevronDown, ChevronUp, MessageSquare, Send,
    Activity, Globe, Cpu, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';


const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-900 bg-terminal/50 rounded-2xl overflow-hidden mb-4 transition-all hover:border-neon-blue/30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex justify-between items-center text-left"
            >
                <span className="text-sm font-black text-white italic uppercase tracking-tighter">{question}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-neon-blue" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 text-xs text-gray-500 font-mono leading-relaxed"
                    >
                        {answer}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Support = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [reportType, setReportType] = useState('BUG');
    const [formData, setFormData] = useState({ subject: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const faqs = [
        { q: "HOW_TO_UPGRADE_TIER?", a: "Access your Studio interface and navigate to the Monetization tab. Choose between PRO or ELITE protocols to unlock advanced grid features." },
        { q: "WHAT_IS_REPUTATION?", a: "Reputation measures your impact on the grid. Earn points via transmissions (uploads), pulses (likes), and community interactions." },
        { q: "PRIVATE_SYSTEM_SECURITY?", a: "Private systems are encrypted at the node level. Only the architect has authorized access unless explicit clearance is granted." },
        { q: "WITHDRAWAL_PROTOCOL?", a: "Creators can withdraw credits once their balance exceeds 10.00 CODE_CREDITS. Processing takes approximately 24-48 grid cycles." }
    ];

    const { currentUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`${API_BASE}/api/support`, {
                type: reportType,
                subject: formData.subject,
                description: formData.description,
                userEmail: currentUser?.email
            });
            toast.success("GLITCH_REPORT_INJECTED: System administrators notified.");
            setFormData({ subject: '', description: '' });
        } catch (err) {
            console.error('Support submission error:', err);
            toast.error("SYNC_ERROR: Failed to transmit glitch report.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusModules = [
        { name: 'MAINFRAME', status: 'Operational', color: 'text-neon-green' },
        { name: 'INDEX_GRID', status: 'Operational', color: 'text-neon-green' },
        { name: 'AI_ASSISTANT', status: 'Degraded', color: 'text-yellow-500' },
        { name: 'PAYMENT_NODE', status: 'Operational', color: 'text-neon-green' }
    ];

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 max-w-6xl mx-auto">
            {/* Header */}
            <header className="text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-[10px] font-black rounded-full uppercase tracking-widest mb-6"
                >
                    <Shield className="w-3 h-3" /> Assistance_Sovereignty
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-4">
                    Assistance <span className="text-neon-blue">Hub_</span>
                </h1>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Knowledge Synchronization and Glitch Mitigation Protocol.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left: Status & Knowledge */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Status Dashboard */}
                    <section className="bg-terminal border border-gray-900 rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Activity className="w-32 h-32 text-white" />
                        </div>
                        <h2 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-neon-green" /> Grid_Status_Telemetry
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {statusModules.map(m => (
                                <div key={m.name} className="space-y-1">
                                    <p className="text-[10px] text-gray-500 font-mono">{m.name}</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full bg-current ${m.color} animate-pulse`} />
                                        <span className={`text-[10px] font-black uppercase ${m.color}`}>{m.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-neon-blue" /> Knowledge_Vault
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Search_Protocols..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-void border border-gray-900 rounded-lg pl-9 pr-4 py-2 text-[10px] text-white focus:border-neon-blue outline-none font-mono"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <FAQItem key={i} question={faq.q} answer={faq.a} />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right: Glitch Reporting */}
                <div className="lg:col-span-1">
                    <section className="bg-terminal border border-gray-900 p-8 rounded-3xl sticky top-32">
                        <h2 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" /> Glitch_Report_Protocol
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex gap-2 p-1 bg-void border border-gray-800 rounded-xl">
                                {['BUG', 'REQUEST', 'ACCESS'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setReportType(t)}
                                        className={`flex-grow py-2 text-[8px] font-black rounded-lg transition-all ${reportType === t ? 'bg-gray-800 text-white shadow-xl' : 'text-gray-600'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Subject</label>
                                <input
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-blue outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-neon-blue outline-none font-mono resize-none"
                                />
                            </div>
                            <button
                                disabled={isSubmitting}
                                className="w-full py-4 bg-neon-blue text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,212,255,0.2)] flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Zap className="w-4 h-4 animate-spin" />
                                ) : (
                                    <><Send className="w-4 h-4" /> Inject_Report</>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-gray-900">
                            <div className="flex items-center gap-4 text-xs text-gray-500 hover:text-white transition-colors cursor-pointer group">
                                <MessageSquare className="w-4 h-4 group-hover:text-neon-green" />
                                <span className="font-black uppercase tracking-widest text-[9px]">Direct_Admin_Comms</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Support;
