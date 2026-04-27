import React, { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';

interface ScreenShareViewProps {
    stream: MediaStream;
    presenterId: string;
    isMe: boolean;
    
    compact?: boolean;
}

export const ScreenShareView: React.FC<ScreenShareViewProps> = ({
    stream, presenterId, isMe, compact = false
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [volume, setVolume] = useState<number>(1);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    
    useEffect(() => {
        if (videoRef.current && !isMe) {
            videoRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted, isMe]);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Fullscreen error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative group bg-black overflow-hidden transition-all duration-300
                ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full h-full rounded-2xl border border-gray-800 shadow-2xl'}
            `}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMe}
                className="w-full h-full object-contain bg-black"
            />

            {}
            {!compact && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-between items-end gap-4">

                    {}
                    <div className="flex-1 min-w-0">
                        <span className="text-white font-medium bg-red-600 px-2 py-1 rounded text-xs">CANLI</span>
                        <p className="text-gray-300 text-sm mt-1 truncate">
                            {isMe ? 'Ekranını Paylaşıyorsun' : `Sunum: ${presenterId}`}
                        </p>
                    </div>

                    {}
                    {!isMe && (
                        <div
                            className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsMuted(m => !m)}
                                className="text-gray-300 hover:text-white transition-colors flex-shrink-0"
                                title={isMuted ? 'Sesi Aç' : 'Sessize Al'}
                            >
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={e => {
                                    setVolume(parseFloat(e.target.value));
                                    setIsMuted(false);
                                }}
                                className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-3
                                    [&::-webkit-slider-thumb]:h-3
                                    [&::-webkit-slider-thumb]:bg-blue-400
                                    [&::-webkit-slider-thumb]:rounded-full"
                                title="Yayın Ses Seviyesi"
                            />
                            <span className="text-[10px] text-gray-400 w-6 text-right flex-shrink-0">
                                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                            </span>
                        </div>
                    )}

                    {}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors flex-shrink-0"
                    >
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
            )}
        </div>
    );
};
