
export const createDummyVideoTrack = (): MediaStreamTrack => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let active = true;

    const draw = () => {
        if (!active || !ctx) return;

        
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        
        
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);
        ctx.fillStyle = '#010101';
        ctx.fillRect(x, y, 1, 1);

        
        setTimeout(draw, 1000 / 15);
    };

    
    draw();

    
    const stream = canvas.captureStream(15);
    const track = stream.getVideoTracks()[0];

    
    track.enabled = true;

    
    track.onended = () => {
        active = false;
    };

    return track;
};
