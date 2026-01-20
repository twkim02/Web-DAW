import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';

const FluidBackground = ({ primaryColor = '#00ffcc' }) => {
    const mesh = useRef();
    const { viewport } = useThree();

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uBass: { value: 0 },
        uColor: { value: new THREE.Color(primaryColor) },
        uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) }
    }), [primaryColor, viewport]);

    // Update uniforms on frame
    useFrame((state) => {
        if (!mesh.current) return;

        const time = state.clock.getElapsedTime();
        mesh.current.material.uniforms.uTime.value = time;

        const freqData = audioEngine.getFrequencyData();
        const bass = freqData ? (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / 4 : 0;

        // Smooth changes
        mesh.current.material.uniforms.uBass.value = THREE.MathUtils.lerp(
            mesh.current.material.uniforms.uBass.value,
            bass / 255,
            0.1
        );
        mesh.current.material.uniforms.uColor.value.set(primaryColor);
    });

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
            
            // Time slowed down for majestic feel
            float time = uTime * 0.15;
            
            // Multi-layered noise
            float n1 = snoise(uv * 2.0 + vec2(time * 0.2, time * 0.1));
            float n2 = snoise(uv * 4.0 - vec2(time * 0.5, 0.0) + n1);
            float n3 = snoise(uv * 8.0 + n2 * 2.0 + uBass); 

            // Waveform impact
            float wave = sin(uv.y * 10.0 + time + n2 * 5.0) * 0.5 + 0.5;
            
            // Color Mixing
            vec3 baseColor = vec3(0.05, 0.05, 0.1); // Deep space blue/black
            vec3 midColor = uColor * 0.4;
            vec3 highlightColor = uColor * 1.5;

            // Mix based on noise and bass
            float mix1 = smoothstep(-0.2, 0.6, n2);
            float mix2 = smoothstep(0.4, 1.0, n3 + uBass * 0.5);

            vec3 finalColor = mix(baseColor, midColor, mix1);
            finalColor = mix(finalColor, highlightColor, mix2 * wave);
            
            // Vignette for depth
            float dist = distance(uv, vec2(0.5));
            float vignette = 1.0 - smoothstep(0.4, 1.2, dist);

            gl_FragColor = vec4(finalColor * vignette, 1.0);
        }
    `;

    return (
        <mesh ref={mesh} position={[0, 0, -20]} scale={[viewport.width, viewport.height, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                depthWrite={false}
                depthTest={true} // Allow particles to be in front
            />
        </mesh>
    );
};

export default FluidBackground;
