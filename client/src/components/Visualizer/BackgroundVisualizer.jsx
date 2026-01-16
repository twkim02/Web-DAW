import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../audio/AudioEngine';

const BackgroundVisualizer = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        const draw = () => {
            animationId = requestAnimationFrame(draw);

            const data = audioEngine.getAudioData();
            if (!data) return;

            const width = canvas.width;
            const height = canvas.height;
            const barWidth = (width / data.length) * 2.5;
            let x = 0;

            ctx.clearRect(0, 0, width, height);

            // Create Gradient
            const gradient = ctx.createLinearGradient(0, height, 0, height / 2);
            gradient.addColorStop(0, '#00ffff'); // Cyan at bottom
            gradient.addColorStop(0.5, '#cc00ff'); // Purple in middle
            gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Transparent at top

            ctx.fillStyle = gradient;

            for (let i = 0; i < data.length; i++) {
                // data[i] is -Infinity to 0 dB, usually -100 to 0
                // Normalize to 0-1 range roughly
                const value = Math.max(-100, data[i]);
                const percent = (value + 100) / 100; // 0.0 to 1.0

                const barHeight = percent * height * 0.8; // Scale to 80% screen height

                // Draw Bar
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    const style = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: '#111' // Fallback/Base color
    };

    return <canvas ref={canvasRef} style={style} />;
};

export default BackgroundVisualizer;
