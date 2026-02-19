import React from 'react';
import { Link } from 'react-router-dom';
import {
    Terminal, Shield, Globe, Github, Heart, Cpu, Zap, Mail, MessageSquare
} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-void border-t border-gray-900 mt-20 pt-16 pb-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-neon-green rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_15px_#39FF1466]">
                                <Terminal className="w-5 h-5 text-black" />
                            </div>
                            <span className="text-xl font-black text-white italic tracking-tighter uppercase transition-colors group-hover:text-neon-green">
                                KP<span className="text-neon-green font-normal">HUB</span>
                            </span>
                        </Link>
                        <p className="text-gray-500 font-mono text-[10px] leading-relaxed uppercase tracking-widest max-w-[200px]">
                            The premier digital ecosystem for high-pulse architects and grid citizens.
                            Deploy. Pulse. Monetize.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 bg-gray-900 rounded-lg text-gray-500 hover:text-neon-green transition-all"><Github size={16} /></a>
                            <a href="#" className="p-2 bg-gray-900 rounded-lg text-gray-500 hover:text-neon-blue transition-all"><Mail size={16} /></a>
                            <a href="#" className="p-2 bg-gray-900 rounded-lg text-gray-500 hover:text-purple-500 transition-all"><MessageSquare size={16} /></a>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6">Discovery_Grid</h4>
                        <ul className="space-y-4">
                            <li><Link to="/" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Global_Feed</Link></li>
                            <li><Link to="/leaderboard" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Power_Ranking</Link></li>
                            <li><Link to="/" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Marketplace</Link></li>
                            <li><Link to="/studio" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Creator_Studio</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6">Assistance_Protocols</h4>
                        <ul className="space-y-4">
                            <li><Link to="/support" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Help_Center</Link></li>
                            <li><Link to="/support" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Status_Mainframe</Link></li>
                            <li><Link to="/support" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Glitch_Report</Link></li>
                            <li><Link to="/legal" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Mission_Briefing</Link></li>

                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6">Grid_Laws</h4>
                        <ul className="space-y-4">
                            <li><Link to="/legal" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Terms_Of_Sync</Link></li>
                            <li><Link to="/legal" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Data_Encryption_Policy</Link></li>
                            <li><Link to="/legal" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Conduct_Protocols</Link></li>
                            <li><Link to="/legal" className="text-xs text-gray-500 hover:text-white transition-colors font-mono uppercase tracking-widest">Tracker_Policy</Link></li>

                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 text-[9px] text-gray-600 font-mono uppercase tracking-widest">
                        <span>© {currentYear} KPHUB_MAINFRAME</span>
                        <span className="hidden md:block text-gray-800">|</span>
                        <div className="flex items-center gap-1.5">
                            <Cpu className="w-3 h-3" /> NODE_07_SOUTH_SECTOR
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[9px] text-neon-green font-mono uppercase animate-pulse">
                            <Zap className="w-3 h-3" /> System_Online
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-gray-600 font-mono uppercase">
                            Built with <Heart className="w-2.5 h-2.5 text-red-500" /> for Architects
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
