import React, { useState } from 'react';
import { usePeer } from '../context/PeerContext';
import { UserTile } from './UserTile';
import { ChatSidebar } from './ChatSidebar';
import { Mic, MicOff, PhoneOff, Copy, Check, Monitor, MonitorOff, MessageSquare, Video, VideoOff } from 'lucide-react';
import { ScreenShareView } from './ScreenShareView';
import { useSoundEffects } from '../hooks/useSoundEffects';

export const Room: React.FC = () => {
    const {
        myId,
        remoteStreams,
        myStream,
        leaveRoom,
        toggleMute,
        isMuted,
        remoteMuteStates,
        remoteCameraStates,
        screenStream,
        remoteScreenStream,
        presenterPeerId,
        startScreenShare,
        stopScreenShare,
        messages,
        toggleVideo,
        isVideoOn,
        peerNicknames,
        nickname,
        isHost,
        hostPeerId
    } = usePeer();

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const prevMsgCountRef = React.useRef(0);

    
    
    
    
    const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);

    const { playMessageSound } = useSoundEffects();

    React.useEffect(() => {
        if (messages.length <= prevMsgCountRef.current) {
            prevMsgCountRef.current = messages.length;
            return;
        }
        
        const newMessages = messages.slice(prevMsgCountRef.current);
        newMessages.forEach(msg => {
            
            if (!msg.isSystem && msg.senderId !== myId) {
                if (!isChatOpen) setHasUnread(true);
                playMessageSound();
            } else if (!msg.isSystem && msg.senderId === myId) {
                
                
            } else if (!isChatOpen && msg.isSystem) {
                
                setHasUnread(true);
            }
        });
        prevMsgCountRef.current = messages.length;
    }, [messages, isChatOpen, myId, playMessageSound]);

    const [copied, setCopied] = useState(false);

    const copyId = () => {
        navigator.clipboard.writeText(myId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    
    const remotePeerIds = Object.keys(remoteStreams);
    const activeScreenShare = screenStream || remoteScreenStream;
    const iAmPresenter = !!screenStream;

    
    const presenterDisplayName = presenterPeerId
        ? (peerNicknames[presenterPeerId] || presenterPeerId.substring(0, 8) + '...')
        : 'Unknown';

    
    const handleTileClick = (peerId: string) => {
        setPinnedPeerId(prev => (prev === peerId ? null : peerId));
    };

    
    
    
    
    const layoutMode: 'spotlight' | 'screen' | 'grid' =
        pinnedPeerId !== null
            ? 'spotlight'
            : activeScreenShare
                ? 'screen'
                : 'grid';

    
    const allParticipants = [
        ...remotePeerIds.map(id => ({ id, isMe: false })),
        ...(myStream ? [{ id: myId, isMe: true }] : [])
    ];

    const totalParticipants = remotePeerIds.length + (myStream ? 1 : 0);

    
    const getGridClass = () => {
        if (totalParticipants <= 1) return 'grid-cols-1 auto-rows-[1fr]';
        if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2 auto-rows-[1fr]';
        if (totalParticipants <= 4) return 'grid-cols-2 auto-rows-[1fr]';
        if (totalParticipants <= 6) return 'grid-cols-2 md:grid-cols-3 auto-rows-[1fr]';
        if (totalParticipants <= 9) return 'grid-cols-3 auto-rows-[1fr]';
        return 'grid-cols-3 md:grid-cols-4 auto-rows-[1fr]';
    };

    
    const renderTile = (peerId: string, isMe: boolean, opts: {
        isSpotlight?: boolean;
        isPinned?: boolean;
        onClick?: () => void;
    }) => {
        const stream = isMe ? myStream! : remoteStreams[peerId];
        if (!stream) return null;
        return (
            <UserTile
                key={peerId}
                peerId={peerId}
                stream={stream}
                isMe={isMe}
                nickname={isMe ? nickname : peerNicknames[peerId]}
                isVideoOn={isMe ? isVideoOn : (remoteCameraStates[peerId] ?? false)}
                isMuted={isMe ? isMuted : remoteMuteStates[peerId]}
                isHost={peerId === hostPeerId || (isMe && isHost)}
                isPinned={opts.isPinned}
                isSpotlight={opts.isSpotlight}
                onClick={opts.onClick}
            />
        );
    };

    
    const renderSpotlightLayout = () => {
        const pinnedIsMe = pinnedPeerId === myId;
        const stripParticipants = allParticipants.filter(p => p.id !== pinnedPeerId);
        const hasStrip = stripParticipants.length > 0 || activeScreenShare;

        return (
            <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
                {}
                <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-indigo-500/40 shadow-2xl">
                    {renderTile(pinnedPeerId!, pinnedIsMe, {
                        isSpotlight: true,
                        isPinned: true,
                        onClick: () => handleTileClick(pinnedPeerId!)
                    })}
                </div>

                {}
                {hasStrip && (
                    <div className="flex-none w-[200px] md:w-[240px] flex flex-col gap-2 overflow-y-auto pb-28 no-scrollbar">
                        {}
                        {activeScreenShare && (
                            <div
                                className="flex-shrink-0 w-full h-[130px] rounded-xl overflow-hidden border border-blue-600/60 hover:border-blue-400/80 cursor-pointer shadow-md transition-colors"
                                onClick={() => setPinnedPeerId(null)}
                                title="Ekran paylaşımına dön"
                            >
                                <ScreenShareView
                                    stream={activeScreenShare}
                                    presenterId={presenterDisplayName}
                                    isMe={iAmPresenter}
                                    compact
                                />
                            </div>
                        )}

                        {}
                        {stripParticipants.map(({ id, isMe }) => (
                            <div
                                key={id}
                                className="flex-shrink-0 w-full h-[150px] rounded-xl overflow-hidden border border-gray-700/60 hover:border-indigo-400/50 cursor-pointer shadow-md transition-colors"
                            >
                                {renderTile(id, isMe, { onClick: () => handleTileClick(id) })}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    
    
    const renderScreenLayout = () => (
        <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
            {}
            <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-gray-800/50 shadow-2xl bg-black/40 backdrop-blur-sm">
                <ScreenShareView
                    stream={activeScreenShare!}
                    presenterId={presenterDisplayName}
                    isMe={iAmPresenter}
                />
            </div>

            {}
            {allParticipants.length > 0 && (
                <div className="flex-none w-[200px] md:w-[240px] flex flex-col gap-2 overflow-y-auto pb-28 no-scrollbar">
                    {allParticipants.map(({ id, isMe }) => (
                        <div
                            key={id}
                            className="flex-shrink-0 w-full h-[150px] rounded-xl overflow-hidden border border-gray-700/60 hover:border-indigo-400/50 cursor-pointer shadow-md transition-colors"
                        >
                            {renderTile(id, isMe, { onClick: () => handleTileClick(id) })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    
    const renderGridLayout = () => (
        <div className={`grid gap-4 transition-all duration-500 ease-in-out ${getGridClass()} h-full`}>
            {myStream && renderTile(myId, true, { onClick: () => handleTileClick(myId) })}

            {remotePeerIds.map(peerId =>
                renderTile(peerId, false, { onClick: () => handleTileClick(peerId) })
            )}

            {remotePeerIds.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center min-h-[200px] text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/30 p-4">
                    <p className="text-center font-medium">Başkalarının katılması bekleniyor...</p>
                    <p className="text-center text-xs text-yellow-500/80 mt-2 max-w-sm">
                        Eğer odaya katılan diğer kişileri göremiyorsanız, ağınızdaki katı bir güvenlik duvarı (Firewall) veya NAT kısıtlaması P2P bağlantısını engelliyor olabilir.
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col w-full max-w-7xl mx-auto p-4 md:p-6 gap-4 relative h-[100dvh] overflow-hidden transition-all">

            {}
            <header className="flex-none flex justify-between items-center bg-gray-900/80 p-4 rounded-2xl border border-gray-800 backdrop-blur-sm z-30 shadow-lg">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                        Oda Aktif
                        {pinnedPeerId && (
                            <span className="text-xs font-normal text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-700/40">
                                Odaklanma modu — çıkmak için tekrar tıkla
                            </span>
                        )}
                    </h2>
                    <p className="text-gray-400 text-xs mt-1 ml-6">
                        {remotePeerIds.length + 1} katılımcı
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={copyId}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-all text-sm group"
                    >
                        <span className="text-gray-400 group-hover:text-white">ID: {myId}</span>
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />}
                    </button>
                </div>
            </header>

            {}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {layoutMode === 'spotlight' && renderSpotlightLayout()}
                {layoutMode === 'screen' && renderScreenLayout()}
                {layoutMode === 'grid' && renderGridLayout()}
            </div>

            {}
            <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

            {}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md border border-gray-800 p-2 rounded-full shadow-2xl flex gap-3 z-50">
                <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    title={isMuted ? "Sesi Aç" : "Sessize Al"}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-all ${!isVideoOn ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    title={!isVideoOn ? "Kamerayı Aç" : "Kamerayı Kapat"}
                >
                    {!isVideoOn ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                <button
                    onClick={iAmPresenter ? stopScreenShare : startScreenShare}
                    disabled={!iAmPresenter && !!presenterPeerId}
                    className={`p-4 rounded-full transition-all ${iAmPresenter
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                        : !!presenterPeerId
                            ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                    title={iAmPresenter ? "Paylaşımı Durdur" : (!!presenterPeerId ? "Şu an başkası paylaşıyor" : "Ekran Paylaş")}
                >
                    {iAmPresenter ? <MonitorOff size={24} /> : <Monitor size={24} />}
                </button>

                <button
                    onClick={() => {
                        setIsChatOpen(!isChatOpen);
                        if (!isChatOpen) setHasUnread(false);
                    }}
                    className={`p-4 rounded-full transition-all relative ${isChatOpen
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                    title="Sohbet"
                >
                    <MessageSquare size={24} />
                    {hasUnread && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse"></span>
                    )}
                </button>

                <button
                    onClick={leaveRoom}
                    className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </div>
    );
};
