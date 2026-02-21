import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Calendar, Clock, Trophy, Upload as UploadIcon, X, CheckCircle2, AlertTriangle, Code } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Hackathons = () => {
    const { currentUser } = useAuth();
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHackathon, setSelectedHackathon] = useState(null); // For submission modal
    const [userProjects, setUserProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');

    // Calculate time remaining
    const getTimeRemaining = (endDate) => {
        if (!endDate) return "T-MINUS ??";

        // Handle Firestore Timestamp (Axios returns as object with _seconds)
        let endMs;
        if (endDate._seconds) {
            endMs = endDate._seconds * 1000;
        } else if (typeof endDate.toDate === 'function') {
            endMs = endDate.toDate().getTime();
        } else {
            endMs = Date.parse(endDate);
        }

        const total = endMs - Date.now();
        if (total <= 0) return "EVENT_CONCLUDED";

        const minutes = Math.floor((total / 1000 / 60) % 60);
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const days = Math.floor(total / (1000 * 60 * 60 * 24));

        return `${days}d ${hours}h ${minutes}m`;
    };

    const activeHackathons = hackathons.filter(h => h.status !== 'COMPLETED' && getTimeRemaining(h.endDate) !== 'EVENT_CONCLUDED');
    const pastHackathons = hackathons.filter(h => h.status === 'COMPLETED' || getTimeRemaining(h.endDate) === 'EVENT_CONCLUDED');

    useEffect(() => {
        fetchHackathons();
        if (currentUser) {
            fetchUserProjects();
        }
    }, [currentUser]);

    const fetchHackathons = async () => {
        try {

            const res = await axios.get(`${API_BASE}/api/hackathons`);
            setHackathons(res.data);
        } catch (err) {
            console.error("Hackathon fetch error:", err);
            toast.error("NEXUS_SYNC_ERROR: Event feed offline.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserProjects = async () => {
        try {

            const res = await axios.get(`${API_BASE}/api/projects/user/${currentUser.uid}`);
            setUserProjects(res.data);
        } catch (err) {
            console.error("Project fetch error:", err);
        }
    };

    const handleJoin = async (id) => {
        if (!currentUser) return toast.error("ACCESS_DENIED: Login required.");

        try {

            await axios.post(`${API_BASE}/api/hackathons/${id}/join`, {
                userId: currentUser.uid
            });
            toast.success("EVENT_REGISTRATION_CONFIRMED", { icon: '🎫' });
            fetchHackathons();
        } catch (err) {
            toast.error(err.response?.data?.error || "Registration Failed.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProject) return toast.error("No project selected.");

        const project = userProjects.find(p => p.id === selectedProject);

        try {

            await axios.post(`${API_BASE}/api/hackathons/${selectedHackathon.id}/submit`, {
                userId: currentUser.uid,
                projectId: selectedProject,
                projectTitle: project.title
            });
            toast.success("SUBMISSION_UPLOADED: Good luck, Architect.", { icon: '🚀' });
            setSelectedHackathon(null);
            setSelectedProject('');
            fetchHackathons();
        } catch (err) {
            toast.error(err.response?.data?.error || "Submission Failed.");
        }
    };


    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto pb-12">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-neon-blue tracking-tighter uppercase italic drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                    Community_Nexus
                </h1>
                <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">
                    Global Events. Competitions. Glory. <br />
                    <span className="text-neon-green">Compete</span> against the grid's best architects.
                </p>
            </div>

            <div className="space-y-8">
                {activeHackathons.length > 0 && (
                    <div className="space-y-8">
                        {activeHackathons.map(hackathon => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={hackathon.id}
                                className="bg-black border border-gray-800 rounded-3xl overflow-hidden relative shadow-2xl group"
                            >
                                {/* Background Image / Overlay */}
                                <div className="absolute inset-0 z-0">
                                    <img src={hackathon.image} alt="bg" className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />
                                </div>

                                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    <div className="space-y-4 max-w-2xl">
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                <Trophy className="w-3 h-3" /> Event_Active
                                            </span>
                                            <span className="text-gray-500 font-mono text-xs flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Ends in: {getTimeRemaining(hackathon.endDate)}
                                            </span>
                                        </div>
                                        <h2 className="text-4xl font-black text-white italic tracking-tighter">{hackathon.title}</h2>
                                        <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-purple-500 pl-4">
                                            {hackathon.description}
                                        </p>
                                        <div className="flex flex-col gap-2 pt-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-neon-green font-bold text-xs uppercase tracking-widest">RewardPool:</span>
                                                <span className="text-white font-mono font-bold border-b border-neon-green">{hackathon.reward}</span>
                                            </div>
                                            {hackathon.entryFee > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-neon-blue font-bold text-[10px] uppercase tracking-widest">EntryFee:</span>
                                                    <span className="text-white font-mono text-xs">{hackathon.entryFee} KPC</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 min-w-[200px]">
                                        {currentUser && hackathon.participants?.includes(currentUser.uid) ? (
                                            <>
                                                <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg flex items-center gap-2 justify-center">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Registered</span>
                                                </div>

                                                {hackathon.submissions?.some(s => s.userId === currentUser.uid) ? (
                                                    <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-lg flex items-center gap-2 justify-center">
                                                        <Trophy className="w-4 h-4 text-purple-500" />
                                                        <span className="text-purple-500 text-xs font-bold uppercase tracking-widest">Submitted</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedHackathon(hackathon)}
                                                        className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neon-green transition-all shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        <UploadIcon className="w-4 h-4" /> Submit_Project
                                                    </button>
                                                )}
                                                {hackathon.winnerId === currentUser.uid && (
                                                    <div className="bg-neon-green/20 border border-neon-green p-3 rounded-lg flex items-center gap-2 justify-center animate-pulse">
                                                        <Trophy className="w-4 h-4 text-neon-green" />
                                                        <span className="text-neon-green text-xs font-black uppercase tracking-widest">Event Winner</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleJoin(hackathon.id)}
                                                className="w-full py-4 bg-purple-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                            >
                                                {hackathon.entryFee > 0 ? `Join for ${hackathon.entryFee} KPC` : 'Join_Event'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Submissions Ticker (Mock) */}
                                {hackathon.submissions?.length > 0 && (
                                    <div className="border-t border-gray-900 bg-black/50 p-3 backdrop-blur-sm flex items-center gap-4 overflow-x-auto relative z-10">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold shrink-0">Latest entries:</span>
                                        {hackathon.submissions.map((sub, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-800 shrink-0">
                                                <Code className="w-3 h-3 text-purple-500" />
                                                <span className="text-xs text-white font-mono">{sub.projectTitle}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {pastHackathons.length > 0 && (
                    <div className="pt-12 border-t border-gray-900">
                        <h2 className="text-xl font-black text-gray-500 uppercase tracking-widest mb-8 text-center italic">Hall of_Glory / Ended Events</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pastHackathons.map(hackathon => (
                                <div key={hackathon.id} className="bg-void border border-gray-900 rounded-2xl p-6 opacity-60 hover:opacity-100 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-white uppercase text-sm">{hackathon.title}</h3>
                                        <span className="bg-gray-800 text-[8px] px-2 py-0.5 rounded uppercase text-gray-400">Ended</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mb-4 line-clamp-2">{hackathon.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-neon-green font-mono text-[10px]">{hackathon.reward}</span>
                                        {hackathon.winnerId && (
                                            <div className="flex items-center gap-1">
                                                <Trophy className="w-3 h-3 text-purple-500" />
                                                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-tighter">Winner Declared</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {hackathons.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl bg-terminal/30">
                        <Calendar className="w-16 h-16 text-gray-800 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">No Active Events</h3>
                        <p className="text-gray-600 font-mono text-xs mt-2">The Nexus is quiet... for now.</p>
                    </div>
                )}
            </div>

            {/* Submission Modal */}
            <AnimatePresence>
                {selectedHackathon && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex justify-center items-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-terminal border border-gray-800 rounded-2xl w-full max-w-md p-8 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setSelectedHackathon(null)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-2xl font-black text-white mb-2 uppercase italic">Submit Entry</h2>
                            <p className="text-xs text-purple-400 font-mono mb-6">Event: {selectedHackathon.title}</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-3">Select from your projects</label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {userProjects.length > 0 ? userProjects.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => setSelectedProject(p.id)}
                                                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${selectedProject === p.id
                                                    ? 'bg-purple-500/20 border-purple-500 text-white'
                                                    : 'bg-void border-gray-800 text-gray-400 hover:border-gray-600'
                                                    }`}
                                            >
                                                <span className="font-bold text-sm">{p.title}</span>
                                                {selectedProject === p.id && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
                                            </div>
                                        )) : (
                                            <div className="text-center py-4 text-gray-600 text-xs">
                                                No projects found. <br /> Deploy a project first!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!selectedProject}
                                    className="w-full py-4 bg-neon-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm_Submission
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Hackathons;
