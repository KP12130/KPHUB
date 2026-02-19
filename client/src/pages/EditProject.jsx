import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Save, ChevronLeft, AlertCircle, Loader, Shield, File as FileIcon, ImageIcon, Folder } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';

const EditProject = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Web',
        tags: '',
        demoUrl: '',
        repoUrl: '',
        isPrivate: false,
        memberOnly: false
    });

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/projects/${id}?userId=${currentUser?.uid}`);
                const project = res.data;

                if (project.author.uid !== currentUser?.uid) {
                    toast.error("UNAUTHORIZED: Cannot access system source.");
                    navigate('/');
                    return;
                }

                setFormData({
                    title: project.title,
                    description: project.description,
                    category: project.category,
                    tags: project.tags?.join(', ') || '',
                    demoUrl: project.demoUrl || '',
                    repoUrl: project.repoUrl || '',
                    isPrivate: project.isPrivate || false,
                    memberOnly: project.memberOnly || false
                });
            } catch (err) {
                console.error(err);
                setError('Failed to fetch project data.');
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) fetchProject();
    }, [id, currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(`${API_BASE}/api/projects/${id}`, {
                ...formData,
                userId: currentUser.uid
            });
            toast.success("SYSTEM_UPDATED: Binary changes synchronized.");
            navigate(`/project/${id}`);
        } catch (err) {
            toast.error("SYNC_ERROR: Failed to update system.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen pt-32 bg-void flex justify-center">
            <Loader className="w-12 h-12 text-neon-green animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen pt-32 pb-20 bg-void px-4">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group">
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Abort_Edit</span>
                </button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-terminal border border-gray-900 rounded-3xl p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-12 h-12 bg-neon-blue/10 rounded-2xl flex items-center justify-center border border-neon-blue/30">
                            <Save className="w-6 h-6 text-neon-blue" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Edit_System</h1>
                            <p className="text-gray-500 font-mono text-[10px]">Modify system metadata and protocols.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Title & Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">System_Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-void border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-800 font-bold"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-void border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-neon-blue outline-none transition-all cursor-pointer font-bold"
                                >
                                    {['Web', 'Game', 'Tool', 'AI', 'Script', 'Mobile'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* URLs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Live_Demo_URL</label>
                                <input
                                    type="url"
                                    placeholder="https://"
                                    value={formData.demoUrl}
                                    onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                                    className="w-full bg-void border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-800 font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Source_Repo_URL</label>
                                <input
                                    type="url"
                                    placeholder="https://github.com/..."
                                    value={formData.repoUrl}
                                    onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                                    className="w-full bg-void border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-800 font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Description / Documentation (Markdown Supported)</label>
                            <textarea
                                value={formData.description}
                                rows={6}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-void border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-800 font-mono text-sm leading-relaxed"
                            />
                        </div>

                        {/* Security Protocols */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-6 bg-neon-blue/5 border border-neon-blue/20 rounded-2xl flex items-center justify-between ${formData.memberOnly ? 'border-neon-blue' : ''}`}>
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Gated_Access</h4>
                                    <p className="text-[9px] text-gray-500 font-mono">Only PRO/ELITE citizens can access.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, memberOnly: !formData.memberOnly })}
                                    className={`w-12 h-6 rounded-full relative transition-all ${formData.memberOnly ? 'bg-neon-blue shadow-[0_0_10px_#00D4FF]' : 'bg-gray-800'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.memberOnly ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className={`p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-center justify-between ${formData.isPrivate ? 'border-purple-500' : ''}`}>
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Private_System</h4>
                                    <p className="text-[9px] text-gray-500 font-mono">Invisible from public grid searches.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                                    className={`w-12 h-6 rounded-full relative transition-all ${formData.isPrivate ? 'bg-purple-500 shadow-[0_0_10px_#A855F7]' : 'bg-gray-800'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isPrivate ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-6 bg-neon-blue text-black font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl text-xs hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                        >
                            {saving ? <Loader className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Execute_Update</>}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default EditProject;
