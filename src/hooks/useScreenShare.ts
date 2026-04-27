import { usePeerState } from './usePeerState';

export const useScreenShare = (state: ReturnType<typeof usePeerState>) => {
    const {
        peer,
        myId,
        presenterPeerId, setPresenterPeerId,
        screenStreamRef,
        setScreenStream,
        setError,
        connections, connectionsRef
    } = state;

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            setScreenStream(null);
            screenStreamRef.current = null;
            setPresenterPeerId(null);

            Object.values(connections).forEach(conn => {
                if (conn.open) {
                    conn.send({ type: 'SCREEN_SHARE_STATUS', isSharing: false, presenterId: myId });
                }
            });
        }
    };

    const startScreenShare = async () => {
        if (presenterPeerId) return;

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false,
                    suppressLocalAudioPlayback: true, 
                } as any 
            });

            setScreenStream(stream);
            screenStreamRef.current = stream;
            setPresenterPeerId(myId);

            Object.values(connections).forEach(conn => {
                if (conn.open) {
                    conn.send({ type: 'SCREEN_SHARE_STATUS', isSharing: true, presenterId: myId });
                }
            });

            Object.keys(connectionsRef.current).forEach(peerId => {
                if (peer && connectionsRef.current[peerId].open) {
                    peer.call(peerId, stream, {
                        metadata: { type: 'screen' }
                    });
                }
            });

            stream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };

        } catch (err) {
            console.error("Error starting screen share:", err);
            setError("Ekran paylaşımı başlatılamadı.");
        }
    };

    return { startScreenShare, stopScreenShare };
};
