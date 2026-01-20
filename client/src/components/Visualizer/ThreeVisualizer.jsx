import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';



const ThreeVisualizer = ({ themeType = 'dynamic', primaryColor = '#00ffcc', visualizerMode = 'default' }) => {
    const mountRef = useRef(null);

    useEffect(() => {
        let renderer, scene, camera, bars = [], stars, backgroundPlane, frameId;
        const BAR_COUNT = 200; // Increased count for finer resolution
        const RADIUS = 4.2;
        const STAR_COUNT = 1500;
        let resizeObserver;

        // Helper to create a circle texture on the fly (no external image needed)
        const createCircleTexture = () => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Draw a soft glow
            const center = size / 2;
            const gradient = ctx.createRadialGradient(center, center, 0, center, center, size / 2);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            return texture;
        };
        const particleTexture = createCircleTexture();

        try {
            const container = mountRef.current;
            const width = container.clientWidth;
            const height = container.clientHeight;

            // 1. Setup
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

            // Camera Z calculation:
            // Original: z=6 for 100% height.
            // New: Height is 140% (1.4x).
            // To maintain scale, z should be 6 * 1.4 = 8.4.
            camera.position.z = 8.4;

            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
            renderer.setSize(width, height);
            renderer.domElement.style.background = 'transparent'; // Force CSS transparency

            // Always Transparent - Let CSS/Parent handle background color
            renderer.setClearColor(0x000000, 0);
            scene.background = null;

            if (container) {
                container.innerHTML = '';
                container.appendChild(renderer.domElement);
            }

            // --- 2. Random Space Background (Only for Dynamic) ---
            if (themeType === 'dynamic') {
                // Stars (particles)
                const starGeo = new THREE.BufferGeometry();
                const starPos = new Float32Array(STAR_COUNT * 3);
                for (let i = 0; i < STAR_COUNT * 3; i++) {
                    starPos[i] = (Math.random() - 0.5) * 100;
                }
                starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
                const starMat = new THREE.PointsMaterial({
                    color: 0xffffff,
                    size: 0.2, // Slightly larger to see the glow
                    map: particleTexture,
                    transparent: true,
                    opacity: 0.8,
                    depthWrite: false // Fixes transparency sorting issues
                });
                stars = new THREE.Points(starGeo, starMat);
                scene.add(stars);

                // Add a subtle fog for depth
                scene.fog = new THREE.FogExp2(0x000000, 0.02);
            }

            // --- 3. Mode Specific Setup ---
            // Default/Bass/Rainbow/Gradient Modes (Bar Circular)
            const circleGroup = new THREE.Group();
            let waveLine;
            let particleSystem;

            if (['default', 'bass', 'rainbow', 'gradient', 'bar'].includes(visualizerMode)) {
                scene.add(circleGroup);
                // Thinner bars: width 0.05
                const geometry = new THREE.BoxGeometry(0.05, 0.6, 0.05);
                const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(primaryColor), transparent: true, opacity: 0.9 });

                // Inner Glow Ring - REMOVED to avoid confusion with 'Sonar' mode
                // const ringGeo = new THREE.RingGeometry(RADIUS - 0.15, RADIUS - 0.05, 128);
                // const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(primaryColor), side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
                // const ring = new THREE.Mesh(ringGeo, ringMat);
                // scene.add(ring);

                for (let i = 0; i < BAR_COUNT; i++) {
                    const bar = new THREE.Mesh(geometry, material.clone());
                    const angle = (i / BAR_COUNT) * Math.PI * 2;
                    bar.position.x = Math.cos(angle) * RADIUS;
                    bar.position.y = Math.sin(angle) * RADIUS;
                    bar.rotation.z = angle - Math.PI / 2;
                    circleGroup.add(bar);
                    bars.push(bar);
                }
            }
            else if (visualizerMode === 'circular_wave') {
                // Circular Wave using LineLoop
                const curvePts = [];
                for (let i = 0; i <= 256; i++) { // 256 points for waveform
                    const angle = (i / 256) * Math.PI * 2;
                    curvePts.push(new THREE.Vector3(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0));
                }
                const waveGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
                const waveMat = new THREE.LineBasicMaterial({ color: primaryColor, linewidth: 2 });
                waveLine = new THREE.LineLoop(waveGeo, waveMat);
                scene.add(waveLine);
            }
            else if (visualizerMode === 'particles') {
                // Reactive Particle System
                const particleCount = 300;
                const pGeo = new THREE.BufferGeometry();
                const pPos = new Float32Array(particleCount * 3);
                const pVel = []; // Velocities

                for (let i = 0; i < particleCount; i++) {
                    pPos[i * 3] = (Math.random() - 0.5) * 10;
                    pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
                    pPos[i * 3 + 2] = (Math.random() - 0.5) * 5;
                    pVel.push({
                        x: (Math.random() - 0.5) * 0.02,
                        y: (Math.random() - 0.5) * 0.02,
                        z: (Math.random() - 0.5) * 0.02
                    });
                }
                pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
                const pMat = new THREE.PointsMaterial({
                    color: primaryColor,
                    size: 0.5,
                    map: particleTexture,
                    transparent: true,
                    opacity: 0.8,
                    depthWrite: false
                });
                particleSystem = new THREE.Points(pGeo, pMat);
                particleSystem.userData = { velocities: pVel };
                scene.add(particleSystem);
            }


            // --- 4. Legendary Fluid Shader Background ---
            const vertexShader = `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `;

            const fragmentShader = `
                uniform float uTime;
                uniform float uBass;
                uniform vec3 uColor;
                varying vec2 vUv;

                // Simplex 2D noise
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                float snoise(vec2 v){
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                    + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m ;
                    m = m*m ;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                void main() {
                    vec2 uv = vUv;
                    
                    // Dynamic Liquid Movement
                    float time = uTime * 0.2;
                    float noise1 = snoise(uv * 3.0 + time);
                    float noise2 = snoise(uv * 6.0 - time * 1.5 + noise1);
                    
                    // Bass Impact (Ripple)
                    float dist = distance(uv, vec2(0.5));
                    float ripple = sin(dist * 20.0 - uTime * 2.0) * uBass * 0.1;

                    // Color Mixing
                    vec3 color1 = vec3(0.0, 0.0, 0.0); // Black Base
                    vec3 color2 = uColor * 0.5; // Muted Theme Color
                    vec3 color3 = uColor * 2.0; // Bright Pop

                    float mixVal = smoothstep(-0.5, 1.0, noise2 + ripple);
                    vec3 finalColor = mix(color1, color2, mixVal);
                    finalColor = mix(finalColor, color3, smoothstep(0.6, 1.0, noise2));

                    // Vignette
                    float vignette = 1.0 - smoothstep(0.5, 1.5, dist);
                    
                    gl_FragColor = vec4(finalColor * vignette, 1.0);
                }
            `;

            // Background Plane
            // We want it strictly behind everything.
            // Since camera z=8.4, we can put this at z=-5 or so, and scale it up.
            const bgGeo = new THREE.PlaneGeometry(30, 20); // Large enough to cover screen
            const bgUniforms = {
                uTime: { value: 0 },
                uBass: { value: 0 }, // 0.0 to 1.0
                uColor: { value: new THREE.Color(primaryColor) }
            };
            const bgMat = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: bgUniforms,
                depthWrite: false,
                depthTest: true
            });

            // "Legendary" Toggle: Only add if enabled (default true for now, can be toggled via prop)
            // But user wants a toggle. Let's assume prop 'showBackground'.
            // For now, add it, we will control opacity or remove based on prop later?
            // Actually, better to just modify the shader logic or visibility.
            backgroundPlane = new THREE.Mesh(bgGeo, bgMat);
            backgroundPlane.position.z = -2; // Behind particles
            scene.add(backgroundPlane);


            // --- 5. Animation ---
            const animate = () => {
                frameId = requestAnimationFrame(animate);
                const time = performance.now() * 0.001;

                // --- Frequency Data (for Scale/Color) ---
                const array = audioEngine.getFrequencyData();
                const bass = (array && array.length > 0) ? Math.max(array[0] || 0, array[1] || 0, array[2] || 0) : 0;

                // Update Shader Uniforms
                if (backgroundPlane) {
                    backgroundPlane.material.uniforms.uTime.value = time;
                    // Smooth bass for shader
                    backgroundPlane.material.uniforms.uBass.value = (bass / 255);
                    backgroundPlane.material.uniforms.uColor.value.set(primaryColor);
                }

                // --- Time Domain Data (for Wave) ---
                const waveData = visualizerMode === 'circular_wave' ? audioEngine.getTimeDomainData() : null;

                if (['default', 'bass', 'rainbow', 'gradient', 'bar'].includes(visualizerMode)) {
                    // Existing logic for bars
                    if (array && array.length > 0) {
                        // --- Color Logic ---
                        if (visualizerMode === 'rainbow') {
                            const hue = (Date.now() * 0.0002) % 1;
                            const color = new THREE.Color().setHSL(hue, 1, 0.5);
                            bars.forEach(b => b.material.color.copy(color));
                        } else if (visualizerMode === 'bass') {
                            const isBassHit = bass > 130;
                            const targetColor = isBassHit ? new THREE.Color('#ff0055') : new THREE.Color(primaryColor);
                            const lerpFactor = isBassHit ? 0.8 : 0.05;
                            bars.forEach(b => b.material.color.lerp(targetColor, lerpFactor));
                        } else if (visualizerMode === 'gradient') {
                            const timeOffset = Date.now() * 0.0002;
                            bars.forEach((b, i) => {
                                const hue = ((i / BAR_COUNT) + timeOffset) % 1;
                                b.material.color.setHSL(hue, 1, 0.5);
                            });
                        } else {
                            const defaultColor = new THREE.Color(primaryColor);
                            bars.forEach(b => b.material.color.lerp(defaultColor, 0.1));
                        }

                        // --- Scale Logic ---
                        for (let i = 0; i < BAR_COUNT; i++) {
                            const index = Math.floor((i / BAR_COUNT) * array.length * 0.5);
                            const val = array[index] || 0;
                            // Scale: 0.1 (Idle) -> 5 (Max)
                            const scale = 0.1 + (val / 255) * 5;
                            bars[i].scale.y = scale;
                        }
                    }
                    if (circleGroup) circleGroup.rotation.z -= 0.002;

                }
                else if (visualizerMode === 'circular_wave' && waveLine && waveData) {
                    // Update Wave
                    const positions = waveLine.geometry.attributes.position.array;

                    // Smooth the wave data slightly
                    for (let i = 0; i <= 256; i++) {
                        // waveData is 0-255. 128 is "silence" center.
                        const rawIndex = Math.floor((i / 256) * waveData.length);
                        const val = waveData[rawIndex % waveData.length] || 128;

                        // Normalized -1 to 1
                        const normalized = (val - 128) / 128;

                        // Apply slight smoothing using previous Frame? 
                        // No, just amplify.
                        const amp = normalized * 1.5; // Scale amplitude

                        const angle = (i / 256) * Math.PI * 2;
                        // Base Radius + Wave
                        const r = RADIUS + amp;

                        positions[i * 3] = Math.cos(angle) * r;
                        positions[i * 3 + 1] = Math.sin(angle) * r;
                        positions[i * 3 + 2] = 0;
                    }
                    waveLine.geometry.attributes.position.needsUpdate = true;
                    // Rotate slowly
                    waveLine.rotation.z += 0.002;
                }
                else if (visualizerMode === 'particles' && particleSystem && array) {
                    // Particle Animation
                    const positions = particleSystem.geometry.attributes.position.array;
                    const vels = particleSystem.userData.velocities;

                    // Bass influences speed and spread
                    // Use a low-frequency average
                    const bassEnergy = (array[0] + array[1] + array[2] + array[3]) / 4 || 0;

                    // Idle state: very slow movement. Active: fast.
                    const isSilent = bassEnergy < 5;
                    const baseSpeed = isSilent ? 0.2 : 1.0;
                    const speedMultiplier = baseSpeed + (bassEnergy / 255) * 4;
                    const explode = bassEnergy > 200 ? 1.05 : 1;

                    for (let i = 0; i < vels.length; i++) {
                        // Move
                        positions[i * 3] += vels[i].x * speedMultiplier;
                        positions[i * 3 + 1] += vels[i].y * speedMultiplier;
                        positions[i * 3 + 2] += vels[i].z * speedMultiplier;

                        // Pulse expansion logic
                        if (explode > 1) {
                            positions[i * 3] *= explode;
                            positions[i * 3 + 1] *= explode;
                            positions[i * 3 + 2] *= explode;
                        }

                        // Bounds check - wrap around box
                        const BOUND = 8;
                        if (positions[i * 3] > BOUND) positions[i * 3] = -BOUND;
                        if (positions[i * 3] < -BOUND) positions[i * 3] = BOUND;
                        if (positions[i * 3 + 1] > BOUND) positions[i * 3 + 1] = -BOUND;
                        if (positions[i * 3 + 1] < -BOUND) positions[i * 3 + 1] = BOUND;
                        if (positions[i * 3 + 2] > 5) positions[i * 3 + 2] = -5;
                        if (positions[i * 3 + 2] < -5) positions[i * 3 + 2] = 5;
                    }
                    particleSystem.geometry.attributes.position.needsUpdate = true;
                    // Rotation
                    particleSystem.rotation.y += isSilent ? 0.0005 : 0.002;
                    particleSystem.rotation.x += isSilent ? 0.0002 : 0.001;

                    // Bass Color Punch
                    if (bassEnergy > 150) {
                        particleSystem.material.color.setHex(0xffffff);
                        particleSystem.material.opacity = 1;
                        particleSystem.material.size = 0.5;
                    } else {
                        particleSystem.material.color.lerp(new THREE.Color(primaryColor), 0.1);
                        particleSystem.material.opacity = 0.8;
                        particleSystem.material.size = 0.5;
                    }
                }

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

                // Also update shader time for smoother transitions if needed
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

    }, [themeType, primaryColor, visualizerMode]);

    return <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }} />;
};

export default ThreeVisualizer;
