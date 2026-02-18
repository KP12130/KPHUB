import { useCallback, useRef, useEffect } from 'react';

const useSound = () => {
    // Lazy initialization ref
    const audioCtxRef = useRef(null);

    // Initialize only on first user interaction
    const initAudio = useCallback(() => {
        if (audioCtxRef.current) {
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume().catch(e => console.warn(e));
            }
            return;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtxRef.current = new AudioContext();
            }
        } catch (e) {
            console.warn('AudioContext not supported or blocked:', e);
        }
    }, []);

    useEffect(() => {
        const handleInteraction = () => {
            initAudio();
            ['click', 'keydown', 'touchstart'].forEach(event =>
                window.removeEventListener(event, handleInteraction)
            );
        };

        ['click', 'keydown', 'touchstart'].forEach(event =>
            window.addEventListener(event, handleInteraction)
        );

        return () => {
            ['click', 'keydown', 'touchstart'].forEach(event =>
                window.removeEventListener(event, handleInteraction)
            );
        };
    }, [initAudio]);

    const playSound = useCallback((type) => {
        // Attempt to wake up if not already
        if (!audioCtxRef.current) initAudio();

        const audioCtx = audioCtxRef.current;
        if (!audioCtx) return; // Audio not supported or failed to init

        // Create nodes
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        switch (type) {
            case 'click':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gainNode.gain.setValueAtTime(0.05, now); // Lower volume
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'hover':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05);
                gainNode.gain.setValueAtTime(0.01, now); // Very subtle
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                oscillator.start(now);
                oscillator.stop(now + 0.05);
                break;

            case 'success':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;

            case 'error':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.linearRampToValueAtTime(50, now + 0.3);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;

            case 'unlock':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.5);
                gainNode.gain.setValueAtTime(0.03, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;

            default:
                break;
        }
    }, [initAudio]);

    return { playSound };
};

export default useSound;
