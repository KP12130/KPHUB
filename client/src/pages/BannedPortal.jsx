import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, AlertOctagon } from 'lucide-react';
import SupportChat from '../components/SupportChat';

const BannedPortal = () => {
    const { currentUser, logout } = useAuth();

    return (
        <div className="min-h-screen bg-void flex flex-col items-center justify-center p-4 relative overflow-hidden scanlines noise">
            {/* Security Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-500/5 rounded-full blur-[150px] animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-5xl z-10 flex border border-red-500/20 bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)]" style={{ height: '85vh', maxHeight: '700px' }}>

                {/* Left Side: Ban Notice */}
                <div className="w-1/3 p-8 border-r border-red-500/20 bg-red-950/20 flex flex-col justify-between">
                    <div>
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6">
                            <AlertOctagon className="w-8 h-8 text-red-500 animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Access_Denied</h1>
                        <p className="text-xs text-red-400 font-mono uppercase tracking-widest mb-6">User Tier: BANNED</p>

                        <div className="space-y-4 text-sm text-gray-400 leading-relaxed font-mono">
                            <p>
                                Your connection to the grid has been severed due to severe protocol violations.
                            </p>
                            <p>
                                You are currently isolated in a secure instance. The only permitted action is to contact the <span className="text-red-500 font-bold">Architects</span> to appeal your suspension.
                            </p>
                            <div className="p-4 bg-black/40 border border-red-500/20 rounded-xl mt-6">
                                <p className="text-[10px] text-gray-500 uppercase">Registered ID:</p>
                                <p className="text-xs text-white truncate mt-1">{currentUser?.uid}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 hover:text-red-400 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sever_Connection
                    </button>
                </div>

                {/* Right Side: Embedded Support Chat */}
                <div className="w-2/3 p-6 bg-gradient-to-br from-black/40 to-black/80 flex flex-col min-h-0">
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Appeal_Terminal
                        </h2>
                    </div>
                    {/* Render existing SupportChat directly - it inherits user context automatically */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <SupportChat currentUser={currentUser} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BannedPortal;
