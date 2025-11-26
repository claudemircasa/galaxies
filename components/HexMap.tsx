
import React, { useMemo } from 'react';
import { Hex, ResourceType, Fleet, ShipType } from '../types';
import { Hexagon, Skull, Radar, Rocket, Plane, Shield, Castle, Flag, Footprints, Database } from 'lucide-react';

interface HexMapProps {
  hexes: Hex[];
  fleets?: Fleet[];
  movementCosts?: { [id: string]: number } | null;
  activePlayerId: number;
  playerColors?: string[]; // Array of color keys ['blue', 'orange'] etc.
  onHexClick: (hex: Hex) => void;
}

const HEX_SIZE = 50;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;

// --- Planet Component ---
const Planet: React.FC<{ 
    type: ResourceType; 
    x: number; 
    y: number; 
    size: number; 
    populated: boolean; 
}> = ({ type, x, y, size, populated }) => {
    
    let fillUrl = "";

    switch (type) {
        case ResourceType.Money:
            fillUrl = "url(#planetMoney)";
            break;
        case ResourceType.Science:
            fillUrl = "url(#planetScience)";
            break;
        case ResourceType.Materials:
            fillUrl = "url(#planetMaterials)";
            break;
    }

    return (
        <g transform={`translate(${x}, ${y})`}>
            {/* Population Glow/Ring */}
            {populated && (
                <circle cx="0" cy="0" r={size + 3} fill="none" stroke="#4ade80" strokeWidth="2" strokeDasharray="2 2" className="animate-spin-slow opacity-80" />
            )}
            
            {/* Planet Body */}
            <circle cx="0" cy="0" r={size} fill={fillUrl} className="drop-shadow-md" />
            
            {/* Atmospheric/Surface Detail Overlay (Simple) */}
            <circle cx="-30%" cy="-30%" r={size / 3} fill="white" fillOpacity="0.1" filter="blur(1px)" />

            {/* Populated Indicator (Fixed icon) */}
            {populated && (
                 <circle cx={size} cy={-size} r={3} className="fill-green-400 stroke-green-900 stroke-1" />
            )}
        </g>
    );
};


