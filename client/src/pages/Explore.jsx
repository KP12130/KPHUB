import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Terminal, Code, Cpu, Globe, Gamepad2, Layers } from 'lucide-react';
import ProjectCard from '../components/ProjectCard'; // Assuming this exists or I'll use the one from Home

const Explore = () => {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [activeTag, setActiveTag] = useState('');

    const categories = [
        { id: 'ALL', label: 'All Systems', icon: <Terminal className="w-4 h-4" /> },
        { id: 'Web', label: 'Web Protocols', icon: <Globe className="w-4 h-4" /> },
        { id: 'Game', label: 'Simulations', icon: <Gamepad2 className="w-4 h-4" /> },
        { id: 'Tool', label: 'Utilities', icon: <Cpu className="w-4 h-4" /> },
        { id: 'Other', label: 'Misc Data', icon: <Layers className="w-4 h-4" /> }
    ];

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        filterProjects();
    }, [searchTerm, activeCategory, activeTag, projects]);

    const fetchProjects = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/projects`);
            setProjects(res.data);
        } catch (err) {
            console.error("Explore fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const filterProjects = () => {
        let result = projects;

        if (activeCategory !== 'ALL') {
            result = result.filter(p => p.category === activeCategory);
        }

        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(lowerQuery) ||
                p.description.toLowerCase().includes(lowerQuery) ||
                p.tags?.some(t => t.toLowerCase().includes(lowerQuery))
            );
        }

        if (activeTag) {
            result = result.filter(p => p.tags?.includes(activeTag));
        }

        setFilteredProjects(result);
    };

    if (loading) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto pb-12">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">
                    System_Discovery
                </h1>
                <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">
                    Navigate the grid. Locate <span className="text-neon-blue">advanced protocols</span>.
                </p>
            </div>

            {/* Controls */}
            <div className="mb-12 space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search systems by query..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-terminal border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-600 font-mono"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeCategory === cat.id
                                ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                                : 'bg-void border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                                }`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {filteredProjects.map(project => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={project.id}
                        >
                            <ProjectCard project={project} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredProjects.length === 0 && (
                <div className="text-center py-20 text-gray-600 font-mono text-sm uppercase">
                    No signals matching your query.
                </div>
            )}
        </div>
    );
};

export default Explore;
