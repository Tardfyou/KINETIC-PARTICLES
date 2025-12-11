import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandState, ShapeType } from '../../types';
import { PARTICLE_COUNT } from '../../constants';

interface ParticlesProps {
  shape: ShapeType;
  color: string;
  isAutoColor: boolean;
  handState: HandState;
}

export const Particles: React.FC<ParticlesProps> = ({ shape, color, isAutoColor, handState }) => {
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
          const tKnot = u * Math.PI * 4;
          const scale = 0.8;
          vec.x = scale * (Math.sin(tKnot) + 2 * Math.sin(2 * tKnot));
          vec.y = scale * (Math.cos(tKnot) - 2 * Math.cos(2 * tKnot));
          vec.z = scale * (-Math.sin(3 * tKnot));
          vec.x += (Math.random() - 0.5) * 0.5;
          vec.y += (Math.random() - 0.5) * 0.5;
          vec.z += (Math.random() - 0.5) * 0.5;
          return vec;

        case ShapeType.GALAXY:
          // Spiral Galaxy Generator
          const arms = 3; // Number of spiral arms
          const armIndex = i % arms;
          const randomOffset = Math.pow(Math.random(), 3); // More particles near center
          const maxR = 5;
          
          const radius = randomOffset * maxR;
          const spinAngle = radius * 2.5; // Twist factor
          const armAngle = (armIndex / arms) * Math.PI * 2;
          
          const totalAngle = armAngle + spinAngle;
          
          // Add some randomness to spread the arms
          const spread = (Math.random() - 0.5) * 0.5 * (radius / 2); // Spread increases with radius
          
          vec.x = radius * Math.cos(totalAngle + spread);
          vec.y = (Math.random() - 0.5) * (2 / (radius + 0.1)); // Flattened disk, thicker at center
          vec.z = radius * Math.sin(totalAngle + spread);
          
          // Add random star dust
          vec.addScalar((Math.random() - 0.5) * 0.15);
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
    const material = pointsRef.current.material as THREE.PointsMaterial;

    // --- Color Logic ---
    if (isAutoColor) {
      // Faster color cycle for more energy
      const hue = (time * 0.2) % 1; 
      material.color.setHSL(hue, 1.0, 0.6);
    } else {
      material.color.set(color);
    }
    
    // --- Scale / Gesture Logic ---
    let targetScale = 1.0;
    if (handState === HandState.OPEN) {
        targetScale = 2.5; // Explosion
    } else if (handState === HandState.CLOSED || handState === HandState.PINCH) {
        targetScale = 0.1; // Implosion / Aggregation
    }

    const isInteracting = handState !== HandState.IDLE;
    const lerpSpeed = isInteracting ? 0.08 : 0.04;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      const tx = targetPositions[i3];
      const ty = targetPositions[i3+1];
      const tz = targetPositions[i3+2];

      let dx = tx * targetScale;
      let dy = ty * targetScale;
      let dz = tz * targetScale;

      const isCompressed = (handState === HandState.CLOSED || handState === HandState.PINCH);
      
      const noiseAmp = isCompressed ? 0.05 : 0.15;
      const noiseFreq = isCompressed ? 20 : 1.5;
      
      dx += Math.sin(time * noiseFreq + randoms[i] * 10) * noiseAmp;
      dy += Math.cos(time * noiseFreq + randoms[i] * 10) * noiseAmp;
      dz += Math.sin(time * noiseFreq + randoms[i] * 10) * noiseAmp;

      // --- Enhanced Rotation / Vortex ---
      // Significantly increased rotation speeds for the "spectacular" feel
      const rotSpeed = isCompressed ? 4.0 : 0.5; // Faster idle spin, very fast compression spin
      const cosT = Math.cos(time * rotSpeed);
      const sinT = Math.sin(time * rotSpeed);
      
      // Rotate around Y axis
      const rx = dx * cosT - dz * sinT;
      const rz = dx * sinT + dz * cosT;
      
      dx = rx;
      dz = rz;

      currentPositions[i3] += (dx - currentPositions[i3]) * lerpSpeed;
      currentPositions[i3+1] += (dy - currentPositions[i3+1]) * lerpSpeed;
      currentPositions[i3+2] += (dz - currentPositions[i3+2]) * lerpSpeed;

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
        size={0.09} // Slightly larger particles
        color={color}
        transparent
        opacity={0.85}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};