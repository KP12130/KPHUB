import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE } from '../api';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import {
    LayoutDashboard, Trophy, Code, Upload as UploadIcon, HelpCircle,
    Bell, BellDot, User, LogOut, Menu, X, Target, Terminal, ShoppingCart, Zap
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { getReputationTitle } from '../utils/reputation';
import useSound from '../hooks/useSound';

const Navbar = ({ onOpenCommandPalette }) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const { playSound } = useSound();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [allFlares, setAllFlares] = useState({});

    useEffect(() => {
        const fetchFlares = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/exchange/flares`);
                setAllFlares(res.data);
            } catch (err) {
                console.error("Flares fetch failed", err);
            }
        };
        fetchFlares();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            }).slice(0, 20);

            // Check for new notifications to play sound
            if (fetched.length > notifications.length) {
                const newOnes = fetched.filter(f => !notifications.find(o => o.id === f.id));
                if (newOnes.some(n => !n.read)) {
                    playSound('pop');
                }
            }

            setNotifications(fetched);
        });

        return () => unsubscribe();
    }, [currentUser, notifications.length]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    }

    const markAsRead = async (id) => {
        try {
            await updateDoc(doc(db, 'notifications', id), {
                read: true
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <nav className="w-full bg-glass backdrop-blur-xl border border-glass-border rounded-2xl shadow-2xl relative z-50 overflow-hidden group">
            {/* Neon Glow Line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" onMouseEnter={() => playSound('hover')} className="text-2xl font-black tracking-tighter text-white z-50 relative group/logo">
                    <span className="text-glow-sm group-hover/logo:text-neon-green transition-colors duration-300">KP</span>
                    <span className="text-neon-green group-hover/logo:text-white transition-colors duration-300">HUB</span>
                </Link>

                {/* Command Center Trigger */}
                <button
                    onClick={onOpenCommandPalette}
                    onMouseEnter={() => playSound('hover')}
                    className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                >
                    <Terminal className="w-4 h-4 text-neon-green group-hover:animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Execute_Command</span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/40 rounded border border-white/5">
                        <span className="text-[8px] text-gray-500 font-bold">CTRL K</span>
                    </div>
                </button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                    {currentUser ? (
                        <>
                            <div className="flex bg-black/20 rounded-full px-4 py-2 border border-white/5 backdrop-blur-sm shadow-inner gap-4">
                                <Link to="/studio" onMouseEnter={() => playSound('hover')} className="text-gray-400 hover:text-neon-green transition-all hover:scale-110" title="Creator Studio"><LayoutDashboard className="w-5 h-5" /></Link>
                                <Link to="/missions" onMouseEnter={() => playSound('hover')} className="text-gray-400 hover:text-neon-green transition-all hover:scale-110" title="Missions"><Target className="w-5 h-5" /></Link>
                                <Link to="/hackathons" onMouseEnter={() => playSound('hover')} className="text-gray-400 hover:text-neon-purple transition-all hover:scale-110" title="Hackathons"><Trophy className="w-5 h-5" /></Link>
                                <Link to="/reviews" onMouseEnter={() => playSound('hover')} className="text-gray-400 hover:text-neon-blue transition-all hover:scale-110" title="Code Reviews"><Code className="w-5 h-5" /></Link>
                                <Link to="/upload" onMouseEnter={() => playSound('hover')} className="text-gray-400 hover:text-neon-green transition-all hover:scale-110" title="Deploy"><UploadIcon className="w-5 h-5" /></Link>
                                <Link to="/support" onMouseEnter={() => playSound('hover')} className="text-gray-400 hover:text-white transition-all hover:scale-110" title="Support"><HelpCircle className="w-5 h-5" /></Link>
                            </div>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="text-gray-400 hover:text-neon-green transition-colors relative p-2 rounded-full hover:bg-white/5"
                                >
                                    {unreadCount > 0 ? <BellDot className="w-5 h-5 text-neon-green animate-pulse" /> : <Bell className="w-5 h-5" />}
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-neon-primary rounded-full animate-ping" />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showNotifications && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-4 w-80 glass-panel rounded-xl z-50 overflow-hidden"
                                        >
                                            <div className="p-3 border-b border-glass-border flex justify-between items-center bg-black/40">
                                                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">System Alerts</span>
                                                {unreadCount > 0 && <span className="text-[10px] text-neon-green font-mono">{unreadCount} New</span>}
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map(n => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => {
                                                                markAsRead(n.id);
                                                                navigate(`/project/${n.projectId}`);
                                                                setShowNotifications(false);
                                                            }}
                                                            className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!n.read ? 'bg-neon-green/5 border-l-2 border-l-neon-green' : ''}`}
                                                        >
                                                            <p className="text-xs text-gray-300 flex items-center gap-1 flex-wrap">
                                                                <span className="text-neon-green font-bold">{n.senderName}</span>
                                                                {n.senderTier && n.senderTier !== 'GHOST' && (
                                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest ${n.senderTier === 'ELITE' ? 'bg-neon-purple text-white' : 'bg-neon-green text-black'}`}>
                                                                        {n.senderTier}
                                                                    </span>
                                                                )}
                                                                <span className="text-gray-500 text-[10px] uppercase font-bold">{n.type === 'like' ? 'endorsed' : 'commented'}</span>
                                                                <span className="text-white font-bold ml-1 truncate max-w-[150px]">{n.projectTitle}</span>
                                                            </p>
                                                            <span className="text-[9px] text-gray-600 font-mono italic mt-1 block">
                                                                {n.createdAt?.toDate
                                                                    ? n.createdAt.toDate().toLocaleTimeString()
                                                                    : n.createdAt?.seconds
                                                                        ? new Date(n.createdAt.seconds * 1000).toLocaleTimeString()
                                                                        : new Date(n.createdAt).toLocaleTimeString() || 'Just now'}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-8 text-center text-[10px] text-gray-700 font-mono uppercase tracking-widest">No Alerts Detected</div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex bg-black/20 rounded-full px-4 py-2 border border-white/5 backdrop-blur-sm shadow-inner gap-4 items-center">
                                <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
                                    <Zap className="w-3.5 h-3.5 text-neon-green" />
                                    <span className="text-[10px] font-black text-white">{currentUser.stats?.kpcBalance?.toLocaleString() || 0}</span>
                                    <span className="text-[8px] font-mono text-neon-green uppercase tracking-tighter">KPC</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-terminal border border-neon-blue/30 rounded flex items-center justify-center text-[8px] font-black text-neon-blue">
                                        {Math.floor(Math.sqrt((currentUser.stats?.xp || 0) / 100)) || 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white leading-none">REP: {currentUser.stats?.reputation || 0}</span>
                                        <span className={`text-[8px] font-mono text-neon-blue uppercase tracking-widest ${getReputationTitle(currentUser.stats?.reputation || 0).color}`}>{getReputationTitle(currentUser.stats?.reputation || 0).title}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pl-4 border-l border-glass-border">
                                <Link to="/studio" className="flex items-center gap-2 group">
                                    <div className="flex flex-col items-end">
                                        <p className="text-white font-black text-xs group-hover:text-neon-green transition-colors flex items-center gap-2">
                                            <span style={currentUser.activeFlare ? Object.fromEntries(allFlares[currentUser.activeFlare]?.style.split(';').filter(s => s).map(s => s.split(':').map(x => x.trim()))) : {}}>
                                                {currentUser.displayName}
                                            </span>
                                            {currentUser.stats?.verified && <Trophy className="w-3 h-3 text-neon-blue" />}
                                        </p>
                                        <p className={`text-[8px] font-mono leading-none mt-1 uppercase tracking-widest ${getReputationTitle(currentUser.stats?.reputation || 0).color}`}>
                                            {getReputationTitle(currentUser.stats?.reputation || 0).title}
                                        </p>
                                    </div>
                                    {currentUser.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-neon-green shadow-lg transition-all object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-gray-400 border border-gray-600 rounded-full p-2 bg-black/50" />
                                    )}
                                </Link>
                                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-lg"><LogOut className="w-4 h-4" /></button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors">Login</Link>
                            <Link to="/signup" className="px-6 py-3 bg-neon-green text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(57,255,20,0.4)]">
                                Initialize
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <div className="md:hidden flex items-center gap-4">
                    {currentUser && unreadCount > 0 && (
                        <BellDot className="w-5 h-5 text-neon-green animate-pulse" onClick={() => setShowNotifications(true)} />
                    )}
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white z-50 p-2 hover:bg-white/10 rounded-lg transition-colors">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-0 bg-void/95 backdrop-blur-xl z-40 flex flex-col pt-32 px-8"
                        >
                            <div className="space-y-8">
                                {currentUser && (
                                    <div className="pb-8 border-b border-gray-900 mb-8">
                                        <div className="flex items-center gap-4">
                                            <img src={currentUser.photoURL} alt="P" className="w-14 h-14 rounded-full border border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.2)]" />
                                            <div>
                                                <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{currentUser.displayName}</p>
                                                <p className={`text-[10px] font-mono tracking-[0.3em] uppercase ${getReputationTitle(currentUser.stats?.reputation || 0).color}`}>
                                                    {getReputationTitle(currentUser.stats?.reputation || 0).title}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-6">
                                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-black text-white hover:text-neon-green tracking-tighter">HOME</Link>
                                    <Link to="/explore" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-black text-gray-500 hover:text-white tracking-tighter">DISCOVERY</Link>
                                    {currentUser && <Link to="/studio" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-black text-neon-green tracking-tighter">STUDIO_ACCESS</Link>}
                                    <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-gray-600 tracking-widest uppercase">ABOUT_SYSTEM</Link>
                                </div>

                                {currentUser && notifications.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-gray-900 overflow-y-auto max-h-[30vh]">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recent Signals</p>
                                        {notifications.slice(0, 5).map(n => (
                                            <div key={`mob-notif-${n.id}`} onClick={() => { markAsRead(n.id); navigate(`/project/${n.projectId}`); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                                                <div className={`w-1.5 h-1.5 rounded-full ${n.read ? 'bg-gray-700' : 'bg-neon-green animate-pulse'}`} />
                                                <div className="flex-grow min-w-0">
                                                    <p className="text-[10px] text-white truncate"><span className="text-neon-green font-bold">{n.senderName}</span> {n.type === 'like' ? 'endorsed' : 'commented'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {currentUser ? (
                                    <button onClick={handleLogout} className="mt-8 text-red-500 font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                        <LogOut className="w-4 h-4" /> Terminate Session
                                    </button>
                                ) : (
                                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="mt-8 block text-center px-8 py-4 bg-neon-green text-black font-black uppercase tracking-widest rounded-xl">
                                        Initialize Session
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default Navbar;
