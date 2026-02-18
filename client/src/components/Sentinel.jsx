import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, ShieldCheck, ShieldAlert, Activity, Cpu, Database, Eye } from 'lucide-react';

const Sentinel = () => {
    const [status, setStatus] = useState('ACTIVE');
    const [threats, setThreats] = useState(0);
    const [logs, setLogs] = useState([
        { id: 1, type: 'INFO', msg: 'System initialized. Firewall status: NOMINAL.', time: '14:24:01' },
        { id: 2, type: 'SYNC', msg: 'Matrix Shield synchronized with global grid.', time: '14:24:05' }
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.8) {
                const newLog = {
                    id: Date.now(),
                    type: Math.random() > 0.8 ? 'ALERT' : 'INFO',
                    msg: Math.random() > 0.8 ? 'Suspicious packet detected from 192.168.x.x' : 'System integrity check complete.',
                    time: new Date().toLocaleTimeString([], { hour12: false })
                };
                setLogs(prev => [newLog, ...prev.slice(0, 10)]);
                if (newLog.type === 'ALERT') setThreats(prev => prev + 1);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Shield Status */}
                <div className="glass-panel p-6 rounded-3xl border border-neon-blue/20 bg-neon-blue/5 flex items-center gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Shield className="w-24 h-24 text-neon-blue" />
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-neon-blue/10 flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-neon-blue" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-neon-blue uppercase tracking-widest mb-1">Matrix_Shield</p>
                        <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">ONLINE</h4>
                    </div>
                </div>

                {/* Threat Monitor */}
                <div className="glass-panel p-6 rounded-3xl border border-neon-purple/20 bg-neon-purple/5 flex items-center gap-6 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert className="w-24 h-24 text-neon-purple" />
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-neon-purple/10 flex items-center justify-center">
                        <Activity className={`w-8 h-8 text-neon-purple ${threats > 0 ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-neon-purple uppercase tracking-widest mb-1">Threat_Intercepts</p>
                        <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">{threats}</h4>
                    </div>
                </div>

                {/* Resource Guard */}
                <div className="glass-panel p-6 rounded-3xl border border-neon-green/20 bg-neon-green/5 flex items-center gap-6 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Cpu className="w-24 h-24 text-neon-green" />
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-neon-green/10 flex items-center justify-center">
                        <Cpu className="w-8 h-8 text-neon-green" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-neon-green uppercase tracking-widest mb-1">Resource_Health</p>
                        <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">98%</h4>
                    </div>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 noise">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Sentinel_Audit_Log_v3.2</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                        <span className="text-[8px] text-neon-green font-bold uppercase tracking-widest">REALTIME_STREAMING</span>
                    </div>
                </div>
                <div className="p-4 h-[400px] overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar">
                    <AnimatePresence>
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-4 p-2 rounded hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-gray-800"
                            >
                                <span className="text-gray-700">[{log.time}]</span>
                                <span className={log.type === 'ALERT' ? 'text-neon-purple font-black' : 'text-neon-blue'}>[{log.type}]</span>
                                <span className="text-gray-400">{log.msg}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Sentinel;
