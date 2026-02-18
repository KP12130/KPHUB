import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, CheckCircle, MessageSquare, Clock, X, Shield, Eye, ThumbsUp, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const CodeReviews = () => {
    const { currentUser } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);
    const [reviewContent, setReviewContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
            const res = await axios.get(`${API_BASE}/api/reviews`);
            setReviews(res.data);
        } catch (err) {
            console.error("Fetch reviews error", err);
            toast.error("AUDIT_LOG_ERROR: Sync failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!currentUser || !reviewContent.trim()) return;

        setIsSubmitting(true);
        try {
            const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
            await axios.post(`${API_BASE}/api/reviews/${selectedReview.id}/comment`, {
                userId: currentUser.uid,
                userName: currentUser.displayName,
                userAvatar: currentUser.photoURL,
                content: reviewContent,
                rating: 'comment'
            });
            toast.success("AUDIT_SUBMITTED: Reputation +15", { icon: '🛡️' });
            setSelectedReview(null);
            setReviewContent('');
            fetchReviews();
        } catch (err) {
            toast.error(err.response?.data?.error || "Submission Failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseReview = async (e, reviewId) => {
        e.stopPropagation();
        if (!window.confirm("Close this review request?")) return;

        try {
            const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
            await axios.post(`${API_BASE}/api/reviews/${reviewId}/close`, {
                userId: currentUser.uid
            });
            toast.success("AUDIT_CLOSED: Request archived.");
            fetchReviews();
        } catch (err) {
            toast.error("Failed to close.");
        }
    };

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto pb-12">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic flex justify-center items-center gap-4">
                    <Code className="w-12 h-12 text-neon-blue" />
                    Code_Review_Protocol
                </h1>
                <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">
                    Peer Analysis. Security Audits. Optimization. <br />
                    <span className="text-neon-blue">Review</span> code to earn reputation and secure the grid.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.length > 0 ? reviews.map(review => (
                    <motion.div
                        layoutId={review.id}
                        key={review.id}
                        onClick={() => setSelectedReview(review)}
                        className="bg-terminal border border-gray-800 rounded-2xl p-6 hover:border-neon-blue/50 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Code className="w-32 h-32 text-neon-blue" />
                        </div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <img src={review.authorAvatar || '/default-avatar.png'} className="w-8 h-8 rounded-full border border-gray-700" alt="auth" />
                                <div>
                                    <p className="text-white font-bold text-sm tracking-tight">{review.authorName}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">
                                        {new Date(review.createdAt._seconds * 1000).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-neon-blue/10 px-2 py-1 rounded text-neon-blue border border-neon-blue/20">
                                <MessageSquare className="w-3 h-3" />
                                <span className="text-xs font-bold">{review.reviews?.length || 0}</span>
                            </div>
                        </div>

                        <div className="mb-6 relative z-10">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-blue transition-colors truncate">
                                {review.projectTitle}
                            </h3>
                            <p className="text-gray-500 text-xs font-mono line-clamp-3 bg-gray-900/50 p-2 rounded">
                                " {review.requestComment} "
                            </p>
                        </div>

                        <div className="flex justify-between items-center relative z-10">
                            <Link
                                to={`/project/${review.projectId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-1"
                            >
                                <Eye className="w-3 h-3" /> View_Codebase
                            </Link>

                            {currentUser?.uid === review.authorId && (
                                <button
                                    onClick={(e) => handleCloseReview(e, review.id)}
                                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400"
                                >
                                    Close_Audit
                                </button>
                            )}
                        </div>
                    </motion.div>
                )) : (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl bg-terminal/30">
                        <CheckCircle className="w-16 h-16 text-gray-800 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest">System Optimal</h3>
                        <p className="text-gray-600 font-mono text-xs mt-2">No pending audits detected.</p>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedReview && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex justify-center items-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-terminal border border-gray-800 rounded-2xl w-full max-w-2xl p-0 relative shadow-2xl flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-gray-900/50 rounded-t-2xl">
                                <div>
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">Audit Protocol</h2>
                                    <Link to={`/project/${selectedReview.projectId}`} className="text-neon-blue text-xs font-mono hover:underline flex items-center gap-1">
                                        Target: {selectedReview.projectTitle} <Eye className="w-3 h-3" />
                                    </Link>
                                </div>
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="text-gray-500 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="bg-void border border-gray-800 p-4 rounded-xl">
                                    <h4 className="text-gray-500 text-[10px] uppercase font-bold mb-2">Request Brief</h4>
                                    <p className="text-gray-300 font-mono text-sm">{selectedReview.requestComment}</p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-white text-xs uppercase font-black tracking-widest">Audit Logs</h4>
                                    {selectedReview.reviews && selectedReview.reviews.length > 0 ? (
                                        selectedReview.reviews.map((r, i) => (
                                            <div key={i} className="flex gap-4 p-4 border-b border-gray-800 last:border-0">
                                                <img src={r.userAvatar || '/default-avatar.png'} className="w-8 h-8 rounded-full" alt="av" />
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-neon-blue font-bold text-xs">{r.userName}</span>
                                                        <span className="text-gray-600 text-[10px] font-mono">{new Date(r.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-300 text-sm">{r.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-600 italic text-xs">No audits recorded yet.</p>
                                    )}
                                </div>
                            </div>

                            {currentUser && (
                                <div className="p-6 border-t border-gray-800 bg-void rounded-b-2xl">
                                    <form onSubmit={handleSubmitReview}>
                                        <textarea
                                            value={reviewContent}
                                            onChange={e => setReviewContent(e.target.value)}
                                            placeholder="Enter audit findings..."
                                            className="w-full bg-black border border-gray-800 rounded-xl p-4 text-white focus:border-neon-blue outline-none h-24 resize-none font-mono text-sm mb-4"
                                            required
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="px-6 py-2 bg-neon-blue text-black font-black uppercase rounded-lg text-xs tracking-widest hover:bg-white transition-all disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Uploading...' : 'Submit_Audit'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CodeReviews;
