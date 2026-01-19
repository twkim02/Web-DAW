import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';

const VisualizerBars = ({
    count = 200,
    radius = 4.2,
    mode = 'default',
    primaryColor = '#00ffcc'
}) => {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const colorDummy = useMemo(() => new THREE.Color(), []);

    useFrame(() => {
        if (!mesh.current) return;

        const freqData = audioEngine.getFrequencyData();
        const hasAudio = freqData && freqData.length > 0;

        // Bass detection for bass mode
        const bass = hasAudio ? Math.max(freqData[0], freqData[1], freqData[2] || 0) : 0;
        const isBassHit = bass > 140;

        // Time for color cycling
        const time = Date.now() * 0.0002;

        for (let i = 0; i < count; i++) {
            // 1. Calculate Position (Circular)
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            dummy.position.set(x, y, 0);

            // Rotation: Point outwards
            dummy.rotation.z = angle - Math.PI / 2;

            // 2. Calculate Scale based on Audio
            let scaleY = 0.1; // Idle scale
            if (hasAudio) {
                // Map bar index to frequency bin
                const index = Math.floor((i / count) * freqData.length * 0.5); // Use lower half of spectrum
                const val = freqData[index] || 0;
                // Scale factor: 0.1 to ~5
                scaleY = 0.1 + (val / 255) * 5;
            }
            dummy.scale.set(1, scaleY, 1);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);

            // 3. Calculate Color
            colorDummy.set(primaryColor); // Reset to base

            if (mode === 'rainbow') {
                const hue = (time * 2) % 1; // Global cycle
                colorDummy.setHSL(hue, 1, 0.5);
            }
            else if (mode === 'gradient') {
                const hue = ((i / count) + time) % 1;
                colorDummy.setHSL(hue, 1, 0.5);
            }
            else if (mode === 'bass') {
                if (isBassHit) {
                    colorDummy.set('#ff0055'); // Red punch
                } else {
                    colorDummy.set(primaryColor);
                }
            }

            // Apply color to instance
            mesh.current.setColorAt(i, colorDummy);
        }

        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;

        // Rotate entire group slowly
        mesh.current.rotation.z -= 0.002;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <boxGeometry args={[0.05, 1, 0.05]} />
            <meshStandardMaterial
                transparent
                opacity={0.9}
                roughness={0.2}
                metalness={0.8}
            />
        </instancedMesh>
    );
};

export default VisualizerBars;
