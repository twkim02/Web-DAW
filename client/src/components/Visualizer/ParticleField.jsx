import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';

const ParticleField = ({ count = 2000, color = '#00ffcc' }) => {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Generate random positions and initial velocities
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    useFrame((state, delta) => {
        if (!mesh.current) return;

        // Get Audio Data for reactivity
        const freqData = audioEngine.getFrequencyData();
        // Bass average (approx bins 0-4)
        const bass = freqData ? (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / 4 : 0;
        const bassNormalized = bass / 255;

        // Pulse scale driven by bass
        const scale = 1 + bassNormalized * 0.5;

        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;

            // Update time/position
            // Move faster with bass
            t = particle.t += speed / 2 + (bassNormalized * 0.05);

            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);

            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
            );

            // Apply scale pulse
            const particleScale = (s > 0 ? s : -s) * scale;
            dummy.scale.set(particleScale, particleScale, particleScale);

            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();

            mesh.current.setMatrixAt(i, dummy.matrix);
        });

        mesh.current.instanceMatrix.needsUpdate = true;

        // Rotate entire field slowly or based on bass
        mesh.current.rotation.y += 0.001 + (bassNormalized * 0.005);
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial
                color={color}
                transparent
                opacity={0.6}
                roughness={0}   // Shiny
                metalness={0.5}
                emissive={color}
                emissiveIntensity={0.2}
            />
        </instancedMesh>
    );
};

export default ParticleField;
