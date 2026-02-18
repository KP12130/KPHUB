import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-void flex flex-col justify-center items-center text-center p-4 relative overflow-hidden">
            {/* Glitch Background */}
            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] opacity-5 pointer-events-none bg-cover mix-blend-screen"></div>

            <div className="relative z-10 space-y-6">
                <AlertTriangle className="w-24 h-24 text-red-500 mx-auto animate-pulse" />
                <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-t from-red-600 to-red-500 tracking-tighter">
                    404
                </h1>
                <h2 className="text-2xl font-bold text-white uppercase tracking-[0.5em]">System_Failure</h2>
                <p className="text-sm text-gray-500 font-mono max-w-md mx-auto">
                    The requested protocol could not be located in this sector. The coordinates may be corrupted or the node has been terminated.
                </p>

                <div className="pt-8">
                    <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                        <Home className="w-5 h-5" /> Return_To_Base
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-[10px] text-red-900 font-mono uppercase">Error_Code: ID_10_T // Grid_Sync_Lost</p>
            </div>
        </div>
    );
};

export default NotFound;
