
import React from 'react';
import { Tech, TechCategory } from '../types';
import { SHIP_PARTS_DB } from '../constants';
import { Check, Lock, Zap, Shield, Cpu, Box, Microscope, FlaskConical, RotateCcw } from 'lucide-react';

interface TechPanelProps {
  techs: Tech[];
  science: number;
  onResearch: (techId: string) => void;
  onReset: () => void;
}

const HexNode: React.FC<{ 
  tech: Tech; 
  status: 'locked' | 'available' | 'completed';
  canAfford: boolean;
  onResearch: () => void;
}> = ({ tech, status, canAfford, onResearch }) => {
  let strokeColor = '#374151'; // gray-700
  let fillColor = '#1f2937'; // gray-800
  let textColor = '#9ca3af'; // gray-400
  let Icon = Microscope;
  let glowEffect = '';

  // Determine Category Styling
  switch (tech.category) {
    case TechCategory.Military:
      Icon = Zap;
      if (status !== 'locked') {
          strokeColor = '#ef4444'; // red-500
          fillColor = status === 'completed' ? '#450a0a' : '#1e1b4b'; // red-950/custom dark
          textColor = '#fca5a5'; // red-300
      }
      break;
    case TechCategory.Grid:
      Icon = Shield;
       if (status !== 'locked') {
          strokeColor = '#3b82f6'; // blue-500
          fillColor = status === 'completed' ? '#172554' : '#1e1b4b'; // blue-950
          textColor = '#93c5fd'; // blue-300
      }
      break;
    case TechCategory.Nano:
      Icon = Cpu;
       if (status !== 'locked') {
          strokeColor = '#10b981'; // emerald-500
          fillColor = status === 'completed' ? '#064e3b' : '#1e1b4b'; // emerald-950
          textColor = '#6ee7b7'; // emerald-300
      }
      break;
  }

  if (status === 'available') {
      fillColor = '#111827'; // gray-900 base
      if (canAfford) {
          glowEffect = 'animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]';
      }
  } else if (status === 'completed') {
      glowEffect = `drop-shadow-[0_0_10px_${strokeColor}]`;
  }

  const unlockedPart = SHIP_PARTS_DB.find(p => p.reqTech === tech.id);

  return (
    <div 
        className={`relative w-24 h-28 md:w-28 md:h-32 flex flex-col items-center justify-center group select-none transition-transform duration-300 ${status === 'available' && canAfford ? 'cursor-pointer hover:scale-110 z-10' : 'z-0'}`}
        onClick={status === 'available' && canAfford ? onResearch : undefined}
        title={`${tech.name}: ${tech.description}`}
    >
       {/* SVG Hexagon */}
       <svg viewBox="0 0 100 115" className={`absolute inset-0 w-full h-full transition-all duration-300 ${glowEffect}`}>
            <path d="M50 2 L98 29.5 L98 84.5 L50 112 L2 84.5 L2 29.5 Z" 
                  fill={fillColor} 
                  stroke={strokeColor} 
                  strokeWidth={status === 'available' && canAfford ? 3 : 1.5}
            />
       </svg>

       {/* Icon Layer */}
       <div className="relative z-10 flex flex-col items-center gap-1">
            <div className={`transition-opacity duration-300 ${status === 'locked' ? 'opacity-30' : 'opacity-100'}`} style={{ color: textColor }}>
                {status === 'completed' ? <Check size={20} className="md:w-6 md:h-6" /> : status === 'locked' ? <Lock size={16} className="md:w-5 md:h-5" /> : <Icon size={20} className="md:w-6 md:h-6" />}
            </div>
            
            <span className="text-[9px] md:text-[10px] font-bold uppercase text-center max-w-[80%] leading-tight" style={{ color: textColor }}>
                {tech.name}
            </span>

            {status === 'available' && (
                <div className={`text-[8px] md:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/20 ${canAfford ? 'bg-white/10 text-white' : 'bg-red-900/50 text-red-400'}`}>
                    {tech.cost} Sc
                </div>
            )}
            
            {unlockedPart && status !== 'locked' && (
                <div className="absolute -bottom-6 flex items-center justify-center pointer-events-none">
                    <div className="bg-space-900/90 border border-gray-600 rounded px-1.5 py-0.5 flex items-center gap-1 shadow-lg">
                        <Box size={8} className="text-gray-400"/>
                        <span className="text-[7px] text-gray-300 uppercase truncate max-w-[60px]">{unlockedPart.name.split(' ')[0]}</span>
                    </div>
                </div>
            )}
       </div>
    </div>
  )
}

