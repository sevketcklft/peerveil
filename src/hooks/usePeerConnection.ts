import { useEffect } from 'react';
import Peer from 'peerjs';
import { usePeerState } from './usePeerState';
import type { Message } from './usePeerState';
import { createDummyVideoTrack } from '../utils/mediaUtils';
import { useSoundEffects } from './useSoundEffects';

export const usePeerConnection = (state: ReturnType<typeof usePeerState>) => {
    const {
        peer, setPeer,
        myId, setMyId,
        connections, setConnections,
        mediaConnections, setMediaConnections,
        setRemoteStreams,
        myStream, setMyStream,
        setIsHost,
        setError,
        hostPeerId, setHostPeerId,
        setRoomPassword,
        setNickname,
        setPeerNicknames,
        setConnectionStatus,
        setRemoteMuteStates,
        setRemoteCameraStates,
        setRemoteScreenStream,
        presenterPeerId, setPresenterPeerId,
        setMessages,
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
    } = state;

    const { playJoinSound, playLeaveSound } = useSoundEffects();

    const sendMessage = (text: string) => {
        const message: Message = {
            id: Date.now().toString(),
            senderId: myId,
            text,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, message]);

        Object.values(connectionsRef.current).forEach(conn => {
            if (conn.open) {
                conn.send({ type: 'CHAT', message });
            }
        });
    };

    const connectToPeer = (peerId: string, password?: string, currentPeer: Peer = peer!) => {
        if (!currentPeer) return;
        if (connectionsRef.current[peerId]) return;

        console.log(`Connecting to peer: ${peerId} `);

        const conn = currentPeer.connect(peerId);
        conn.on('open', () => {
            conn.send({ type: 'JOIN_REQUEST', isMuted: isMutedRef.current, isVideoOn: isVideoOnRef.current, password, nickname: nicknameRef.current });
        });

        conn.on('data', (data: any) => {
            if (data.type === 'JOIN_ACCEPTED') {
                console.log(`Connected & Handshake accepted by ${peerId} `);
                verifiedPeersRef.current.add(peerId);

                if (data.hostNickname) {
                    setPeerNicknames(prev => {
                        const updated = { ...prev, [peerId]: data.hostNickname };
                        peerNicknamesRef.current = updated;
                        return updated;
                    });
                }

                playJoinSound();
                setConnections(prev => {
                    const updated = { ...prev, [peerId]: conn };
                    connectionsRef.current = updated;
                    return updated;
                });

                if (data.isMuted !== undefined) {
                    setRemoteMuteStates(prev => ({ ...prev, [peerId]: data.isMuted }));
                }

                if (data.isVideoOn !== undefined) {
                    setRemoteCameraStates(prev => ({ ...prev, [peerId]: data.isVideoOn }));
                }

                if (data.presenterPeerId) {
                    setPresenterPeerId(data.presenterPeerId);
                }

                if (data.history && Array.isArray(data.history)) {
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const newMessages = data.history.filter((m: Message) => !existingIds.has(m.id));
                        return [...prev, ...newMessages].sort((a, b) => a.timestamp - b.timestamp);
                    });
                }

                conn.send({ type: 'JOIN_ACK' });

                if (data.iWillCallYou) {
                    console.log(`Host ${peerId} has Video.Sent ACK, waiting for incoming call...`);
                    return;
                }

                const stream = myStreamRef.current;
                if (stream) {
                    const call = currentPeer.call(peerId, stream, {
                        metadata: { type: 'main' }
                    });

                    call.on('stream', (remoteStream) => {
                        setRemoteStreams(prev => {
                            const updated = { ...prev, [peerId]: remoteStream };
                            streamsRef.current = updated;
                            return updated;
                        });
                    });

                    call.on('close', () => {
                        console.log(`Media connection(Outgoing) closed to ${peerId} `);
                        
                        
                        
                        
                    });

                    const pc = call.peerConnection;
                    if (pc) {
                        const updateState = () => {
                            setConnectionStatus(prev => ({ ...prev, [peerId]: pc.iceConnectionState }));
                            
                            
                        };
                        pc.oniceconnectionstatechange = updateState;
                        updateState();
                    }

                    setMediaConnections(prev => ({ ...prev, [peerId]: call }));
                }

            } else if (data.type === 'peer-list') {
                if (hostPeerId && conn.peer !== hostPeerId) {
                    console.warn(`Ignored peer - list from non - host peer: ${conn.peer} `);
                    return;
                }
                data.peers.forEach((p: { id: string, nickname: string }, index: number) => {
                    if (p.id !== currentPeer.id && !connectionsRef.current[p.id]) {
                        
                        setTimeout(() => {
                            connectToPeer(p.id, roomPasswordRef.current || undefined, currentPeer);
                            if (p.nickname) {
                                setPeerNicknames(prev => {
                                    const updated = { ...prev, [p.id]: p.nickname };
                                    peerNicknamesRef.current = updated;
                                    return updated;
                                });
                            }
                        }, index * 300);
                    }
                });
            } else if (data.type === 'MUTE_STATUS') {
                const targetId = data.peerId || peerId;
                setRemoteMuteStates(prev => ({ ...prev, [targetId]: data.isMuted }));
            } else if (data.type === 'CAMERA_STATUS') {
                const targetId = data.peerId || peerId;
                setRemoteCameraStates(prev => ({ ...prev, [targetId]: data.isVideoOn }));
            } else if (data.type === 'SCREEN_SHARE_STATUS') {
                if (data.isSharing) {
                    setPresenterPeerId(data.presenterId);
                } else {
                    setPresenterPeerId(null);
                    setRemoteScreenStream(null);
                }
            } else if (data.type === 'CHAT') {
                setMessages(prev => {
                    if (prev.some(m => m.id === data.message.id)) return prev;
                    return [...prev, data.message];
                });
            }
        });

        conn.on('close', () => {
            playLeaveSound();
            verifiedPeersRef.current.delete(conn.peer);
            setConnections(prev => {
                const newConns = { ...prev };
                delete newConns[peerId];
                connectionsRef.current = newConns;
                return newConns;
            });
            setRemoteStreams(prev => {
                const next = { ...prev };
                delete next[peerId];
                return next;
            });
            setPeerNicknames(prev => {
                const next = { ...prev };
                delete next[peerId];
                peerNicknamesRef.current = next;
                return next;
            });
            setRemoteMuteStates(prev => {
                const next = { ...prev };
                delete next[peerId];
                return next;
            });
            if (peerId === presenterPeerId) {
                setPresenterPeerId(null);
                setRemoteScreenStream(null);
            }

            
            
            if (peerId === hostPeerIdRef.current) {
                console.log("Host disconnected! Initiating host handover...");
                const remainingPeers = Object.keys(connectionsRef.current);

                if (remainingPeers.length > 0) {
                    
                    const newHostId = remainingPeers.sort()[0];

                    if (newHostId === peer!.id) {
                        
                        console.log("I am the new host!");
                        setIsHost(true);
                        isHostRef.current = true;
                        setHostPeerId(peer!.id);

                        
                        Object.values(connectionsRef.current).forEach(conn => {
                            if (conn.open) {
                                conn.send({
                                    type: 'HOST_CHANGED',
                                    newHostId: peer!.id
                                });
                            }
                        });
                    } else {
                        
                        console.log(`New host is: ${newHostId} `);
                        setHostPeerId(newHostId);
                    }
                } else {
                    
                    console.log("I am now alone, becoming host");
                    setIsHost(true);
                    isHostRef.current = true;
                    setHostPeerId(peer!.id);
                }
            }
        });
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (!newPeer.id) {
                setError("Ağ bağlantısı zaman aşımına uğradı. (Sunucu yoğun olabilir). Tekrar deneniyor...");
                console.error("PeerJS Connection timed out.");
                newPeer.destroy();
            }
        }, 15000);

        const newPeer = new Peer({
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' },
                    { urls: 'stun:stun.services.mozilla.com' },
                    { urls: 'stun:stun.voip.blackberry.com:3478' },
                ],
                sdpSemantics: 'unified-plan',
                pingInterval: 5000,
            },
            debug: 1
        });

        newPeer.on('open', (id) => {
            clearTimeout(timeoutId);
            console.log('My Peer ID is: ' + id);
            setMyId(id);
            setPeer(newPeer);
            setError(null);
        });

        newPeer.on('call', (call) => {
            if (!verifiedPeersRef.current.has(call.peer)) {
                console.warn(`Blocked unauthorized media call from ${call.peer} `);
                call.close();
                return;
            }

            const metadata = call.metadata || {};

            if (metadata.type === 'screen') {
                call.answer();
                call.on('stream', (remoteStream) => {
                    setRemoteScreenStream(remoteStream);
                    setPresenterPeerId(call.peer);
                });
                call.on('close', () => {
                    setRemoteScreenStream(null);
                    setPresenterPeerId(null);
                });
            } else {
                
                
                setMediaConnections(prev => {
                    const oldCall = prev[call.peer];
                    if (oldCall) {
                        console.log(`[Incoming Re-Call] Closing old media connection from ${call.peer}`);
                        oldCall.close();
                    }
                    return prev;
                });

                const stream = myStreamRef.current;
                if (stream) {
                    call.answer(stream);
                } else {
                    console.warn("No local stream to answer with, answering receive-only");
                    call.answer();
                }

                call.on('stream', (remoteStream) => {
                    console.log(`[Incoming call] Received stream from ${call.peer}`);
                    setRemoteStreams((prev) => {
                        const updated = { ...prev, [call.peer]: remoteStream };
                        streamsRef.current = updated;
                        return updated;
                    });
                });
                call.on('close', () => {
                    console.log(`Media connection closed by ${call.peer}`);
                });

                const pc = call.peerConnection;
                if (pc) {
                    const updateState = () => {
                        setConnectionStatus(prev => ({ ...prev, [call.peer]: pc.iceConnectionState }));
                    };
                    pc.oniceconnectionstatechange = updateState;
                    updateState();
                }

                setMediaConnections(prev => ({ ...prev, [call.peer]: call }));
            }
        });

        newPeer.on('connection', (conn) => {
            let handshakeTimeout: ReturnType<typeof setTimeout>;

            conn.on('open', () => {
                handshakeTimeout = setTimeout(() => {
                    console.warn(`Peer ${conn.peer} failed handshake timeout.Closing.`);
                    conn.close();
                }, 15000);
            });

            conn.on('data', (data: any) => {
                const isHandshake = data.type === 'JOIN_REQUEST' || data.type === 'JOIN_REJECTED';
                const isVerified = verifiedPeersRef.current.has(conn.peer);

                if (!isHandshake && !isVerified) {
                    conn.close();
                    return;
                }

                if (data.type === 'JOIN_REJECTED') {
                    console.error("Join Rejected:", data.reason);
                    setError(data.reason || 'Odaya katılma reddedildi.');
                    conn.close();
                    return;
                }

                if (data.type === 'JOIN_REQUEST') {
                    clearTimeout(handshakeTimeout);

                    if (roomPasswordRef.current && data.password !== roomPasswordRef.current) {
                        console.warn(`Peer ${conn.peer} provided WRONG password.`);
                        conn.send({ type: 'JOIN_REJECTED', reason: 'Geçersiz Şifre' });
                        setTimeout(() => conn.close(), 500);
                        return;
                    }

                    
                    
                    if (Object.keys(connectionsRef.current).length >= 5) {
                        console.warn(`Room Full.Rejecting ${conn.peer} `);
                        conn.send({ type: 'JOIN_REJECTED', reason: 'Oda dolu (Maksimum 6 kişi)' });
                        setTimeout(() => conn.close(), 500);
                        return;
                    }

                    verifiedPeersRef.current.add(conn.peer);
                    const willICallYou = isVideoOnRef.current;

                    conn.send({
                        type: 'JOIN_ACCEPTED',
                        presenterPeerId: presenterPeerIdRef.current,
                        history: messagesRef.current,
                        hostNickname: nicknameRef.current,
                        isMuted: isMutedRef.current,
                        iWillCallYou: willICallYou,
                        isVideoOn: willICallYou 
                    });

                    if (data.nickname) {
                        setPeerNicknames(prev => {
                            const updated = { ...prev, [conn.peer]: data.nickname };
                            peerNicknamesRef.current = updated;
                            return updated;
                        });
                    }

                    if (data.isMuted !== undefined) {
                        setRemoteMuteStates(prev => ({ ...prev, [conn.peer]: data.isMuted }));
                    }

                    if (data.isVideoOn !== undefined) {
                        setRemoteCameraStates(prev => ({ ...prev, [conn.peer]: data.isVideoOn }));
                    }

                    setConnections(prev => {
                        const updated = { ...prev, [conn.peer]: conn };
                        connectionsRef.current = updated;
                        return updated;
                    });

                    playJoinSound();

                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        senderId: 'System',
                        text: `${conn.peer.slice(0, 5)} odaya katıldı.`,
                        timestamp: Date.now(),
                        isSystem: true
                    }]);

                    const currentConnectionKeys = Object.keys(connectionsRef.current);
                    if (currentConnectionKeys.length > 0) {
                        const others = currentConnectionKeys.filter(id => id !== conn.peer);
                        if (others.length > 0) {
                            const peerListPayload = others.map(id => ({
                                id,
                                nickname: peerNicknamesRef.current[id] || ''
                            }));
                            conn.send({ type: 'peer-list', peers: peerListPayload });
                        }
                    }

                } else if (data.type === 'JOIN_ACK') {
                    const willICallYou = isVideoOnRef.current;
                    if (willICallYou) {
                        const stream = myStreamRef.current;
                        if (stream) {
                            const call = newPeer.call(conn.peer, stream, { metadata: { type: 'main' } });
                            call.on('stream', (remoteStream) => {
                                setRemoteStreams(prev => {
                                    const updated = { ...prev, [conn.peer]: remoteStream };
                                    streamsRef.current = updated;
                                    return updated;
                                });
                            });
                            setMediaConnections(prev => ({ ...prev, [conn.peer]: call }));
                        }
                    }
                    if (screenStreamRef.current) {
                        newPeer.call(conn.peer, screenStreamRef.current, { metadata: { type: 'screen' } });
                    }
                } else if (data.type === 'peer-list') {
                    data.peers.forEach((p: { id: string, nickname: string }, index: number) => {
                        if (p.id !== newPeer.id && !connectionsRef.current[p.id]) {
                            setTimeout(() => {
                                connectToPeer(p.id, roomPasswordRef.current || undefined, newPeer);
                                if (p.nickname) {
                                    setPeerNicknames(prev => {
                                        const updated = { ...prev, [p.id]: p.nickname };
                                        peerNicknamesRef.current = updated;
                                        return updated;
                                    });
                                }
                            }, index * 300);
                        }
                    });
                } else if (data.type === 'MUTE_STATUS') {
                    const targetId = data.peerId || conn.peer;
                    setRemoteMuteStates(prev => ({ ...prev, [targetId]: data.isMuted }));
                } else if (data.type === 'CAMERA_STATUS') {
                    const targetId = data.peerId || conn.peer;
                    setRemoteCameraStates(prev => ({ ...prev, [targetId]: data.isVideoOn }));
                } else if (data.type === 'SCREEN_SHARE_STATUS') {
                    if (data.isSharing) {
                        setPresenterPeerId(data.presenterId);
                    } else {
                        setPresenterPeerId(null);
                        setRemoteScreenStream(null);
                    }
                } else if (data.type === 'CHAT') {
                    setMessages(prev => {
                        if (prev.some(m => m.id === data.message.id)) return prev;
                        return [...prev, data.message];
                    });
                    if (isHostRef.current) {
                        Object.values(connectionsRef.current).forEach(targetConn => {
                            if (targetConn.peer !== conn.peer && targetConn.open && verifiedPeersRef.current.has(targetConn.peer)) {
                                targetConn.send({ type: 'CHAT', message: data.message });
                            }
                        });
                    }
                } else if (data.type === 'REVERSE_CALL_REQUEST') {
                    const stream = myStreamRef.current;
                    if (stream) {
                        const call = newPeer.call(conn.peer, stream, { metadata: { type: 'main' } });
                        call.on('stream', (remoteStream) => {
                            setRemoteStreams(prev => {
                                const updated = { ...prev, [conn.peer]: remoteStream };
                                streamsRef.current = updated;
                                return updated;
                            });
                        });
                    }
                } else if (data.type === 'HOST_CHANGED') {
                    
                    console.log(`Host changed to: ${data.newHostId} `);
                    setHostPeerId(data.newHostId);

                    
                    if (data.newHostId === newPeer.id) {
                        console.log("Confirmed: I am the new host");
                        setIsHost(true);
                        isHostRef.current = true;
                    }
                }
            });

            conn.on('close', () => {
                playLeaveSound();
                verifiedPeersRef.current.delete(conn.peer);
                setConnections(prev => {
                    const next = { ...prev };
                    delete next[conn.peer];
                    connectionsRef.current = next;
                    return next;
                });
                setRemoteStreams(prev => {
                    const next = { ...prev };
                    delete next[conn.peer];
                    return next;
                });
                setPeerNicknames(prev => {
                    const next = { ...prev };
                    delete next[conn.peer];
                    peerNicknamesRef.current = next;
                    return next;
                });
                setRemoteMuteStates(prev => {
                    const next = { ...prev };
                    delete next[conn.peer];
                    return next;
                });
                if (conn.peer === presenterPeerIdRef.current) {
                    setPresenterPeerId(null);
                    setRemoteScreenStream(null);
                }
            });
            conn.on('error', (err) => {
                console.error("Peer Connection Error:", err);
                setConnections(prev => {
                    const next = { ...prev };
                    delete next[conn.peer];
                    connectionsRef.current = next;
                    return next;
                });
            });
        });

        newPeer.on('error', (err) => {
            console.error("PeerJS Global Error:", err);
            if (err.type === 'network' || err.type === 'peer-unavailable' || err.type === 'server-error') {
                setError(`Bağlantı Hatası: ${err.message} (Sunucu yoğun olabilir)`);
            } else {
                setError(`Hata(PeerJS): ${err.message} `);
            }
        });

        
        const heartbeatInterval = setInterval(() => {
            if (isHostRef.current) {
                const currentConnectionKeys = Object.keys(connectionsRef.current);
                if (currentConnectionKeys.length > 0) {
                    const allPeers = currentConnectionKeys.map(id => ({
                        id,
                        nickname: peerNicknamesRef.current[id] || ''
                    }));
                    allPeers.push({ id: newPeer.id, nickname: nicknameRef.current });

                    Object.values(connectionsRef.current).forEach(conn => {
                        if (conn.open) {
                            conn.send({ type: 'peer-list', peers: allPeers });
                            conn.send({ type: 'PING' });
                        } else {
                            console.warn(`Cleaning up closed connection: ${conn.peer} `);
                            conn.close();
                            setConnections(prev => {
                                const next = { ...prev };
                                delete next[conn.peer];
                                connectionsRef.current = next;
                                return next;
                            });
                        }
                    });
                }
            } else {
                if (hostPeerId) {
                    const hostConn = connectionsRef.current[hostPeerId];
                    if (hostConn && hostConn.open) {
                        hostConn.send({ type: 'PING' });
                    }
                }
            }
        }, 5000);

        const handleUnload = () => {
            newPeer.destroy();
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearInterval(heartbeatInterval);
            window.removeEventListener('beforeunload', handleUnload);
            clearTimeout(timeoutId);
            newPeer.destroy();
        };
    }, []);

    const createRoom = (password?: string, displayName?: string) => {
        setIsHost(true);
        if (displayName) {
            setNickname(displayName);
            nicknameRef.current = displayName;
        }
        if (password) {
            setRoomPassword(password);
            roomPasswordRef.current = password;
        }
        
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(async (audioStream) => {
                const blackVideoTrack = createDummyVideoTrack();

                
                const combinedStream = new MediaStream([
                    ...audioStream.getAudioTracks(),
                    blackVideoTrack
                ]);

                setMyStream(combinedStream);
                myStreamRef.current = combinedStream;
            })
            .catch(() => setError('Mikrofona erişilemedi'));
        
        setHostPeerId(myId);
        return myId;
    };

    const joinRoom = (hostId: string, password?: string, displayName?: string) => {
        setIsHost(false);
        if (displayName) {
            setNickname(displayName);
            nicknameRef.current = displayName;
        }
        if (password) {
            setRoomPassword(password);
            roomPasswordRef.current = password;
        }
        
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(async (audioStream) => {
                const blackVideoTrack = createDummyVideoTrack();

                
                const combinedStream = new MediaStream([
                    ...audioStream.getAudioTracks(),
                    blackVideoTrack
                ]);

                setMyStream(combinedStream);
                myStreamRef.current = combinedStream;
                setHostPeerId(hostId);
                connectToPeer(hostId, password);
            })
            .catch(() => setError('Mikrofona erişilemedi'));
    };

    const leaveRoom = () => {
        Object.values(mediaConnections).forEach(conn => conn.close());
        Object.values(connections).forEach(conn => conn.close());
        setRemoteStreams({});
        setConnections({});
        setMediaConnections({});
        if (myStream) {
            myStream.getTracks().forEach(t => t.stop());
            setMyStream(null);
        }
        window.location.reload();
    };

    return { sendMessage, createRoom, joinRoom, leaveRoom };
};
