import React, { useEffect, useRef, useState } from 'react';
import { User, MicOff, Pin } from 'lucide-react';

interface UserTileProps {
    peerId: string;
    stream: MediaStream;
    isMe?: boolean;
    isMuted?: boolean;
    isVideoOn?: boolean;
    nickname?: string;
    isHost?: boolean;
    isPinned?: boolean;
    isSpotlight?: boolean;
    onClick?: () => void;
}

export const UserTile: React.FC<UserTileProps> = ({
    peerId, stream, isMe, isMuted, isVideoOn = false,
    nickname, isHost, isPinned, isSpotlight, onClick
}) => {
    const [volume, setVolume] = useState<number>(1);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (audioRef.current && !isMe) {
            audioRef.current.srcObject = stream;
            audioRef.current.volume = volume;
            audioRef.current.play().catch(e => console.error('Audio play failed', e));
        }
    }, [stream, isMe]);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        if (!isMe) {
            if (audioRef.current) audioRef.current.volume = volume;
            if (videoRef.current) videoRef.current.volume = volume;
        }
    }, [volume, isMe]);

    useEffect(() => {
        if (!stream) return;

        let audioCtx: AudioContext | null = null;
        let rafId = 0;

        try {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            source.connect(analyser);
            analyser.fftSize = 256;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const canvas = canvasRef.current;
            const canvasCtx = canvas?.getContext('2d');

            const draw = () => {
                rafId = requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                const loudness = Math.min(average / 50, 1);

                setIsSpeaking(loudness > 0.08);

                if (canvas && canvasCtx) {
                    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                        canvas.width = canvas.clientWidth;
                        canvas.height = canvas.clientHeight;
                    }
                    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
                    canvasCtx.fillStyle = `rgba(99, 102, 241, ${loudness})`;
                    canvasCtx.beginPath();
                    const minDim = Math.min(canvas.width, canvas.height);
                    const radius = (minDim / 2) * (0.6 + loudness * 0.4);
                    canvasCtx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
                    canvasCtx.fill();
                }
            };

            draw();
        } catch (_) {  }

        return () => {
            cancelAnimationFrame(rafId);
            audioCtx?.close();
            setIsSpeaking(false);
        };
    }, [stream]);

    const videoTracks = stream?.getVideoTracks() || [];
    const hasRealVideoTrack = videoTracks.length > 0 && videoTracks[0].readyState === 'live';
    const hasVideo = hasRealVideoTrack && isVideoOn;

    const displayName = isMe
        ? (nickname || 'Sen')
        : (nickname || `Kullanıcı ${peerId.substr(0, 5)}...`);

    return (
        <div
            onClick={onClick}
            className={`
                relative flex flex-col items-center justify-center bg-gray-800 rounded-xl shadow-lg
                w-full h-full overflow-hidden border transition-all duration-200 group
                ${isPinned
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                    : hasVideo && isSpeaking
                        ? 'border-green-400 ring-2 ring-green-400/40'
                        : 'border-gray-700/50'
                }
                ${onClick ? 'cursor-pointer hover:border-indigo-400/60 hover:ring-1 hover:ring-indigo-400/30' : ''}
            `}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMe}
                style={{ display: hasVideo ? 'block' : 'none' }}
                className={`absolute inset-0 w-full h-full object-cover ${isMe ? 'scale-x-[-1]' : ''}`}
            />

            {!hasVideo && (
                <>
                    {!isMe && <audio ref={audioRef} autoPlay playsInline />}

                    <canvas
                        ref={canvasRef}
                        width={200}
                        height={200}
                        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
                    />

                    <div className="z-10 bg-gray-700 p-4 rounded-full mb-3 shadow-md">
                        <User size={isSpotlight ? 64 : 48} className="text-gray-300" />
                    </div>
                </>
            )}

            {hasVideo && isSpeaking && (
                <span className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                    <span className="text-[10px] text-green-300 font-medium">Konuşuyor</span>
                </span>
            )}

            <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-2 pt-8 bg-gradient-to-t from-black/75 to-transparent">
                <div className="flex items-center justify-between gap-1">
                    <span className="text-white text-sm font-semibold truncate drop-shadow">{displayName}</span>
                    {isMuted && <MicOff size={14} className="text-red-400 flex-shrink-0" />}
                </div>

                {!isMe && (
                    <div
                        className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-medium">Vol</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={e => setVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
                {isHost && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-indigo-400/50">
                        HOST
                    </span>
                )}
                {isPinned && (
                    <span className="bg-black/60 p-1 rounded backdrop-blur-sm">
                        <Pin size={12} className="text-indigo-400" />
                    </span>
                )}
            </div>
        </div>
    );
};
