import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';

const MILESTONES = [
    { id: 'wealth_10k', threshold: 10000, title: 'GRID_INITIATE', icon: <Target className="w-5 h-5 text-neon-blue" />, color: 'neon-blue' },
    { id: 'wealth_50k', threshold: 50000, title: 'PULSE_ARCHITECT', icon: <Zap className="w-5 h-5 text-yellow-500" />, color: 'yellow-500' },
    { id: 'wealth_100k', threshold: 100000, title: 'SYSTEM_LEGEND', icon: <Trophy className="w-5 h-5 text-neon-green" />, color: 'neon-green' },
    { id: 'wealth_500k', threshold: 500000, title: 'GRID_OVERLORD', icon: <Star className="w-5 h-5 text-neon-purple" />, color: 'neon-purple' }
];

const AchievementHub = ({ currentUser }) => {
    const userWealth = currentUser?.stats?.kpcBalance || 0;
    const [lastUnlocked, setLastUnlocked] = useState(null);

    useEffect(() => {
        if (!currentUser?.uid) return;
        const checkMilestones = () => {
            const unlockedKey = `kphub_unlocked_milestones_${currentUser.uid}`;
            const unlocked = JSON.parse(localStorage.getItem(unlockedKey) || '[]');

            const newMilestone = MILESTONES.find(m =>
                userWealth >= m.threshold && !unlocked.includes(m.id)
            );

            if (newMilestone) {
                unlocked.push(newMilestone.id);
                localStorage.setItem(unlockedKey, JSON.stringify(unlocked));
                triggerAchievement(newMilestone);
            }
        };

        checkMilestones();
    }, [userWealth]);

    const triggerAchievement = (milestone) => {
        setLastUnlocked(milestone);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#39FF14', '#00F3FF', '#8A2BE2']
        });

        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full glass-panel border border-neon-green/30 bg-black/90 p-4 rounded-3xl pointer-events-auto flex gap-4 items-center shadow-[0_0_50px_rgba(57,255,20,0.2)]`}>
                <div className={`w-12 h-12 rounded-2xl bg-${milestone.color}/10 border border-${milestone.color}/30 flex items-center justify-center shrink-0`}>
                    {milestone.icon}
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-neon-green uppercase tracking-[0.2em]">Achievement_Unlocked</p>
                    <p className="text-sm font-black text-white italic tracking-tighter uppercase">{milestone.title}</p>
                    <p className="text-[9px] text-gray-500 font-mono uppercase">Wealth threshold {milestone.threshold.toLocaleString()} KPC reached in the grid.</p>
                </div>
            </div>
        ), { duration: 5000 });

        setTimeout(() => setLastUnlocked(null), 6000);
    };

    return (
        <AnimatePresence>
            {lastUnlocked && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
                >
                    <div className="absolute inset-0 bg-void/50 backdrop-blur-sm" />
                    <div className="relative p-12 text-center space-y-6">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="inline-block"
                        >
                            <Trophy className="w-32 h-32 text-neon-green shadow-glow" />
                        </motion.div>
                        <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">PURCHASE SUCCESSFUL</h2>
                        <p className="text-3xl font-black text-neon-green uppercase tracking-widest">{lastUnlocked.title}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AchievementHub;
