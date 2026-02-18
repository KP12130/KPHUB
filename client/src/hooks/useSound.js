import { useCallback } from 'react';

const useSound = () => {
    const playSound = useCallback((type) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;

            case 'hover':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05);
                gainNode.gain.setValueAtTime(0.02, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                oscillator.start(now);
                oscillator.stop(now + 0.05);
                break;

            case 'success':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(400, now);
                oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;

            case 'error':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.linearRampToValueAtTime(50, now + 0.3);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;

            case 'unlock':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.5);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;

            default:
                break;
        }
    }, []);

    return { playSound };
};

export default useSound;
