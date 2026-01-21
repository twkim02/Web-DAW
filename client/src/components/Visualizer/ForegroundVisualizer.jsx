import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import ParticleField from './ParticleField';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import VisualizerBars from './VisualizerBars';
import VisualizerWave from './VisualizerWave';
import { OrbitControls } from '@react-three/drei';

const ForegroundVisualizer = ({ primaryColor = '#00ffcc', mode = 'default' }) => {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'transparent' }}>
            <Canvas camera={{ position: [0, 0, 8.4], fov: 75 }} gl={{ antialias: false, alpha: true }}>
                {/* Lights */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <spotLight position={[-10, 0, 0]} intensity={2} color={primaryColor} />

                {/* Content */}
                <Suspense fallback={null}>
                    {/* Particles Mode or 'Stardust' */}
                    {(mode === 'particles' || mode === 'stardust') && (
                        <ParticleField count={1000} color={primaryColor} />
                    )}

                    {/* Wave Mode */}
                    {mode === 'circular_wave' && (
                        <VisualizerWave color={primaryColor} />
                    )}

                    {/* Bar Modes (Default, Bass, Rainbow, Gradient) */}
                    {['default', 'bass', 'rainbow', 'gradient'].includes(mode) && (
                        <VisualizerBars mode={mode} primaryColor={primaryColor} />
                    )}
                </Suspense>

                {/* Post Processing - Bloom for the glow */}
                <EffectComposer>
                    <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default ForegroundVisualizer;
