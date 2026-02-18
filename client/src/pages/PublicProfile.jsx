import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Calendar, Award, Code, Trophy, ArrowLeft, Github, Twitter, Globe, ExternalLink } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import { getReputationTitle } from '../utils/reputation';
import { ActivityCalendar as GitHubCalendar } from 'react-activity-calendar';

const PublicProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [badgeDefs, setBadgeDefs] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
                const res = await axios.get(`${API_BASE}/api/users/profile/${username}?viewerId=${currentUser?.uid || ''}`);
                setProfile(res.data);
                // Fetch badge definitions
                const badgesRes = await axios.get(`${API_BASE}/api/users/badges/definitions`);
                setBadgeDefs(badgesRes.data);

                // Check if following
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
        if (!currentUser) return alert("Please login to follow creators!");
        try {
            if (isFollowing) {
                await axios.post(`http://localhost:5000/api/users/unfollow/${profile.user.uid}`, { followerId: currentUser.uid });
                setIsFollowing(false);
            } else {
                await axios.post(`http://localhost:5000/api/users/follow/${profile.user.uid}`, { followerId: currentUser.uid });
                setIsFollowing(true);
            }
        } catch (err) {
            console.error("Follow toggle failed", err);
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
                        <div className="absolute -bottom-2 -right-2 bg-neon-green text-black px-2 py-0.5 rounded font-black text-[10px] tracking-widest uppercase">
                            Level {Math.floor((user.stats?.reputation || 0) / 100) + 1}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-grow text-center md:text-left">
                        <h1 className="text-3xl font-black text-white mb-1 uppercase tracking-tighter flex items-center gap-3">
                            {user.displayName || user.username}
                            {user.tier && user.tier !== 'GHOST' && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${user.tier === 'ELITE' ? 'bg-purple-500 text-white' : 'bg-neon-green text-black'}`}>
                                    {user.tier}
                                </span>
                            )}
                        </h1>
                        <div className="flex items-center gap-2 mb-4">
                            <p className="text-neon-green font-mono text-sm">@{user.username}</p>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded border border-white/10 ${getReputationTitle(user.stats?.reputation || 0).color}`}>
                                {getReputationTitle(user.stats?.reputation || 0).title}
                            </span>
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
                        </div>

                        <p className="text-gray-400 max-w-xl mb-6 text-sm leading-relaxed">
                            {user.bio || "No biography available for this citizen of the grid."}
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className="flex items-center gap-2 bg-void px-4 py-2 rounded-lg border border-gray-800">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                <span className="text-white font-mono text-xs">{user.stats?.reputation || 0} REP</span>
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
            </div>
        </div>
    );
};

export default PublicProfile;
