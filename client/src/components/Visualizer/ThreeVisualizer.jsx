import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { audioEngine } from '../../audio/AudioEngine';

function VisualizerScene() {
  const meshRef = useRef();
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    // 오디오 분석기 설정
    if (audioEngine && audioEngine.context) {
      const analyser = audioEngine.context.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      // 마스터 출력에 연결 (가능한 경우)
      try {
        if (audioEngine.masterVolume) {
          audioEngine.masterVolume.connect(analyser);
        }
      } catch (e) {
        console.warn('Could not connect analyser to audio engine:', e);
      }
    }
  }, []);

  useFrame(() => {
    if (meshRef.current && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // 평균 주파수 계산
      const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
      const normalized = average / 255;
      
      // 메시 크기 및 회전 애니메이션
      meshRef.current.scale.x = 1 + normalized * 0.5;
      meshRef.current.scale.y = 1 + normalized * 0.5;
      meshRef.current.scale.z = 1 + normalized * 0.5;
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Sphere ref={meshRef} args={[1, 32, 32]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.6}
        />
      </Sphere>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

function ThreeVisualizer() {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      zIndex: -1,
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1e 100%)'
    }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <VisualizerScene />
      </Canvas>
    </div>
  );
}

export default ThreeVisualizer;
