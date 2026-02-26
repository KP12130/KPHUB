import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    User, Calendar, Download, Heart, MessageCircle, Share2, ArrowLeft,
    Trash2, Send, Edit, ExternalLink, MessageSquare, X, Shield, Lock,
    File as FileIcon, Folder, ChevronRight, ChevronDown, CheckCircle2, AlertCircle, Plus,
    CreditCard, Edit3, Code, Database, FileCode, Terminal, Zap, Eye
} from 'lucide-react';
import { API_BASE } from '../api';

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AIAssistant from '../components/AIAssistant';

import Devlog from '../components/Devlog';
import ShowcaseEmbed from '../components/ShowcaseEmbed';
import AdUnit from '../components/AdUnit';
import SupportButton from '../components/SupportButton';

// --- Reusable Glass Components ---
const GlassCard = ({ children, className = "" }) => (
    <div className={`glass-panel rounded-3xl p-6 md:p-8 ${className}`}>
        {children}
    </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
    <h3 className="text-xl font-black text-white flex items-center gap-3 mb-6 tracking-tight">
        {Icon && <Icon className="w-5 h-5 text-neon-green" />}
        {title}
    </h3>
);

// --- SECURITY COMPONENTS ---
const SecurityBadge = ({ status, summary }) => {
    if (status === 'SKIPPED') return null;
    const isClean = summary?.includes('Clean');
    const isPending = status === 'PENDING';

    return (
        <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 font-black text-[10px] tracking-widest uppercase transition-all ${isPending ? 'bg-white/5 border-white/10 text-gray-500' :
            isClean ? 'bg-neon-green/10 border-neon-green/30 text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.1)]' :
                'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
            }`}>
            {isPending ? <Zap className="w-3 h-3 animate-pulse" /> : isClean ? <Shield className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {isPending ? 'SCAN_IN_PROGRESS...' : summary || 'THREAT_DETECTED'}
        </div>
    );
};

const DangerZoneModal = ({ isOpen, onClose, onConfirm, project }) => {
    if (!isOpen) return null;
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
            <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-8 max-w-md w-full relative overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.2)]">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 blur-[80px] rounded-full" />
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4 text-red-500">
                        <div className="p-3 bg-red-500/20 rounded-2xl">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Danger_Zone</h2>
                    </div>

                    <div className="p-4 bg-black/40 rounded-2xl border border-red-500/10 space-y-3">
                        <p className="text-sm font-bold text-red-200 uppercase tracking-tight">Biztonsági figyelmeztetés:</p>
                        <p className="text-xs text-gray-400 leading-relaxed font-mono">
                            Ez a rendszer futtatható fájlokat (.exe / .bat) tartalmaz. Csak akkor indítsd el, ha megbízol a feltöltőben! A KPHUB nem vállal felelősséget a tartalmáért.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <img src={project.author?.avatar} className="w-8 h-8 rounded-full border border-neon-green" />
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Uploader</p>
                            <p className="text-xs font-bold text-white">@{project.author?.username || project.author?.name}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/5 text-gray-400 font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-white/10 transition-colors"
                        >
                            Aborted
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-red-500 transition-all shadow-lg hover:shadow-red-500/20"
                        >
                            Proceed_Anyway
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- File Tree Component (Preserved & Styled) ---
const FileTree = ({ files, selectedFile, onSelectFile, isRepoView = false }) => {
    const [expandedFolders, setExpandedFolders] = useState(['root']);

    // Simplistic tree construction for demo (handling flat vs tree would be improved in real app)
    // For now, assuming flat list or basic structure.

    // Recursive folder rendering logic...
    const tree = { name: 'root', type: 'folder', children: [] };
    files.forEach(file => {
        const parts = file.path.split('/');
        let current = tree;
        parts.forEach((part, i) => {
            if (i === parts.length - 1) {
                current.children.push({ name: part, type: 'file', ...file });
            } else {
                let folder = current.children.find(c => c.name === part && c.type === 'folder');
                if (!folder) {
                    folder = { name: part, type: 'folder', children: [] };
                    current.children.push(folder);
                }
                current = folder;
            }
        });
    });

    const toggleFolder = (path) => {
        setExpandedFolders(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
    };

    const renderNode = (node, path = '') => {
        const fullPath = path ? `${path}/${node.name}` : node.name;
        const isExpanded = expandedFolders.includes(fullPath);

        if (node.type === 'folder') {
            return (
                <div key={fullPath} className="mb-1">
                    <div
                        onClick={() => toggleFolder(fullPath)}
                        className="flex items-center gap-2 py-2 px-3 hover:bg-white/5 rounded-lg cursor-pointer text-gray-400 hover:text-white transition-colors select-none"
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Folder className="w-4 h-4 text-neon-blue" />
                        <span className="text-sm font-mono">{node.name}</span>
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pl-4 border-l border-white/10 ml-4 overflow-hidden"
                            >
                                {node.children.map(child => renderNode(child, fullPath))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }
        return (
            <div
                key={fullPath}
                onClick={() => onSelectFile && onSelectFile(node)}
                className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer group transition-all mb-1 ${selectedFile?.path === node.path ? 'bg-neon-green/10 text-neon-green' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
            >
                <FileCode className="w-4 h-4 opacity-70" />
                <span className="text-sm font-mono">{node.name}</span>
                <span className="text-[10px] text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {(node.size / 1024).toFixed(1)}KB
                </span>
            </div>
        );
    };

    return (
        <div className="bg-black/30 rounded-xl p-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {tree.children.map(child => renderNode(child))}
        </div>
    );
};


const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, refreshUser } = useAuth();

    // State
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('README'); // 'README', 'CODE', 'DISCUSS', 'AI'
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [relatedProjects, setRelatedProjects] = useState([]);
    const [comments, setComments] = useState([]);
    const [updates, setUpdates] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [likeSpamBlocked, setLikeSpamBlocked] = useState(false);
    const likeClickCount = useRef(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFileLoading, setIsFileLoading] = useState(false);
    const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);

    // Fetch Logic
    // Capture uid on mount only — do NOT put currentUser in deps or the project
    // will re-fetch every time refreshUser() updates the auth state.
    const currentUserRef = React.useRef(currentUser);
    useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

    const location = useLocation();

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            const uid = currentUserRef.current?.uid;
            try {
                const res = await axios.get(`${API_BASE}/api/projects/${id}${uid ? `?userId=${uid}` : ''}`);

                // Handle Tab selection from query param
                const query = new URLSearchParams(location.search);
                const requestedTab = query.get('tab');
                if (requestedTab) setActiveTab(requestedTab.toUpperCase());

                // Legacy support
                if ((!res.data.files || res.data.files.length === 0) && res.data.fileKey) {
                    const filename = res.data.fileKey.split('/').pop();
                    res.data.files = [{ name: filename, path: filename, key: res.data.fileKey, size: 0, type: 'file' }];
                }

                setProject(res.data);
                setLikeCount(res.data.stats?.likes || 0);
                if (uid && res.data.likes?.includes(uid)) setLiked(true);

                // Fetch Related
                const relatedRes = await axios.get(`${API_BASE}/api/projects?category=${res.data.category}&limit=3`);
                setRelatedProjects(relatedRes.data.filter(p => p.id !== id));

                // Fetch Comments
                const commentsRes = await axios.get(`${API_BASE}/api/comments/${id}`);
                setComments(commentsRes.data);

                // Fetch Devlogs
                try {
                    const updatesRes = await axios.get(`${API_BASE}/api/projects/${id}/updates`);
                    setUpdates(updatesRes.data);
                } catch (e) { console.warn("Devlog fetch failed", e); }

                // Check Unlock Status for Premium Projects
                if (res.data.isPremium && uid && res.data.author?.uid !== uid) {
                    try {
                        const checkUrl = `${API_BASE}/api/projects/${id}/download?userId=${uid}`;
                        await axios.head(checkUrl); // Use HEAD or a simple GET to check permission
                        setIsUnlocked(true);
                    } catch (e) {
                        setIsUnlocked(false);
                    }
                } else if (res.data.author?.uid === uid) {
                    setIsUnlocked(true);
                }

            } catch (err) {
                console.error(err);
                if (err.response?.status === 404) navigate('/404');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, navigate]); // ⚠️ NO currentUser here — refreshUser must not trigger a project reload

    // Handlers
    const handleLike = async () => {
        if (!currentUser) return toast.error("Login required to pulse.");
        if (currentUser.restrictions?.muted) return toast.error("🔇 MUTED — Liking is restricted. Contact support to appeal.", { duration: 4000 });

        // Local spam gate — no DB writes, resets on page refresh
        likeClickCount.current += 1;
        if (likeClickCount.current > 10) {
            if (!likeSpamBlocked) {
                setLikeSpamBlocked(true);
                toast.error('🚧 Like limit reached. Slow down.', { duration: 5000 });
            }
            return;
        }
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
        try {
            await axios.post(`${API_BASE}/api/projects/${id}/like`, { userId: currentUser.uid });
        } catch (err) {
            setLiked(liked); // Revert to original state
            setLikeCount(prev => liked ? prev + 1 : prev - 1);
            // Sync user state on security blocks so RestrictionBanner can show.
            if (err.response?.status === 403 || err.response?.status === 429) {
                toast.error(err.response.data?.message || '🔇 Interaction restricted.', { duration: 4000 });
                // Delay slightly to let Firestore write complete before reading back
                setTimeout(() => refreshUser(currentUser.uid), 800);
            }
        }
    };

    const handleDownload = async () => {
        if (currentUser?.restrictions?.downloadBlocked) return toast.error("⬇️ DOWNLOAD BLOCKED — Downloads are restricted on your account. Contact support to appeal.", { duration: 4000 });

        // Trigger Danger Zone for executables
        if (project?.security?.hasExecutables && !isDangerZoneOpen) {
            setIsDangerZoneOpen(true);
            return;
        }

        setIsDangerZoneOpen(false);
        setIsDownloading(true);
        try {
            const url = `${API_BASE}/api/projects/${id}/download${currentUser ? `?userId=${currentUser.uid}` : ''}`;

            // For ZIP downloads (Ad-Zip buffer), we use a hidden link trick
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'blob'
            });

            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Get filename from header if possible
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `${project.title.replace(/\s+/g, '_')}_Source.zip`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch) fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("System downloaded successfully.");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Download connection lost.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleUnlock = async () => {
        if (!currentUser) return toast.error("LOGIN_REQUIRED: Identification protocol failure.");
        if (isUnlocking) return;

        if (!window.confirm(`Initialize protocol: Unlock this system for ${project.unlockKpc} KPC?`)) return;

        setIsUnlocking(true);
        try {
            await axios.post(`${API_BASE}/api/projects/${id}/unlock`, { userId: currentUser.uid });
            toast.success("PROTOCOL_UNLOCKED: Grid access authorized.");
            setIsUnlocked(true);
            refreshUser(currentUser.uid); // Update KPC balance
        } catch (err) {
            toast.error(err.response?.data?.error || "Unlock transition failed.");
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleFileSelect = async (file) => {
        setSelectedFile(file);
        setIsFileLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/projects/raw?key=${encodeURIComponent(file.key)}`);
            setFileContent(res.data);
        } catch (err) {
            console.error(err);
            setFileContent("// Access Denied: Could not retrieve grid segment.");
        } finally {
            setIsFileLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!commentInput.trim()) return;
        if (currentUser?.restrictions?.muted) return toast.error("🔇 MUTED — Commenting is restricted on your account. Contact support to appeal.", { duration: 4000 });
        try {
            const res = await axios.post(`${API_BASE}/api/comments/${id}`, {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.username,
                userAvatar: currentUser.photoURL,
                content: commentInput,
                parentId: replyTo
            });
            setComments([res.data, ...comments]);
            setCommentInput('');
            setReplyTo(null);
            toast.success("Signal transmitted.");
        } catch (err) {
            // Sync user state on security blocks so RestrictionBanner can show.
            if (err.response?.status === 403 || err.response?.status === 429) {
                refreshUser(currentUser.uid);
                toast.error(err.response.data?.message || '🔇 Interaction restricted.', { duration: 4000 });
            } else {
                toast.error("Transmission failed.");
            }
        }
    };


    // Donation Modal State
    const [isDonationOpen, setIsDonationOpen] = useState(false);

    // Review Request State
    const [isRequestOpen, setIsRequestOpen] = useState(false);
    const [reviewRequest, setReviewRequest] = useState({ comments: '', type: 'GENERAL' });

    const handleRequestReview = async () => {
        try {

            await axios.post(`${API_BASE}/api/reviews/request`, {
                userId: currentUser.uid,
                projectId: id,
                comments: reviewRequest.comments,
                type: reviewRequest.type
            });
            toast.success("AUDIT_REQUEST: Sent to community grid.");
            setIsRequestOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.error || "Request failed.");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-void flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                <span className="text-neon-green font-mono text-xs animate-pulse tracking-widest">DECRYPTING_SYSTEM_DATA...</span>
            </div>
        </div>
    );

    if (!project) return null;

    return (
        <div className="min-h-screen pb-20">
            {/* 1. IMMERSIVE HEADER */}
            <header className="relative h-[60vh] w-full overflow-hidden flex items-end">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    {project.screenshots?.[0] ? (
                        <img src={project.screenshots[0]} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-void flex items-center justify-center">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-void via-transparent to-void" />
                </div>

                {/* Header Content */}
                <div className="container mx-auto px-6 pb-12 relative z-10 flex flex-col md:flex-row items-end justify-between gap-8">
                    <div className="space-y-4 max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4"
                        >
                            <span className="px-3 py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                                {project.category}
                            </span>
                            <span className="text-gray-400 font-mono text-xs flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                            <SecurityBadge status={project.security?.scanStatus} summary={project.security?.vtSummary} />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter text-glow"
                        >
                            {project.title}
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            className="flex items-center gap-6"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={project.author?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${project.author?.username || 'anon'}`}
                                    className="w-10 h-10 rounded-full border border-gray-600"
                                />
                                <div>
                                    <p className="text-white font-bold leading-none">{project.author?.username}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Stats / Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                        className="flex gap-4"
                    >
                        <SupportButton
                            receiverUid={project.author?.uid}
                            projectTitle={project.title}
                            projectId={id}
                            className="h-14"
                        />

                        <button
                            onClick={handleLike}
                            className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all ${liked ? 'bg-red-500 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                        >
                            <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                        </button>

                        {project.demoUrl && (
                            <a
                                href={project.demoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                <ExternalLink className="w-5 h-5" /> Live_Demo
                            </a>
                        )}

                        {project.repoUrl && (
                            <a
                                href={project.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="h-14 px-8 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                            >
                                <Code className="w-5 h-5" /> Source_Grid
                            </a>
                        )}
                    </motion.div>
                </div>
            </header>

            {/* 2. TWO-COLUMN LAYOUT */}
            <div className="container mx-auto px-4 md:px-6 -mt-8 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN (MAIN CONTENT) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Tab Navigation */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {['README', 'CODE', ...(project.demoUrl ? ['SHOWCASE'] : []), 'DISCUSS', 'AI_ASSIST'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab
                                        ? 'bg-neon-green text-black shadow-[0_0_15px_rgba(57,255,20,0.3)]'
                                        : 'bg-glass border border-glass-border text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'README' && (
                                    <GlassCard className="prose prose-invert max-w-none">
                                        <SectionTitle icon={FileIcon} title="System Documentation" />
                                        <div className="text-gray-300 font-light leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {project.description}
                                            </ReactMarkdown>
                                        </div>
                                    </GlassCard>
                                )}

                                {activeTab === 'SHOWCASE' && (
                                    <div className="h-[600px]">
                                        <ShowcaseEmbed demoUrl={project.demoUrl} title={project.title} />
                                    </div>
                                )}

                                {activeTab === 'CODE' && (
                                    <GlassCard>
                                        <SectionTitle icon={Code} title="Source Explorer" />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
                                            <div className="col-span-1">
                                                <FileTree
                                                    files={project.files || []}
                                                    selectedFile={selectedFile}
                                                    onSelectFile={handleFileSelect}
                                                    isRepoView
                                                />
                                            </div>
                                            <div className="col-span-2 bg-black/50 rounded-xl border border-white/10 p-4 font-mono text-xs overflow-auto custom-scrollbar relative">
                                                {isFileLoading ? (
                                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                                        <div className="w-6 h-6 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
                                                        <span className="text-[10px] text-neon-blue animate-pulse">STREAMING_MATRIX...</span>
                                                    </div>
                                                ) : selectedFile ? (
                                                    <div className="space-y-4">
                                                        {selectedFile.name.endsWith('.bat') && (
                                                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-500 mb-4">
                                                                <Terminal className="w-4 h-4" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Szkript előnézet (Biztonsági ellenőrzés)</span>
                                                            </div>
                                                        )}
                                                        <pre className="text-gray-300">
                                                            <code>{fileContent || `// Empty file or could not read stream.`}</code>
                                                        </pre>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                                                        <FileCode className="w-8 h-8 opacity-20" />
                                                        <span>AWAITING_SELECTION...</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-white/10 rounded text-[10px] text-gray-400">
                                                    {selectedFile ? selectedFile.name : 'NO_FILE'}
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                )}

                                {activeTab === 'DISCUSS' && (
                                    <div className="space-y-6">
                                        <GlassCard>
                                            <SectionTitle icon={MessageSquare} title={`Transmissions (${comments.length})`} />
                                            <div className="flex gap-4 mb-8">
                                                {currentUser ? (
                                                    <img src={currentUser.photoURL} className="w-10 h-10 rounded-full border border-neon-green" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-800" />
                                                )}
                                                <div className="flex-grow space-y-2">
                                                    {replyTo && (
                                                        <div className="flex items-center justify-between bg-neon-blue/10 px-3 py-1 rounded border border-neon-blue/30 mb-2">
                                                            <span className="text-[10px] text-neon-blue font-bold uppercase tracking-widest">Replying to signal...</span>
                                                            <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white"><X className="w-3 h-3" /></button>
                                                        </div>
                                                    )}
                                                    <textarea
                                                        value={commentInput}
                                                        onChange={(e) => setCommentInput(e.target.value)}
                                                        placeholder={replyTo ? "Compose reply..." : "Broadcast a signal to the creator..."}
                                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-neon-green outline-none min-h-[100px]"
                                                    />
                                                    <button
                                                        onClick={handlePostComment}
                                                        className={`px-6 py-2 font-bold uppercase text-xs tracking-widest rounded-lg transition-colors border ${replyTo ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/30 hover:bg-neon-blue hover:text-black' : 'bg-white/5 text-white border-white/10 hover:bg-neon-green hover:text-black'}`}
                                                    >
                                                        {replyTo ? 'Reply' : 'Transmit'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {comments.filter(c => !c.parentId).map(comment => (
                                                    <div key={comment.id} className="space-y-3">
                                                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-neon-green font-bold text-sm tracking-tight">{comment.userName}</span>
                                                                    <span className="text-gray-600 text-[10px] font-mono">
                                                                        {comment.createdAt?.seconds
                                                                            ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString()
                                                                            : new Date(comment.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setReplyTo(comment.id);
                                                                        setCommentInput(`@${comment.userName} `);
                                                                        document.querySelector('textarea')?.focus();
                                                                    }}
                                                                    className="text-[10px] font-black uppercase text-gray-500 hover:text-neon-blue transition-colors"
                                                                >
                                                                    Reply
                                                                </button>
                                                            </div>
                                                            <div className="text-gray-300 text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {comment.content || comment.text}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>

                                                        {/* Replies */}
                                                        {comments.filter(reply => reply.parentId === comment.id)
                                                            .sort((a, b) => {
                                                                const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                                                                const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                                                                return dateA - dateB; // Ascending for replies
                                                            })
                                                            .map(reply => (
                                                                <div key={reply.id} className="ml-10 p-4 bg-white/5 border-l-2 border-neon-blue/20 rounded-r-xl relative">
                                                                    <div className="absolute -left-6 top-1/2 w-4 h-[1px] bg-neon-blue/20" />
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <span className="text-neon-blue font-bold text-xs">@{reply.userName}</span>
                                                                        <span className="text-gray-600 text-[9px] font-mono">
                                                                            {reply.createdAt?.seconds
                                                                                ? new Date(reply.createdAt.seconds * 1000).toLocaleDateString()
                                                                                : new Date(reply.createdAt).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-gray-400 text-xs leading-relaxed prose prose-invert prose-xs max-w-none opacity-80">
                                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                            {reply.content || reply.text}
                                                                        </ReactMarkdown>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </GlassCard>
                                    </div>
                                )}

                                {activeTab === 'AI_ASSIST' && (
                                    <AIAssistant project={project} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN (SIDEBAR) */}
                    <div className="space-y-6">
                        {/* Stats Panel */}
                        <GlassCard className="space-y-6 sticky top-24">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/5 hover:border-neon-green/30 transition-colors">
                                    <Heart className="w-5 h-5 text-red-500 mx-auto mb-2" />
                                    <div className="text-2xl font-black text-white">{likeCount}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Pulse</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/5 hover:border-neon-blue/30 transition-colors">
                                    <Eye className="w-5 h-5 text-neon-blue mx-auto mb-2" />
                                    <div className="text-2xl font-black text-white">{project.stats?.views || 0}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Visuals</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/5 hover:border-purple-500/30 transition-colors">
                                    <Download className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                                    <div className="text-2xl font-black text-white">{project.stats?.downloads || 0}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Clones</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/5 hover:border-yellow-500/30 transition-colors">
                                    <Share2 className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                                    <div className="text-2xl font-black text-white">-</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Propagate</div>
                                </div>
                            </div>

                            <button
                                onClick={project.isPremium && !isUnlocked ? handleUnlock : handleDownload}
                                disabled={isDownloading || isUnlocking}
                                className={`w-full py-4 text-black font-black uppercase tracking-tighter rounded-2xl flex items-center justify-center gap-3 transition-all relative overflow-hidden group/btn ${project.isPremium && !isUnlocked
                                    ? 'bg-neon-blue shadow-[0_0_30px_rgba(0,183,235,0.3)] hover:scale-[1.02]'
                                    : 'bg-neon-green shadow-neon-glow hover:scale-[1.02]'}`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                                {isDownloading || isUnlocking ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        <span className="animate-pulse">{isUnlocking ? 'UNLOCK_INIT...' : 'DOWNLOADING...'}</span>
                                    </div>
                                ) : project.isPremium && !isUnlocked ? (
                                    <>
                                        <Lock className="w-5 h-5" /> Unlock_Protocol ({project.unlockKpc} KPC)
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" /> Download_System
                                    </>
                                )}
                            </button>

                            {currentUser?.uid === project.author?.uid && (
                                <>
                                    <Link to={`/edit/${id}`} className="block w-full py-3 bg-white/10 text-white text-center font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-white/20 transition-colors border border-white/10">
                                        Modify Protocol
                                    </Link>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("Channel 5,000 KPC to boost system visibility for 24h?")) {
                                                try {
                                                    await axios.post(`${API_BASE}/api/exchange/boost/${id}`, { userId: currentUser.uid });
                                                    toast.success("SYSTEM_GLOW: Visibility amplified.");
                                                    window.location.reload();
                                                } catch (err) {
                                                    toast.error(err.response?.data?.error || "Boost failed.");
                                                }
                                            }
                                        }}
                                        className="block w-full py-3 bg-neon-green/10 text-neon-green text-center font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-neon-green hover:text-black transition-colors border border-neon-green/30"
                                    >
                                        Boost Protocol (5k KPC)
                                    </button>
                                    <button
                                        onClick={() => setIsRequestOpen(true)}
                                        className="block w-full py-3 bg-neon-blue/20 text-neon-blue text-center font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-neon-blue hover:text-black transition-colors border border-neon-blue/30"
                                    >
                                        Request Audit
                                    </button>
                                </>
                            )}
                        </GlassCard>

                        {/* Author Trust Profile */}
                        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img src={project.author?.avatar} className="w-12 h-12 rounded-full border-2 border-neon-green" />
                                    {project.author?.isVerified && (
                                        <div className="absolute -bottom-1 -right-1 bg-neon-blue text-black p-0.5 rounded-full" title="Verified Developer">
                                            <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="font-black text-white text-sm truncate tracking-tight">@{project.author?.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${project.author?.tier === 'TITAN' ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' :
                                            project.author?.tier === 'COMMANDER' ? 'bg-neon-purple text-white' :
                                                project.author?.tier === 'OPERATIVE' ? 'bg-neon-green text-black' :
                                                    project.author?.tier === 'CITIZEN' ? 'bg-neon-blue text-black' :
                                                        project.author?.tier === 'ARCHITECT' ? 'bg-yellow-500 text-black' :
                                                            'bg-gray-800 text-gray-400'
                                            }`}>
                                            {project.author?.tier === 'TITAN' ? '🏮 TITAN' :
                                                project.author?.tier === 'COMMANDER' ? '🎖️ COMMANDER' :
                                                    project.author?.tier === 'OPERATIVE' ? '🦾 OPERATIVE' :
                                                        project.author?.tier === 'CITIZEN' ? '🏙️ CITIZEN' :
                                                            project.author?.tier === 'ARCHITECT' ? '🏛️ ARCHITECT' :
                                                                'GHOST'}
                                        </span>
                                        {project.author?.isVerified && (
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-neon-blue/20 text-neon-blue rounded border border-neon-blue/20">
                                                Verified_Dev
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 space-y-2 border-t border-white/5">
                                <div className="flex justify-between text-[10px] font-mono">
                                    <span className="text-gray-600 uppercase">Tenure</span>
                                    <span className="text-gray-300">
                                        {(() => {
                                            const start = new Date(project.author?.memberSince || Date.now());
                                            const diff = Date.now() - start.getTime();
                                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                            if (days < 30) return `${days} Days`;
                                            const months = Math.floor(days / 30);
                                            if (months < 12) return `${months} Months`;
                                            return `${(months / 12).toFixed(1)} Years`;
                                        })()} member
                                    </span>
                                </div>
                            </div>

                            <Link
                                to={`/p/${project.author?.uid}`}
                                className="block w-full py-2 bg-white/5 hover:bg-white/10 text-white text-center text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                            >
                                View Grid Profile
                            </Link>

                        </div>

                        {/* Recent Activity / Devlog */}
                        <div className="glass-panel rounded-3xl overflow-hidden">
                            <div className="p-4 border-b border-glass-border bg-white/5">
                                <h4 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-neon-purple" /> System Logs
                                </h4>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                <div className="p-4">
                                    <Devlog
                                        projectId={id}
                                        updates={updates}
                                        isAuthor={currentUser?.uid === project.author?.uid}
                                        onUpdate={(newLog) => setUpdates([newLog, ...updates])}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Related Projects */}
                        {relatedProjects.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-black text-white uppercase tracking-widest text-xs ml-2 opacity-50">Related_Systems</h4>
                                {relatedProjects.map(p => (
                                    <Link key={p.id} to={`/project/${p.id}`} className="flex gap-4 p-3 glass-panel rounded-xl hover:bg-white/5 transition-colors group">
                                        <div className="w-16 h-12 bg-gray-800 rounded-lg overflow-hidden">
                                            {p.screenshots?.[0] ? <img src={p.screenshots[0]} className="w-full h-full object-cover" /> : null}
                                        </div>
                                        <div className="flex-grow overflow-hidden">
                                            <h5 className="font-bold text-white text-sm truncate group-hover:text-neon-green transition-colors">{p.title}</h5>
                                            <p className="text-[10px] text-gray-500 font-mono uppercase truncate">@{p.author?.username}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        <AdUnit slot="project-sidebar-slot" format="auto" />
                    </div>
                </div>
            </div>

            {/* DonationModal removed in favor of SupportButton inline component */}

            {/* Danger Zone Modal */}
            <DangerZoneModal
                isOpen={isDangerZoneOpen}
                onClose={() => setIsDangerZoneOpen(false)}
                onConfirm={handleDownload}
                project={project}
            />

            {/* Request Review Modal */}
            {isRequestOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-terminal border border-neon-blue/30 rounded-2xl p-6 max-w-lg w-full relative shadow-[0_0_50px_rgba(59,130,246,0.15)]">
                        <button
                            onClick={() => setIsRequestOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Request Audit</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Audit Type</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['GENERAL', 'SECURITY', 'OPTIMIZATION', 'BUG_HUNT'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setReviewRequest({ ...reviewRequest, type })}
                                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${reviewRequest.type === type
                                                ? 'bg-neon-blue text-black border-neon-blue'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Instructions</label>
                                <textarea
                                    value={reviewRequest.comments}
                                    onChange={(e) => setReviewRequest({ ...reviewRequest, comments: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-neon-blue outline-none h-32 font-mono text-sm"
                                    placeholder="Describe specific areas needing inspection..."
                                />
                            </div>
                            <button
                                onClick={handleRequestReview}
                                className="w-full py-3 bg-neon-blue text-black font-black uppercase tracking-widest rounded-xl hover:bg-white hover:scale-[1.02] transition-all"
                            >
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
