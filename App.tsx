import React, { useState, useCallback, useEffect } from 'react';
import { Experience } from './components/Scene/Experience';
import { Overlay } from './components/UI/Overlay';
import { CameraHandler } from './components/Vision/CameraHandler';
import { ShapeType, GestureState, HandState } from './types';
import { DEFAULT_COLOR, DEFAULT_SHAPE } from './constants';

const App: React.FC = () => {
  // App State
  const [selectedShape, setSelectedShape] = useState<ShapeType>(DEFAULT_SHAPE);
  const [particleColor, setParticleColor] = useState<string>(DEFAULT_COLOR);
  
  // Vision/Gesture State
  const [gestureState, setGestureState] = useState<GestureState>({
    handState: HandState.IDLE,
    confidence: 0,
    isTracking: false
  });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Callback for when Gemini updates the hand state
  const handleGestureUpdate = useCallback((newState: HandState) => {
    setGestureState(prev => ({
      ...prev,
      handState: newState,
      confidence: 1.0 // Assumed high if function called
    }));
  }, []);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Experience 
          shape={selectedShape} 
          color={particleColor} 
          handState={gestureState.handState} 
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Overlay 
          selectedShape={selectedShape}
          onShapeSelect={setSelectedShape}
          particleColor={particleColor}
          onColorChange={setParticleColor}
          gestureState={gestureState}
          isConnected={isConnected}
          error={error}
        />
      </div>

      {/* Vision Logic (Non-visual but contains video element) */}
      <CameraHandler 
        onGestureUpdate={handleGestureUpdate} 
        onConnectionChange={handleConnectionChange}
        onError={handleError}
      />

    </div>
  );
};

export default App;