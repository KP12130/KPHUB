import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    User, Calendar, Download, Heart, MessageCircle, Share2, ArrowLeft,
    Trash2, Send, Edit, ExternalLink, MessageSquare, X, Shield, Lock,
    File, Folder, ChevronRight, ChevronDown, Image, CheckCircle2, AlertCircle, Plus,
    CreditCard, Edit3, Code, Database, FileCode, Terminal, Zap, Eye
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AIAssistant from '../components/AIAssistant';
import Devlog from '../components/Devlog';
import SponsoredAd from '../components/SponsoredAd';
import { getReputationTitle } from '../utils/reputation';

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
    const { currentUser } = useAuth();

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
    const [commentInput, setCommentInput] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFileLoading, setIsFileLoading] = useState(false);

    // Fetch Logic
    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/api/projects/${id}${currentUser ? `?userId=${currentUser.uid}` : ''}`);

                // Legacy support
                if ((!res.data.files || res.data.files.length === 0) && res.data.fileKey) {
                    const filename = res.data.fileKey.split('/').pop();
                    res.data.files = [{ name: filename, path: filename, key: res.data.fileKey, size: 0, type: 'file' }];
                }

                setProject(res.data);
                setLikeCount(res.data.stats?.likes || 0);
                if (currentUser && res.data.likes?.includes(currentUser.uid)) setLiked(true);

                // Fetch Related
                const relatedRes = await axios.get(`${API_BASE}/api/projects?category=${res.data.category}&limit=3`);
                setRelatedProjects(relatedRes.data.filter(p => p.id !== id));

                // Fetch Comments - Calibration to /api/comments route
                const commentsRes = await axios.get(`${API_BASE}/api/comments/${id}`);
                setComments(commentsRes.data);

            } catch (err) {
                console.error(err);
                if (err.response?.status === 404) navigate('/404');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, currentUser, navigate]);

    // Handlers
    const handleLike = async () => {
        if (!currentUser) return toast.error("Login required to pulse.");
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
        try {
            await axios.post(`${API_BASE}/api/projects/${id}/like`, { userId: currentUser.uid });
        } catch (err) {
            setLiked(!liked); // Revert
            setLikeCount(prev => liked ? prev + 1 : prev - 1);
        }
    };

    const handleDownload = async () => {
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
        try {
            const res = await axios.post(`${API_BASE}/api/comments/${id}`, {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.username,
                userAvatar: currentUser.photoURL,
                content: commentInput
            });
            setComments([res.data, ...comments]);
            setCommentInput('');
            toast.success("Signal transmitted.");
        } catch (err) {
            toast.error("Transmission failed.");
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
                                    <p className={`text-[10px] font-mono uppercase ${getReputationTitle(project.author?.stats?.reputation || 0).color}`}>
                                        {getReputationTitle(project.author?.stats?.reputation || 0).title}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Stats / Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                        className="flex gap-4"
                    >
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
                            {['README', 'CODE', 'DISCUSS', 'AI_ASSIST'].map((tab) => (
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
                                        <SectionTitle icon={File} title="System Documentation" />
                                        <div className="text-gray-300 font-light leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {project.description}
                                            </ReactMarkdown>
                                        </div>
                                    </GlassCard>
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
                                                    <pre className="text-gray-300">
                                                        <code>{fileContent || `// Empty file or could not read stream.`}</code>
                                                    </pre>
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
                                                    <textarea
                                                        value={commentInput}
                                                        onChange={(e) => setCommentInput(e.target.value)}
                                                        placeholder="Broadcast a signal to the creator..."
                                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-neon-green outline-none min-h-[100px]"
                                                    />
                                                    <button
                                                        onClick={handlePostComment}
                                                        className="px-6 py-2 bg-white/5 hover:bg-neon-green hover:text-black text-white font-bold uppercase text-xs tracking-widest rounded-lg transition-colors border border-white/10"
                                                    >
                                                        Transmit
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {comments.map(comment => (
                                                    <div key={comment.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-neon-green font-bold text-sm">{comment.userName}</span>
                                                                <span className="text-gray-600 text-xs font-mono">
                                                                    {comment.createdAt?.seconds
                                                                        ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString()
                                                                        : new Date(comment.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-gray-300 text-sm leading-relaxed">{comment.content || comment.text}</p>
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
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="w-full py-4 bg-neon-green text-black font-black uppercase tracking-widest rounded-xl hover:bg-white hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        ARCHIVING...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" /> Download_System
                                    </>
                                )}
                            </button>

                            {currentUser?.uid === project.author?.uid && (
                                <Link to={`/edit/${id}`} className="block w-full py-3 bg-white/10 text-white text-center font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-white/20 transition-colors border border-white/10">
                                    Modify Protocol
                                </Link>
                            )}
                        </GlassCard>

                        {/* Recent Activity / Devlog */}
                        <div className="glass-panel rounded-3xl overflow-hidden">
                            <div className="p-4 border-b border-glass-border bg-white/5">
                                <h4 className="font-bold text-white uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-neon-purple" /> System Logs
                                </h4>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {/* Mock Logs */}
                                <div className="p-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full bg-neon-green mt-1.5 shadow-[0_0_5px_#0f0]" />
                                        <div>
                                            <p className="text-xs text-gray-300 font-mono">System initialized v1.0.0</p>
                                            <p className="text-[10px] text-gray-600">{new Date(project.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
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

                        <SponsoredAd />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
