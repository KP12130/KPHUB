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
                        <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Mission_Briefing</h2>
                        <div className="space-y-6 text-gray-400 font-mono text-xs leading-relaxed">
                            <p>KPHUB is a decentralized platform designed for developers to showcase, share, and collaborate on software projects. Our mission is to provide a robust infrastructure for the open-source community, enabling seamless discovery and interaction.</p>
                            <p>We believe in the power of code to transform the digital landscape. KPHUB offers a suite of tools for version control, project management, and community engagement, all wrapped in a high-performance interface.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <h3 className="text-neon-green font-black mb-2 uppercase tracking-widest">Innovation</h3>
                                    <p className="opacity-60">Fostering creativity through cutting-edge tools and a supportive environment for experimental development.</p>
                                </div>
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <h3 className="text-neon-blue font-black mb-2 uppercase tracking-widest">Community</h3>
                                    <p className="opacity-60">Building a network of architects and engineers who share knowledge and resources to elevate the collective standard.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'TERMS':
                return (
                    <div className="space-y-8 animate-fade-in text-gray-400 font-mono text-xs leading-relaxed">
                        <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Terms_Of_Service</h2>
                        <p className="text-neon-blue uppercase text-[10px] font-black">Last Updated: 2026.02.18</p>

                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">1. Acceptance of Terms</h3>
                            <p>By accessing or using KPHUB, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. We reserve the right to modify these terms at any time.</p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">2. User Conduct</h3>
                            <p>You agree to use KPHUB only for lawful purposes. You are prohibited from posting content that is illegal, offensive, or infringes on the intellectual property rights of others. Harassment, spamming, and the distribution of malware are strictly forbidden.</p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">3. Intellectual Property</h3>
                            <p>Users retain ownership of the content they upload to KPHUB. By posting content, you grant KPHUB a non-exclusive license to display, distribute, and promote your content within the platform. KPHUB respects the intellectual property rights of others and expects users to do the same.</p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">4. Limitation of Liability</h3>
                            <p>KPHUB is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform, including but not limited to data loss, service interruptions, or unauthorized access.</p>
                        </section>
                    </div>
                );
            case 'PRIVACY':
                return (
                    <div className="space-y-8 animate-fade-in text-gray-400 font-mono text-xs leading-relaxed">
                        <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Privacy_Policy</h2>

                        <div className="p-4 bg-neon-green/10 border border-neon-green/30 rounded-xl flex items-center gap-4 mb-8">
                            <Shield className="w-8 h-8 text-neon-green" />
                            <div>
                                <p className="text-white font-black text-[10px] uppercase">Data Protection Protocol</p>
                                <p className="opacity-60 text-[9px]">Your privacy is paramount. We adhere to strict data security standards.</p>
                            </div>
                        </div>

                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">1. Information Collection</h3>
                            <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include your username, email address, and profile content. We also automatically collect certain technical data, such as your IP address and device information, to ensure system stability.</p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">2. Use of Cookies</h3>
                            <p>KPHUB uses cookies and similar technologies to enhance your experience, analyze usage patterns, and personalize content. We may use third-party services, such as Google Analytics and Google AdSense, which may also place cookies on your device to serve relevant advertisements.</p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">3. Third-Party Sharing</h3>
                            <p>We do not sell your personal information. We may share aggregated, non-personally identifiable information with partners or advertisers. We may also disclose information if required by law or to protect our rights and safety.</p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-white uppercase font-bold text-sm tracking-widest">4. Data Security</h3>
                            <p>We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, or destruction. However, no method of transmission over the internet is 100% secure.</p>
                        </section>
                    </div>
                );
            case 'CONTACT':
                return (
                    <div className="space-y-8 animate-fade-in text-gray-400 font-mono text-xs leading-relaxed">
                        <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Contact_Us</h2>
                        <p>If you have any questions about these Terms or our Privacy Policy, please contact us.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <Mail className="w-5 h-5 text-neon-blue" />
                                    <div>
                                        <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">Email_Support</h4>
                                        <p className="opacity-60">support@kphub.example.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                                    <MapPin className="w-5 h-5 text-neon-green" />
                                    <div>
                                        <h4 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">HQ_Location</h4>
                                        <p className="opacity-60">Digital Innovation Park<br />Sector 7, Neo-Tokyo</p>
                                    </div>
                                </div>
                            </div>
                            <form className="space-y-4 p-8 bg-terminal border border-gray-900 rounded-3xl">
                                <input placeholder="Your Name" className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-blue" />
                                <input placeholder="Your Email" className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-blue" />
                                <textarea placeholder="Message..." rows={4} className="w-full bg-void border border-gray-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-neon-blue resize-none font-mono" />
                                <button type="button" className="w-full py-4 bg-neon-blue text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white transition-all">
                                    Send Message
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
