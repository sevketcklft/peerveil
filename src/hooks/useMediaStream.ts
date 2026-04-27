import { usePeerState } from './usePeerState';
import { createDummyVideoTrack } from '../utils/mediaUtils';

export const useMediaStream = (state: ReturnType<typeof usePeerState>) => {
    const {
        myStream, myStreamRef,
        isMuted, setIsMuted,
        isVideoOn, setIsVideoOn,
        connections, connectionsRef,
        mediaConnections, setMediaConnections,
        setRemoteStreams, streamsRef,
        setError,
        peer,
        verifiedPeersRef,
        isMutedRef
    } = state;

    const toggleMute = () => {
        if (myStream) {
            const newMutedState = !isMuted;
            myStream.getAudioTracks().forEach(track => {
                track.enabled = !newMutedState;
            });
            setIsMuted(newMutedState);

            Object.values(connections).forEach(conn => {
                if (conn.open) {
                    conn.send({ type: 'MUTE_STATUS', isMuted: newMutedState, peerId: state.myId });
                }
            });
        }
    };

    const toggleVideo = async () => {
        try {
            const newVideoState = !isVideoOn;

            if (!myStream) {
                console.error("[ToggleVideo] No stream available");
                return;
            }

            console.log(`[ToggleVideo] Switching to ${newVideoState ? 'CAMERA ON' : 'CAMERA OFF'} using Re-Call strategy`);

            let newVideoTrack: MediaStreamTrack;

            if (newVideoState) {
                try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    newVideoTrack = videoStream.getVideoTracks()[0];
                    console.log("[ToggleVideo] Acquired real camera track:", newVideoTrack.id);
                } catch (e) {
                    console.error("[ToggleVideo] Camera access denied", e);
                    setError("Kameraya erişilemedi.");
                    return;
                }
            } else {
                newVideoTrack = createDummyVideoTrack();
                console.log("[ToggleVideo] Created dummy video track:", newVideoTrack.id);
            }

            const existingAudioTracks = myStream.getAudioTracks();
            existingAudioTracks.forEach(t => {
                t.enabled = !isMutedRef.current;
            });

            const newStream = new MediaStream([
                ...existingAudioTracks,
                newVideoTrack
            ]);

            myStream.getVideoTracks().forEach(t => t.stop());

            myStreamRef.current = newStream;
            state.setMyStream(newStream);
            setIsVideoOn(newVideoState);

            const currentPeer = peer;
            if (currentPeer) {
                const peersToRecall = Object.keys(connectionsRef.current);

                peersToRecall.forEach((peerId, index) => {
                    setTimeout(() => {
                        const oldCall = mediaConnections[peerId];
                        if (oldCall) {
                            console.log(`[Re-Call] Closing old media connection to ${peerId}`);
                            oldCall.close();
                        }

                        const dataConn = connectionsRef.current[peerId];
                        if (dataConn && dataConn.open && verifiedPeersRef.current.has(peerId)) {
                            console.log(`[Re-Call] Re-calling ${peerId} with new stream`);
                            const newCall = currentPeer.call(peerId, newStream, {
                                metadata: { type: 'main' }
                            });

                            newCall.on('stream', (remoteStream) => {
                                console.log(`[Re-Call] Got stream back from ${peerId}`);
                                setRemoteStreams(prev => {
                                    const updated = { ...prev, [peerId]: remoteStream };
                                    streamsRef.current = updated;
                                    return updated;
                                });
                            });

                            newCall.on('close', () => {
                                console.log(`[Re-Call] Media connection closed to ${peerId}`);
                            });

                            newCall.on('error', (err) => {
                                console.error(`[Re-Call] Media connection error to ${peerId}:`, err);
                            });

                            setMediaConnections(prev => ({ ...prev, [peerId]: newCall }));
                        } else {
                            console.warn(`[Re-Call] Skipping ${peerId} - data connection not open or peer not verified`);
                        }
                    }, index * 150);
                });
            }

            Object.values(connections).forEach(conn => {
                if (conn.open) {
                    conn.send({ type: 'CAMERA_STATUS', isVideoOn: newVideoState, peerId: state.myId });
                }
            });

            console.log(`[ToggleVideo] Done. Video is now ${newVideoState ? 'ON' : 'OFF'}`);

        } catch (err) {
            console.error("[ToggleVideo] Unexpected error:", err);
            setError("Kamera değiştirilirken bir hata oluştu.");
        }
    };

    return { toggleMute, toggleVideo };
};
