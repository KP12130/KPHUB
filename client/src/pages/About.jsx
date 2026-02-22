import React from 'react';
import { motion } from 'framer-motion';
import { Info, Target, Users, Zap, Globe, Shield, Terminal } from 'lucide-react';

const About = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 px-4 max-w-5xl mx-auto">
            <header className="text-center mb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-neon-green/10 border border-neon-green/30 text-neon-green text-[10px] font-black rounded-full uppercase tracking-widest mb-6"
                >
                    <Terminal className="w-3 h-3" /> Grid_Intelligence
                </motion.div>
                <h1 className="text-6xl md:text-[5rem] font-black text-white italic uppercase tracking-tighter leading-none mb-8">
                    The Pulse of <br /> <span className="text-neon-green">Innovation_</span>
                </h1>
                <p className="text-gray-400 font-mono text-sm uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
                    KPHUB is the premier digital nexus where code meets consciousness. We provide the infrastructure for high-performance architects to deploy, explore, and evolve the next generation of software systems.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                {[
                    { icon: Target, title: 'Our_Objective', desc: 'To create an immutable and accessible global directory for software engineers to broadcast their inventions.', color: 'text-neon-blue' },
                    { icon: Globe, title: 'Global_Nexus', desc: 'A decentralized ecosystem where geography is irrelevant and code is the universal language of progress.', color: 'text-neon-green' },
                    { icon: Users, title: 'The_Citizens', desc: 'Empowering thousands of architects to collaborate on high-pulse protocols and earn KPC through proof of work.', color: 'text-purple-500' }
                ].map((item, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
                    >
                        <item.icon className={`w-8 h-8 ${item.color} mb-6 group-hover:scale-110 transition-transform`} />
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-4">{item.title}</h3>
                        <p className="text-xs text-gray-500 font-mono leading-relaxed uppercase tracking-wider">{item.desc}</p>
                    </motion.div>
                ))}
            </div>

            <section className="glass-panel p-12 rounded-[3rem] border border-glass-border relative overflow-hidden mb-32">
                <div className="absolute top-0 right-0 w-96 h-96 bg-neon-green/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-8">
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">System_Foundations</h2>
                        <div className="space-y-6 text-gray-400 font-mono text-sm leading-relaxed uppercase">
                            <p>Founded on the principle of open collaboration, KPHUB has evolved from a simple repository index into a comprehensive creator studio.</p>
                            <p>Our technologies are built to handle high-pulse telemetry, ensuring that every architect has the tools necessary to maintain their digital perimeter and grow their influence within the grid.</p>
                        </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        <div className="p-6 bg-void border border-gray-900 rounded-2xl flex flex-col items-center justify-center text-center">
                            <Zap className="w-6 h-6 text-yellow-500 mb-4" />
                            <span className="text-2xl font-black text-white">1.2ms</span>
                            <span className="text-[10px] text-gray-600 font-mono uppercase">Global_Latency</span>
                        </div>
                        <div className="p-6 bg-void border border-gray-900 rounded-2xl flex flex-col items-center justify-center text-center">
                            <Shield className="w-6 h-6 text-neon-blue mb-4" />
                            <span className="text-2xl font-black text-white">99.9%</span>
                            <span className="text-[10px] text-gray-600 font-mono uppercase">Grid_Uptime</span>
                        </div>
                        <div className="col-span-2 p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                            <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest leading-loose">
                                "The grid grows through the collective input of its citizens. Without the pulse, the system is dormant."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="text-center pt-20 border-t border-white/5">
                <p className="text-gray-600 font-mono text-[10px] uppercase tracking-[0.3em]">
                    System initialized under governance protocol V1.4.0
                </p>
            </footer>
        </div>
    );
};

export default About;
