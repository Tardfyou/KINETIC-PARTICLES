import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Particles } from './Particles';
import { ShapeType, HandState } from '../../types';
import { CAMERA_FOV } from '../../constants';

interface ExperienceProps {
  shape: ShapeType;
  color: string;
  handState: HandState;
}

export const Experience: React.FC<ExperienceProps> = ({ shape, color, handState }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: CAMERA_FOV }}
      gl={{ antialias: true, alpha: false }}
    >
      {/* Background */}
      <color attach="background" args={['#050505']} />
      
      {/* Lights */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Content */}
      <Suspense fallback={null}>
        <Particles shape={shape} color={color} handState={handState} />
        
        {/* Subtle environment reflection for depth */}
        <Environment preset="city" />
      </Suspense>

      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={2} 
        maxDistance={20}
        autoRotate={handState === HandState.IDLE}
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
};
