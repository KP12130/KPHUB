import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, GitBranch, Zap, Shield, Cpu, Code } from 'lucide-react';

const Changelog = () => {
    const protocolLogs = [
        {
            version: '1.2.0',
            date: '2026-02-19',
            title: 'Social Evolution & Grid Expansion',
            type: 'MAJOR_PATCH',
            changes: [
                { icon: Zap, text: 'Implemented XP & Leveling system (Protocol Level = floor(sqrt(XP/100))).' },
                { icon: Shield, text: 'Launched Professional Verification Audit protocol (Verified Badge).' },
                { icon: Cpu, text: 'Identity Flares: Unlocked Neon, Cyber, and Matrix name customization.' },
                { icon: Code, text: 'Quest-to-XP bridge active: All quest completions now award Grid Experience.' }
            ]
        },
        {
            version: '1.1.5',
            date: '2026-02-18',
            title: 'Nexus Forge Acquisition',
            type: 'MONETIZATION',
            changes: [
                { icon: Zap, text: 'PulseForge Credit Shop deployed for direct KPC acquisition.' },
                { icon: GitBranch, text: 'Atomic Transaction Ledger integrated for multisig credit processing.' }
            ]
        },
        {
            version: '1.0.8',
            date: '2026-02-17',
            title: 'AdSense Protocol & Hub SEO',
            type: 'STABILITY',
            changes: [
                { icon: Terminal, text: 'Global AdSense script injection for grid monetization.' },
                { icon: Code, text: 'Full SEO/OG metadata audit completed for all primary nodes.' }
            ]
        }
    ];

    return (
        <div className="min-h-screen pt-24 px-4 max-w-4xl mx-auto pb-20">
            <div className="mb-16 space-y-4">
                <div className="flex items-center gap-4 text-neon-green">
                    <Terminal className="w-6 h-6 animate-pulse" />
                    <span className="font-mono text-xs uppercase tracking-[0.5em]">System_Protocol_Logs</span>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                    Changelog_<span className="text-neon-green">v1.2</span>
                </h1>
                <p className="text-gray-500 font-mono text-sm">Monitoring the continuous evolution of the Kodex Pulse Grid architected by Antigravity.</p>
            </div>

            <div className="space-y-12">
                {protocolLogs.map((log, index) => (
                    <motion.div
                        key={log.version}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-12 border-l border-white/5"
                    >
                        <div className="absolute left-[-5px] top-0 w-[10px] h-[10px] bg-neon-green rounded-full shadow-[0_0_10px_#39FF14]" />

                        <div className="mb-6">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-[10px] font-black bg-white/5 text-gray-400 px-2 py-0.5 rounded uppercase tracking-widest">{log.version}</span>
                                <span className="text-[10px] font-mono text-neon-green uppercase tracking-widest">{log.type}</span>
                                <span className="text-[10px] font-mono text-gray-500">{log.date}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{log.title}</h3>
                        </div>

                        <div className="space-y-4">
                            {log.changes.map((change, i) => (
                                <div key={i} className="flex items-start gap-4 group">
                                    <div className="mt-1 w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-neon-green/30 transition-all">
                                        <change.icon className="w-4 h-4 text-gray-500 group-hover:text-neon-green" />
                                    </div>
                                    <p className="text-gray-400 text-sm font-mono leading-relaxed pt-1 group-hover:text-white transition-all">
                                        {change.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-20 p-8 glass-panel border border-white/5 rounded-3xl text-center bg-black/20">
                <p className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-4">End of Transmission</p>
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
        </div>
    );
};

export default Changelog;
