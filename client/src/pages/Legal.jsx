import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Info, Lock, ChevronRight, Mail, MapPin, Globe } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

const Legal = () => {
    const { section } = useParams();
    const [activeTab, setActiveTab] = useState(section?.toUpperCase() || 'ABOUT');

    useEffect(() => {
        if (section) setActiveTab(section.toUpperCase());
    }, [section]);

    const tabs = [
        { id: 'ABOUT', label: 'Mission_Briefing', icon: <Info className="w-4 h-4" /> },
        { id: 'TERMS', label: 'Terms_Of_Sync', icon: <FileText className="w-4 h-4" /> },
        { id: 'PRIVACY', label: 'Encryption_Policy', icon: <Lock className="w-4 h-4" /> },
        { id: 'CONTACT', label: 'Transmission_Line', icon: <Mail className="w-4 h-4" /> }
    ];

    const Content = () => {
        switch (activeTab) {
            case 'ABOUT':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Grid_Origins</h2>
                        <div className="space-y-6 text-gray-400 font-mono text-xs leading-relaxed">
                            <p>KPHUB was baptized in the neon-stained alleyways of the digital underground. We didn't just build a platform; we engineered a sanctuary for architects who speak in binary and dream in GLSL.</p>
                            <p>Our mission is simple: Total decentralization of creative power. Whether you're deploying a micro-module or a sprawling meta-system, KPHUB provides the high-bandwidth infrastructure you need to pulse, monetize, and dominate the discovery grid.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <h3 className="text-neon-green font-black mb-2 uppercase tracking-widest">Pulse_First</h3>
                                    <p className="opacity-60">Engagement isn't just a number; it's the lifeblood of the grid. We prioritize quality transmissions over static noise.</p>
                                </div>
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <h3 className="text-neon-blue font-black mb-2 uppercase tracking-widest">Architect_Sovereignty</h3>
                                    <p className="opacity-60">You own your binary. Our licensing protocols ensure your intellectual assets remain under your command.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'TERMS':
                return (
                    <div className="space-y-8 animate-fade-in text-gray-400 font-mono text-xs leading-relaxed">
                        <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Terms_Of_Sync</h2>
                        <p className="text-neon-blue uppercase text-[10px] font-black">Last Sync: 2026.02.17</p>
                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">01. Acceptance_Protocol</h3>
                            <p>By initializing a connection to the KPHUB mainframe, you agree to abide by the Grid conduct requirements. Unauthorized packet manipulation or system injections are strictly prohibited.</p>
                        </section>
                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">02. Transmission_Ownership</h3>
                            <p>Architects retain full sovereignty over their uploaded transmissions. KPHUB serves as the relay node but does not claim ownership of the binary streams.</p>
                        </section>
                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">03. Monetization_Integrity</h3>
                            <p>Revenue share protocols are non-negotiable. Pro and Elite citizens are entitled to their respective credit withdraws as specified in the Monetization Engine.</p>
                        </section>
                    </div>
                );
            case 'PRIVACY':
                return (
                    <div className="space-y-8 animate-fade-in text-gray-400 font-mono text-xs leading-relaxed">
                        <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Encryption_Policy</h2>
                        <div className="p-4 bg-neon-green/10 border border-neon-green/30 rounded-xl flex items-center gap-4 mb-8">
                            <Shield className="w-8 h-8 text-neon-green" />
                            <div>
                                <p className="text-white font-black text-[10px] uppercase">Zero_Knowledge_Architecture</p>
                                <p className="opacity-60 text-[9px]">We do not monitor your private syncs or encrypted transmissions.</p>
                            </div>
                        </div>
                        <p>We collect essential telemetry only to optimize grid performance. Your identity is masked behind your chosen architect handle, and personal data is never shared with third-party corp-entities.</p>
                        <p>All passwords and sensitive tokens are salted, hashed, and stored in protected sectors of the mainframe.</p>
                    </div>
                );
            case 'CONTACT':
                return (
                    <div className="space-y-8 animate-fade-in text-gray-400 font-mono text-xs leading-relaxed">
                        <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Transmission_Line</h2>
                        <p>Need a direct uplink to the administrators? Use the protocols below to bypass the standard support relays.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <Mail className="w-5 h-5 text-neon-blue" />
                                    <div>
                                        <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">Direct_Uplink</h4>
                                        <p className="opacity-60">nexus@kphub.network</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <MapPin className="w-5 h-5 text-neon-green" />
                                    <div>
                                        <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">Node_Location</h4>
                                        <p className="opacity-60">High-Pulse District, Sector 7<br />Neo-Tokyo Grid</p>
                                    </div>
                                </div>
                            </div>
                            <form className="space-y-4 p-8 bg-terminal border border-gray-900 rounded-3xl">
                                <input placeholder="Your_Architect_Handle" className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-blue" />
                                <input placeholder="Secure_Return_Address" className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-blue" />
                                <textarea placeholder="Message_Binary..." rows={4} className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-blue resize-none font-mono" />
                                <button type="button" className="w-full py-4 bg-neon-blue text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white transition-all">
                                    Broadcast_Message
                                </button>
                            </form>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 px-4 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Sidebar Navigation */}
                <aside className="lg:col-span-1 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all border ${activeTab === tab.id
                                ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue shadow-[0_0_20px_rgba(0,212,255,0.1)]'
                                : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {tab.icon}
                                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                            </div>
                            <ChevronRight className={`w-3 h-3 transition-transform ${activeTab === tab.id ? 'rotate-90 text-neon-blue' : 'opacity-0'}`} />
                        </button>
                    ))}
                    <div className="mt-12 p-6 border border-gray-900 rounded-2xl bg-void/50">
                        <p className="text-[9px] text-gray-600 font-mono uppercase leading-relaxed">
                            System identity confirmed. Legal protocols loaded from Node Secure Storage.
                        </p>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="lg:col-span-3 min-h-[600px] bg-terminal border border-gray-900 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Globe size={300} strokeWidth={0.5} />
                    </div>
                    <Content />
                </main>
            </div>
        </div>
    );
};

export default Legal;
