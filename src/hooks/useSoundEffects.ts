import { useCallback } from 'react';

export const useSoundEffects = () => {
    
    
    const playJoinSound = useCallback(() => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        
        
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    }, []);

    
    const playLeaveSound = useCallback(() => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';

        
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }, []);

    
    const playMessageSound = useCallback(() => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

        
        const times = [
            { freq: 880, start: 0,    dur: 0.08 },
            { freq: 660, start: 0.06, dur: 0.10 },
        ];

        times.forEach(({ freq, start, dur }) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
            gain.gain.setValueAtTime(0, audioCtx.currentTime + start);
            gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + dur);
            osc.start(audioCtx.currentTime + start);
            osc.stop(audioCtx.currentTime + start + dur);
        });
    }, []);

    return { playJoinSound, playLeaveSound, playMessageSound };
};
