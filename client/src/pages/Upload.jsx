import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Check, AlertCircle, Loader, Shield, X, File as FileIcon, Image as ImageIcon, Folder, Plus, Lock, Zap } from 'lucide-react';
import { API_BASE } from '../api';

const Upload = () => {
    const { currentUser, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [files, setFiles] = useState([]);
    const [screenshots, setScreenshots] = useState([]);
    const [screenshotPreviews, setScreenshotPreviews] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Web',
        tags: '',
        demoUrl: '',
        repoUrl: '',
        memberOnly: false,
        isPrivate: false,
        isPremium: false,
        unlockKpc: 500
    });

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const handleScreenshotChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setScreenshots(prev => [...prev, ...selectedFiles]);

        // Generate previews
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setScreenshotPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeScreenshot = (index) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index));
        setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Restriction check
        if (currentUser?.restrictions?.uploadBlocked) {
            setError('⬆️ UPLOAD BLOCKED — Uploading is restricted on your account. Contact support to appeal.');
            return;
        }


        if (files.length === 0) return setError('Please select at least one source file.');

        // 3. Verified Developer Check for Executables (.exe, .bat)
        const EXECUTABLE_EXTENSIONS = ['.exe', '.bat', '.msi', '.cmd'];
        const hasExecutables = files.some(f => EXECUTABLE_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)));
        if (hasExecutables && currentUser) {
            const isVerified = (currentUser.stats?.extraSlots || 0) >= 10 || ['OPERATIVE', 'COMMANDER', 'TITAN', 'ARCHITECT', 'ADMIN', 'PRO'].includes(currentUser.tier);
            if (!isVerified) {
                setError('SECURITY_RESTRICTION: Uploading executable apps (.exe, .bat) requires Verified Developer status. Acquire a Small Booster (+10 Slots) in the Forge to verify your identity.');
                return;
            }
        }

        setError('');
        setLoading(true);

        const data = new FormData();
        files.forEach(file => data.append('projectFiles', file));
        screenshots.forEach(file => data.append('screenshots', file));

        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('tags', formData.tags);
        data.append('demoUrl', formData.demoUrl);
        data.append('repoUrl', formData.repoUrl);
        data.append('authorId', currentUser?.uid || '');
        data.append('authorName', currentUser?.displayName || currentUser?.username || 'Anonymous');
        data.append('authorAvatar', currentUser?.photoURL || '');
        data.append('memberOnly', formData.memberOnly);
        data.append('isPrivate', formData.isPrivate);
        data.append('isPremium', formData.isPremium);
        data.append('unlockKpc', formData.unlockKpc);

        try {
            await axios.post(`${API_BASE}/api/projects`, data);

            // Increment locally for immediate UI feedback
            if (currentUser) {
                updateUser({
                    stats: {
                        ...(currentUser.stats || {}),
                        uploads: (currentUser.stats?.uploads || 0) + 1
                    }
                });
            }

            navigate('/studio');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to deploy system.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 pb-10 px-4 flex justify-center items-start">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl bg-terminal border border-gray-800 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            >
                <div className="flex items-center gap-4 mb-4 border-b border-gray-800 pb-4">
                    <div className="p-3 bg-neon-green/10 rounded-lg text-neon-green">
                        <UploadIcon className="w-8 h-8" />
                    </div>
                    <div className="flex-grow">
                        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">System Deployment</h1>
                        <p className="text-gray-500 text-[10px] font-mono tracking-widest uppercase">Initializing grid transmission protocol...</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-mono text-gray-500 uppercase mb-1">Grid_Capacity</p>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 justify-end">
                                <span className="text-white font-black text-sm">
                                    {currentUser?.stats?.uploads || 0} / {15 + (currentUser?.stats?.extraSlots || 0)}
                                </span>
                                <Link to="/forge" className="p-1.5 bg-neon-blue/10 border border-neon-blue/30 rounded text-neon-blue hover:bg-neon-blue hover:text-white transition-all shadow-[0_0_10px_rgba(0,212,255,0.2)]">
                                    <Plus className="w-3 h-3" />
                                </Link>
                            </div>
                            <span className="text-[8px] font-mono text-neon-purple uppercase font-black text-right min-w-[120px]">
                                Max_Payload: {(() => {
                                    const bandwidth = { 'GHOST': 25, 'CITIZEN': 50, 'OPERATIVE': 150, 'COMMANDER': 500, 'TITAN': 1024, 'ARCHITECT': 5120, 'ADMIN': 10240 };
                                    return bandwidth[currentUser?.tier] || 25;
                                })()}MB
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg flex items-center gap-3 font-mono text-xs">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-500 text-[10px] font-black tracking-widest mb-2 uppercase">System Identifier</label>
                                <input
                                    type="text" required
                                    className="w-full bg-void border border-gray-800 rounded-xl p-4 text-white focus:border-neon-green outline-none transition-all placeholder:text-gray-700"
                                    placeholder="e.g. My Awesome Project"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-500 text-[10px] font-black tracking-widest mb-2 uppercase">Classification</label>
                                <select
                                    className="w-full bg-void border border-gray-800 rounded-xl p-4 text-white focus:border-neon-green outline-none"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="Web">Web Application</option>
                                    <option value="Game">Game / Virtual World</option>
                                    <option value="Tool">Tool</option>
                                    <option value="AI">AI / Machine Learning</option>
                                    <option value="Script">Script</option>
                                </select>
                            </div>
                        </div>

                        {/* URLs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-gray-500 text-[10px] font-black tracking-widest uppercase mb-2">Live Demo URL</label>
                                <input
                                    type="url"
                                    className="w-full bg-void border border-gray-800 rounded-xl p-4 text-white focus:border-neon-green outline-none transition-all placeholder:text-gray-700 font-mono text-sm"
                                    placeholder="https://"
                                    value={formData.demoUrl}
                                    onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-gray-500 text-[10px] font-black tracking-widest uppercase mb-2">Source Repo URL</label>
                                <input
                                    type="url"
                                    className="w-full bg-void border border-gray-800 rounded-xl p-4 text-white focus:border-neon-green outline-none transition-all placeholder:text-gray-700 font-mono text-sm"
                                    placeholder="https://github.com/..."
                                    value={formData.repoUrl}
                                    onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-gray-500 text-[10px] font-black tracking-widest uppercase mb-2">Description</label>
                            <textarea
                                required
                                className="w-full h-[132px] bg-void border border-gray-800 rounded-xl p-4 text-white focus:border-neon-green outline-none resize-none placeholder:text-gray-700"
                                placeholder="Detail the system architecture and purpose..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Source Files Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="block text-gray-500 text-[10px] font-black tracking-widest uppercase">Source Files ({files.length} files)</label>
                            <label className="cursor-pointer text-xs font-black text-neon-green hover:underline">
                                + Add Files
                                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>

                        <div className="bg-void border border-gray-800 rounded-xl overflow-hidden min-h-[120px]">
                            {files.length > 0 ? (
                                <div className="divide-y divide-gray-900 overflow-y-auto max-h-[200px]">
                                    {files.map((file, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 group hover:bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <FileIcon className="w-4 h-4 text-gray-600" />
                                                <span className="text-xs text-gray-300 font-mono">{file.name}</span>
                                                <span className="text-[10px] text-gray-600 font-mono">{(file.size / 1024).toFixed(1)}KB</span>
                                            </div>
                                            <button type="button" onClick={() => removeFile(i)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[120px] flex flex-col items-center justify-center gap-4 text-gray-600 border-2 border-dashed border-gray-800 rounded-xl">
                                    <Folder className="w-8 h-8 opacity-20" />
                                    <p className="text-[10px] font-mono uppercase tracking-[0.2em]">No files selected</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Screenshot Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="block text-gray-500 text-[10px] font-black tracking-widest uppercase">Screenshots ({screenshots.length} uploaded)</label>
                            <label className="cursor-pointer text-xs font-black text-neon-blue hover:underline">
                                + Add Screenshots
                                <input type="file" multiple accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {screenshotPreviews.map((url, i) => (
                                <div key={i} className="aspect-video bg-void border border-gray-800 rounded-lg relative group overflow-hidden">
                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                        <button type="button" onClick={() => removeScreenshot(i)} className="p-2 bg-red-500 text-white rounded-full">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <label className="aspect-video flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-800 rounded-lg text-gray-700 hover:border-neon-blue hover:text-neon-blue transition-all cursor-pointer">
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Add Screenshots</span>
                                <input type="file" multiple accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* Security Protocol */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-neon-blue/5 border border-neon-blue/20 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Shield className={`w-6 h-6 ${formData.memberOnly ? 'text-neon-blue animate-pulse' : 'text-gray-800'}`} />
                                <div>
                                    <h4 className="text-white font-black text-xs uppercase tracking-[0.15em]">Gated Access Protocol</h4>
                                    <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase text-left">Restrict system to ELITE tier citizens.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, memberOnly: !formData.memberOnly })}
                                className={`min-w-[56px] h-7 rounded-full p-1 transition-all flex items-center ${formData.memberOnly ? 'bg-neon-blue' : 'bg-void border border-gray-800'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-all ${formData.memberOnly ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {currentUser?.tier && currentUser.tier !== 'GHOST' && (
                            <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Lock className={`w-6 h-6 ${formData.isPrivate ? 'text-purple-500 animate-pulse' : 'text-gray-800'}`} />
                                    <div>
                                        <h4 className="text-white font-black text-xs uppercase tracking-[0.15em]">Private Project</h4>
                                        <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase text-left">Hide from public grid Discovery.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                                    className={`min-w-[56px] h-7 rounded-full p-1 transition-all flex items-center ${formData.isPrivate ? 'bg-purple-500' : 'bg-void border border-gray-800'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white transition-all ${formData.isPrivate ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        )}

                        <div className="p-6 bg-neon-green/5 border border-neon-green/20 rounded-2xl flex items-center justify-between col-span-1 md:col-span-2">
                            <div className="flex items-center gap-4">
                                <Zap className={`w-6 h-6 ${formData.isPremium ? 'text-neon-blue animate-pulse' : 'text-gray-800'}`} />
                                <div>
                                    <h4 className="text-white font-black text-xs uppercase tracking-[0.15em]">Premium System</h4>
                                    <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase text-left">Require KPC unlock for transmission.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                {formData.isPremium && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-[8px] font-black text-gray-600 uppercase">Unlock_KPC</label>
                                        <input
                                            type="number" min="100"
                                            value={formData.unlockKpc}
                                            onChange={(e) => setFormData({ ...formData, unlockKpc: parseInt(e.target.value) })}
                                            className="w-20 bg-void border border-gray-800 rounded-lg p-2 text-white font-mono text-center text-xs focus:border-neon-blue outline-none"
                                        />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isPremium: !formData.isPremium })}
                                    className={`min-w-[56px] h-7 rounded-full p-1 transition-all flex items-center ${formData.isPremium ? 'bg-neon-blue' : 'bg-void border border-gray-800'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white transition-all ${formData.isPremium ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-900 flex justify-between items-center">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-600 font-mono uppercase">Node: {currentUser?.uid?.slice(0, 8)}</p>
                            <p className="text-[10px] text-gray-600 font-mono uppercase">Status: READY</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || files.length === 0}
                            className={`px-12 py-5 rounded-xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center gap-4 ${loading || files.length === 0
                                ? 'bg-void text-gray-800 border border-gray-900 cursor-not-allowed'
                                : 'bg-white text-black hover:bg-neon-green hover:shadow-[0_0_40px_rgba(57,255,20,0.3)]'
                                }`}
                        >
                            {loading ? (
                                <><Loader className="w-5 h-5 animate-spin" /> EXECUTING...</>
                            ) : (
                                <><UploadIcon className="w-5 h-5" /> Deploy Project</>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Upload;