const HexTile: React.FC<{ hex: Hex; fleetsInHex: Fleet[]; movementCost?: number; onClick: () => void; playerColorMap: string[] }> = ({ hex, fleetsInHex, movementCost, onClick, playerColorMap }) => {
  // Convert axial to pixel
  const x = HEX_SIZE * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = HEX_SIZE * ((3 / 2) * hex.r);
  
  const isReachable = movementCost !== undefined;
  const isControlled = hex.ownerId !== null;
  const ownerColor = isControlled && hex.ownerId !== null ? playerColorMap[hex.ownerId] : 'gray';

  // Styling based on state
  let fillColor = '#1e293b'; // Default Slate 800
  let strokeColor = '#334155'; // Slate 700
  let strokeWidth = 2;
  let strokeDasharray = 'none';
  let filter = 'none';
  
  if (!hex.revealed) {
    fillColor = '#020617'; // Slate 950 (Fog of War)
    strokeColor = '#1e293b';
  } else if (hex.type === 'Core') {
    fillColor = '#311010'; // Dark Red
    strokeColor = '#ef4444';
  } else if (isControlled) {
    fillColor = '#0f172a'; // Deep base
    // Use dynamic tailwind colors via style or mapping could be complex, sticking to simple hex mapping or predefined classes if passed
    // For simplicity in this SVG engine, we'll map common colors manually or pass hex codes. 
    // Let's assume playerColorMap returns: 'blue', 'orange', 'green', 'purple'
    const colorHexMap: {[key: string]: string} = {
        'blue': '#3b82f6',
        'orange': '#f97316',
        'green': '#10b981',
        'purple': '#a855f7'
    };
    strokeColor = colorHexMap[ownerColor] || '#3b82f6';
    strokeWidth = 3;
    filter = `drop-shadow(0 0 8px ${strokeColor}66)`; // 66 = 40% opacity
  } else if (hex.type === 'Start') {
    fillColor = '#064e3b'; // Green 900
    strokeColor = '#22c55e';
  }

  // Override for movement visualization
  if (isReachable) {
      strokeColor = '#facc15'; // Yellow
      strokeWidth = 3;
      strokeDasharray = '4 2';
  }

  const opacity = (isControlled || hex.type === 'Start' || hex.type === 'Core' || isReachable) ? 1 : hex.revealed ? 0.9 : 0.4;

  // --- Render Planets ---
  const planets = useMemo(() => {
      if (!hex.revealed || hex.resources.length === 0) return null;
      
      const count = hex.resources.length;
      const planetSize = 8;
      const positions = [];

      // Positioning Logic
      if (count === 1) {
          positions.push({ x: 0, y: 18 });
      } else if (count === 2) {
          positions.push({ x: -12, y: 18 });
          positions.push({ x: 12, y: 18 });
      } else if (count === 3) {
          positions.push({ x: 0, y: 10 }); // Top center of bottom half
          positions.push({ x: -14, y: 25 }); // Bottom left
          positions.push({ x: 14, y: 25 }); // Bottom right
      }

      return hex.resources.map((res, i) => (
          <Planet 
            key={i} 
            type={res} 
            x={x + positions[i].x} 
            y={y + positions[i].y} 
            size={planetSize}
            populated={i < hex.population} 
          />
      ));
  }, [hex.revealed, hex.resources, hex.population, x, y]);


  // Calculate Fleet Icons
  const fleetIcons = useMemo(() => {
    if (fleetsInHex.length === 0) return null;
    
    // Group fleets by owner
    return fleetsInHex.map((fleet, idx) => {
        const totalShips = (fleet.ships[ShipType.Interceptor] || 0) + (fleet.ships[ShipType.Cruiser] || 0) + (fleet.ships[ShipType.Dreadnought] || 0);
        if (totalShips === 0) return null;

        // Visual Offset if multiple fleets
        const xOff = (idx * 10) - ((fleetsInHex.length - 1) * 5); 
        
        let MainIcon = Plane; 
        if (fleet.ships[ShipType.Dreadnought] > 0) MainIcon = Shield;
        else if (fleet.ships[ShipType.Cruiser] > 0) MainIcon = Rocket;

        const isEnemy = fleet.ownerId === 'enemy';
        const colorClass = isEnemy ? "text-red-500" : `text-${playerColorMap[fleet.ownerId as number] || 'blue'}-400`;
        const fillClass = isEnemy ? "fill-red-900" : `fill-slate-900`;

        return (
            <g key={fleet.id} transform={`translate(${x - 8 + xOff}, ${y - 15})`}>
                <circle r="12" cx="8" cy="8" className={`${fillClass} stroke-current ${colorClass} stroke-1 opacity-90`} />
                <foreignObject width="16" height="16">
                    <MainIcon size={16} className={colorClass} />
                </foreignObject>
                <circle cx="16" cy="0" r="6" className="fill-black border border-white" />
                <text x="16" y="2" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">{totalShips}</text>
            </g>
        )
    });
    
  }, [fleetsInHex, x, y, playerColorMap]);


  return (
    <g onClick={onClick} className={`transition-opacity group ${isReachable ? 'cursor-crosshair hover:opacity-100' : 'cursor-pointer hover:opacity-100'}`}>
      {/* Hex Polygon */}
      <polygon
        points={`
          ${x},${y - HEX_SIZE}
          ${x + HEX_WIDTH / 2},${y - HEX_SIZE / 2}
          ${x + HEX_WIDTH / 2},${y + HEX_SIZE / 2}
          ${x},${y + HEX_SIZE}
          ${x - HEX_WIDTH / 2},${y + HEX_SIZE / 2}
          ${x - HEX_WIDTH / 2},${y - HEX_SIZE / 2}
        `}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        style={{ opacity, filter }}
        className="group-hover:stroke-white/50 transition-all duration-300"
      />
      
      {/* Background Grid Pattern for Tech Feel on revealed tiles */}
      {hex.revealed && !hex.type.includes('Core') && (
         <path 
            d={`M${x - 10} ${y} L${x + 10} ${y} M${x} ${y - 10} L${x} ${y + 10}`} 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="1" 
         />
      )}

      {/* Label or Fog Icon */}
      {hex.revealed ? (
        <text x={x} y={y - 28} textAnchor="middle" fill="white" fontSize="7" className="font-mono font-bold uppercase pointer-events-none opacity-80 drop-shadow-md tracking-tighter">
          {hex.name}
        </text>
      ) : (
        <foreignObject x={x - 10} y={y - 10} width={20} height={20} className="pointer-events-none opacity-20">
            <Radar size={20} className="text-gray-400" />
        </foreignObject>
      )}

      {/* Movement Cost Overlay */}
      {isReachable && (
          <g className="animate-pulse pointer-events-none">
            <circle cx={x} cy={y} r="14" className="fill-black/60 stroke-yellow-400 stroke-1" />
            <foreignObject x={x - 6} y={y - 14} width={12} height={12}>
                 <Footprints size={12} className="text-yellow-400 opacity-80" />
            </foreignObject>
            <text x={x} y={y + 5} textAnchor="middle" fill="#facc15" fontSize="11" fontWeight="bold">{movementCost}</text>
          </g>
      )}

      {/* --- Icons Layer --- */}
      
      {/* Boss/Core Icon */}
      {hex.revealed && hex.isGCDS && (
        <foreignObject x={x - 15} y={y - 15} width={30} height={30}>
           <Skull size={30} className="text-red-600 animate-pulse drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
        </foreignObject>
      )}
      
      {/* Enemy Icon */}
      {hex.revealed && !hex.isGCDS && hex.hasEnemy && (
        <foreignObject x={x - 20} y={y - 35} width={14} height={14}>
           <Hexagon size={14} className="text-red-400 fill-red-900 drop-shadow-md" />
        </foreignObject>
      )}

      {/* Controlled Flag */}
      {isControlled && hex.ownerId !== null && (
        <foreignObject x={x + 12} y={y - 25} width={12} height={12}>
           <Flag size={12} className={`text-${playerColorMap[hex.ownerId]}-400 fill-black drop-shadow-md`} />
        </foreignObject>
      )}

       {/* Artifact Icon */}
       {hex.revealed && hex.hasArtifact && (
        <foreignObject x={x} y={y - 35} width={12} height={12}>
           <Database size={12} className="text-purple-400 drop-shadow-md" />
        </foreignObject>
      )}

      {/* Starbase Icon */}
      {hex.structure === 'Starbase' && (
         <foreignObject x={x - 24} y={y - 10} width={16} height={16}>
             <Castle size={16} className={`text-white fill-${isControlled && hex.ownerId !== null ? playerColorMap[hex.ownerId] : 'gray'}-600 drop-shadow-md`} />
         </foreignObject>
      )}

      {/* PLANETS RENDER */}
      {planets}

      {/* Fleet Icons (Top Layer) */}
      {fleetIcons}
    </g>
  );
};

