export enum ShapeType {
  SPHERE = 'SPHERE',
  CUBE = 'CUBE',
  TORUS = 'TORUS',
  DNA = 'DNA',
  TARDFYOU = 'TARDFYOU'
}

export enum HandState {
  IDLE = 'IDLE',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PINCH = 'PINCH'
}

export interface GestureState {
  handState: HandState;
  confidence: number;
  isTracking: boolean;
}

export interface ShapeConfig {
  id: ShapeType;
  label: string;
  icon: string; // Component name or path
}

// Augment JSX Intrinsic Elements for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
    }
  }
}