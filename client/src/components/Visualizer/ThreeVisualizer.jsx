import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';

const SPACE_IMAGES = [
    'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Nebula
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Galaxy
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Earth/Space
    'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80', // Deep Space
    'https://images.unsplash.com/photo-1506318137071-a8bcbf6dd043?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'  // Purple Nebula
];

const ThreeVisualizer = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        let renderer, scene, camera, bars = [], stars, backgroundPlane, frameId;
        const BAR_COUNT = 140;
        const RADIUS = 4.2;
        const STAR_COUNT = 1500;

        try {
            // 1. Setup
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 6;

            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000, 1);

            if (mountRef.current) {
                mountRef.current.innerHTML = '';
                mountRef.current.appendChild(renderer.domElement);
            }

            // --- 2. Random Space Background ---
            const textureLoader = new THREE.TextureLoader();
            const randomImage = SPACE_IMAGES[Math.floor(Math.random() * SPACE_IMAGES.length)];

            const bgGeometry = new THREE.PlaneGeometry(60, 40); // Large plane
            const bgMaterial = new THREE.MeshBasicMaterial({
                color: 0x888888, // Dim it slightly
                transparent: true,
                opacity: 0, // Fade in
            });

            textureLoader.load(randomImage, (texture) => {
                bgMaterial.map = texture;
                bgMaterial.needsUpdate = true;
                // Fade in effect
                let opacity = 0;
                const fadeIn = setInterval(() => {
                    opacity += 0.05;
                    bgMaterial.opacity = opacity;
                    if (opacity >= 0.6) clearInterval(fadeIn); // Max opacity 0.6
                }, 50);
            });

            backgroundPlane = new THREE.Mesh(bgGeometry, bgMaterial);
            backgroundPlane.position.z = -20;
            scene.add(backgroundPlane);


            // --- 3. NCS Visualizer (Bars) ---
            const circleGroup = new THREE.Group();
            scene.add(circleGroup);
            // Thinner, cleaner bars
            const geometry = new THREE.BoxGeometry(0.1, 0.6, 0.05);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.9 });

            // Inner Glow Ring
            const ringGeo = new THREE.RingGeometry(RADIUS - 0.15, RADIUS - 0.05, 128);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            scene.add(ring);

            for (let i = 0; i < BAR_COUNT; i++) {
                const bar = new THREE.Mesh(geometry, material.clone());
                const angle = (i / BAR_COUNT) * Math.PI * 2;
                bar.position.x = Math.cos(angle) * RADIUS;
                bar.position.y = Math.sin(angle) * RADIUS;
                bar.rotation.z = angle - Math.PI / 2;
                circleGroup.add(bar);
                bars.push(bar);
            }

            // --- 4. Warp Stars (Overlay) ---
            const starGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(STAR_COUNT * 3);
            const velocities = new Float32Array(STAR_COUNT);

            for (let i = 0; i < STAR_COUNT; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 400;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
                velocities[i] = Math.random() * 0.5 + 0.1;
            }
            starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const starMat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.5,
                transparent: true,
                opacity: 0.7,
                map: createCircleTexture()
            });
            stars = new THREE.Points(starGeo, starMat);
            scene.add(stars);


            // --- 5. Animation ---
            const clock = new THREE.Clock();

            const animate = () => {
                frameId = requestAnimationFrame(animate);
                const elapsedTime = clock.getElapsedTime();
                const data = audioEngine.getAudioData();

                let bassEnergy = 0;
                let volume = 0;

                if (data) {
                    const step = Math.floor(data.length / BAR_COUNT);
                    for (let i = 0; i < BAR_COUNT; i++) {
                        const dataIndex = i * step;
                        let val = data[dataIndex] || -100;
                        if (!isFinite(val)) val = -100;
                        const norm = Math.max(0, (val + 100) / 100);
                        const scaleY = 0.1 + (norm * norm * 9.0);

                        if (bars[i]) {
                            bars[i].scale.y = scaleY;
                            // Clean Cyan to White
                            bars[i].material.color.setHSL(0.5, 1.0, 0.5 + norm * 0.5);
                        }

                        volume += norm;
                        if (i < 10) bassEnergy += norm;
                    }
                    volume /= BAR_COUNT;
                    bassEnergy /= 10;
                }

                // Background Pulse
                if (backgroundPlane) {
                    const pulse = 1 + (bassEnergy * 0.05);
                    backgroundPlane.scale.set(pulse, pulse, 1);
                    // Slow drift
                    backgroundPlane.rotation.z = Math.sin(elapsedTime * 0.05) * 0.02;
                }

                // Warp Stars
                const pos = stars.geometry.attributes.position.array;
                const speedMultiplier = 1 + (bassEnergy * 15);

                for (let i = 0; i < STAR_COUNT; i++) {
                    pos[i * 3 + 2] += velocities[i] * speedMultiplier;
                    if (pos[i * 3 + 2] > 50) pos[i * 3 + 2] = -300;
                }
                stars.geometry.attributes.position.needsUpdate = true;

                // Camera Beat Logic
                camera.position.z = 6 + (bassEnergy * 0.3);
                circleGroup.rotation.z -= 0.002; // Constant slow spin

                renderer.render(scene, camera);
            };
            animate();

            const handleResize = () => {
                if (camera && renderer) {
                    camera.aspect = window.innerWidth / window.innerHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(window.innerWidth, window.innerHeight);
                }
            };
            window.addEventListener('resize', handleResize);

        } catch (e) {
            console.error("ThreeVisualizer Init Error", e);
        }

        return () => {
            window.removeEventListener('resize', () => { });
            if (frameId) cancelAnimationFrame(frameId);
            if (renderer) renderer.dispose();
            bars.forEach(b => { b.geometry.dispose(); b.material.dispose(); });
            if (stars) { stars.geometry.dispose(); stars.material.dispose(); }
            if (backgroundPlane) { backgroundPlane.geometry.dispose(); backgroundPlane.material.dispose(); }
        };
    }, []);

    function createCircleTexture() {
        const matCanvas = document.createElement('canvas');
        matCanvas.width = matCanvas.height = 32;
        const matContext = matCanvas.getContext('2d');
        const texture = new THREE.CanvasTexture(matCanvas);
        const center = 16;
        const radius = 16;
        const gradient = matContext.createRadialGradient(center, center, 0, center, center, radius);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        matContext.fillStyle = gradient;
        matContext.fillRect(0, 0, 32, 32);
        return texture;
    }

    return (
        <div
            ref={mountRef}
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                zIndex: 0, pointerEvents: 'none'
            }}
        />
    );
};

export default ThreeVisualizer;
