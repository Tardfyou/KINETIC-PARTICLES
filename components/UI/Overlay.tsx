import React, { useState } from 'react';
import { ShapeType, HandState, GestureState } from '../../types';
import { SHAPE_OPTIONS } from '../../constants';
import { Settings, Maximize, Circle, Box, Disc, Dna, Activity, Wifi, WifiOff, AlertCircle, Sparkles } from 'lucide-react';

interface OverlayProps {
  selectedShape: ShapeType;
  onShapeSelect: (shape: ShapeType) => void;
  particleColor: string;
  onColorChange: (color: string) => void;
  gestureState: GestureState;
  isConnected: boolean;
  error: string | null;
}

const getIcon = (shape: ShapeType) => {
  switch (shape) {
    case ShapeType.SPHERE: return <Circle size={20} />;
    case ShapeType.CUBE: return <Box size={20} />;
    case ShapeType.TORUS: return <Disc size={20} />;
    case ShapeType.DNA: return <Dna size={20} />;
    case ShapeType.TARDFYOU: return <Sparkles size={20} />;
    default: return <Circle size={20} />;
  }
};

export const Overlay: React.FC<OverlayProps> = ({
  selectedShape,
  onShapeSelect,
  particleColor,
  onColorChange,
  gestureState,
  isConnected,
  error
}) => {
  const [panelOpen, setPanelOpen] = useState(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Status Indicator Styles
  const statusColor = isConnected ? 'text-green-400' : 'text-red-500';
  const handStatusMap = {
    [HandState.IDLE]: 'Idle',
    [HandState.OPEN]: 'Exploding',
    [HandState.CLOSED]: 'Contracting',
    [HandState.PINCH]: 'Aggregating'
  };

  return (
    <div className="w-full h-full p-6 flex flex-col justify-between pointer-events-none">
      
      {/* Header / Status */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl font-bold font-['Rajdhani'] tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            KINETIC PARTICLES
          </h1>
          <div className="flex items-center gap-2 mt-2 font-mono text-sm bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit">
            {isConnected ? <Wifi size={14} className={statusColor} /> : <WifiOff size={14} className={statusColor} />}
            <span className={statusColor}>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
            <span className="text-gray-500">|</span>
            <Activity size={14} className="text-cyan-400" />
            <span className="text-cyan-200 uppercase">{handStatusMap[gestureState.handState]}</span>
          </div>
          {error && (
             <div className="flex items-center gap-2 mt-2 text-red-400 text-xs bg-red-900/20 px-2 py-1 rounded">
               <AlertCircle size={12}/> {error}
             </div>
          )}
        </div>

        <button 
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all backdrop-blur-sm border border-white/10"
        >
          <Maximize size={20} />
        </button>
      </div>

      {/* Control Panel */}
      <div className={`pointer-events-auto self-end transition-all duration-300 transform ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 w-72 shadow-2xl">
          
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
            <h2 className="text-lg font-semibold font-['Rajdhani'] text-gray-200 flex items-center gap-2">
              <Settings size={18} /> Configuration
            </h2>
          </div>

          {/* Shape Selector */}
          <div className="mb-6">
            <label className="text-xs font-mono text-gray-400 mb-3 block uppercase tracking-widest">Model Geometry</label>
            <div className="grid grid-cols-2 gap-2">
              {SHAPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onShapeSelect(opt.id as ShapeType)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all border ${
                    selectedShape === opt.id 
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                      : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {getIcon(opt.id as ShapeType)}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-mono text-gray-400 mb-3 block uppercase tracking-widest">Particle Aesthetic</label>
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/10">
              <input 
                type="color" 
                value={particleColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none outline-none"
              />
              <span className="font-mono text-sm text-gray-300">{particleColor.toUpperCase()}</span>
            </div>
          </div>

        </div>
      </div>
      
      {/* Instructions Overlay (Bottom Left) */}
      <div className="absolute bottom-6 left-6 max-w-xs pointer-events-none opacity-60">
        <p className="text-xs font-mono text-gray-400">
          <span className="text-cyan-400 font-bold">[GESTURE CONTROL]</span><br/>
          Open Hand: Expand / Explode<br/>
          Pinch/Fist: Contract / Aggregate<br/>
          Camera required.
        </p>
      </div>

    </div>
  );
};
