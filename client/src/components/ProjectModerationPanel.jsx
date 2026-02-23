import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../api';
import { toast } from 'react-hot-toast';
import {
    Package, Shield, CheckCircle2, XCircle, ExternalLink,
    User, Clock, AlertTriangle, Loader2, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

const GlassCard = ({ children, className = "" }) => (
    <div className={`glass-panel border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all ${className}`}>
        {children}
    </div>
);

export default function ProjectModerationPanel({ adminToken }) {
    const [pendingProjects, setPendingProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActing, setIsActing] = useState(null);

    const fetchPending = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/projects/admin/pending`);
            setPendingProjects(res.data);
        } catch (err) {
            toast.error("Failed to sync pending projects.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApprove = async (projectId) => {
        if (!window.confirm("CONFIRM_AUTHORIZATION: Release this project to the public grid?")) return;
        setIsActing(projectId);
        try {
            await axios.post(`${API_BASE}/api/projects/admin/approve`, { projectId, adminToken });
            toast.success("SYSTEM_RELEASE: Project authorized.");
            fetchPending();
        } catch (err) {
            toast.error(err.response?.data?.error || "Authorization protocol failed.");
        } finally {
            setIsActing(null);
        }
    };

    const handleReject = async (projectId) => {
        if (!window.confirm("FORCE_TERMINATION: Permanently delete this project?")) return;
        setIsActing(projectId);
        try {
            // Reusing existing delete logic if available, otherwise just use approve with rejected status
            await axios.delete(`${API_BASE}/api/projects/${projectId}`);
            toast.success("SYSTEM_PURGE: Malicious project eradicated.");
            fetchPending();
        } catch (err) {
            toast.error("Purge protocol failed.");
        } finally {
            setIsActing(null);
        }
    };

    if (isLoading && pendingProjects.length === 0) {
        return (
            <div className="py-20 text-center">
                <Loader2 className="w-12 h-12 text-neon-blue animate-spin mx-auto mb-4" />
                <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">Syncing Moderation Queue...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                    <Package className="text-neon-blue" /> Grid_Moderation_Queue
                </h2>
                <button
                    onClick={fetchPending}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                    title="Refresh List"
                >
                    <Clock className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingProjects.length > 0 ? (
                    pendingProjects.map(project => (
                        <GlassCard key={project.id} className="group relative">
                            {/* Security Status Overlay */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${project.security?.vtSummary?.includes('✅')
                                        ? 'bg-neon-green/10 border-neon-green/30 text-neon-green'
                                        : 'bg-red-500/10 border-red-500/30 text-red-500'
                                    }`}>
                                    {project.security?.vtSummary || 'SCAN_PENDING'}
                                </span>
                            </div>

                            <div className="flex gap-6">
                                {/* Thumbnail */}
                                <div className="w-24 h-24 rounded-xl bg-void border border-white/5 overflow-hidden shrink-0">
                                    {project.thumbnail ? (
                                        <img src={project.thumbnail} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-800">
                                            <Package className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                    <div>
                                        <h3 className="text-white font-black uppercase text-lg tracking-tighter truncate">{project.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <img src={project.author.avatar} alt="" className="w-4 h-4 rounded-full" />
                                            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Author: @{project.author.name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-[9px] font-mono text-gray-600 uppercase">
                                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(project.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-yellow-500" /> Contain_Executables</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-void/50 border border-white/5 rounded-xl">
                                <p className="text-[8px] font-bold text-gray-600 uppercase mb-2 tracking-widest">Metadata_Snapshot</p>
                                <p className="text-[10px] text-gray-400 font-mono line-clamp-2">{project.description}</p>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Link
                                    to={`/project/${project.id}?tab=CODE`}
                                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <ExternalLink className="w-3 h-3" /> Inspect
                                </Link>
                                <button
                                    onClick={() => handleApprove(project.id)}
                                    disabled={isActing === project.id}
                                    className="flex-1 py-3 bg-neon-green text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all flex items-center justify-center gap-2"
                                >
                                    {isActing === project.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                    Authorize_Release
                                </button>
                                <button
                                    onClick={() => handleReject(project.id)}
                                    disabled={isActing === project.id}
                                    className="px-4 py-3 border border-red-500/30 text-red-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                >
                                    {isActing === project.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                </button>
                            </div>
                        </GlassCard>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center glass-panel rounded-3xl border border-dashed border-white/5">
                        <CheckCircle2 className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em]">The grid is clean. No pending transmissions detected.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