const HexMap: React.FC<HexMapProps> = ({ hexes, fleets = [], movementCosts = null, activePlayerId, playerColors = [], onHexClick }) => {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto bg-space-900 rounded-xl md:rounded-2xl border border-white/10 shadow-2xl relative">
      <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm p-2 rounded border border-gray-700 text-[10px] md:text-xs text-gray-400 font-mono pointer-events-none">
        <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> P1 Control</div>
        {playerColors.length > 1 && <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span> P2 Control</div>}
        <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Hostile</div>
        <div className="flex items-center gap-2 mb-1">
             <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
             </div> 
             Planets
        </div>
      </div>
      
      <svg width="100%" height="100%" viewBox="-300 -250 600 500" preserveAspectRatio="xMidYMid meet">
        <defs>
            <radialGradient id="planetMoney" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#9a3412" />
            </radialGradient>
            <radialGradient id="planetScience" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#fbcfe8" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#831843" />
            </radialGradient>
             <radialGradient id="planetMaterials" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#e7e5e4" />
                <stop offset="50%" stopColor="#78716c" />
                <stop offset="100%" stopColor="#451a03" />
            </radialGradient>
        </defs>
        
        {hexes.map((hex) => (
          <HexTile 
            key={hex.id} 
            hex={hex} 
            fleetsInHex={fleets.filter(f => f.hexId === hex.id)}
            movementCost={movementCosts ? movementCosts[hex.id] : undefined}
            onClick={() => onHexClick(hex)} 
            playerColorMap={playerColors}
          />
        ))}
      </svg>
    </div>
  );
};

export default HexMap;
