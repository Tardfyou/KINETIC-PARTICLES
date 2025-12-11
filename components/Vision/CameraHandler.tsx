import React, { useEffect, useRef, useState } from 'react';
import { HandState } from '../../types';
import { GeminiLiveService } from '../../services/geminiLive';

interface CameraHandlerProps {
  onGestureUpdate: (state: HandState) => void;
  onConnectionChange: (connected: boolean) => void;
  onError: (error: string) => void;
}

// How often we send frames (FPS). 
// Gemini 2.5 Flash is fast, but we don't need 60fps for simple state detection.
// 2-5 FPS is plenty for "Open/Close" detection to save bandwidth/tokens.
const SEND_INTERVAL_MS = 300; 
const JPEG_QUALITY = 0.5;

export const CameraHandler: React.FC<CameraHandlerProps> = ({ 
  onGestureUpdate, 
  onConnectionChange,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<GeminiLiveService | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    // 1. Initialize Gemini Service
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      onError("Missing API_KEY in environment variables.");
      return;
    }

    const service = new GeminiLiveService(apiKey);
    service.setCallbacks(
      (stateStr) => {
        // Map string to Enum
        let state = HandState.IDLE;
        if (stateStr === 'OPEN') state = HandState.OPEN;
        if (stateStr === 'CLOSED') state = HandState.CLOSED;
        if (stateStr === 'PINCH') state = HandState.PINCH;
        onGestureUpdate(state);
      },
      onConnectionChange,
      onError
    );

    serviceRef.current = service;
    service.connect();

    // 2. Setup Camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
        onError("Could not access camera. Please allow permissions.");
      }
    };

    startCamera();

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      serviceRef.current?.disconnect();
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onGestureUpdate, onConnectionChange, onError]);

  // 3. Frame Loop
  useEffect(() => {
    if (!streamActive) return;

    intervalRef.current = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const service = serviceRef.current;

      if (video && canvas && service) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw video to canvas (resized for performance)
          canvas.width = 320; // Lower res is fine for gesture
          canvas.height = 240;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get Base64
          const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
          service.sendFrame(base64, 'image/jpeg');
        }
      }
    }, SEND_INTERVAL_MS);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [streamActive]);

  return (
    <div className="hidden">
      <video ref={videoRef} playsInline muted />
      <canvas ref={canvasRef} />
    </div>
  );
};
