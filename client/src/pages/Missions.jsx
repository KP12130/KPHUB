import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, AlertCircle, Shield, CheckCircle2, DollarSign, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Missions = () => {
    const { currentUser } = useAuth();
    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // New Bounty Form State
    const [newBounty, setNewBounty] = useState({
        title: '',
        description: '',
        reward: '',
        difficulty: 'Medium'
    });

    useEffect(() => {
        fetchBounties();
    }, []);

    const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
    const fetchBounties = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/bounties`);
            setBounties(res.data);
        } catch (err) {
            console.error("Failed to fetch bounties", err);
            toast.error("MISSION_SYNC_FAILED: Network Disruption.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBounty = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const rewardAmount = parseInt(newBounty.reward);
        if (currentUser.stats?.balance < rewardAmount) {
            toast.error("INSUFFICIENT_CREDITS: Transaction Halted.");
            return;
        }

        try {
            const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
            await axios.post(`${API_BASE}/api/bounties`, {
                authorId: currentUser.uid,
                ...newBounty,
                reward: rewardAmount
            });
            toast.success("MISSION_PROTOCOL_INITIATED: Bounty Posted.", { icon: '🎯' });
            setIsCreateOpen(false);
            setNewBounty({ title: '', description: '', reward: '', difficulty: 'Medium' });
            fetchBounties(); // Refresh list
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Creation Failed.");
        }
    };

    const handleClaimBounty = async (bountyId) => {
        if (!currentUser) return toast.error("Authentication Required.");

        try {
            const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
            await axios.post(`${API_BASE}/api/bounties/${bountyId}/claim`, {
                userId: currentUser.uid
            });
            toast.success("MISSION_ACCEPTED: Good hunting, Spartan.", { icon: '⚔️' });
            fetchBounties();
        } catch (err) {
            toast.error(err.response?.data?.error || "Claim Failed.");
        }
    };

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto pb-12">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Target className="text-neon-green w-8 h-8" /> Missions_Protocol
                    </h1>
                    <p className="text-gray-500 font-mono text-sm mt-2">
                        Accept contracts. Execute objectives. Earn credits.
                    </p>
                </div>
                {currentUser && (
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-neon-green text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)] flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Post_Bounty
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bounties.length > 0 ? bounties.map(bounty => (
                    <div key={bounty.id} className="group bg-terminal border border-gray-900 rounded-2xl p-6 hover:border-neon-green/50 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target className="w-24 h-24 text-neon-green" />
                        </div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${bounty.difficulty === 'Easy' ? 'border-neon-blue text-neon-blue bg-neon-blue/10' :
                                bounty.difficulty === 'Medium' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' :
                                    'border-red-500 text-red-500 bg-red-500/10'
                                }`}>
                                {bounty.difficulty}
                            </span>
                            <span className="text-neon-green font-black font-mono flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> {bounty.reward}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 relative z-10 group-hover:text-neon-green transition-colors">{bounty.title}</h3>
                        <p className="text-gray-500 text-xs font-mono mb-6 line-clamp-3 relative z-10">
                            {bounty.description}
                        </p>

                        <div className="flex justify-between items-center border-t border-gray-800 pt-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3 text-gray-600" />
                                <span className="text-[10px] text-gray-600 uppercase font-bold">{bounty.authorName}</span>
                            </div>

                            {/* Actions */}
                            {currentUser && currentUser.uid !== bounty.authorId ? (
                                <button
                                    onClick={() => handleClaimBounty(bounty.id)}
                                    className="px-4 py-2 bg-gray-900 border border-gray-700 text-white text-[10px] font-bold uppercase rounded hover:bg-neon-green hover:text-black hover:border-neon-green transition-all"
                                >
                                    Accept_Mission
                                </button>
                            ) : (
                                <span className="text-[10px] text-gray-700 uppercase font-mono italic">
                                    {currentUser?.uid === bounty.authorId ? 'Your_Directive' : 'Login_Required'}
                                </span>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center border border-dashed border-gray-800 rounded-2xl">
                        <AlertCircle className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                        <p className="text-gray-600 font-mono text-sm uppercase">No Active Contracts Detected.</p>
                        <p className="text-gray-800 text-xs mt-2">Be the first to post a directive.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-terminal border border-gray-800 rounded-2xl p-8 max-w-lg w-full relative shadow-2xl"
                        >
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-2xl font-black text-white mb-6 uppercase italic tracking-tighter">
                                Initiate_Protocol
                            </h2>

                            <form onSubmit={handleCreateBounty} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-2">Objective Title</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-void border border-gray-800 rounded-lg p-3 text-white focus:border-neon-green outline-none font-mono text-sm"
                                        placeholder="e.g. Fix Navigation Bug"
                                        value={newBounty.title}
                                        onChange={e => setNewBounty({ ...newBounty, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-2">Detailed Brief</label>
                                    <textarea
                                        required
                                        className="w-full bg-void border border-gray-800 rounded-lg p-3 text-white focus:border-neon-green outline-none font-mono text-sm h-32 resize-none"
                                        placeholder="Describe the task parameters..."
                                        value={newBounty.description}
                                        onChange={e => setNewBounty({ ...newBounty, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-2">Bounty (Credits)</label>
                                        <input
                                            required
                                            type="number"
                                            min="10"
                                            className="w-full bg-void border border-gray-800 rounded-lg p-3 text-white focus:border-neon-green outline-none font-mono text-sm"
                                            placeholder="500"
                                            value={newBounty.reward}
                                            onChange={e => setNewBounty({ ...newBounty, reward: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase font-bold mb-2">Difficulty</label>
                                        <select
                                            className="w-full bg-void border border-gray-800 rounded-lg p-3 text-white focus:border-neon-green outline-none font-mono text-sm"
                                            value={newBounty.difficulty}
                                            onChange={e => setNewBounty({ ...newBounty, difficulty: e.target.value })}
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                            <option value="Extreme">Extreme</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-800 flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-neon-green text-black px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                                    >
                                        Upload_Contract
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Missions;
