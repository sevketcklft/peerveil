import { useState, useRef, useEffect } from 'react';
import Peer from 'peerjs';
import type { MediaConnection, DataConnection } from 'peerjs';

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
}

export const usePeerState = () => {
    const [peer, setPeer] = useState<Peer | null>(null);
    const [myId, setMyId] = useState<string>('');
    const [connections, setConnections] = useState<{ [key: string]: DataConnection }>({});
    const [mediaConnections, setMediaConnections] = useState<{ [key: string]: MediaConnection }>({});
    const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [isHost, setIsHost] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isVideoOn, setIsVideoOn] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hostPeerId, setHostPeerId] = useState<string | null>(null);
    const [roomPassword, setRoomPassword] = useState<string | null>(null);
    const [nickname, setNickname] = useState<string>('');
    const [peerNicknames, setPeerNicknames] = useState<{ [key: string]: string }>({});
    const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: string }>({});
    const [remoteMuteStates, setRemoteMuteStates] = useState<{ [key: string]: boolean }>({});
    const [remoteCameraStates, setRemoteCameraStates] = useState<{ [key: string]: boolean }>({});
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
    const [presenterPeerId, setPresenterPeerId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const streamsRef = useRef<{ [key: string]: MediaStream }>({});
    const connectionsRef = useRef<{ [key: string]: DataConnection }>({});
    const verifiedPeersRef = useRef<Set<string>>(new Set());
    const roomPasswordRef = useRef<string | null>(null);
    const nicknameRef = useRef<string>('');
    const peerNicknamesRef = useRef<{ [key: string]: string }>({});
    const myStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const presenterPeerIdRef = useRef<string | null>(null);
    const isHostRef = useRef<boolean>(false);
    const messagesRef = useRef<Message[]>([]);
    const isVideoOnRef = useRef<boolean>(false);
    const isMutedRef = useRef<boolean>(false);
    const hostPeerIdRef = useRef<string | null>(null);

    
    useEffect(() => { isHostRef.current = isHost; }, [isHost]);
    useEffect(() => { isVideoOnRef.current = isVideoOn; }, [isVideoOn]);
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
    useEffect(() => { presenterPeerIdRef.current = presenterPeerId; }, [presenterPeerId]);
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { roomPasswordRef.current = roomPassword; }, [roomPassword]);
    useEffect(() => { nicknameRef.current = nickname; }, [nickname]);
    useEffect(() => { hostPeerIdRef.current = hostPeerId; }, [hostPeerId]);

    return {
        peer, setPeer,
        myId, setMyId,
        connections, setConnections,
        mediaConnections, setMediaConnections,
        remoteStreams, setRemoteStreams,
        myStream, setMyStream,
        isHost, setIsHost,
        isMuted, setIsMuted,
        isVideoOn, setIsVideoOn,
        error, setError,
        hostPeerId, setHostPeerId,
        roomPassword, setRoomPassword,
        nickname, setNickname,
        peerNicknames, setPeerNicknames,
        connectionStatus, setConnectionStatus,
        remoteMuteStates, setRemoteMuteStates,
        remoteCameraStates, setRemoteCameraStates,
        screenStream, setScreenStream,
        remoteScreenStream, setRemoteScreenStream,
        presenterPeerId, setPresenterPeerId,
        messages, setMessages,
        streamsRef,
        connectionsRef,
        verifiedPeersRef,
        roomPasswordRef,
        nicknameRef,
        peerNicknamesRef,
        myStreamRef,
        screenStreamRef,
        presenterPeerIdRef,
        isHostRef,
        messagesRef,
        isVideoOnRef,
        isMutedRef,
        hostPeerIdRef
    };
};
