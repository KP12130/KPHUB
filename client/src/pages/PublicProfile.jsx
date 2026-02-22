import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api';
import { motion } from 'framer-motion';
import { User, Calendar, Award, Code, Trophy, ArrowLeft, Github, Twitter, Globe, ExternalLink, Gift, Heart, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ProjectCard from '../components/ProjectCard';
import { ActivityCalendar as GitHubCalendar } from 'react-activity-calendar';

const PublicProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [badgeDefs, setBadgeDefs] = useState({});
    const [allFlares, setAllFlares] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [topDonors, setTopDonors] = useState([]);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [ranks, setRanks] = useState({});
    const [isGifting, setIsGifting] = useState(null);
    const { currentUser, updateUser } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const [res, badgesRes, flaresRes, donorsRes, ranksRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/users/profile/${username}?viewerId=${currentUser?.uid || ''}`),
                    axios.get(`${API_BASE}/api/users/badges/definitions`),
                    axios.get(`${API_BASE}/api/exchange/flares`),
                    axios.get(`${API_BASE}/api/exchange/top-donors/${username}`),
                    axios.get(`${API_BASE}/api/exchange/ranks`)
                ]);

                setProfile(res.data);
                setBadgeDefs(badgesRes.data);
                setAllFlares(flaresRes.data);
                setTopDonors(donorsRes.data);
                setRanks(ranksRes.data);

                if (currentUser && res.data.user.followers?.includes(currentUser.uid)) {
                    setIsFollowing(true);
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
                setError(err.response?.data?.error || 'Profile not found');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username, currentUser]);

    const handleFollowToggle = async () => {
        if (!currentUser) return toast.error("Please login to follow creators!");
        try {
            if (isFollowing) {
                await axios.post(`${API_BASE}/api/users/unfollow/${profile.user.uid}`, { followerId: currentUser.uid });
                setIsFollowing(false);
                setProfile(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        stats: {
                            ...prev.user.stats,
                            followersCount: (prev.user.stats?.followersCount || 1) - 1
                        }
                    }
                }));
            } else {
                await axios.post(`${API_BASE}/api/users/follow/${profile.user.uid}`, {
                    followerId: currentUser.uid,
                    followerName: currentUser.displayName || currentUser.username
                });
                setIsFollowing(true);
                setProfile(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        stats: {
                            ...prev.user.stats,
                            followersCount: (prev.user.stats?.followersCount || 0) + 1
                        }
                    }
                }));
            }
        } catch (err) {
            console.error("Follow toggle failed", err);
            toast.error("Handshake failed. Protocol interference.");
        }
    };

    const handleGiftRank = async (rankId) => {
        if (!currentUser) return toast.error("Identity unknown. Login to gift.");
        const rank = ranks[rankId];
        if (currentUser.stats?.kpcBalance < rank.kpcPrice) return toast.error("Insufficient KPC credits.");

        setIsGifting(rankId);
        try {
            await axios.post(`${API_BASE}/api/exchange/gift-rank`, {
                donorId: currentUser.uid,
                targetId: profile.user.uid,
                rankId
            });
            toast.success(`Success! ${rankId} gifted to ${profile.user.username}.`);
            setShowGiftModal(false);
            updateUser({ stats: { ...currentUser.stats, kpcBalance: currentUser.stats.kpcBalance - rank.kpcPrice } });
        } catch (err) {
            toast.error(err.response?.data?.error || "Gift protocol aborted.");
        } finally {
            setIsGifting(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center text-neon-green">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen flex flex-col justify-center items-center text-red-500 gap-4">
            <p className="text-xl font-mono">ERROR: {error.toUpperCase()}</p>
            <Link to="/" className="text-neon-green hover:underline flex items-center gap-2 font-mono">
                <ArrowLeft className="w-4 h-4" /> RETURN_TO_GRID
            </Link>
        </div>
    );

    const { user, projects } = profile;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-terminal border border-gray-800 rounded-2xl p-8 mb-12 relative overflow-hidden shadow-2xl"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <User className="w-48 h-48" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                    {/* Avatar */}
                    <div className="relative group">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="w-32 h-32 rounded-2xl border-2 border-gray-800 group-hover:border-neon-green transition-all object-cover shadow-[0_0_20px_rgba(0,0,0,0.5)]" />
                        ) : (
                            <div className="w-32 h-32 rounded-2xl bg-gray-900 flex items-center justify-center border-2 border-gray-800 group-hover:border-neon-green transition-all">
                                <User className="w-12 h-12 text-gray-700" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-3xl font-black text-white mb-1 uppercase tracking-tighter flex shadow-glow-sm items-center justify-center md:justify-start gap-3">
                            <span style={user.activeFlare ? Object.fromEntries(allFlares[user.activeFlare]?.style.split(';').filter(s => s).map(s => s.split(':').map(x => x.trim()))) : {}}>
                                {user.displayName || user.username}
                            </span>
                            {user.stats?.verified && (
                                <div className="p-1 bg-neon-blue/10 rounded-full border border-neon-blue/30 scale-75 md:scale-100">
                                    <Trophy className="w-4 h-4 text-neon-blue" />
                                </div>
                            )}
                            {user.tier && user.tier !== 'GHOST' && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${user.tier === 'ELITE' ? 'bg-purple-500 text-white' : 'bg-neon-green text-black'}`}>
                                    {user.tier}
                                </span>
                            )}
                        </h1>
                        <div className="flex items-center gap-2 mb-4">
                            <p className="text-neon-green font-mono text-sm">@{user.username}</p>
                            <div className="flex gap-1">
                                {user.roles?.map(role => (
                                    <span key={role} className="px-1.5 py-0.5 bg-neon-blue/10 border border-neon-blue/30 rounded text-[8px] text-neon-blue font-mono font-bold uppercase">
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                            {currentUser && currentUser.uid !== user.uid && (
                                <button
                                    onClick={handleFollowToggle}
                                    className={`px-8 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${isFollowing
                                        ? 'bg-gray-800 text-gray-500 border border-gray-700'
                                        : 'bg-neon-blue text-black hover:bg-white shadow-[0_0_20px_rgba(0,212,255,0.2)]'
                                        }`}
                                >
                                    {isFollowing ? 'Disconnected' : 'Sync_Follow'}
                                </button>
                            )}
                            {currentUser && currentUser.uid !== user.uid && (
                                <button
                                    onClick={() => setShowGiftModal(true)}
                                    className="px-8 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple hover:text-white"
                                >
                                    <Gift className="w-4 h-4" /> Gift_Rank
                                </button>
                            )}
                        </div>

                        <p className="text-gray-400 max-w-xl mb-6 text-sm leading-relaxed">
                            {user.bio || "No biography available for this citizen of the grid."}
                        </p>


                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className="flex items-center gap-6 bg-void px-4 py-2 rounded-lg border border-gray-800">
                                <div className="flex flex-col items-center">
                                    <span className="text-white font-black text-xs">{user.stats?.followersCount || user.followers?.length || 0}</span>
                                    <span className="text-[8px] text-gray-500 uppercase font-mono">Followers</span>
                                </div>
                                <div className="h-4 w-[1px] bg-gray-800" />
                                <div className="flex flex-col items-center">
                                    <span className="text-white font-black text-xs">{user.stats?.followingCount || user.following?.length || 0}</span>
                                    <span className="text-[8px] text-gray-500 uppercase font-mono">Following</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-void px-4 py-2 rounded-lg border border-gray-800">
                                <Award className="w-4 h-4 text-neon-blue" />
                                <span className="text-white font-mono text-xs">{projects.length} UPLOADS</span>
                            </div>
                            <div className="flex items-center gap-2 bg-void px-4 py-2 rounded-lg border border-gray-800">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-white font-mono text-xs">JOINED {user.createdAt ? new Date(user.createdAt._seconds * 1000).toLocaleDateString() : 'UNKNOWN'}</span>
                            </div>
                        </div>

                        {/* Socials & Badges */}
                        <div className="mt-8 flex flex-col md:flex-row gap-8">
                            {/* Badges */}
                            {user.badges?.length > 0 && (
                                <div className="flex-grow">
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                                        <Award className="w-3 h-3 text-neon-green" />
                                        Protocol_Achievements
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {user.badges.map(badgeId => {
                                            const def = badgeDefs[badgeId];
                                            if (!def) return null;
                                            return (
                                                <div
                                                    key={badgeId}
                                                    className="relative group bg-gray-900/50 border border-gray-800 p-2 pr-3 rounded-lg flex items-center gap-2 hover:border-neon-green/50 transition-all hover:bg-gray-800 cursor-help"
                                                >
                                                    <span className="text-xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{def.icon}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-gray-300 group-hover:text-neon-green uppercase tracking-wider">{def.name}</span>
                                                    </div>

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-black border border-neon-green/30 text-white text-[10px] p-2 rounded hidden group-hover:block z-50 shadow-xl">
                                                        {def.description}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neon-green/30"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Social Links */}
                            {user.socials && (Object.values(user.socials).some(v => v)) && (
                                <div className="min-w-[150px]">
                                    <h3 className="text-[10px] font-black text-gray-600 uppercase mb-3 tracking-widest">Connect</h3>
                                    <div className="flex gap-3">
                                        {user.socials.github && (
                                            <a href={`https://github.com/${user.socials.github}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:border-neon-green transition-all">
                                                <Github className="w-5 h-5" />
                                            </a>
                                        )}
                                        {user.socials.twitter && (
                                            <a href={`https://twitter.com/${user.socials.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:border-neon-green transition-all">
                                                <Twitter className="w-5 h-5" />
                                            </a>
                                        )}
                                        {user.socials.website && (
                                            <a href={user.socials.website.startsWith('http') ? user.socials.website : `https://${user.socials.website}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:border-neon-green transition-all">
                                                <Globe className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Top Benefactors */}
                            {topDonors.length > 0 && (
                                <div className="min-w-[200px]">
                                    <h3 className="text-[10px] font-black text-neon-blue uppercase mb-3 tracking-widest flex items-center gap-2">
                                        <Heart className="w-3 h-3 animate-pulse" />
                                        Top_Benefactors
                                    </h3>
                                    <div className="space-y-2">
                                        {topDonors.map((donor, idx) => (
                                            <div key={donor.id} className="flex items-center justify-between text-[10px] font-mono border-b border-white/5 pb-1">
                                                <span className="text-gray-400">
                                                    <span className="text-neon-blue mr-1">#{idx + 1}</span>
                                                    @{donor.username}
                                                </span>
                                                <span className="text-neon-green">{donor.total.toLocaleString()} KPC</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* GitHub Activity Section */}
            {user.socials?.github && (() => {
                // Extract username whether it's a full URL or just a handle
                const githubLink = user.socials.github;
                const githubUsername = githubLink.split('/').pop();
                // Simple extraction: assumes "username" or "github.com/username" or "https://github.com/username"
                // Better regex:
                const cleanUsername = githubLink.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '').replace(/\/$/, '');

                return (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <Github className="w-5 h-5 text-white" />
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">Neural Commit Stream</h2>
                        </div>
                        <div className="bg-terminal border border-gray-800 rounded-2xl p-6 overflow-hidden overflow-x-auto custom-scrollbar">
                            <div className="min-w-[700px]">
                                <GitHubCalendar
                                    username={cleanUsername}
                                    colorScheme="dark"
                                    theme={{
                                        dark: ['#1a1a1a', '#0e4429', '#006d32', '#26a641', '#39d353'],
                                    }}
                                    fontSize={10}
                                    blockSize={10}
                                    blockMargin={4}
                                />
                            </div>
                        </div>
                    </div>
                );
            })()}

            <div>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black flex items-center gap-2 italic">
                        <Code className="text-neon-green" />
                        Systems Repository
                    </h2>
                </div>

                {projects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-terminal border border-dashed border-gray-800 rounded-2xl">
                        <p className="text-gray-600 font-mono">No projects found in this repository.</p>
                    </div>
                )}
                {/* Gifting Modal */}
                {showGiftModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-void/90 backdrop-blur-sm"
                            onClick={() => setShowGiftModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="relative bg-terminal border border-neon-purple/30 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(147,51,234,0.2)]"
                        >
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2 flex items-center gap-3">
                                <Gift className="text-neon-purple" /> Rank_Distribution
                            </h2>
                            <p className="text-gray-400 text-xs font-mono mb-8">Authorize a grid-wide protocol upgrade for <span className="text-neon-purple">@{user.username}</span>.</p>

                            <div className="space-y-4">
                                {['PRO', 'ELITE'].map(rankId => (
                                    <button
                                        key={rankId}
                                        onClick={() => handleGiftRank(rankId)}
                                        disabled={isGifting || user.tier === rankId}
                                        className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${user.tier === rankId ? 'border-white/5 opacity-50' : 'border-white/10 hover:border-neon-purple bg-void/50'}`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Shield className={`w-4 h-4 ${rankId === 'PRO' ? 'text-neon-blue' : 'text-neon-purple'}`} />
                                                <span className="text-white font-black uppercase tracking-widest text-sm">{ranks[rankId]?.label}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1">{ranks[rankId]?.kpcPrice.toLocaleString()} KPC</p>
                                        </div>
                                        <div className="text-[10px] font-black text-neon-purple uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isGifting === rankId ? 'COMMITTING...' : user.tier === rankId ? 'ALREADY_ACTIVE' : 'SEND_GIFT'}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowGiftModal(false)}
                                className="w-full mt-8 py-3 text-[10px] font-black uppercase text-gray-600 hover:text-white transition-colors"
                            >
                                Abort_Protocol
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicProfile;
