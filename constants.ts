import { ShapeType } from './types';

export const DEFAULT_SHAPE = ShapeType.SPHERE;
export const DEFAULT_COLOR = '#00ffff';
export const PARTICLE_COUNT = 4000; // Increased count slightly for better Galaxy density
export const CAMERA_FOV = 45;

export const SHAPE_OPTIONS = [
  { id: ShapeType.SPHERE, label: 'Sphere' },
  { id: ShapeType.CUBE, label: 'Cube' },
  { id: ShapeType.TORUS, label: 'Vortex' },
  { id: ShapeType.DNA, label: 'Helix' },
  { id: ShapeType.TARDFYOU, label: 'Tardfyou' },
  { id: ShapeType.GALAXY, label: 'Hyper Galaxy' },
];

// Gemini System Instruction
export const SYSTEM_INSTRUCTION = `
You are a real-time vision controller for a particle system.
Analyze the video stream to detect the user's hand gesture.
1. If the hand is OPEN (fingers spread), call the function with state 'OPEN'.
2. If the hand is CLOSED (fist), call the function with state 'CLOSED'.
3. If the thumb and index finger are touching (pinching gesture), call with 'PINCH'.
4. If no hand is clearly visible or the gesture is ambiguous, call with 'IDLE'.
Focus purely on the hand gesture. Be responsive.
`;