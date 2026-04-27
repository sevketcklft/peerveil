import React, { createContext, useContext } from 'react';
import Peer from 'peerjs';
import type { MediaConnection, DataConnection } from 'peerjs';
import { usePeerState } from '../hooks/usePeerState';
import type { Message } from '../hooks/usePeerState';
import { useMediaStream } from '../hooks/useMediaStream';
import { useScreenShare } from '../hooks/useScreenShare';
import { usePeerConnection } from '../hooks/usePeerConnection';

interface PeerContextType {
    peer: Peer | null;
    myId: string;
    connections: { [key: string]: DataConnection };
    mediaConnections: { [key: string]: MediaConnection };
    remoteStreams: { [key: string]: MediaStream };
    myStream: MediaStream | null;
    joinRoom: (hostId: string, password?: string, nickname?: string) => void;
    createRoom: (password?: string, nickname?: string) => string;
    isHost: boolean;
    hostPeerId: string | null;
    toggleMute: () => void;
    isMuted: boolean;
    leaveRoom: () => void;
    error: string | null;
    connectionStatus: { [key: string]: string };
    remoteMuteStates: { [key: string]: boolean };
    remoteCameraStates: { [key: string]: boolean };
    screenStream: MediaStream | null;
    remoteScreenStream: MediaStream | null;
    presenterPeerId: string | null;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => void;

    isVideoOn: boolean;
    toggleVideo: () => void;

    messages: Message[];
    sendMessage: (text: string) => void;
    roomPassword: string | null;
    nickname: string;
    peerNicknames: { [key: string]: string };
}

export type { Message };

const PeerContext = createContext<PeerContextType | null>(null);

export const usePeer = () => {
    const context = useContext(PeerContext);
    if (!context) throw new Error('usePeer must be used within a PeerProvider');
    return context;
};

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const state = usePeerState();
    const media = useMediaStream(state);
    const screenShare = useScreenShare(state);
    const connection = usePeerConnection(state);

    const leaveRoom = () => {
        screenShare.stopScreenShare();
        connection.leaveRoom();
    };

    return (
        <PeerContext.Provider value={{
            
            peer: state.peer,
            myId: state.myId,
            connections: state.connections,
            mediaConnections: state.mediaConnections,
            remoteStreams: state.remoteStreams,
            myStream: state.myStream,
            isHost: state.isHost,
            hostPeerId: state.hostPeerId,
            isMuted: state.isMuted,
            isVideoOn: state.isVideoOn,
            error: state.error,
            connectionStatus: state.connectionStatus,
            remoteMuteStates: state.remoteMuteStates,
            remoteCameraStates: state.remoteCameraStates,
            screenStream: state.screenStream,
            remoteScreenStream: state.remoteScreenStream,
            presenterPeerId: state.presenterPeerId,
            messages: state.messages,
            roomPassword: state.roomPassword,
            nickname: state.nickname,
            peerNicknames: state.peerNicknames,

            
            joinRoom: connection.joinRoom,
            createRoom: connection.createRoom,
            leaveRoom,
            toggleMute: media.toggleMute,
            toggleVideo: media.toggleVideo,
            startScreenShare: screenShare.startScreenShare,
            stopScreenShare: screenShare.stopScreenShare,
            sendMessage: connection.sendMessage
        }}>
            {children}
        </PeerContext.Provider>
    );
};
