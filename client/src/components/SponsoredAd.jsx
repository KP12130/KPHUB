import React, { useEffect, useState } from 'react';
import { ExternalLink, Zap } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';

const ADS = [
    {
        id: 'ad_cyberdyne',
        brand: 'CYBERDYNE SYSTEMS',
        title: 'Automated Defense Solutions',
        desc: 'Protect your server nodes with AI-driven sentries.',
        image: 'https://images.unsplash.com/photo-1535378437832-718914e60575?w=500&q=80',
        color: 'text-red-500',
        borderColor: 'border-red-500/50'
    },
    {
        id: 'ad_neurolink',
        brand: 'NEUROLINK CORP',
        title: 'Upgrade Your Cortex',
        desc: 'Experience 10x processing speed with the new N-Chip.',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80',
        color: 'text-neon-blue',
        borderColor: 'border-neon-blue/50'
    },
    {
        id: 'ad_soma',
        brand: 'SOMA SYNTHETICS',
        title: 'Digital Relaxation',
        desc: 'Unwind in the cloud. 100% packet-loss free.',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
        color: 'text-purple-500',
        borderColor: 'border-purple-500/50'
    }
];

const SponsoredAd = ({ projectId, currentUser }) => {
    const [ad, setAd] = useState(null);
    const [viewed, setViewed] = useState(false);

    useEffect(() => {
        // PRO users don't see ads
        if (currentUser?.tier === 'PRO' || currentUser?.tier === 'ELITE') return;

        // Select random ad
        setAd(ADS[Math.floor(Math.random() * ADS.length)]);
    }, [currentUser]);

    useEffect(() => {
        if (ad && !viewed && projectId && currentUser) {
            // Track View
            const trackView = async () => {
                try {
                    await axios.post(`${API_BASE}/api/ads/view`, {
                        projectId,
                        viewerId: currentUser.uid
                    });
                    setViewed(true);
                } catch (err) {
                    console.error("Ad View Track Fail", err);
                }
            };
            // Small delay to ensure "view" counts as an impression
            const timer = setTimeout(trackView, 2000);
            return () => clearTimeout(timer);
        }
    }, [ad, viewed, projectId, currentUser]);

    const handleClick = async () => {
        if (!projectId || !currentUser) return;
        try {
            await axios.post(`${API_BASE}/api/ads/click`, {
                projectId,
                viewerId: currentUser.uid
            });
        } catch (err) {
            console.error("Ad Click Track Fail", err);
        }
    };

    if (!ad || currentUser?.tier === 'PRO' || currentUser?.tier === 'ELITE') return null;

    return (
        <div className={`relative group overflow-hidden bg-black border ${ad.borderColor} rounded-2xl p-4 animate-in fade-in zoom-in duration-500`}>
            <div className="absolute top-0 right-0 bg-gray-900 px-2 py-0.5 rounded-bl-lg text-[8px] font-mono text-gray-500 uppercase tracking-widest border-b border-l border-gray-800">
                Sponsored_Content
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative h-32 w-full rounded-xl overflow-hidden group-hover:brightness-110 transition-all">
                    <img src={ad.image} alt="Ad" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${ad.color} flex items-center gap-1`}>
                            <Zap className="w-3 h-3 fill-current" /> {ad.brand}
                        </p>
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-white font-bold text-sm italic">{ad.title}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed font-mono">{ad.desc}</p>
                </div>

                <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleClick(); }}
                    className={`block w-full text-center py-2 ${ad.color} bg-void border border-gray-800 hover:bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all`}
                >
                    Initialize_Link
                </a>
            </div>
        </div>
    );
};

export default SponsoredAd;
