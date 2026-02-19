import React from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Mail } from 'lucide-react';
import { API_BASE } from '../api';

const Login = () => {
    const { loginWithGoogle, loginWithGithub, currentUser } = useAuth();
    const navigate = useNavigate();

    const checkProfileAndRedirect = async (user) => {
        if (!user) return;
        try {
            // Check if user profile exists in our DB

            await axios.get(`${API_BASE}/api/users/${user.uid}`);
            // If successful (200), user exists -> Go to Dashboard
            navigate('/');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // User not found -> Must complete signup
                navigate('/signup');
            } else {
                console.error("Profile check error:", error);
            }
        }
    };

    React.useEffect(() => {
        if (currentUser) {
            checkProfileAndRedirect(currentUser);
        }
    }, [currentUser, navigate]);

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
            // The useEffect will handle the redirect once currentUser updates
        } catch (error) {
            console.error("Google Login Error:", error);
        }
    };

    const handleGithubLogin = async () => {
        try {
            await loginWithGithub();
            // The useEffect will handle the redirect once currentUser updates
        } catch (error) {
            console.error("Github Login Error:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-void relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-green/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-terminal border border-gray-800 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md relative z-10"
            >
                <h2 className="text-3xl font-black text-center mb-2 tracking-tighter">
                    <span className="text-white">ACCESS</span> <span className="text-neon-green">CONTROL</span>
                </h2>
                <p className="text-gray-500 text-center mb-8 font-mono text-sm">Identify yourself to proceed.</p>

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-lg font-bold hover:bg-gray-200 transition-all transform hover:scale-[1.02]"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        Continue with Google
                    </button>

                    <button
                        onClick={handleGithubLogin}
                        className="w-full flex items-center justify-center gap-3 bg-[#24292e] text-white py-3 rounded-lg font-bold border border-gray-700 hover:border-white transition-all transform hover:scale-[1.02]"
                    >
                        <Github className="w-5 h-5" />
                        Continue with GitHub
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                    <p className="text-xs text-gray-600 font-mono">
                        SYSTEM STATUS: <span className="text-neon-green">SECURE</span>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
