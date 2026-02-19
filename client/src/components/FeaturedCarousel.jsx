import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeaturedCarousel = ({ projects = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const featured = (projects || []).sort((a, b) => {
        const aBoosted = a.boostedUntil && new Date(a.boostedUntil) > new Date();
        const bBoosted = b.boostedUntil && new Date(b.boostedUntil) > new Date();
        if (aBoosted && !bBoosted) return -1;
        if (!aBoosted && bBoosted) return 1;
        return (b.stats?.likes || 0) - (a.stats?.likes || 0);
    }).slice(0, 5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % featured.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [featured.length]);

    if (featured.length === 0) return null;

    return (
        <div className="relative w-full h-[400px] md:h-[450px] bg-void rounded-[2rem] overflow-hidden mb-12 border border-white/10 group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-neon-blue/5 opacity-50" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    {featured[currentIndex].screenshots?.[0] ? (
                        <motion.img
                            key={`img-${currentIndex}`}
                            src={featured[currentIndex].screenshots[0]}
                            className="w-full h-full object-cover"
                            initial={{ scale: 1.1, filter: 'blur(20px)', opacity: 0 }}
                            animate={{ scale: 1, filter: 'blur(0px)', opacity: 0.5 }}
                            transition={{ duration: 1.2 }}
                            alt="Featured"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-void to-terminal flex items-center justify-center opacity-40">
                            <Zap className="w-24 h-24 text-neon-green/10" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent p-8 md:p-16 flex flex-col justify-end">
                        <div className="max-w-2xl">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 ${featured[currentIndex].boostedUntil && new Date(featured[currentIndex].boostedUntil) > new Date() ? 'bg-neon-green text-black' : 'bg-neon-blue text-white'} text-[10px] font-black rounded-lg uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(57,255,20,0.2)]`}>
                                <Zap className={`w-3 h-3 ${featured[currentIndex].boostedUntil && new Date(featured[currentIndex].boostedUntil) > new Date() ? 'fill-black' : 'fill-white'}`} />
                                {featured[currentIndex].boostedUntil && new Date(featured[currentIndex].boostedUntil) > new Date() ? 'Promoted_System' : 'Trending_Transmission'}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic mb-2">
                                {featured[currentIndex].title}
                            </h2>
                            <p className="text-gray-400 text-sm font-mono mb-6 line-clamp-2 max-w-lg">
                                {featured[currentIndex].description}
                            </p>
                            <div className="flex items-center gap-6">
                                <Link
                                    to={`/project/${featured[currentIndex].id}`}
                                    className="px-8 py-3 bg-neon-green text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                                >
                                    Access_System
                                </Link>
                                <div className="flex items-center gap-4 text-gray-500 font-mono text-xs">
                                    <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {featured[currentIndex].stats?.views || 0}</span>
                                    <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {featured[currentIndex].stats?.likes || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Pagination Dots */}
            <div className="absolute bottom-12 right-12 flex gap-2">
                {featured.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-neon-green shadow-[0_0_10px_#39FF14]' : 'w-2 bg-gray-800'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default FeaturedCarousel;
