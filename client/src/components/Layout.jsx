import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './CommandPalette';
import GridChat from './GridChat';
import { useAuth } from '../context/AuthContext';
import BannedPortal from '../pages/BannedPortal';

const Layout = ({ children }) => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // BANNED USER TRAP (Must be after all hooks!)
    if (currentUser?.tier === 'BANNED') {
        return <BannedPortal />;
    }

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden scanlines noise">
            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-green/5 rounded-full blur-[150px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neon-blue/5 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            {/* Floating Navbar Container */}
            <div className="z-50 p-4 md:p-6 sticky top-0 pointer-events-none">
                <div className="pointer-events-auto">
                    <Navbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-grow container mx-auto px-4 md:px-6 relative z-10 pb-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Cinematic Footer */}
            <div className="relative z-10 mt-20">
                <Footer />
            </div>

            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
            />
        </div>
    );
};

export default Layout;
