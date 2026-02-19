import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Info, Mail, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Legal = () => {
    return (
        <div className="min-h-screen pt-32 pb-20 px-4 max-w-4xl mx-auto">
            <header className="text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-[10px] font-black rounded-full uppercase tracking-widest mb-6"
                >
                    <Shield className="w-3 h-3" /> System_Governance
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-4">
                    Legal <span className="text-neon-blue">Protocols_</span>
                </h1>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Complete framework for synchronize and access.</p>
            </header>

            <div className="space-y-24">
                {/* 1. Mission Briefing */}
                <section id="mission" className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                            <Info className="w-5 h-5 text-neon-blue" />
                        </div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mission_Briefing</h2>
                    </div>
                    <div className="space-y-6 text-gray-400 font-mono text-sm leading-relaxed max-w-2xl">
                        <p>KPHUB is a decentralized nexus designed for architects to showcase, orbit, and synchronize software projects. Our mission is to provide an immutable infrastructure for the global coding community.</p>
                        <p>We foster innovation through cutting-edge tools and a high-performance interface, ensuring that every transmission contributes to the collective standard of the grid.</p>
                    </div>
                </section>

                <hr className="border-gray-900" />

                {/* 2. Terms of Service */}
                <section id="terms" className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-neon-green" />
                        </div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Terms_Of_Sync</h2>
                    </div>
                    <div className="space-y-8 text-gray-400 font-mono text-sm leading-relaxed">
                        <div className="space-y-2">
                            <h3 className="text-white font-black uppercase text-xs tracking-widest">01_Acceptance</h3>
                            <p>By initializing a connection to KPHUB, you agree to these protocols. Unauthorized access or exploitation of grid resources is strictly prohibited.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-white font-black uppercase text-xs tracking-widest">02_Identity</h3>
                            <p>Users retain total ownership of their transmissions. By deploying to the grid, you grant KPHUB a license to index and distribute your software across authorized nodes.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-white font-black uppercase text-xs tracking-widest">03_Conduct</h3>
                            <p>Malicious injections, harassment of other architects, and distribution of encrypted malware are grounds for immediate node termination.</p>
                        </div>
                    </div>
                </section>

                <hr className="border-gray-900" />

                {/* 3. Privacy Policy */}
                <section id="privacy" className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-purple-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Encryption_Policy</h2>
                    </div>
                    <div className="space-y-8 text-gray-400 font-mono text-sm leading-relaxed">
                        <div className="p-6 bg-terminal border border-gray-900 rounded-3xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-white font-black uppercase text-xs tracking-widest mb-4">Data_Harvesting_Protocol</p>
                            <p>We collect only the telemetry necessary to maintain system stability. This includes authentication data and publicly Orbiting repositories. We do not sell your biometric or digital footprints to third-party entities.</p>
                        </div>
                        <p>Cookies are utilized to maintain secure session state. Third-party nodes (like Google Analytics) may be active to monitor grid health and delivery performance.</p>
                    </div>
                </section>

                {/* Footer Link to Support */}
                <div className="pt-20 text-center">
                    <Link
                        to="/support"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-void border border-gray-800 rounded-2xl text-gray-500 hover:text-white hover:border-neon-blue transition-all group"
                    >
                        <Mail className="w-4 h-4 group-hover:text-neon-blue transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Direct_Communication_Line</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Legal;
