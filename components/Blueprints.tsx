
import React, { useState } from 'react';
import { ShipBlueprint, ShipType, ShipPart, Tech } from '../types';
import { SHIP_PARTS_DB } from '../constants';
import { Rocket, Box, Activity, Move, ArrowUp, Plus, Trash2, Zap, Shield, Crosshair, Cpu, Lock } from 'lucide-react';

interface BlueprintsProps {
  blueprints: { [key in ShipType]: ShipBlueprint };
  materials: number;
  techs: Tech[];
  onUpgrade: (type: ShipType, stat: 'hull' | 'initiative' | 'movement') => void;
  onInstallPart: (type: ShipType, slotIndex: number, partId: string) => void;
  onUninstallPart: (type: ShipType, slotIndex: number) => void;
}

const PartIcon: React.FC<{ type: string; className?: string }> = ({ type, className }) => {
    switch (type) {
        case 'Weapon': return <Crosshair size={14} className={className} />;
        case 'Defense': return <Shield size={14} className={className} />;
        case 'Support': return <Zap size={14} className={className} />;
        case 'Drive': return <Move size={14} className={className} />;
        default: return <Cpu size={14} className={className} />;
    }
}

const ShipCard: React.FC<{ 
    ship: ShipBlueprint; 
    materials: number;
    techs: Tech[];
    onUpgrade: (type: ShipType, stat: 'hull' | 'initiative' | 'movement') => void;
    onInstallPart: (type: ShipType, slotIndex: number, partId: string) => void;
    onUninstallPart: (type: ShipType, slotIndex: number) => void;
}> = ({ ship, materials, techs, onUpgrade, onInstallPart, onUninstallPart }) => {
    
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Calculate Total Stats (Base + Parts)
  let totalHull = ship.baseHull;
  let totalInit = ship.baseInitiative;
  let totalMove = ship.baseMovement;
  let totalDmg = ship.baseDamage || 1; 

  ship.installedParts.forEach(partId => {
      const part = SHIP_PARTS_DB.find(p => p.id === partId);
      if (part) {
          if (part.stats.hull) totalHull += part.stats.hull;
          if (part.stats.initiative) totalInit += part.stats.initiative;
          if (part.stats.movement) totalMove += part.stats.movement;
          if (part.stats.damage) totalDmg += part.stats.damage;
      }
  });

  const costs = { hull: 2, initiative: 3, movement: 3 };

  const renderStatBlock = (
      label: string, 
      baseValue: number, 
      totalValue: number,
      icon: React.ReactNode, 
      statKey: 'hull' | 'initiative' | 'movement'
  ) => {
      const cost = costs[statKey];
      const canAfford = materials >= cost;

      return (
        <div className="flex flex-col items-center bg-black/30 p-2 rounded gap-1 relative group w-full border border-white/5">
            <span className="text-gray-500 flex gap-1 items-center text-[10px] uppercase tracking-wider">{icon} {label}</span>
            <div className="flex items-baseline gap-1">
                <span className="text-white font-bold text-lg">{totalValue}</span>
                {totalValue > baseValue && <span className="text-xs text-blue-400">({baseValue}+{totalValue-baseValue})</span>}
            </div>
            
            <button 
                onClick={() => onUpgrade(ship.type, statKey)}
                disabled={!canAfford}
                className={`w-full text-[10px] flex items-center justify-center gap-1 py-1 px-2 rounded transition-colors uppercase font-bold mt-1
                    ${canAfford ? 'bg-brand-materials hover:bg-yellow-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
                `}
                title={`Upgrade Base Chassis ${label} (-${cost} Materials)`}
            >
                <ArrowUp size={10} />
                <span>{cost} Mat</span>
            </button>
        </div>
      );
  };

  const getAllParts = () => {
      // Return all parts but with lock status info
      return SHIP_PARTS_DB.map(part => {
          const reqTech = part.reqTech ? techs.find(t => t.id === part.reqTech) : null;
          const isUnlocked = !part.reqTech || (reqTech && reqTech.unlocked);
          return {
              ...part,
              isUnlocked,
              techName: reqTech ? reqTech.name : ''
          };
      }).sort((a, b) => {
          // Sort unlocked first
          if (a.isUnlocked && !b.isUnlocked) return -1;
          if (!a.isUnlocked && b.isUnlocked) return 1;
          return 0;
      });
  };

  // Determine z-index: if a slot is selected, this card must float above others
  const zIndexClass = selectedSlot !== null ? 'z-50' : 'z-0';

  return (
    <div className={`bg-space-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-3 shadow-lg relative group ${zIndexClass}`}>
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 z-10 relative">
        <h4 className="font-bold text-white uppercase flex items-center gap-2">
          <Rocket size={16} className="text-blue-400" />
          {ship.type}
        </h4>
        <span className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-0.5 rounded">Class {ship.slots} Slots</span>
      </div>

      {/* Visual Representation of the Ship with Interactive Slots */}
      <div className={`flex flex-col items-center py-4 relative ${selectedSlot !== null ? 'z-30' : 'z-10'}`}>
         {/* Simplified visual of a ship hull */}
         <div className="relative flex items-center justify-center mb-6">
            {ship.type === ShipType.Interceptor && (
                <svg width="80" height="80" viewBox="0 0 100 100" className="fill-gray-900 stroke-blue-600 stroke-[2px] opacity-80 drop-shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                    <path d="M50 0 L100 80 L50 60 L0 80 Z" />
                </svg>
            )}
            {ship.type === ShipType.Cruiser && (
                <svg width="100" height="100" viewBox="0 0 100 100" className="fill-gray-900 stroke-blue-600 stroke-[2px] opacity-80 drop-shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                    <path d="M50 0 L90 40 L90 90 L50 80 L10 90 L10 40 Z" />
                </svg>
            )}
             {ship.type === ShipType.Dreadnought && (
                <svg width="120" height="120" viewBox="0 0 100 100" className="fill-gray-900 stroke-blue-600 stroke-[2px] opacity-80 drop-shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                    <path d="M30 0 L70 0 L90 30 L90 100 L10 100 L10 30 Z" />
                </svg>
            )}
            
            {/* Slots Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-wrap justify-center gap-2 w-[180px]">
                {Array.from({ length: ship.slots }).map((_, i) => {
                    const partId = ship.installedParts[i];
                    const part = partId ? SHIP_PARTS_DB.find(p => p.id === partId) : null;
                    
                    return (
                        <button 
                            key={i}
                            onClick={() => setSelectedSlot(selectedSlot === i ? null : i)}
                            className={`
                                relative w-10 h-10 rounded-md border-2 flex items-center justify-center transition-all hover:scale-110 shadow-lg
                                ${selectedSlot === i ? 'ring-2 ring-yellow-400 z-50 border-white' : ''}
                                ${part 
                                    ? 'bg-space-800 border-blue-400 text-blue-200 shadow-blue-900/50' 
                                    : 'bg-black/60 border-gray-600/50 text-gray-600 border-dashed hover:border-gray-400 hover:text-gray-300'}
                            `}
                        >
                            {part ? <PartIcon type={part.type} /> : <Plus size={14} />}
                            
                            {/* Part Context Menu */}
                            {selectedSlot === i && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-space-900 border border-gray-600 rounded-lg shadow-2xl z-[100] p-2 flex flex-col gap-1 max-h-64 overflow-hidden">
                                    {part ? (
                                        <>
                                            <div className="text-xs font-bold text-white border-b border-gray-700 pb-1 mb-1">{part.name}</div>
                                            <div className="text-[10px] text-gray-400 mb-2">{part.description}</div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onUninstallPart(ship.type, i); setSelectedSlot(null); }}
                                                className="bg-red-900/50 hover:bg-red-600 text-red-200 text-xs py-2 rounded flex items-center justify-center gap-2 w-full font-bold uppercase"
                                            >
                                                <Trash2 size={12} /> Uninstall
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-xs font-bold text-gray-400 border-b border-gray-700 pb-1 mb-1 px-1 uppercase tracking-wider">Available Modules</div>
                                            <div className="overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                                                {getAllParts().map(p => {
                                                    const canAfford = materials >= p.cost;
                                                    if (!p.isUnlocked) {
                                                        return (
                                                            <div key={p.id} className="text-left text-xs p-2 rounded flex justify-between items-center opacity-50 bg-black/20 border border-transparent">
                                                                <div className="flex items-center gap-2">
                                                                    <Lock size={10} />
                                                                    <span className="text-gray-500">{p.name}</span>
                                                                </div>
                                                                <span className="text-[9px] text-red-400 uppercase font-mono">Req: {p.techName}</span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            key={p.id}
                                                            disabled={!canAfford}
                                                            onClick={(e) => { e.stopPropagation(); onInstallPart(ship.type, i, p.id); setSelectedSlot(null); }}
                                                            className={`text-left text-xs p-2 rounded flex justify-between items-center group/item transition-colors border border-transparent
                                                                ${canAfford ? 'hover:bg-blue-900/50 hover:border-blue-500/30 text-gray-200 hover:text-white' : 'opacity-50 cursor-not-allowed bg-red-900/10'}
                                                            `}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{p.name}</span>
                                                                <span className="text-[9px] text-gray-500">{p.description}</span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className={`${canAfford ? 'text-brand-materials' : 'text-red-500'} font-mono font-bold text-[10px]`}>{p.cost} Mat</span>
                                                                <PartIcon type={p.type} className="text-gray-600" />
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto z-10">
        {renderStatBlock('Hull', ship.baseHull, totalHull, <Box size={10}/>, 'hull')}
        {renderStatBlock('Init', ship.baseInitiative, totalInit, <Activity size={10}/>, 'initiative')}
        {renderStatBlock('Move', ship.baseMovement, totalMove, <Move size={10}/>, 'movement')}
        
        {/* Damage Block - Display Only */}
        <div className="flex flex-col items-center bg-black/30 p-2 rounded gap-1 relative group w-full opacity-90 border border-white/5">
            <span className="text-gray-500 flex gap-1 items-center text-[10px] uppercase tracking-wider"><Crosshair size={10}/> Dmg</span>
            <div className="flex items-baseline gap-1">
                <span className="text-white font-bold text-lg">{totalDmg}</span>
                 {totalDmg > (ship.baseDamage || 1) && <span className="text-xs text-blue-400">({(ship.baseDamage || 1)}+{totalDmg-(ship.baseDamage || 1)})</span>}
            </div>
             <div className="w-full text-[10px] flex items-center justify-center gap-1 py-1 px-2 rounded mt-1 bg-transparent text-gray-600 cursor-default uppercase font-bold">
                 <span>Weapon Based</span>
            </div>
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-space-900/20 to-space-900/80 pointer-events-none rounded-lg"></div>
    </div>
  );
};

const Blueprints: React.FC<BlueprintsProps> = ({ blueprints, materials, techs, onUpgrade, onInstallPart, onUninstallPart }) => {
  return (
    <div className="h-full">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-space-900/95 p-2 z-20 border-b border-gray-700 backdrop-blur">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Rocket className="text-brand-materials" />
                Naval Shipyards
            </h3>
            <div className="text-sm font-mono text-brand-materials bg-brand-materials/10 px-3 py-1 rounded border border-brand-materials/30 flex items-center gap-2">
                <Box size={14} />
                Stockpile: {materials} Materials
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
            <ShipCard 
                ship={blueprints[ShipType.Interceptor]} 
                materials={materials} 
                techs={techs}
                onUpgrade={onUpgrade}
                onInstallPart={onInstallPart}
                onUninstallPart={onUninstallPart}
            />
            <ShipCard 
                ship={blueprints[ShipType.Cruiser]} 
                materials={materials} 
                techs={techs}
                onUpgrade={onUpgrade}
                onInstallPart={onInstallPart}
                onUninstallPart={onUninstallPart}
            />
            <ShipCard 
                ship={blueprints[ShipType.Dreadnought]} 
                materials={materials} 
                techs={techs}
                onUpgrade={onUpgrade}
                onInstallPart={onInstallPart}
                onUninstallPart={onUninstallPart}
            />
        </div>
        
        <div className="mt-6 p-4 bg-blue-900/10 border border-blue-700/30 rounded-lg flex gap-3 items-start">
            <div className="bg-blue-500/10 p-2 rounded text-blue-500">
                <Cpu size={20} />
            </div>
            <div>
                <h5 className="text-blue-400 font-bold text-sm uppercase mb-1">Modular Architecture</h5>
                <p className="text-xs text-blue-200/70 leading-relaxed">
                    Click on empty slots to install modules. Parts add to base stats and unlock special abilities (Shields, Missiles, etc.).
                    Grayed-out parts require research in the Tech Lab.
                </p>
            </div>
        </div>
    </div>
  );
};

export default Blueprints;
