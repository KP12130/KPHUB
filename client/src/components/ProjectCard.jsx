import React from 'react';
import { ExternalLink, Heart, MessageSquare, Eye, Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useSound from '../hooks/useSound';

const ProjectCard = ({ project, loading, index = 0 }) => {
    const { playSound } = useSound();
    if (loading || !project) {
        return (
            <div className="bg-void border border-gray-900 rounded-3xl overflow-hidden animate-pulse flex flex-col h-[350px] relative">
                <div className="absolute inset-0 bg-gray-900/20" />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-900 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 space-y-3">
                    <div className="h-6 bg-gray-800 rounded-lg w-3/4" />
                    <div className="h-4 bg-gray-800 rounded-md w-1/2" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -10, scale: 1.02 }}
            onMouseEnter={() => playSound('hover')}
            className="group relative h-[400px] w-full rounded-3xl overflow-hidden bg-terminal border border-gray-900 hover:border-neon-green/50 transition-all duration-500 shadow-2xl"
        >
            <Link to={`/project/${project.id}`} className="block h-full w-full relative">
                {/* Background Image / Parallax */}
                <div className="absolute inset-0 z-0">
                    {project.screenshots && project.screenshots.length > 0 ? (
                        <img
                            src={project.screenshots[0]}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                        />
                    ) : (
                        <div className="w-full h-full bg-void flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]" />
                            <Zap className="w-12 h-12 text-gray-800" />
                        </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500" />
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-black/50 backdrop-blur-xl border border-white/10 text-neon-green text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg">
                        {project.category}
                    </span>
                    {project.isPrivate && (
                        <span className="px-3 py-1 bg-purple-500/20 backdrop-blur-xl border border-purple-500/30 text-purple-400 text-[10px] font-black rounded-lg uppercase tracking-widest flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Private
                        </span>
                    )}
                </div>

                {/* Content - Glass Panel */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="space-y-3">
                        {/* Author Info */}
                        <div className="flex items-center gap-2 mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {project.author?.photoURL ? (
                                <img src={project.author.photoURL} className="w-5 h-5 rounded-full border border-white/20" />
                            ) : (
                                <div className="w-5 h-5 rounded-full bg-gray-700" />
                            )}
                            <span className="text-xs text-gray-300 font-mono">@{project.author?.username || 'GHOST'}</span>
                        </div>

                        <h3 className="text-2xl font-black text-white leading-none tracking-tight group-hover:text-neon-green transition-colors drop-shadow-lg">
                            {project.title}
                        </h3>

                        <p className="text-gray-400 text-xs line-clamp-2 font-light group-hover:text-gray-200 transition-colors">
                            {project.description}
                        </p>

                        {/* Interactive Stats Bar */}
                        <div className="pt-4 flex items-center justify-between border-t border-white/10 group-hover:border-neon-green/30 transition-colors">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-white transition-colors">
                                    <Heart className={`w-4 h-4 ${project.likes?.length > 0 ? 'text-red-500 fill-red-500' : ''}`} />
                                    <span className="text-xs font-mono">{project.stats?.likes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-500 group-hover:text-white transition-colors">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="text-xs font-mono">{project.stats?.comments || 0}</span>
                                </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0">
                                <span className="text-[10px] bg-white text-black px-2 py-1 rounded font-bold uppercase tracking-widest">
                                    View_System
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProjectCard;
