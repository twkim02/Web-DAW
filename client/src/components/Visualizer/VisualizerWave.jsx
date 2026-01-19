import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';

const VisualizerWave = ({
    radius = 4.2,
    color = '#00ffcc'
}) => {
    const lineRef = useRef();
    const POINTS = 256; // Must match or cover timeDomain slice

    // Initial Geometry Points
    const points = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= POINTS; i++) {
            const angle = (i / POINTS) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
        }
        return pts;
    }, [radius]);

    // Create BufferGeometry
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        return geo;
    }, [points]);

    useFrame(() => {
        if (!lineRef.current) return;

        const waveData = audioEngine.getTimeDomainData(); // 0-255, 128 center
        if (!waveData || waveData.length === 0) return;

        const positions = lineRef.current.geometry.attributes.position.array;

        for (let i = 0; i <= POINTS; i++) {
            // Map index to waveData length
            const dataIndex = Math.floor((i / POINTS) * waveData.length);
            const val = waveData[dataIndex % waveData.length] || 128;

            // Normalize: 128 -> 0 (-1 to 1 range approx)
            const normalized = (val - 128) / 128;
            const amp = normalized * 1.5; // Amplitude Scale

            const currentR = radius + amp;
            const angle = (i / POINTS) * Math.PI * 2;

            positions[i * 3] = Math.cos(angle) * currentR;
            positions[i * 3 + 1] = Math.sin(angle) * currentR;
            positions[i * 3 + 2] = 0;
        }

        lineRef.current.geometry.attributes.position.needsUpdate = true;

        // Rotate slowly
        lineRef.current.rotation.z += 0.002;
    });

    return (
        <lineLoop ref={lineRef} geometry={geometry}>
            <lineBasicMaterial color={color} linewidth={2} />
        </lineLoop>
    );
};

export default VisualizerWave;
