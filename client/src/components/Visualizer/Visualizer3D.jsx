import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import ParticleField from './ParticleField';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import VisualizerBars from './VisualizerBars';
import VisualizerWave from './VisualizerWave';

const Visualizer3D = ({ primaryColor = '#00ffcc', hasCustomBackground = false, mode = 'default', dynamicMode = true }) => {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', background: 'transparent' }}>
            <Canvas camera={{ position: [0, 0, 35], fov: 75 }} gl={{ antialias: false }}>
                {/* Lights */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <spotLight position={[-10, 0, 0]} intensity={2} color={primaryColor} />

                {/* Content */}
                <Suspense fallback={null}>
                    {/* Stars - Always visible */}
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

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

                {/* Post Processing */}
                <EffectComposer>
                    <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
                </EffectComposer>

                {/* Controls - disabled for background usually, but here just in case needed for debugging */}
                {/* <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} /> */}
            </Canvas >

            {/* Overlay Gradient to blend with UI - Only show if no custom background to avoid darkening user image */}
            {
                !hasCustomBackground && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.8) 100%)',
                        pointerEvents: 'none'
                    }} />
                )
            }
        </div >
    );
};

export default Visualizer3D;
