import React, { useState } from 'react';
import { Play, AlertTriangle, ExternalLink } from 'lucide-react';

const ShowcaseEmbed = ({ demoUrl, title }) => {
    const [isActive, setIsActive] = useState(false);

    if (!demoUrl) return null;

    // Safety check for HTTP vs HTTPS
    const isSecure = demoUrl.startsWith('https://');

    return (
        <div className="w-full h-full min-h-[500px] bg-black/50 rounded-xl overflow-hidden border border-white/10 relative group">
            {!isActive ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-terminal/80 backdrop-blur-sm z-10 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-neon-green/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform cursor-pointer" onClick={() => setIsActive(true)}>
                        <Play className="w-8 h-8 text-neon-green fill-neon-green" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">
                        Initialize Showcase
                    </h3>
                    <p className="text-gray-400 font-mono text-sm max-w-md mb-6">
                        Click to load the external interactive module.
                        <br />
                        <span className="text-xs text-gray-500">Source: {new URL(demoUrl).hostname}</span>
                    </p>

                    {!isSecure && (
                        <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg mb-4">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-bold">Insecure Source (HTTP) - Might be blocked by browser</span>
                        </div>
                    )}

                    <button
                        onClick={() => setIsActive(true)}
                        className="px-8 py-3 bg-neon-green text-black font-black uppercase tracking-widest rounded hover:bg-white transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                    >
                        Load System
                    </button>
                </div>
            ) : (
                <iframe
                    src={demoUrl}
                    title={`Showcase: ${title}`}
                    className="w-full h-full min-h-[600px] border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
                />
            )}

            {/* Overlay actions when active */}
            {isActive && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                        href={demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-black/80 text-white rounded hover:text-neon-green transition-colors"
                        title="Open in new tab"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                        onClick={() => setIsActive(false)}
                        className="p-2 bg-black/80 text-white rounded hover:text-red-500 transition-colors"
                        title="Terminate Session"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShowcaseEmbed;
