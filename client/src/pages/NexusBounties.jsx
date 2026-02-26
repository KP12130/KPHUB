import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Terminal, Plus, Search, Filter, MessageSquare,
    Send, CheckCircle2, X, ChevronRight, User, Globe, AlertCircle, Loader2,
    ShieldAlert, Clock, RotateCcw, Scale
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CATEGORIES = ['All', 'Code', 'Debugging', 'UI/UX', 'Logic', 'Security'];

const NexusBounties = () => {
    const { currentUser } = useAuth();
    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedBounty, setSelectedBounty] = useState(null);
    const [submissionInput, setSubmissionInput] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Create Bounty Form State
    const [newBounty, setNewBounty] = useState({
        title: '',
        description: '',
        rewardKpc: 500,
        category: 'Code'
    });

    useEffect(() => {
        fetchBounties();
    }, []);

    const fetchBounties = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/bounties`);
            setBounties(res.data);
        } catch (err) {
            toast.error("Failed to sync with Bounty Grid.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBounty = async (e) => {
        e.preventDefault();
        if (!currentUser) return toast.error("ACCESS_DENIED: Citizen authentication required.");

        try {
            const res = await axios.post(`${API_BASE}/api/bounties`, {
                ...newBounty,
                authorUid: currentUser.uid,
                authorName: currentUser.username || currentUser.displayName,
                authorAvatar: currentUser.photoURL || currentUser.avatar,
                authorReputation: currentUser.stats?.reputation || 0
            });
            toast.success("BOUNTY_POSTED: Escrow protocol engaged.");
            setIsCreateModalOpen(false);
            fetchBounties();
            // Update local balance if possible (handled by context usually)
        } catch (err) {
            toast.error(err.response?.data?.error || "Creation failed.");
        }
    };

    const handleSubmitSolution = async () => {
        if (!submissionInput) return toast.error("Solution packet empty.");
        setSubmitting(true);
        try {
            await axios.post(`${API_BASE}/api/bounties/${selectedBounty.id}/submit`, {
                uid: currentUser.uid,
                username: currentUser.username || currentUser.displayName,
                avatar: currentUser.photoURL || currentUser.avatar,
                reputation: currentUser.stats?.reputation || 0,
                content: submissionInput
            });
            toast.success("SUBMISSION_TRANSMITTED: Awaiting architect review.");
            setSubmissionInput('');
            // Refresh selected bounty to show new submission
            const res = await axios.get(`${API_BASE}/api/bounties/${selectedBounty.id}`);
            setSelectedBounty(res.data);
        } catch (err) {
            toast.error("Transmission failure.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAwardBounty = async (submissionId) => {
        if (!window.confirm("Confirm award? This will release the escrowed KPC to the developer.")) return;

        try {
            await axios.post(`${API_BASE}/api/bounties/${selectedBounty.id}/award`, {
                authorUid: currentUser.uid,
                submissionId
            });
            toast.success("REWARD_DISPENSED: Mission completed.");
            setSelectedBounty(null);
            fetchBounties();
        } catch (err) {
            toast.error(err.response?.data?.error || "Award failed.");
        }
    };

    const handleCancelBounty = async () => {
        if (!window.confirm("Are you sure you want to recall this bounty? Credits will be refunded to your account.")) return;

        try {
            await axios.post(`${API_BASE}/api/bounties/${selectedBounty.id}/cancel`, {
                uid: currentUser.uid
            });
            toast.success("BOUNTY_RECALLED: Credits refunded.");
            setSelectedBounty(null);
            fetchBounties();
        } catch (err) {
            toast.error(err.response?.data?.error || "Recall failed.");
        }
    };

    const handleDisputeBounty = async () => {
        const reason = window.prompt("Enter reason for dispute (required):");
        if (!reason) return;

        try {
            await axios.post(`${API_BASE}/api/bounties/${selectedBounty.id}/dispute`, {
                uid: currentUser.uid,
                reason
            });
            toast.success("DISPUTE_INITIALIZED: Admin audit requested.");
            // Refresh details
            const res = await axios.get(`${API_BASE}/api/bounties/${selectedBounty.id}`);
            setSelectedBounty(res.data);
            fetchBounties();
        } catch (err) {
            toast.error("Failed to initiate dispute.");
        }
    };

    const handleRejectSubmission = async (submissionId) => {
        const reason = window.prompt("REJECTION_REASON (Aborting 48h auto-payout):");
        if (!reason) return;

        try {
            await axios.post(`${API_BASE}/api/bounties/${selectedBounty.id}/reject`, {
                uid: currentUser.uid,
                submissionId,
                reason
            });
            toast.success("SUBMISSION_REJECTED: Developer notified.");
            // Refresh details
            const res = await axios.get(`${API_BASE}/api/bounties/${selectedBounty.id}`);
            setSelectedBounty(res.data);
        } catch (err) {
            toast.error("Rejection failed.");
        }
    };

    const filteredBounties = (Array.isArray(bounties) ? bounties : []).filter(b =>
        activeCategory === 'All' || b.category === activeCategory
    );

    if (loading && bounties.length === 0) return (
        <div className="min-h-screen flex items-center justify-center bg-void">
            <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 max-w-7xl mx-auto font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                        <Terminal className="text-neon-blue w-12 h-12" />
                        Nexus_Bounties
                    </h1>
                    <p className="text-gray-400 font-mono text-xs tracking-widest uppercase">Community task grid // High-reward protocols active</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-8 py-4 bg-neon-blue text-black font-black uppercase tracking-tighter rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,183,235,0.3)] flex items-center gap-3"
                >
                    <Plus className="w-5 h-5" /> Initialize_Bounty
                </button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border ${activeCategory === cat
                            ? 'bg-neon-blue border-neon-blue text-black shadow-[0_0_15px_rgba(0,183,235,0.4)]'
                            : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Bounty Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBounties.map(bounty => (
                    <motion.div
                        key={bounty.id}
                        whileHover={{ y: -5 }}
                        className="glass-panel p-6 rounded-3xl border border-white/5 group cursor-pointer relative overflow-hidden"
                        onClick={() => setSelectedBounty(bounty)}
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <div className="bg-neon-green/10 text-neon-green px-3 py-1 rounded-lg border border-neon-green/30 text-[10px] font-black tracking-widest animate-pulse">
                                {bounty.rewardKpc} KPC
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-gray-500 text-[8px] font-black rounded uppercase tracking-widest">
                                    {bounty.category}
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-white leading-tight group-hover:text-neon-blue transition-colors flex items-center gap-2">
                                {bounty.title}
                                {bounty.status === 'DISPUTED' && <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />}
                            </h3>
                            <p className="text-xs text-gray-400 line-clamp-2 italic font-mono">
                                {bounty.description}
                            </p>

                            <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <img src={bounty.authorAvatar} className="w-6 h-6 rounded-full border border-neon-blue" />
                                    <span className="text-[10px] font-bold text-gray-300">@{bounty.authorName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {bounty.status !== 'OPEN' && (
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded ${bounty.status === 'COMPLETED' ? 'bg-neon-green text-black' : 'bg-red-500/20 text-red-500'}`}>
                                            {bounty.status}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 text-gray-500 text-[10px] font-black uppercase">
                                        <MessageSquare className="w-3 h-3" />
                                        {bounty.submissions?.length || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {filteredBounties.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <AlertCircle className="w-12 h-12 text-gray-700 mb-4" />
                    <p className="text-gray-500 font-mono text-sm">NO_ACTIVE_BOUNTIES_IN_SECTOR</p>
                </div>
            )}

            {/* Bounty Detail Sidebar/Modal */}
            <AnimatePresence>
                {selectedBounty && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-void/90 backdrop-blur-xl flex justify-end"
                    >
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-3xl bg-black border-l border-white/10 h-full overflow-y-auto p-8 md:p-12 relative"
                        >
                            <button
                                onClick={() => setSelectedBounty(null)}
                                className="absolute top-8 right-8 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>

                            <div className="space-y-8 mt-12">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-neon-blue/20 text-neon-blue px-4 py-2 rounded-xl border border-neon-blue/40 text-sm font-black tracking-widest">
                                            {selectedBounty.rewardKpc} KPC REWARD
                                        </div>
                                        <span className="text-gray-500 font-mono text-xs uppercase">{selectedBounty.category}</span>
                                    </div>
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                                        {selectedBounty.title}
                                    </h2>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <img src={selectedBounty.authorAvatar} className="w-10 h-10 rounded-full border border-neon-blue" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Architect</p>
                                                    {(selectedBounty.authorReputation || 0) > 0 && (
                                                        <span className="flex items-center gap-1 text-[8px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded border border-orange-500/20 font-black">
                                                            <Shield className="w-2 h-2" /> RPT {selectedBounty.authorReputation}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-white">@{selectedBounty.authorName}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {currentUser?.uid === selectedBounty.authorUid && selectedBounty.status === 'OPEN' && selectedBounty.submissions?.length === 0 && (
                                                <button
                                                    onClick={handleCancelBounty}
                                                    className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                                                >
                                                    <RotateCcw className="w-3 h-3" /> Recall_Escrow
                                                </button>
                                            )}
                                            {(currentUser?.uid === selectedBounty.authorUid || selectedBounty.submissions?.some(s => s.uid === currentUser?.uid)) && selectedBounty.status === 'OPEN' && (
                                                <button
                                                    onClick={handleDisputeBounty}
                                                    className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center gap-2"
                                                >
                                                    <ShieldAlert className="w-3 h-3" /> Open_Dispute
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-panel p-8 rounded-3xl border border-white/5 prose prose-invert max-w-none prose-sm font-mono">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {selectedBounty.description}
                                    </ReactMarkdown>
                                </div>

                                {/* Submissions Section */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3 tracking-tighter">
                                        <Globe className="w-5 h-5 text-neon-blue" />
                                        Transmitted_Solutions ({selectedBounty.submissions?.length || 0})
                                    </h3>

                                    {/* Submission Input */}
                                    {currentUser?.uid !== selectedBounty.authorUid && (
                                        <div className="space-y-4">
                                            <textarea
                                                value={submissionInput}
                                                onChange={(e) => setSubmissionInput(e.target.value)}
                                                placeholder="Decrypt mission logic... (Markdown supported)"
                                                className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 text-white font-mono text-sm focus:ring-2 focus:ring-neon-blue outline-none transition-all resize-none"
                                            />
                                            <button
                                                onClick={handleSubmitSolution}
                                                disabled={submitting}
                                                className="w-full py-4 bg-neon-blue text-black font-black uppercase tracking-tighter rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-3"
                                            >
                                                {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Transmit_Solution</>}
                                            </button>
                                        </div>
                                    )}

                                    {/* List Submissions */}
                                    <div className="space-y-6">
                                        {selectedBounty.submissions?.map(sub => (
                                            <div key={sub.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 relative group">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <img src={sub.avatar} className="w-8 h-8 rounded-full border border-neon-blue" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold text-white">@{sub.username}</p>
                                                            {(sub.reputation || 0) > 0 && (
                                                                <span className="flex items-center gap-1 text-[8px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded border border-orange-500/20 font-black">
                                                                    <Shield className="w-2 h-2" /> RPT {sub.reputation}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[8px] text-gray-500 uppercase font-mono">{new Date(sub.createdAt).toLocaleString()}</p>
                                                    </div>

                                                    {sub.status !== 'PENDING' ? (
                                                        <span className={`ml-auto px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${sub.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' : 'bg-neon-green/20 text-neon-green'}`}>
                                                            {sub.status}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <div className="ml-auto text-right">
                                                                <p className="text-[8px] text-gray-600 uppercase font-black mb-1 flex items-center gap-1 justify-end">
                                                                    <Clock className="w-2 h-2" /> Auto_Payout_Timer
                                                                </p>
                                                                <p className="text-[10px] text-neon-blue font-mono font-bold tracking-tighter">
                                                                    {Math.max(0, Math.floor((new Date(sub.autoPayoutAt) - new Date()) / (1000 * 60 * 60)))}h Remaining
                                                                </p>
                                                            </div>
                                                            {currentUser?.uid === selectedBounty.authorUid && selectedBounty.status === 'OPEN' && (
                                                                <div className="flex gap-2 ml-4">
                                                                    <button
                                                                        onClick={() => handleAwardBounty(sub.id)}
                                                                        className="px-4 py-2 bg-neon-green/20 border border-neon-green/30 text-neon-green rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neon-green hover:text-black transition-all"
                                                                    >
                                                                        Award
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejectSubmission(sub.id)}
                                                                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="prose prose-invert prose-sm max-w-none font-mono text-xs text-gray-300">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {sub.content}
                                                    </ReactMarkdown>
                                                </div>
                                                {sub.status === 'REJECTED' && (
                                                    <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-mono flex items-start gap-2">
                                                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                                        <span>REJECTION_LOG: {sub.rejectionReason}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {(!selectedBounty.submissions || selectedBounty.submissions.length === 0) && (
                                            <p className="text-center text-gray-600 font-mono text-[10px] py-10">NO_SOLUTIONS_FOUND_IN_STREAM</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Bounty Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-black border border-white/10 rounded-[2.5rem] w-full max-w-2xl p-10 relative overflow-hidden"
                        >
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-neon-blue/10 blur-[100px] rounded-full" />

                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">INITIALIZE_BOUNTY</h2>
                            <p className="text-gray-500 font-mono text-[10px] uppercase mb-8">Credits will be locked in escrow protocol until completion.</p>

                            <form onSubmit={handleCreateBounty} className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neon-blue uppercase tracking-[0.2em] ml-2">Protocol_Title</label>
                                    <input
                                        type="text" required
                                        value={newBounty.title}
                                        onChange={e => setNewBounty({ ...newBounty, title: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono outline-none focus:border-neon-blue transition-all"
                                        placeholder="e.g. Optimize React rendering algorithm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neon-blue uppercase tracking-[0.2em] ml-2">Reward (KPC)</label>
                                        <input
                                            type="number" required min="100"
                                            value={newBounty.rewardKpc}
                                            onChange={e => setNewBounty({ ...newBounty, rewardKpc: parseInt(e.target.value) })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono outline-none focus:border-neon-blue transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-neon-blue uppercase tracking-[0.2em] ml-2">Category</label>
                                        <select
                                            value={newBounty.category}
                                            onChange={e => setNewBounty({ ...newBounty, category: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono outline-none focus:border-neon-blue transition-all appearance-none"
                                        >
                                            {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neon-blue uppercase tracking-[0.2em] ml-2">Protocol_Specs (Markdown)</label>
                                    <textarea
                                        required
                                        value={newBounty.description}
                                        onChange={e => setNewBounty({ ...newBounty, description: e.target.value })}
                                        className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono outline-none focus:border-neon-blue transition-all resize-none"
                                        placeholder="Detailed mission parameters..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 py-4 bg-white/5 border border-white/5 text-gray-500 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white/10 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-neon-blue text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-lg"
                                    >
                                        Establish_Protocol
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NexusBounties;
