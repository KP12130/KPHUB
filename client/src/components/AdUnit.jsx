import React, { useEffect } from 'react';

/**
 * Reusable AdSense Component
 * @param {string} slot - AdSense Ad Slot ID
 * @param {string} format - Ad format (auto, fluid, etc.)
 * @param {boolean} responsive - Whether the ad is responsive
 * @param {Object} style - Custom styling for the ad container
 * @param {string} type - 'display', 'in-feed', 'multiplex'
 */
const AdUnit = ({
    slot = "default-slot",
    format = "auto",
    responsive = "true",
    style = { display: 'block' },
    type = 'display'
}) => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense Sync Error:", e);
        }
    }, []);

    return (
        <div className="ad-container my-8 overflow-hidden rounded-xl border border-white/5 bg-black/20 backdrop-blur-sm p-4 text-center">
            <span className="text-[8px] font-mono text-gray-700 uppercase tracking-[0.3em] mb-2 block">AD_PROTOCOL_TERMINAL</span>
            <ins className="adsbygoogle"
                style={style}
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // USER should replace this with their actual ID
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
                data-ad-type={type === 'multiplex' ? 'autorelaxed' : undefined}
            ></ins>
            <div className="mt-2 flex justify-center gap-4 opacity-20 pointer-events-none">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
        </div>
    );
};

export default AdUnit;
