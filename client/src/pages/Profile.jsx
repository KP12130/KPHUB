import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../api';

import { motion } from 'framer-motion';
import { User, Calendar, Save, ArrowLeft, AtSign, FileText, Github, Twitter, Globe, Shield, Zap, Trophy, Crown, Loader } from 'lucide-react';

const Profile = () => {
    const { currentUser, updateUser } = useAuth();
    const { currentTheme, setCurrentTheme, themes } = useTheme();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        bio: '',
        gender: '',
        birthdate: '',
        photoURL: '',
        badges: [],
        socials: {
            github: '',
            twitter: '',
            website: ''
        }
    });
    const [badgeDefs, setBadgeDefs] = useState({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rankDefs, setRankDefs] = useState({});
    const [purchasing, setPurchasing] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/users/${currentUser.uid}`);
                const user = res.data;
                setFormData({
                    username: user.username || '',
                    displayName: user.displayName || '',
                    bio: user.bio || '',
                    gender: user.gender || '',
                    birthdate: user.birthdate || '',
                    photoURL: user.photoURL || '',
                    badges: user.badges || []
                });
                // Fetch badge definitions
                const badgesRes = await axios.get(`${API_BASE}/api/users/badges/definitions`);
                setBadgeDefs(badgesRes.data);
                // Fetch rank definitions
                const ranksRes = await axios.get(`${API_BASE}/api/exchange/ranks`);
                setRankDefs(ranksRes.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load profile details.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [currentUser, navigate]);

    const handleRankPurchase = async (rankId) => {
        const rank = rankDefs[rankId];
        if (!window.confirm(`Initialize ${rankId} Protocol? This will deduct ${rank.kpcPrice} KPC from your balance.`)) return;

        setPurchasing(rankId);
        setError('');
        try {
            const res = await axios.post(`${API_BASE}/api/exchange/purchase`, {
                uid: currentUser.uid,
                rankId
            });
            setSuccess(res.data.message);
            // Refresh user data
            const userRes = await axios.get(`${API_BASE}/api/users/${currentUser.uid}`);
            updateUser(userRes.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Purchase failed.');
        } finally {
            setPurchasing(null);
        }
    };

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // 1. Upload Avatar if selected
            if (avatarFile) {
                const formData = new FormData();
                formData.append('avatar', avatarFile);
                await axios.post(`${API_BASE}/api/users/${currentUser.uid}/avatar`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // 2. Update Profile Data
            await axios.put(`${API_BASE}/api/users/${currentUser.uid}`, {
                uid: currentUser.uid,
                ...formData
            });
            setSuccess('Profile updated successfully!');

            // Refetch simple data to get potentially updated fields
            const res = await axios.get(`${API_BASE}/api/users/${currentUser.uid}`);

            // Update local form state
            setFormData(prev => ({ ...prev, ...res.data }));
            setAvatarFile(null);
            setAvatarPreview(null);

            // Sync AuthContext (this updates Navbar immediately)
            updateUser(res.data);

        } catch (err) {
            console.error(err);
            setError('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center text-neon-green">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-10 px-4 max-w-2xl mx-auto">
            <Link to="/" className="text-gray-500 hover:text-white flex items-center gap-2 mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-terminal border border-gray-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green to-emerald-500" />

                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">
                    IDENTITY_PROTOCOL
                </h2>
                <div className="max-w-xs mb-8">
                    <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                        <span>Wealth_Index</span>
                        <span className="text-neon-green">{currentUser.stats?.kpcBalance?.toLocaleString() || 0} KPC</span>
                    </div>
                </div>
                <p className="text-gray-500 mb-8 font-mono text-sm">Manage your public identity on the grid.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-neon-green/10 border border-neon-green text-neon-green p-3 rounded mb-6 text-sm">
                        {success}
                    </div>
                )}

                {/* Badges Display */}
                {formData.badges.length > 0 && (
                    <div className="mb-8 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                            <span className="text-xl">🏆</span> Achievements_Unlocked
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {formData.badges.map(badgeId => {
                                const def = badgeDefs[badgeId];
                                if (!def) return null;
                                return (
                                    <div
                                        key={badgeId}
                                        className="relative group bg-black border border-gray-800 p-2 pr-3 rounded-lg flex items-center gap-2 hover:border-neon-green/50 transition-all hover:bg-gray-800 cursor-help"
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

                <div className="flex justify-center mb-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-800 group-hover:border-neon-green transition-colors">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : formData.photoURL ? (
                                <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : currentUser.photoURL ? (
                                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                    <User className="w-12 h-12 text-gray-500" />
                                </div>
                            )}
                        </div>
                        <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                            <span className="text-white text-xs font-bold uppercase">Change</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username (Limited Change) */}
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Username (@)</label>
                        <div className="relative">
                            <AtSign className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-green transition-colors"
                            />
                        </div>
                        <p className="text-xs text-gray-600 mt-1 font-mono">
                            Warning: You can only change your username once every 14 days.
                        </p>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Display Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-green transition-colors"
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Bio / About Me</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-green transition-colors min-h-[100px]"
                                placeholder="Tell us about yourself..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Gender */}
                        <div>
                            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Gender</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-neon-green transition-colors appearance-none"
                            >
                                <option value="" disabled>Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </div>

                        {/* Birthdate */}
                        <div>
                            <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Birthdate</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                                <input
                                    type="date"
                                    value={formData.birthdate}
                                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-green transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4 pt-4 border-t border-gray-900">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            Social_Connectivity
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Github className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="GitHub Username"
                                    value={formData.socials?.github || ''}
                                    onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, github: e.target.value } })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-neon-green transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <Twitter className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Twitter Handle"
                                    value={formData.socials?.twitter || ''}
                                    onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, twitter: e.target.value } })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-neon-green transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Personal Website"
                                    value={formData.socials?.website || ''}
                                    onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, website: e.target.value } })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-neon-green transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Rank Advancement */}
                    <div className="space-y-4 pt-8 border-t border-gray-900">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Shield className="w-4 h-4 text-neon-blue" /> Tier_Advancement
                        </h3>
                        <p className="text-[10px] text-gray-600 font-mono uppercase">Upgrade your clearance level and gain new roles.</p>

                        <div className="grid grid-cols-1 gap-4">
                            {Object.entries(rankDefs).map(([id, rank]) => {
                                const isOwned = currentUser?.tier === id;
                                const canAfford = (currentUser?.stats?.kpcBalance || 0) >= rank.kpcPrice;
                                const isPurchasing = purchasing === id;

                                return (
                                    <div
                                        key={id}
                                        className={`p-4 rounded-xl border transition-all ${isOwned
                                            ? 'border-neon-green bg-neon-green/5'
                                            : 'border-gray-800 bg-void/50 hover:border-gray-700'
                                            } flex items-center justify-between gap-4`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${isOwned ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-900 text-gray-500'}`}>
                                                {id === 'PRO' && <Zap className="w-6 h-6" />}
                                                {id === 'ELITE' && <Trophy className="w-6 h-6" />}
                                                {id === 'LEGEND' && <Crown className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black text-sm uppercase tracking-tighter">{rank.label}</h4>
                                                <p className="text-[10px] text-gray-500 max-w-[200px]">{rank.description}</p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {rank.roles?.map(role => (
                                                        <span key={role} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] text-neon-blue font-mono font-bold">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {isOwned ? (
                                                <span className="text-[10px] font-black text-neon-green uppercase tracking-widest bg-neon-green/10 px-3 py-1 rounded-full border border-neon-green/30">Active</span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRankPurchase(id)}
                                                    disabled={!canAfford || purchasing}
                                                    className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${canAfford
                                                        ? 'bg-white text-black hover:bg-neon-green shadow-xl'
                                                        : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                        } flex items-center gap-2`}
                                                >
                                                    {isPurchasing ? <Loader className="w-4 h-4 animate-spin" /> : `${rank.kpcPrice} KPC`}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Theme Customization */}
                    <div className="space-y-4 pt-4 border-t border-gray-900">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            Grid_Aesthetics
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {Object.values(themes).map((theme) => {
                                const isLocked = (currentUser?.stats?.kpcBalance || 0) < (theme.repRequired * 100);
                                return (
                                    <button
                                        key={theme.id}
                                        type="button"
                                        disabled={isLocked}
                                        onClick={() => setCurrentTheme(theme.id)}
                                        className={`relative p-4 rounded-xl border transition-all text-center group ${currentTheme === theme.id
                                            ? 'border-neon-green bg-neon-green/5'
                                            : 'border-gray-800 bg-void hover:border-gray-600'
                                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className={`w-full h-8 rounded mb-2 ${theme.class}-preview bg-neon-green border border-white/10`}
                                            style={{ background: theme.id === 'CYBER_PULSE' ? '#00D4FF' : theme.id === 'CARBON_CORE' ? '#FF003C' : theme.id === 'ELITE_VOID' ? '#FFFFFF' : '#39FF14' }}
                                        />
                                        <span className={`text-[10px] font-black uppercase ${currentTheme === theme.id ? 'text-neon-green' : 'text-gray-500'}`}>
                                            {theme.name}
                                        </span>
                                        {isLocked && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                                <span className="text-[8px] font-black text-white">LOCKED</span>
                                                <span className="text-[8px] text-neon-blue">{theme.repRequired * 100} KPC</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-neon-green text-black font-bold py-4 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        {saving ? 'SAVING...' : (
                            <>
                                <Save className="w-5 h-5" /> SAVE CHANGES
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;
