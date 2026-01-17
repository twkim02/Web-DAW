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

const ThreeVisualizer = ({ themeType = 'dynamic', primaryColor = '#00ffcc' }) => {
    const mountRef = useRef(null);

    useEffect(() => {
        let renderer, scene, camera, bars = [], stars, backgroundPlane, frameId;
        const BAR_COUNT = 140;
        const RADIUS = 4.2;
        const STAR_COUNT = 1500;
        let resizeObserver;

        try {
            const container = mountRef.current;
            const width = container.clientWidth;
            const height = container.clientHeight;

            // 1. Setup
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            camera.position.z = 6;

            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
            renderer.setSize(width, height);

            // Logic: If Dynamic, use black. Else transparent.
            if (themeType === 'dynamic') {
                renderer.setClearColor(0x000000, 1);
            } else {
                renderer.setClearColor(0x000000, 0);
            }

            if (container) {
                container.innerHTML = '';
                container.appendChild(renderer.domElement);
            }

            // --- 2. Random Space Background (Only for Dynamic) ---
            if (themeType === 'dynamic') {
                const textureLoader = new THREE.TextureLoader();
                textureLoader.setCrossOrigin('anonymous');
                const randomImage = SPACE_IMAGES[Math.floor(Math.random() * SPACE_IMAGES.length)];

                const bgGeometry = new THREE.PlaneGeometry(120, 80);
                const bgMaterial = new THREE.MeshBasicMaterial({
                    color: 0x888888,
                    transparent: true,
                    opacity: 0,
                });

                textureLoader.load(
                    randomImage,
                    (texture) => {
                        bgMaterial.map = texture;
                        bgMaterial.needsUpdate = true;
                        let opacity = 0;
                        const fadeIn = setInterval(() => {
                            opacity += 0.05;
                            bgMaterial.opacity = opacity;
                            if (opacity >= 0.6) clearInterval(fadeIn);
                        }, 50);
                    },
                    undefined,
                    (err) => {
                        bgMaterial.color.setHex(0x222222);
                        bgMaterial.opacity = 1;
                    }
                );

                backgroundPlane = new THREE.Mesh(bgGeometry, bgMaterial);
                backgroundPlane.position.z = -20;
                scene.add(backgroundPlane);

                // Stars
                const starGeo = new THREE.BufferGeometry();
                const starPos = new Float32Array(STAR_COUNT * 3);
                for (let i = 0; i < STAR_COUNT * 3; i++) {
                    starPos[i] = (Math.random() - 0.5) * 100;
                }
                starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
                const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
                stars = new THREE.Points(starGeo, starMat);
                scene.add(stars);
            }

            // --- 3. NCS Visualizer (Bars) ---
            const circleGroup = new THREE.Group();
            scene.add(circleGroup);
            const geometry = new THREE.BoxGeometry(0.1, 0.6, 0.05);
            // Theme Color
            const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(primaryColor), transparent: true, opacity: 0.9 });

            // Inner Glow Ring
            const ringGeo = new THREE.RingGeometry(RADIUS - 0.15, RADIUS - 0.05, 128);
            const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(primaryColor), side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
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

            // --- 4. Animation ---
            const animate = () => {
                frameId = requestAnimationFrame(animate);

                const array = audioEngine.getFrequencyData();
                if (array && array.length > 0) {
                    for (let i = 0; i < BAR_COUNT; i++) {
                        const index = Math.floor((i / BAR_COUNT) * array.length * 0.5);
                        const val = array[index] || 0;
                        const scale = 1 + (val / 255) * 4;
                        bars[i].scale.y = scale;
                    }
                    const bass = array[10] || 0;
                    const scaleBase = 1 + (bass / 255) * 0.1;
                    ring.scale.set(scaleBase, scaleBase, 1);
                }

                if (circleGroup) circleGroup.rotation.z -= 0.002;
                if (stars) stars.rotation.y += 0.0005;

                renderer.render(scene, camera);
            };

            animate();

            // Resize
            const handleResize = () => {
                if (!container) return;
                const w = container.clientWidth;
                const h = container.clientHeight;
                renderer.setSize(w, h);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            };

            resizeObserver = new ResizeObserver(() => handleResize());
            resizeObserver.observe(container);

        } catch (error) {
            console.error("Three.js Init Error:", error);
        }

        // Cleanup
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            if (renderer) renderer.dispose();
            if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement);
            }
            if (resizeObserver) resizeObserver.disconnect();

            // Dispose Three.js objects
            bars.forEach(b => {
                if (b.geometry) b.geometry.dispose();
                if (b.material) b.material.dispose();
            });
            if (scene) {
                scene.traverse((object) => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (object.material.length) {
                            for (let i = 0; i < object.material.length; ++i) object.material[i].dispose();
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }
        };

    }, [themeType, primaryColor]);

    return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }} />;
};

export default ThreeVisualizer;
