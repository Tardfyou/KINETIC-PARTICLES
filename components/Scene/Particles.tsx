import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandState, ShapeType } from '../../types';
import { PARTICLE_COUNT } from '../../constants';

interface ParticlesProps {
  shape: ShapeType;
  color: string;
  handState: HandState;
}

export const Particles: React.FC<ParticlesProps> = ({ shape, color, handState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Calculate target positions based on shape
  const targetPositions = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    
    const getPoint = (i: number): THREE.Vector3 => {
      const vec = new THREE.Vector3();
      const u = Math.random();
      const v = Math.random();
      
      switch (shape) {
        case ShapeType.CUBE:
          vec.x = (u - 0.5) * 4;
          vec.y = (v - 0.5) * 4;
          vec.z = (Math.random() - 0.5) * 4;
          return vec;
        
        case ShapeType.TORUS:
          const theta = u * Math.PI * 2;
          const phi = v * Math.PI * 2;
          const R = 3;
          const r = 1;
          vec.x = (R + r * Math.cos(phi)) * Math.cos(theta);
          vec.y = (R + r * Math.cos(phi)) * Math.sin(theta);
          vec.z = r * Math.sin(phi);
          return vec;

        case ShapeType.DNA:
          const t = u * 20 - 10; // Height
          const helixR = 1.5;
          const freq = 1;
          // Double helix
          const offset = Math.random() > 0.5 ? 0 : Math.PI; 
          vec.x = helixR * Math.cos(t * freq + offset) + (Math.random() - 0.5) * 0.5;
          vec.y = t;
          vec.z = helixR * Math.sin(t * freq + offset) + (Math.random() - 0.5) * 0.5;
          return vec;
        
        case ShapeType.TARDFYOU:
          // Trefoil Knot parametric equation
          // u goes from 0 to 2PI (or 4PI to close it nicely)
          const tKnot = u * Math.PI * 4;
          const scale = 0.8;
          vec.x = scale * (Math.sin(tKnot) + 2 * Math.sin(2 * tKnot));
          vec.y = scale * (Math.cos(tKnot) - 2 * Math.cos(2 * tKnot));
          vec.z = scale * (-Math.sin(3 * tKnot));
          // Add some thickness volume
          vec.x += (Math.random() - 0.5) * 0.5;
          vec.y += (Math.random() - 0.5) * 0.5;
          vec.z += (Math.random() - 0.5) * 0.5;
          return vec;

        case ShapeType.SPHERE:
        default:
          const rSphere = 2.5 * Math.cbrt(Math.random()); // Even distribution
          const thetaS = Math.random() * 2 * Math.PI;
          const phiS = Math.acos(2 * Math.random() - 1);
          vec.setFromSphericalCoords(rSphere, phiS, thetaS);
          return vec;
      }
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = getPoint(i);
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    return positions;
  }, [shape]);

  // Store current positions separately to interpolate
  const currentPositions = useMemo(() => new Float32Array(targetPositions), [targetPositions]);
  
  // Random offsets for "breathing" animation
  const randoms = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT);
    for(let i=0; i<PARTICLE_COUNT; i++) arr[i] = Math.random();
    return arr;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Determine Global Multiplier based on Hand State
    // OPEN: Expand/Explode (Multi > 1.0)
    // CLOSED / PINCH: Contract/Aggregate (Multi < 0.2)
    // IDLE: Normal (Multi = 1.0)
    
    let targetScale = 1.0;
    if (handState === HandState.OPEN) {
        targetScale = 2.5; // Explosion
    } else if (handState === HandState.CLOSED || handState === HandState.PINCH) {
        targetScale = 0.1; // Implosion / Aggregation
    }

    // Adjust interaction speed/noise based on gesture intensity
    const isInteracting = handState !== HandState.IDLE;
    const lerpSpeed = isInteracting ? 0.1 : 0.05;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Original target position for this shape
      const tx = targetPositions[i3];
      const ty = targetPositions[i3+1];
      const tz = targetPositions[i3+2];

      // Calculate desired position based on state
      let dx = tx * targetScale;
      let dy = ty * targetScale;
      let dz = tz * targetScale;

      // Add "Breathing" noise
      // If Pinch/Closed, jitter intensely (high energy compression). 
      // If Open, float loosely.
      const isCompressed = (handState === HandState.CLOSED || handState === HandState.PINCH);
      const noiseAmp = isCompressed ? 0.02 : 0.1;
      const noiseFreq = isCompressed ? 15 : 2;
      
      dx += Math.sin(time * noiseFreq + randoms[i] * 10) * noiseAmp;
      dy += Math.cos(time * noiseFreq + randoms[i] * 10) * noiseAmp;
      dz += Math.sin(time * noiseFreq + randoms[i] * 10) * noiseAmp;

      // Special effect: Rotation
      // Rotate the whole cloud slowly
      const cosT = Math.cos(time * 0.2);
      const sinT = Math.sin(time * 0.2);
      
      const rx = dx * cosT - dz * sinT;
      const rz = dx * sinT + dz * cosT;
      
      dx = rx;
      dz = rz;

      // Interpolate current position towards desired
      currentPositions[i3] += (dx - currentPositions[i3]) * lerpSpeed;
      currentPositions[i3+1] += (dy - currentPositions[i3+1]) * lerpSpeed;
      currentPositions[i3+2] += (dz - currentPositions[i3+2]) * lerpSpeed;

      // Update geometry
      positions[i3] = currentPositions[i3];
      positions[i3+1] = currentPositions[i3+1];
      positions[i3+2] = currentPositions[i3+2];
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={currentPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