const TechColumn: React.FC<{
    title: string;
    icon: React.ReactNode;
    theme: { text: string; border: string; bg: string };
    techs: Tech[];
    allTechs: Tech[];
    science: number;
    onResearch: (id: string) => void;
}> = ({ title, icon, theme, techs, allTechs, science, onResearch }) => {
    return (
        <div className="flex flex-col items-center gap-2 min-w-[90px] flex-1">
            {/* Header */}
            <div className={`flex items-center gap-2 mb-2 ${theme.text} border-b ${theme.border} pb-1 px-2 opacity-90`}>
                {icon}
                <h3 className="text-xs font-bold uppercase hidden md:block">{title}</h3>
            </div>

            {/* Vertical Nodes */}
            <div className="flex flex-col items-center gap-3 relative w-full pt-2 pb-10">
                {/* Connecting Line (Spine) */}
                <div className="absolute top-0 bottom-10 left-1/2 w-0.5 bg-gray-800 -translate-x-1/2 z-0"></div>

                {techs.map((tech, index) => {
                     let status: 'locked' | 'available' | 'completed' = 'locked';
                     if (tech.unlocked) status = 'completed';
                     else if (!tech.prerequisite || allTechs.find(t => t.id === tech.prerequisite)?.unlocked) status = 'available';

                     // Line Coloring Logic
                     const spineColor = status !== 'locked' ? theme.bg : 'bg-gray-800';
                     
                     return (
                         <div key={tech.id} className="relative flex flex-col items-center">
                            {/* Segment Line above (if not first) */}
                            {index > 0 && (
                                <div className={`absolute -top-4 w-0.5 h-6 -z-10 ${spineColor}`}></div>
                            )}
                            
                            <HexNode 
                                tech={tech} 
                                status={status} 
                                canAfford={science >= tech.cost} 
                                onResearch={() => onResearch(tech.id)} 
                            />
                         </div>
                     )
                })}
            </div>
        </div>
    )
}

const TechPanel: React.FC<TechPanelProps> = ({ techs, science, onResearch, onReset }) => {
    const military = techs.filter(t => t.category === TechCategory.Military);
    const grid = techs.filter(t => t.category === TechCategory.Grid);
    const nano = techs.filter(t => t.category === TechCategory.Nano);

    const themes = {
        military: { text: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-500' },
        grid: { text: 'text-blue-500', border: 'border-blue-500/30', bg: 'bg-blue-500' },
        nano: { text: 'text-emerald-500', border: 'border-emerald-500/30', bg: 'bg-emerald-500' },
    };

    return (
        <div className="h-full flex flex-col bg-space-900/50">
             {/* Header */}
             <div className="flex items-center justify-between mb-2 sticky top-0 bg-space-900/95 p-3 z-30 border-b border-gray-700 backdrop-blur shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                    <Microscope className="text-brand-science" />
                    <span className="hidden md:inline">Research Labs</span>
                    <span className="md:hidden">R&D</span>
                </h3>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onReset}
                        className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border border-gray-700"
                        title="Reset Research (Refund Science)"
                    >
                        <RotateCcw size={16} />
                    </button>
                    
                    <div className="text-sm font-mono text-brand-science bg-brand-science/10 px-3 py-1 rounded border border-brand-science/30 flex items-center gap-2 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                        <FlaskConical size={14} />
                        <span className="font-bold">{science} Science</span>
                    </div>
                </div>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div className="flex justify-between md:justify-center gap-1 md:gap-12 min-h-full max-w-2xl mx-auto">
                    <TechColumn 
                        title="Military" 
                        icon={<Zap size={16} />} 
                        theme={themes.military}
                        techs={military} 
                        allTechs={techs}
                        science={science}
                        onResearch={onResearch}
                    />
                     <TechColumn 
                        title="Grid" 
                        icon={<Shield size={16} />} 
                        theme={themes.grid}
                        techs={grid} 
                        allTechs={techs}
                        science={science}
                        onResearch={onResearch}
                    />
                     <TechColumn 
                        title="Nano" 
                        icon={<Cpu size={16} />} 
                        theme={themes.nano}
                        techs={nano} 
                        allTechs={techs}
                        science={science}
                        onResearch={onResearch}
                    />
                </div>
            </div>
        </div>
    )
}

export default TechPanel;
