import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../api';
import { motion } from 'framer-motion';
import { User, Calendar, AtSign, Save } from 'lucide-react';

const Signup = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        displayName: currentUser?.displayName || '',
        gender: '',
        birthdate: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState(null); // null, true, false

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    // Debounced username check
    useEffect(() => {
        const checkUsername = async () => {
            if (formData.username.length < 3) {
                setUsernameAvailable(null);
                return;
            }
            try {
                const res = await axios.get(`${API_BASE}/api/users/check-username?username=${formData.username}`);
                setUsernameAvailable(res.data.available);
            } catch (err) {
                console.error(err);
            }
        };

        const timeoutId = setTimeout(checkUsername, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.username]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usernameAvailable) return setError('Username is taken or invalid.');
        if (!formData.gender || !formData.birthdate) return setError('All fields are required.');

        setLoading(true);
        setError('');

        try {
            await axios.post(`${API_BASE}/api/users`, {
                uid: currentUser.uid,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                ...formData
            });
            navigate('/'); // Redirect to dashboard after success
        } catch (err) {
            console.error(err);
            setError('Failed to create profile. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-void p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-terminal border border-gray-800 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green to-neon-blue" />

                <h2 className="text-3xl font-black text-white mb-2">COMPLETE PROFILE</h2>
                <p className="text-gray-500 mb-8 font-mono text-sm">Initialize your identity on the grid.</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username */}
                    <div>
                        <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Username (@)</label>
                        <div className="relative">
                            <AtSign className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                className={`w-full bg-gray-900 border ${usernameAvailable === false ? 'border-red-500' : usernameAvailable === true ? 'border-neon-green' : 'border-gray-700'} rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors`}
                                placeholder="neo_coder"
                                required
                            />
                        </div>
                        {usernameAvailable === false && <p className="text-red-500 text-xs mt-1">Username taken.</p>}
                        {usernameAvailable === true && <p className="text-neon-green text-xs mt-1">Username available.</p>}
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
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                                placeholder="Neo Anderson"
                                required
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
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-neon-blue transition-colors appearance-none"
                                required
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
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !usernameAvailable}
                        className="w-full bg-neon-green text-black font-bold py-4 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'INITIALIZING...' : (
                            <>
                                <Save className="w-5 h-5" /> SAVE PROFILE
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Signup;
