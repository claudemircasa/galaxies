
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { INITIAL_STATE, SHIP_PARTS_DB, createPlayer, INITIAL_TECHS } from './constants';
import { GameState, ResourceType, Hex, GamePhase, ShipType, Fleet, Player } from './types';
import HexMap from './components/HexMap';
import TechPanel from './components/TechPanel';
import Blueprints from './components/Blueprints';
import ActionPanel from './components/ActionPanel';
import { Coins, FlaskConical, Box, User, Award, Skull, Clock, Sword, Flag, Database, Target, ShieldAlert, Zap, Dices, XCircle, CheckCircle as CheckCircleIcon, Crosshair, Radar, Hammer, Rocket, Minus, Plus, Plane, Shield, Radio, RotateCcw, Move, AlertTriangle, Info, X, Castle, Container, ArrowRightLeft, Users, ChevronRight } from 'lucide-react';

// --- Starfield Background Component ---
const Starfield = React.memo(() => {
  const stars = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 3,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[#05060a] via-[#0b0d17] to-[#161b30] opacity-90"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-nebula"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px] animate-nebula" style={{ animationDelay: '2s', animationDirection: 'reverse' }}></div>
      <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-indigo-900/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full bg-white ${star.id % 3 === 0 ? 'animate-twinkle' : 'animate-twinkle-slow'}`}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
    </div>
  );
});

// --- Combat Types & Logic ---
interface CombatLogEntry {
  round: number;
  message: string;
  type: 'player' | 'enemy' | 'info';
}

interface ActiveCombatEntity {
  name: string;
  hull: number;
  maxHull: number;
  damage: number;
  initiative: number;
  isPlayer: boolean;
  hasShields: boolean;
  hasIon: boolean;
  hasMissiles: boolean;
  hasPlasma: boolean;
}

// --- Visual Dice Component ---
const Die: React.FC<{ value: number; isRolling: boolean; color: 'blue' | 'red' }> = ({ value, isRolling, color }) => {
  const dotColor = color === 'blue' ? 'bg-blue-600' : 'bg-red-600';
  const borderColor = color === 'blue' ? 'border-blue-400' : 'border-red-400';
  const bgColor = 'bg-white';
  const Dot = () => <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${dotColor}`}></div>;

  const renderDots = () => {
    switch (value) {
      case 1: return <div className="flex items-center justify-center h-full"><Dot /></div>;
      case 2: return <div className="flex justify-between p-1 h-full"><Dot /><div className="self-end"><Dot /></div></div>;
      case 3: return <div className="flex justify-between p-1 h-full"><Dot /><div className="self-center"><Dot /></div><div className="self-end"><Dot /></div></div>;
      case 4: return <div className="flex flex-col justify-between p-1 h-full"><div className="flex justify-between"><Dot /><Dot /></div><div className="flex justify-between"><Dot /><Dot /></div></div>;
      case 5: return <div className="flex flex-col justify-between p-1 h-full"><div className="flex justify-between"><Dot /><Dot /></div><div className="flex justify-center"><Dot /></div><div className="flex justify-between"><Dot /><Dot /></div></div>;
      case 6: return <div className="flex flex-col justify-between p-1 h-full"><div className="flex justify-between"><Dot /><Dot /></div><div className="flex justify-between"><Dot /><Dot /></div><div className="flex justify-between"><Dot /><Dot /></div></div>;
      default: return null;
    }
  };

  return (
    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 ${borderColor} ${bgColor} shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-300 ${isRolling ? 'animate-spin' : 'scale-100'}`}>
      {renderDots()}
    </div>
  );
};

// --- Toast Component ---
const Toast: React.FC<{ message: string; type: 'info' | 'error' | 'success'; onClose: () => void; action?: { label: string, onClick: () => void } }> = ({ message, type, onClose, action }) => {
    useEffect(() => {
        if (!action) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [onClose, action]);

    let bg = 'bg-blue-600';
    let icon = <Info size={18} />;
    if (type === 'error') { bg = 'bg-red-600'; icon = <AlertTriangle size={18} />; }
    if (type === 'success') { bg = 'bg-green-600'; icon = <CheckCircleIcon size={18} />; }

    return (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl text-white font-bold animate-in slide-in-from-top-5 fade-in duration-300 ${bg}`}>
            {icon}
            <span>{message}</span>
            {action && (
                <button onClick={action.onClick} className="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs uppercase">
                    {action.label}
                </button>
            )}
        </div>
    );
};

// --- Setup Screen ---
const SetupScreen: React.FC<{ onStart: (playerCount: number) => void }> = ({ onStart }) => {
    const [count, setCount] = useState(2);
    return (
        <div className="fixed inset-0 z-[1000] bg-space-900 flex flex-col items-center justify-center p-4">
             <Starfield />
             <div className="relative z-10 bg-space-800/80 backdrop-blur-md p-8 rounded-2xl border border-gray-600 shadow-2xl text-center max-w-md w-full">
                 <h1 className="text-3xl font-bold uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Galaxies: The Expanse</h1>
                 <p className="text-gray-400 mb-8 font-mono text-sm">Fleet Command & Tactical Interface</p>
                 
                 <div className="mb-8">
                     <label className="block text-gray-300 text-sm font-bold mb-4">SELECT NUMBER OF PLAYERS</label>
                     <div className="flex justify-center gap-4">
                         {[1, 2, 3, 4].map(n => (
                             <button 
                                key={n}
                                onClick={() => setCount(n)}
                                className={`w-12 h-12 rounded-xl font-bold text-xl flex items-center justify-center transition-all
                                    ${count === n ? 'bg-blue-600 text-white ring-2 ring-blue-300 scale-110' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}
                                `}
                             >
                                 {n}
                             </button>
                         ))}
                     </div>
                 </div>

                 <button 
                    onClick={() => onStart(count)}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center gap-2"
                 >
                     Initialize Protocol <ChevronRight />
                 </button>
             </div>
        </div>
    )
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'map' | 'tech' | 'blueprints'>('map');
  const [selectedHex, setSelectedHex] = useState<Hex | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' | 'success'; action?: { label: string, onClick: () => void } } | null>(null);

  // Build State
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [buildQueue, setBuildQueue] = useState<{ [key in ShipType]: number }>({
      [ShipType.Interceptor]: 0,
      [ShipType.Cruiser]: 0,
      [ShipType.Dreadnought]: 0,
  });
  const [buildColonyShipQueue, setBuildColonyShipQueue] = useState(0);

  // Move State
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [movementCosts, setMovementCosts] = useState<{ [id: string]: number } | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveQueue, setMoveQueue] = useState<{ [key in ShipType]: number }>({
      [ShipType.Interceptor]: 0,
      [ShipType.Cruiser]: 0,
      [ShipType.Dreadnought]: 0,
  });

  // Combat State
  const [showCombatModal, setShowCombatModal] = useState(false);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([]);
  const [combatResult, setCombatResult] = useState<'victory' | 'defeat' | null>(null);
  const [playerFleetStatus, setPlayerFleetStatus] = useState<ActiveCombatEntity | null>(null);
  const [enemyStatus, setEnemyStatus] = useState<ActiveCombatEntity | null>(null);
  const [currentDice, setCurrentDice] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [turnIndicator, setTurnIndicator] = useState<'player' | 'enemy' | null>(null);
  const [triggerPlayerHit, setTriggerPlayerHit] = useState(false);
  const [triggerEnemyHit, setTriggerEnemyHit] = useState(false);
  
  const combatScrollRef = useRef<HTMLDivElement>(null);

  // Derived Values
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const playerColors = useMemo(() => ['blue', 'orange', 'green', 'purple'], []);

  const showToast = (msg: string, type: 'info' | 'error' | 'success' = 'info', action?: { label: string, onClick: () => void }) => {
      setToast({ msg, type, action });
  };

  const initGame = (count: number) => {
      const players = [];
      const startHexes = [
          { q: 0, r: 2, id: 'start1' }, 
          { q: 0, r: -2, id: 'start2' },
          { q: 2, r: -1, id: 'start3' },
          { q: -2, r: 1, id: 'start4' }
      ];

      let newMap = [...INITIAL_STATE.map];
      
      // Initialize Players
      for (let i = 0; i < count; i++) {
          const p = createPlayer(i, playerColors[i]);
          players.push(p);

          // Add Start Hex to Map
          const startCoords = startHexes[i];
          const startHex: Hex = { 
              ...startCoords, 
              name: `${p.name} Base`, 
              type: 'Start', 
              resources: [ResourceType.Money, ResourceType.Science, ResourceType.Materials], 
              ownerId: i, // Owned by Player i
              hasEnemy: false, hasArtifact: false, isGCDS: false, 
              description: 'Home Base', revealed: true, 
              structure: 'Starbase', population: 3 
          };
          newMap.push(startHex);
      }

      setGameState({
          ...INITIAL_STATE,
          phase: GamePhase.Action,
          players: players,
          map: newMap
      });
  };

  // Helper to update active player state
  const updateActivePlayer = (updater: (p: Player) => Player) => {
      setGameState(prev => {
          const newPlayers = [...prev.players];
          newPlayers[prev.activePlayerIndex] = updater(newPlayers[prev.activePlayerIndex]);
          return { ...prev, players: newPlayers };
      });
  };

  // Auto-scroll combat log
  useEffect(() => {
    if (combatScrollRef.current) {
        combatScrollRef.current.scrollTop = combatScrollRef.current.scrollHeight;
    }
  }, [combatLogs]);

  const getHexDistance = (a: Hex, b: Hex) => {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs((-a.q-a.r) - (-b.q-b.r))) / 2;
  };

  const calculateShipsRange = (ships: { [key in ShipType]: number }) => {
      let minMovement = 99;
      let hasShips = false;
      const bpList = activePlayer.blueprints;

      (Object.keys(ships) as ShipType[]).forEach(type => {
          if (ships[type] > 0) {
              hasShips = true;
              const bp = bpList[type];
              let move = bp.baseMovement;
              bp.installedParts.forEach(pid => {
                  const part = SHIP_PARTS_DB.find(p => p.id === pid);
                  if (part?.stats.movement) move += part.stats.movement;
              });
              if (move < minMovement) minMovement = move;
          }
      });
      return hasShips ? minMovement : 0;
  };

  const handleHexClick = (hex: Hex) => {
    if (isMoveMode) {
        if (movementCosts && movementCosts[hex.id] !== undefined) {
            executeMove(hex);
        } else {
            if (hex.id === selectedHex?.id) cancelMove();
            else {
                cancelMove();
                setSelectedHex(hex);
            }
        }
    } else {
        setSelectedHex(hex);
    }
  };

  const isNeighbor = (h1: Hex, h2: Hex) => {
    const dq = h1.q - h2.q;
    const dr = h1.r - h2.r;
    return (Math.abs(dq) <= 1 && Math.abs(dr) <= 1 && Math.abs(dq + dr) <= 1) && !(dq === 0 && dr === 0);
  };

  const handleAction = (action: string) => {
    if (!activePlayer) return;

    switch(action) {
        case 'RESEARCH':
            setActiveTab('tech');
            break;
        case 'UPGRADE':
            setActiveTab('blueprints');
            break;
        case 'INFLUENCE':
             showToast("Select a sector on the map to Claim it. Select a controlled sector to Recall influence.", 'info');
            break;
        case 'BUILD':
            if (selectedHex && selectedHex.ownerId === activePlayer.id) {
                if (selectedHex.structure === 'Starbase' || selectedHex.type === 'Start') {
                    setBuildQueue({ [ShipType.Interceptor]: 0, [ShipType.Cruiser]: 0, [ShipType.Dreadnought]: 0 });
                    setBuildColonyShipQueue(0);
                    setShowBuildModal(true);
                } else {
                     showToast("Starbase required for shipyard operations.", 'error');
                }
            } else {
                showToast("Select a sector you control with a Starbase.", 'error');
            }
            break;
        case 'EXPLORE':
            if (selectedHex && selectedHex.ownerId === activePlayer.id) {
                if (activePlayer.resources[ResourceType.Money] >= 1) {
                    
                    updateActivePlayer(p => ({
                        ...p,
                        resources: { ...p.resources, [ResourceType.Money]: p.resources[ResourceType.Money] - 1 }
                    }));

                    let revealedCount = 0;
                    const newMap = gameState.map.map(hex => {
                        if (!hex.revealed && isNeighbor(selectedHex, hex)) {
                            revealedCount++;
                            return { ...hex, revealed: true };
                        }
                        return hex;
                    });

                    if (revealedCount > 0) {
                        setGameState(prev => ({ ...prev, map: newMap }));
                        showToast(`Scanners revealed ${revealedCount} sectors.`, 'success');
                    } else {
                        showToast("No unknown sectors adjacent to this fleet position.", 'info');
                    }
                } else {
                    showToast("Insufficient funds. Cost: 1 Money.", 'error');
                }
            } else {
                showToast("Select a controlled sector to launch scanner drones.", 'error');
            }
            break;
        case 'MOVE':
            if (selectedHex) {
                // Check if ACTIVE player has fleet here
                const fleet = gameState.fleets.find(f => f.hexId === selectedHex.id && f.ownerId === activePlayer.id);
                if (fleet) {
                    setMoveQueue({ ...fleet.ships }); 
                    setShowMoveModal(true);
                } else {
                    showToast("No fleet stationed here under your command.", 'error');
                }
            } else {
                showToast("Select a sector with a fleet.", 'error');
            }
            break;
        default: break;
    }
  };

  const cancelMove = () => {
      setIsMoveMode(false);
      setMovementCosts(null);
      setToast(null); 
  };
  
  const handleMoveQueueChange = (type: ShipType, delta: number) => {
      const fleet = gameState.fleets.find(f => f.hexId === selectedHex?.id && f.ownerId === activePlayer.id);
      if (!fleet) return;
      const current = moveQueue[type];
      const max = fleet.ships[type];
      const newValue = Math.min(max, Math.max(0, current + delta));
      setMoveQueue(prev => ({ ...prev, [type]: newValue }));
  };

  const initiateMove = () => {
      if (!selectedHex) return;
      const range = calculateShipsRange(moveQueue);
      if (range === 0) {
          showToast("No ships selected or fleet has 0 movement.", 'error');
          return;
      }
      
      const costs: {[id: string]: number} = {};
      let reachableCount = 0;
      gameState.map.forEach(h => {
           if (h.id !== selectedHex.id) {
               const dist = getHexDistance(selectedHex, h);
               if (dist <= range) {
                   costs[h.id] = dist;
                   reachableCount++;
               }
           }
      });

      if (reachableCount > 0) {
          setMovementCosts(costs);
          setIsMoveMode(true);
          setShowMoveModal(false);
          showToast(`Select destination (Range: ${range})`, 'info', { label: "Cancel", onClick: cancelMove });
      } else {
          showToast("No reachable sectors within range.", 'error');
      }
  };

  const executeMove = (targetHex: Hex) => {
      if (!selectedHex) return;

      setGameState(prev => {
          let newFleets = [...prev.fleets];
          const sourceFleetIndex = newFleets.findIndex(f => f.hexId === selectedHex.id && f.ownerId === activePlayer.id);
          if (sourceFleetIndex === -1) return prev; 
          
          const sourceFleet = { ...newFleets[sourceFleetIndex], ships: { ...newFleets[sourceFleetIndex].ships } };
          let sourceEmpty = true;
          
          (Object.keys(moveQueue) as ShipType[]).forEach(type => {
              sourceFleet.ships[type] -= moveQueue[type];
              if (sourceFleet.ships[type] > 0) sourceEmpty = false;
          });

          if (sourceEmpty) newFleets.splice(sourceFleetIndex, 1);
          else newFleets[sourceFleetIndex] = sourceFleet;

          // Merge or Create at Target
          const targetFleetIndex = newFleets.findIndex(f => f.hexId === targetHex.id && f.ownerId === activePlayer.id);
          if (targetFleetIndex !== -1) {
              const targetFleet = { ...newFleets[targetFleetIndex], ships: { ...newFleets[targetFleetIndex].ships } };
              (Object.keys(moveQueue) as ShipType[]).forEach(type => {
                  targetFleet.ships[type] += moveQueue[type];
              });
              newFleets[targetFleetIndex] = targetFleet;
          } else {
              newFleets.push({
                  id: `f-${Date.now()}`,
                  ownerId: activePlayer.id,
                  hexId: targetHex.id,
                  ships: { ...moveQueue } 
              });
          }
          return { ...prev, fleets: newFleets };
      });

      cancelMove();
      setSelectedHex(targetHex);
      
      // Simple Hostile Check: If moved into Enemy hex
      if (targetHex.hasEnemy || targetHex.isGCDS) {
         showToast("Hostiles detected. Engage Combat?", 'error');
      } else if (targetHex.ownerId !== null && targetHex.ownerId !== activePlayer.id) {
          showToast(`Entering ${gameState.players[targetHex.ownerId].name}'s territory.`, 'info');
      } else {
         showToast(`Fleet deployed to ${targetHex.name}.`, 'success');
      }
  };

  const buyTech = (techId: string) => {
    const tech = activePlayer.techs.find(t => t.id === techId);
    if (!tech) return;

    if (activePlayer.resources[ResourceType.Science] >= tech.cost) {
        updateActivePlayer(p => ({
            ...p,
            resources: { ...p.resources, [ResourceType.Science]: p.resources[ResourceType.Science] - tech.cost },
            techs: p.techs.map(t => t.id === techId ? { ...t, unlocked: true } : t)
        }));
        showToast(`Research Complete: ${tech.name}`, 'success');
    }
  };

  const handleResetTechs = () => {
    // Refund Logic
    const spentScience = activePlayer.techs.reduce((total, t) => {
        return t.unlocked ? total + t.cost : total;
    }, 0);

    // Deep copy fresh tech state
    const resetTechs = JSON.parse(JSON.stringify(INITIAL_TECHS));

    updateActivePlayer(p => ({
        ...p,
        resources: {
            ...p.resources,
            [ResourceType.Science]: p.resources[ResourceType.Science] + spentScience
        },
        techs: resetTechs
    }));
    
    showToast(`Research reset. ${spentScience} Science refunded.`, 'success');
  };

  const upgradeBlueprint = (type: ShipType, stat: 'hull' | 'initiative' | 'movement') => {
    const costs = { hull: 2, initiative: 3, movement: 3 };
    const cost = costs[stat];
    
    if (activePlayer.resources[ResourceType.Materials] >= cost) {
        updateActivePlayer(p => {
             const newBlueprints = { ...p.blueprints };
             const ship = { ...newBlueprints[type] };
             if (stat === 'hull') ship.baseHull += 1;
             if (stat === 'initiative') ship.baseInitiative += 1;
             if (stat === 'movement') ship.baseMovement += 1;
             newBlueprints[type] = ship;
             return {
                 ...p,
                 resources: { ...p.resources, [ResourceType.Materials]: p.resources[ResourceType.Materials] - cost },
                 blueprints: newBlueprints
             };
        });
        showToast("Blueprint updated.", 'success');
    }
  };

  const installPart = (type: ShipType, slotIndex: number, partId: string) => {
    const part = SHIP_PARTS_DB.find(p => p.id === partId);
    if (!part) return;
    
    if (activePlayer.resources[ResourceType.Materials] >= part.cost) {
        updateActivePlayer(p => {
            const newBlueprints = { ...p.blueprints };
            const ship = { ...newBlueprints[type], installedParts: [...newBlueprints[type].installedParts] };
            ship.installedParts[slotIndex] = partId;
            newBlueprints[type] = ship;
            return {
                ...p,
                resources: { ...p.resources, [ResourceType.Materials]: p.resources[ResourceType.Materials] - part.cost },
                blueprints: newBlueprints
            };
        });
        showToast(`${part.name} installed.`, 'success');
    }
  };

  const uninstallPart = (type: ShipType, slotIndex: number) => {
     updateActivePlayer(p => {
        const newBlueprints = { ...p.blueprints };
        const ship = { ...newBlueprints[type], installedParts: [...newBlueprints[type].installedParts] };
        ship.installedParts[slotIndex] = null;
        newBlueprints[type] = ship;
        return { ...p, blueprints: newBlueprints };
     });
     showToast("Module uninstalled.", 'info');
  };

  const handleClaimSector = () => {
    if (!selectedHex) return;
    if (activePlayer.influence.current <= 0) {
        showToast("Insufficient Influence Discs.", 'error');
        return;
    }

    const newMap = gameState.map.map(h => {
        if (h.id === selectedHex.id) {
            return { ...h, ownerId: activePlayer.id };
        }
        return h;
    });
    
    setGameState(prev => ({ ...prev, map: newMap }));
    updateActivePlayer(p => ({
        ...p,
        influence: { ...p.influence, current: p.influence.current - 1 },
        victoryPoints: p.victoryPoints + 1
    }));
    
    setSelectedHex(prev => prev ? { ...prev, ownerId: activePlayer.id } : null);
    showToast(`Sector Claimed (+1 VP)`, 'success');
  };

  const handleRecallInfluence = () => {
      if (!selectedHex || selectedHex.ownerId !== activePlayer.id) return;

      const newMap = gameState.map.map(h => {
          if (h.id === selectedHex.id) return { ...h, ownerId: null, structure: null, population: 0 }; 
          return h;
      });
      const recoveredPop = selectedHex.population;

      setGameState(prev => ({ ...prev, map: newMap }));
      updateActivePlayer(p => ({
          ...p,
          influence: { ...p.influence, current: Math.min(p.influence.max, p.influence.current + 1) },
          inventory: {
              ...p.inventory,
              population: p.inventory.population + recoveredPop,
              starbases: selectedHex.structure === 'Starbase' ? Math.min(4, p.inventory.starbases + 1) : p.inventory.starbases
          },
          victoryPoints: Math.max(0, p.victoryPoints - 1)
      }));
       setSelectedHex(prev => prev ? { ...prev, ownerId: null, structure: null, population: 0 } : null);
       showToast("Influence recalled.", 'info');
  };

  const handleBuildStarbase = () => {
      if (!selectedHex || selectedHex.ownerId !== activePlayer.id) return;
      if (activePlayer.inventory.starbases <= 0) {
          showToast("No Starbases available.", 'error'); return;
      }
      if (activePlayer.resources[ResourceType.Materials] < 3) { 
           showToast("Insufficient Materials.", 'error'); return;
      }

      const newMap = gameState.map.map(h => h.id === selectedHex.id ? { ...h, structure: 'Starbase' as const } : h);
      setGameState(prev => ({ ...prev, map: newMap }));
      updateActivePlayer(p => ({
          ...p,
          resources: { ...p.resources, [ResourceType.Materials]: p.resources[ResourceType.Materials] - 3 },
          inventory: { ...p.inventory, starbases: p.inventory.starbases - 1 }
      }));
      setSelectedHex(prev => prev ? { ...prev, structure: 'Starbase' as const } : null);
      showToast("Starbase constructed.", 'success');
  }

  const handleColonize = () => {
       if (!selectedHex || selectedHex.ownerId !== activePlayer.id) return;
       if (activePlayer.inventory.colonyShips <= 0) { showToast("No Colony Ships.", 'error'); return; }
       if (activePlayer.inventory.population <= 0) { showToast("No Workforce.", 'error'); return; }
       if (selectedHex.population >= selectedHex.resources.length) { showToast("Max pop reached.", 'error'); return; }

       const newMap = gameState.map.map(h => h.id === selectedHex.id ? { ...h, population: h.population + 1 } : h);
       setGameState(prev => ({ ...prev, map: newMap }));
       updateActivePlayer(p => ({
          ...p,
          inventory: { ...p.inventory, colonyShips: p.inventory.colonyShips - 1, population: p.inventory.population - 1 }
      }));
      setSelectedHex(prev => prev ? { ...prev, population: prev.population + 1 } : null);
      showToast("Colonization successful.", 'success');
  }

  // --- Build Logic ---
  const handleQueueChange = (type: ShipType, delta: number) => {
      setBuildQueue(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
  };

  const getTotalBuildCost = () => {
      let total = 0;
      Object.entries(buildQueue).forEach(([type, count]) => {
          total += (activePlayer.blueprints[type as ShipType].cost * (count as number));
      });
      total += buildColonyShipQueue * 2; 
      return total;
  };

  const executeBuild = () => {
      const cost = getTotalBuildCost();
      if (activePlayer.resources[ResourceType.Materials] >= cost && selectedHex) {
          updateActivePlayer(p => ({
              ...p,
              resources: { ...p.resources, [ResourceType.Materials]: p.resources[ResourceType.Materials] - cost },
              inventory: { ...p.inventory, colonyShips: p.inventory.colonyShips + buildColonyShipQueue }
          }));

          const newFleets = [...gameState.fleets];
          const hasShips = Object.values(buildQueue).some((c: any) => (c as number) > 0);
          
          if (hasShips) {
            let fleetIndex = newFleets.findIndex(f => f.hexId === selectedHex.id && f.ownerId === activePlayer.id);
            if (fleetIndex === -1) {
                newFleets.push({
                    id: `f-${Date.now()}`,
                    ownerId: activePlayer.id,
                    hexId: selectedHex.id,
                    ships: { ...buildQueue }
                });
            } else {
                const fleet = { ...newFleets[fleetIndex], ships: { ...newFleets[fleetIndex].ships } };
                fleet.ships[ShipType.Interceptor] = (fleet.ships[ShipType.Interceptor] || 0) + buildQueue[ShipType.Interceptor];
                fleet.ships[ShipType.Cruiser] = (fleet.ships[ShipType.Cruiser] || 0) + buildQueue[ShipType.Cruiser];
                fleet.ships[ShipType.Dreadnought] = (fleet.ships[ShipType.Dreadnought] || 0) + buildQueue[ShipType.Dreadnought];
                newFleets[fleetIndex] = fleet;
            }
          }

          setGameState(prev => ({ ...prev, fleets: newFleets }));
          setShowBuildModal(false);
          showToast("Production complete.", 'success');
      }
  };

  // --- Combat Logic ---
  const calculateShipStats = (type: ShipType, count: number) => {
      const bp = activePlayer.blueprints[type];
      
      let totalHull = bp.baseHull;
      let totalInit = bp.baseInitiative;
      let totalDmg = bp.baseDamage || 1;
      
      let specialProps = { hasShields: false, hasIon: false, hasMissiles: false, hasPlasma: false };

      bp.installedParts.forEach(partId => {
          if (!partId) return;
          const part = SHIP_PARTS_DB.find(p => p.id === partId);
          if (part) {
              totalHull += part.stats.hull || 0;
              totalInit += part.stats.initiative || 0;
              totalDmg += (part.stats.damage || 0);
              
              if (part.special === 'Shield') specialProps.hasShields = true;
              if (part.special === 'Ion') specialProps.hasIon = true;
              if (part.special === 'Missile') specialProps.hasMissiles = true;
              if (part.special === 'Plasma') specialProps.hasPlasma = true;
          }
      });
      
      return {
          hull: totalHull * count,
          damage: totalDmg * count,
          initiative: totalInit, 
          ...specialProps
      };
  };

  const resolveCombat = () => {
      if (!selectedHex) return;

      setShowCombatModal(true);
      setCombatLogs([]);
      setCombatResult(null);
      setCurrentDice([]);
      setTurnIndicator(null);
      setTriggerPlayerHit(false);
      setTriggerEnemyHit(false);

      // Simulating a fleet composition for prototype
      // In a real implementation, we'd pass the actual fleet data engaging
      const interceptorStats = calculateShipStats(ShipType.Interceptor, 3);
      const cruiserStats = calculateShipStats(ShipType.Cruiser, 2);
      
      const totalHull = interceptorStats.hull + cruiserStats.hull;
      const totalDamage = interceptorStats.damage + cruiserStats.damage;
      const bestInitiative = Math.max(interceptorStats.initiative, cruiserStats.initiative);
      
      const playerEntity: ActiveCombatEntity = {
          name: activePlayer.name,
          hull: totalHull,
          maxHull: totalHull,
          damage: totalDamage,
          initiative: bestInitiative,
          isPlayer: true,
          hasShields: interceptorStats.hasShields || cruiserStats.hasShields,
          hasIon: interceptorStats.hasIon || cruiserStats.hasIon,
          hasMissiles: interceptorStats.hasMissiles || cruiserStats.hasMissiles,
          hasPlasma: interceptorStats.hasPlasma || cruiserStats.hasPlasma
      };

      // Enemy Logic
      let enemyEntity: ActiveCombatEntity;
      if (selectedHex.isGCDS) {
          enemyEntity = {
              name: "G.C.D.S. Omega",
              hull: 30, maxHull: 30, damage: 7, initiative: 6, isPlayer: false,
              hasShields: true, hasIon: false, hasMissiles: true, hasPlasma: true
          };
      } else {
          enemyEntity = {
              name: "Ancient Guardian",
              hull: 8, maxHull: 8, damage: 3, initiative: 2, isPlayer: false,
              hasShields: false, hasIon: false, hasMissiles: false, hasPlasma: false
          };
      }

      setPlayerFleetStatus(playerEntity);
      setEnemyStatus(enemyEntity);

      let round = 1;
      let pCurrent = { ...playerEntity };
      let eCurrent = { ...enemyEntity };
      const logs: CombatLogEntry[] = [];
      let turnStep = 0;

      const combatLoop = setInterval(() => {
          if (pCurrent.hull <= 0 || eCurrent.hull <= 0) {
              clearInterval(combatLoop);
              const victory = pCurrent.hull > 0;
              setCombatResult(victory ? 'victory' : 'defeat');
              setCurrentDice([]);
              setIsRolling(false);
              
              if (victory) {
                  const reputationGain = Math.floor(Math.random() * 4) + 1; 
                  logs.push({ round, message: `Sector Secured. Reputation: ${reputationGain} VP`, type: 'info' });
                  
                   const newMap = gameState.map.map(h => h.id === selectedHex.id ? { ...h, hasEnemy: false, isGCDS: false } : h);
                   setGameState(prev => ({ ...prev, map: newMap }));
                   
                   updateActivePlayer(p => ({
                       ...p,
                       resources: {
                           ...p.resources,
                           [ResourceType.Materials]: p.resources[ResourceType.Materials] + 2,
                           [ResourceType.Science]: p.resources[ResourceType.Science] + 2
                       },
                       reputation: [...p.reputation, reputationGain],
                       victoryPoints: p.victoryPoints + reputationGain
                   }));
                   setSelectedHex(prev => prev ? { ...prev, hasEnemy: false, isGCDS: false } : null);
              } else {
                  logs.push({ round, message: "Fleet critical failure. Retreating.", type: 'info' });
                  updateActivePlayer(p => ({
                       ...p,
                       resources: { ...p.resources, [ResourceType.Materials]: Math.max(0, p.resources[ResourceType.Materials] - 2) }
                  }));
              }
              setCombatLogs([...logs]);
              return;
          }

          const playerGoesFirst = pCurrent.initiative >= eCurrent.initiative;
          const first = playerGoesFirst ? pCurrent : eCurrent;
          const second = playerGoesFirst ? eCurrent : pCurrent;

          if (turnStep === 0) {
              logs.push({ round, message: `--- Round ${round} ---`, type: 'info' });
              setCombatLogs([...logs]);
              turnStep = 1;
          } else if (turnStep === 1) {
              setTurnIndicator(first.isPlayer ? 'player' : 'enemy');
              setIsRolling(true);
              setCurrentDice([1, 1]); 
              turnStep = 2;
          } else if (turnStep === 2) {
              setIsRolling(false);
              const rollBase = Math.floor(Math.random() * 6) + 1;
              let rollFinal = rollBase + (first.hasMissiles ? 1 : 0);
              setCurrentDice([rollBase]); 
              
              const hit = rollFinal >= 3;
              let dmg = 0;
              let details = [];
              if (hit) {
                  dmg = first.damage;
                  if (rollBase === 6) { dmg += 2; details.push("CRIT"); }
                  let mitigation = 0;
                  if (second.hasShields) {
                      if (first.hasIon) details.push("Ion Bypassed");
                      else { mitigation = 2; details.push("Shields Absorbed"); }
                  }
                  dmg = Math.max(0, dmg - mitigation);
              }
              if (dmg > 0) second.isPlayer ? setTriggerPlayerHit(true) : setTriggerEnemyHit(true);
              setTimeout(() => { setTriggerPlayerHit(false); setTriggerEnemyHit(false); }, 500);

              second.hull -= dmg;
              let logMsg = `${first.name} rolls ${rollBase}`;
              if (dmg > 0) logMsg += `: HIT for ${dmg}`;
              else if (hit) logMsg += `: BLOCKED`;
              else logMsg += `: MISS`;
              logs.push({ round, message: logMsg, type: first.isPlayer ? 'player' : 'enemy' });
              
              setPlayerFleetStatus({ ...pCurrent });
              setEnemyStatus({ ...eCurrent });
              setCombatLogs([...logs]);
              turnStep = second.hull <= 0 ? 5 : 3;
          } else if (turnStep === 3) {
              setTurnIndicator(second.isPlayer ? 'player' : 'enemy');
              setIsRolling(true);
              turnStep = 4;
          } else if (turnStep === 4) {
              setIsRolling(false);
              const rollBase = Math.floor(Math.random() * 6) + 1;
              let rollFinal = rollBase + (second.hasMissiles ? 1 : 0);
              setCurrentDice([rollBase]);

              const hit = rollFinal >= 3;
              let dmg = 0;
              if (hit) {
                  dmg = second.damage;
                   if (rollBase === 6) dmg += 2;
                   let mitigation = 0;
                   if (first.hasShields && !second.hasIon) mitigation = 2;
                   dmg = Math.max(0, dmg - mitigation);
              }
              if (dmg > 0) first.isPlayer ? setTriggerPlayerHit(true) : setTriggerEnemyHit(true);
              setTimeout(() => { setTriggerPlayerHit(false); setTriggerEnemyHit(false); }, 500);

              first.hull -= dmg;
              let logMsg = `${second.name} rolls ${rollBase}`;
              if (dmg > 0) logMsg += `: HIT for ${dmg}`;
              else if (hit) logMsg += `: BLOCKED`;
              else logMsg += `: MISS`;
              logs.push({ round, message: logMsg, type: second.isPlayer ? 'player' : 'enemy' });
              
              setPlayerFleetStatus({ ...pCurrent });
              setEnemyStatus({ ...eCurrent });
              setCombatLogs([...logs]);
              turnStep = 0; round++;
          } else { turnStep = 0; round++; }
      }, 1500); 
  };


  const nextTurn = () => {
    // Switch to next player
    const nextPlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
    
    // If we cycled back to player 0, advance game state logic (Income, Round, etc.) if needed
    // For simplified flow, we'll just say End Turn" switch player, and "End Round" accessible if P1? 
    // Or auto-cycle. Let's do auto-cycle.
    
    if (nextPlayerIndex === 0) {
        // Round Complete
        const phases = [GamePhase.Action, GamePhase.Combat, GamePhase.Maintenance, GamePhase.Cleanup];
        const currentIndex = phases.indexOf(gameState.phase);
        let nextIndex = currentIndex + 1;
        let nextRound = gameState.round;

        if (nextIndex >= phases.length) {
            nextIndex = 0;
            nextRound += 1;
            // Income for ALL players
            const newPlayers = gameState.players.map(p => {
                let moneyInc = p.income[ResourceType.Money];
                let scienceInc = p.income[ResourceType.Science];
                let matInc = p.income[ResourceType.Materials];

                gameState.map.forEach(hex => {
                    if (hex.ownerId === p.id && hex.population > 0) {
                        hex.resources.forEach(r => {
                             if (r === ResourceType.Money) moneyInc += hex.population;
                             if (r === ResourceType.Science) scienceInc += hex.population;
                             if (r === ResourceType.Materials) matInc += hex.population;
                        });
                    }
                });
                return {
                    ...p,
                    resources: {
                        [ResourceType.Money]: p.resources[ResourceType.Money] + moneyInc,
                        [ResourceType.Science]: p.resources[ResourceType.Science] + scienceInc,
                        [ResourceType.Materials]: p.resources[ResourceType.Materials] + matInc,
                    }
                };
            });

            setGameState(prev => ({
                ...prev,
                round: nextRound,
                phase: phases[nextIndex],
                activePlayerIndex: 0,
                players: newPlayers
            }));
            showToast(`Round ${nextRound} Begun. Income distributed.`, 'success');
        } else {
            setGameState(prev => ({ 
                ...prev, 
                phase: phases[nextIndex], 
                activePlayerIndex: 0 
            }));
            showToast(`Phase Changed: ${phases[nextIndex]}`, 'info');
        }
    } else {
        setGameState(prev => ({ ...prev, activePlayerIndex: nextPlayerIndex }));
        showToast(`Turn: ${gameState.players[nextPlayerIndex].name}`, 'info');
    }
  };

  if (gameState.phase === GamePhase.Setup) {
      return <SetupScreen onStart={initGame} />;
  }

  // --- Render ---
  return (
    <div className="flex flex-col h-screen bg-space-900 text-gray-100 font-sans overflow-hidden relative selection:bg-blue-500/30">
      <Starfield />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} action={toast.action} />}

      {/* Header */}
      <header className="h-16 border-b border-gray-700 bg-space-800/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0 z-50 shadow-lg relative">
        <div className="flex items-center gap-2 md:gap-4">
             {/* Player Indicator */}
             <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg border
                bg-${activePlayer.color}-900/30 border-${activePlayer.color}-500/50 text-${activePlayer.color}-300
             `}>
                <Users size={18} />
                <span className="font-bold uppercase tracking-wider text-xs md:text-sm">{activePlayer.name}</span>
             </div>

            <div className="hidden md:flex items-center gap-2 text-[10px] md:text-xs text-gray-400 font-mono border-l border-gray-700 pl-4">
                <span className="flex items-center gap-1"><Clock size={10} className="md:w-3 md:h-3"/> R{gameState.round}/9</span>
                <span className="text-gray-600">|</span>
                <span className="text-brand-grid uppercase truncate max-w-[80px] md:max-w-none">{gameState.phase}</span>
            </div>
        </div>

        {/* Active Player Resources */}
        <div className="flex gap-3 md:gap-6 font-mono overflow-x-auto no-scrollbar items-center mask-image-right">
             <div className="flex flex-col items-center group cursor-help shrink-0">
                <span className="hidden md:block text-xs text-purple-400 uppercase">Influence</span>
                <div className="flex items-center gap-1 md:gap-2 text-purple-300 font-bold text-sm md:text-lg">
                    <Radio size={14} className="md:w-[18px] md:h-[18px]" /> {activePlayer.influence.current}
                </div>
            </div>
             <div className="w-px h-8 bg-gray-700 mx-1"></div>
             <div className="flex gap-3">
                 <div className="flex flex-col items-center group cursor-help shrink-0">
                    <span className="hidden md:block text-xs text-green-400 uppercase">Pop</span>
                    <div className="flex items-center gap-1 md:gap-2 text-green-300 font-bold text-sm md:text-lg">
                        <User size={14} className="md:w-[18px] md:h-[18px]" /> {activePlayer.inventory.population}
                    </div>
                 </div>
             </div>
            <div className="w-px h-8 bg-gray-700 mx-1"></div>
            <div className="flex flex-col items-center group cursor-help shrink-0">
                <span className="hidden md:block text-xs text-gray-500 uppercase">Money</span>
                <div className="flex items-center gap-1 md:gap-2 text-brand-money font-bold text-sm md:text-lg">
                    <Coins size={14} className="md:w-[18px] md:h-[18px]" /> {activePlayer.resources[ResourceType.Money]}
                </div>
            </div>
            <div className="flex flex-col items-center group cursor-help shrink-0">
                <span className="hidden md:block text-xs text-gray-500 uppercase">Sci</span>
                <div className="flex items-center gap-1 md:gap-2 text-brand-science font-bold text-sm md:text-lg">
                    <FlaskConical size={14} className="md:w-[18px] md:h-[18px]" /> {activePlayer.resources[ResourceType.Science]}
                </div>
            </div>
             <div className="flex flex-col items-center group cursor-help shrink-0">
                <span className="hidden md:block text-xs text-gray-500 uppercase">Mat</span>
                <div className="flex items-center gap-1 md:gap-2 text-brand-materials font-bold text-sm md:text-lg">
                    <Box size={14} className="md:w-[18px] md:h-[18px]" /> {activePlayer.resources[ResourceType.Materials]}
                </div>
            </div>
        </div>

        <button 
            onClick={nextTurn}
            className={`ml-4 px-3 py-1.5 md:px-4 md:py-2 rounded font-bold uppercase text-[10px] md:text-xs transition-colors shadow-lg whitespace-nowrap
                bg-${activePlayer.color}-600 hover:bg-${activePlayer.color}-500 text-white shadow-${activePlayer.color}-900/50
            `}
        >
            End Turn
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        {/* Sidebar */}
        <aside className="order-2 md:order-1 w-full md:w-20 h-16 md:h-auto bg-space-800/90 border-t md:border-r border-gray-700/50 flex flex-row md:flex-col items-center justify-around md:justify-start py-2 md:py-6 gap-2 md:gap-6 shrink-0 z-30 backdrop-blur-sm">
            <button 
                onClick={() => setActiveTab('map')}
                className={`p-2 md:p-3 rounded-xl transition-all ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'text-gray-500 hover:bg-space-700 hover:text-gray-300'}`}
            >
                <div className="bg-current p-0.5 rounded-full"><div className="w-4 h-4 md:w-5 md:h-5 border-2 border-current rounded-full"></div></div>
            </button>
            <button 
                onClick={() => setActiveTab('tech')}
                className={`p-2 md:p-3 rounded-xl transition-all ${activeTab === 'tech' ? 'bg-brand-science text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]' : 'text-gray-500 hover:bg-space-700 hover:text-gray-300'}`}
            >
                <FlaskConical size={20} className="md:w-6 md:h-6" />
            </button>
            <button 
                onClick={() => setActiveTab('blueprints')}
                className={`p-2 md:p-3 rounded-xl transition-all ${activeTab === 'blueprints' ? 'bg-brand-materials text-white shadow-[0_0_15px_rgba(133,77,14,0.6)]' : 'text-gray-500 hover:bg-space-700 hover:text-gray-300'}`}
            >
                <Box size={20} className="md:w-6 md:h-6" />
            </button>
        </aside>

        {/* Center View */}
        <div className="order-1 md:order-2 flex-1 p-2 md:p-6 relative flex flex-col gap-2 md:gap-6 overflow-hidden">
            <div className="flex-1 relative rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50 bg-space-900/60 backdrop-blur-sm">
                {activeTab === 'map' && (
                    <HexMap 
                        hexes={gameState.map} 
                        fleets={gameState.fleets} 
                        movementCosts={movementCosts}
                        onHexClick={handleHexClick} 
                        activePlayerId={gameState.activePlayerIndex}
                        playerColors={playerColors}
                    />
                )}
                {activeTab === 'tech' && (
                    <div className="p-4 md:p-6 h-full overflow-y-auto">
                        <TechPanel 
                            techs={activePlayer.techs} 
                            science={activePlayer.resources[ResourceType.Science]} 
                            onResearch={buyTech} 
                            onReset={handleResetTechs}
                        />
                    </div>
                )}
                {activeTab === 'blueprints' && (
                    <div className="p-4 md:p-6 h-full overflow-y-auto">
                        <Blueprints 
                            blueprints={activePlayer.blueprints} 
                            materials={activePlayer.resources[ResourceType.Materials]} 
                            techs={activePlayer.techs}
                            onUpgrade={upgradeBlueprint}
                            onInstallPart={installPart}
                            onUninstallPart={uninstallPart}
                        />
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="h-auto md:h-32 shrink-0 z-10 pb-16 md:pb-0">
                <ActionPanel onAction={handleAction} influence={activePlayer.influence.current} />
            </div>

            {/* Context Sidebar */}
            {selectedHex && activeTab === 'map' && !showCombatModal && !showBuildModal && !showMoveModal && !isMoveMode && (
                <div className="absolute bottom-[8.5rem] left-2 right-2 md:bottom-auto md:top-6 md:left-auto md:right-6 md:w-80 bg-space-800/95 backdrop-blur-md border border-gray-600 rounded-xl p-4 md:p-5 shadow-2xl animate-in slide-in-from-bottom-10 md:slide-in-from-right-10 duration-200 flex flex-col gap-4 z-20 max-h-[50vh] overflow-y-auto md:max-h-none">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-gray-700 pb-2">
                        <div>
                             <h3 className="font-bold text-lg md:text-xl text-white tracking-wide">{selectedHex.revealed ? selectedHex.name : "Unknown Signal"}</h3>
                             <div className="text-[10px] md:text-xs font-mono text-blue-400 mt-1">{selectedHex.id}</div>
                        </div>
                        <button onClick={() => setSelectedHex(null)} className="text-gray-400 hover:text-white">&times;</button>
                    </div>
                    
                    {selectedHex.revealed && (
                        <>
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {selectedHex.ownerId !== null ? (
                                    <span className={`px-2 py-1 bg-${playerColors[selectedHex.ownerId]}-500/20 text-${playerColors[selectedHex.ownerId]}-300 text-[10px] md:text-xs font-bold uppercase rounded border border-${playerColors[selectedHex.ownerId]}-500/30 flex items-center gap-1`}>
                                        <Flag size={10}/> Owned by {gameState.players[selectedHex.ownerId].name}
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 bg-gray-700 text-gray-400 text-[10px] md:text-xs font-bold uppercase rounded border border-gray-600">Unclaimed</span>
                                )}
                                {selectedHex.hasEnemy && <span className="px-2 py-1 bg-red-500/20 text-red-300 text-[10px] md:text-xs font-bold uppercase rounded border border-red-500/30 flex items-center gap-1"><Sword size={10}/> Hostile</span>}
                            </div>

                             {/* Resources Output */}
                             {selectedHex.resources.length > 0 && (
                                <div className="bg-space-900/50 p-2 md:p-3 rounded-lg border border-gray-700/50">
                                    <span className="text-[8px] md:text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-2 block">Planetary Output</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {selectedHex.resources.map((r, i) => (
                                            <div key={i} className={`flex flex-col items-center justify-center p-1 rounded border ${i < selectedHex.population ? 'bg-gray-700 border-white/20 text-white' : 'bg-gray-800/50 border-gray-700 text-gray-500'}`}>
                                                <span className="text-[8px] font-bold">{r}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sector Assets */}
                            <div className="bg-black/30 rounded-lg p-3 border border-gray-700 space-y-3">
                                <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider border-b border-gray-700 pb-1">Sector Assets</div>
                                
                                {/* Structure & Pop */}
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Castle size={14} className={selectedHex.structure ? "text-white" : "text-gray-600"}/>
                                        <span>{selectedHex.structure || "No Infrastructure"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Users size={14} className={selectedHex.population > 0 ? "text-green-400" : "text-gray-600"}/>
                                        <span>{selectedHex.population} / {selectedHex.resources.length} Pop</span>
                                    </div>
                                </div>

                                {/* Fleets Breakdown */}
                                {(() => {
                                    const localFleets = gameState.fleets.filter(f => f.hexId === selectedHex.id);
                                    if (localFleets.length === 0) return <div className="text-xs text-gray-600 italic text-center py-1">No ships detected</div>;

                                    return (
                                        <div className="space-y-2 mt-2">
                                            {localFleets.map(fleet => {
                                                const owner = typeof fleet.ownerId === 'number' ? gameState.players[fleet.ownerId] : null;
                                                const isEnemy = fleet.ownerId === 'enemy';
                                                const name = isEnemy ? "Hostile Fleet" : owner?.name;
                                                const color = isEnemy ? "red" : owner?.color || "gray";
                                                
                                                return (
                                                    <div key={fleet.id} className={`bg-${color}-900/20 border border-${color}-500/30 rounded p-2`}>
                                                        <div className={`text-${color}-400 font-bold text-[10px] uppercase mb-1`}>{name}</div>
                                                        <div className="grid grid-cols-3 gap-1">
                                                            {fleet.ships[ShipType.Interceptor] > 0 && (
                                                                <div className="flex items-center gap-1 text-gray-300 text-[10px]">
                                                                    <Plane size={10} className="text-blue-300" /> {fleet.ships[ShipType.Interceptor]}
                                                                </div>
                                                            )}
                                                            {fleet.ships[ShipType.Cruiser] > 0 && (
                                                                <div className="flex items-center gap-1 text-gray-300 text-[10px]">
                                                                    <Rocket size={10} className="text-orange-300" /> {fleet.ships[ShipType.Cruiser]}
                                                                </div>
                                                            )}
                                                            {fleet.ships[ShipType.Dreadnought] > 0 && (
                                                                <div className="flex items-center gap-1 text-gray-300 text-[10px]">
                                                                    <Shield size={10} className="text-purple-300" /> {fleet.ships[ShipType.Dreadnought]}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Operations / Actions */}
                            <div className="grid grid-cols-1 gap-2 mt-2 pt-2 border-t border-gray-700">
                                {selectedHex.ownerId === null && !selectedHex.hasEnemy && !selectedHex.isGCDS && (
                                    <button onClick={handleClaimSector} disabled={activePlayer.influence.current <= 0} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold uppercase text-xs md:text-sm shadow-lg shadow-blue-900/20">Claim Sector</button>
                                )}
                                {(selectedHex.hasEnemy || selectedHex.isGCDS) && (
                                    <button onClick={resolveCombat} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase text-xs md:text-sm shadow-lg shadow-red-900/20">Engage Hostiles</button>
                                )}
                                {selectedHex.ownerId === activePlayer.id && (
                                    <>
                                        {selectedHex.structure === null && (
                                            <button onClick={handleBuildStarbase} className="py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-[10px] font-bold uppercase">Build Starbase (3 Mat)</button>
                                        )}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={handleColonize} className="py-2 bg-green-900/40 hover:bg-green-900/60 text-green-300 rounded text-[10px] font-bold uppercase border border-green-800">Colonize</button>
                                            <button onClick={handleRecallInfluence} className="py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 rounded text-[10px] font-bold uppercase border border-purple-800">Recall Infl.</button>
                                        </div>
                                        {(selectedHex.structure === 'Starbase' || selectedHex.type === 'Start') && (
                                             <button onClick={() => handleAction('BUILD')} className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded uppercase text-[10px] font-bold shadow-lg shadow-orange-900/20">Open Shipyard</button>
                                        )}
                                         <button onClick={() => handleAction('EXPLORE')} className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded uppercase text-[10px] font-bold border border-blue-900/50">Scan Adjacent Sectors</button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
      </main>
      
      {showMoveModal && selectedHex && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
             <div className="w-full max-w-lg bg-space-800 border border-gray-600 rounded-xl p-4 flex flex-col gap-4">
                  <h2 className="text-white font-bold uppercase border-b border-gray-700 pb-2">Fleet Logistics</h2>
                  
                  <div className="flex-1 overflow-y-auto">
                        <div className="bg-black/30 p-2 rounded mb-2">
                             <div className="text-xs text-gray-400 mb-1">Source Sector</div>
                             <div className="text-blue-300 font-bold">{selectedHex.name}</div>
                        </div>

                        <div className="space-y-2">
                            {(Object.keys(moveQueue) as ShipType[]).map((type) => {
                                const fleet = gameState.fleets.find(f => f.hexId === selectedHex.id && f.ownerId === activePlayer.id);
                                const max = fleet ? fleet.ships[type] : 0;
                                if (max === 0) return null;

                                return (
                                    <div key={type} className="flex items-center justify-between bg-gray-700/30 p-2 rounded">
                                        <span className="text-sm font-bold text-gray-300">{type}</span>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => handleMoveQueueChange(type, -1)}
                                                className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-6 text-center font-mono">{moveQueue[type]}</span>
                                            <button 
                                                onClick={() => handleMoveQueueChange(type, 1)}
                                                className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                  </div>

                  <div className="flex items-center justify-between text-sm bg-blue-900/20 p-2 rounded border border-blue-500/30">
                      <span className="text-blue-300">Est. Range:</span>
                      <span className="font-bold text-white">{calculateShipsRange(moveQueue)} Sectors</span>
                  </div>

                  <div className="flex gap-2">
                       <button onClick={() => setShowMoveModal(false)} className="flex-1 py-3 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase text-xs">Cancel</button>
                       <button onClick={initiateMove} className="flex-1 py-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs shadow-lg shadow-blue-900/50">Select Target</button>
                  </div>
             </div>
        </div>
      )}

      {showBuildModal && selectedHex && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-xl bg-space-800 border border-gray-600 rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                    <h2 className="text-white font-bold uppercase flex items-center gap-2">
                        <Hammer size={18} className="text-orange-500"/> Orbital Shipyard
                    </h2>
                    <div className="text-xs font-mono text-gray-400">
                        Funds: <span className={`${activePlayer.resources[ResourceType.Materials] < getTotalBuildCost() ? 'text-red-500' : 'text-brand-materials'} font-bold`}>
                            {activePlayer.resources[ResourceType.Materials]} Mat
                        </span>
                    </div>
                  </div>

                   <div className="flex-1 overflow-y-auto space-y-2 max-h-[60vh] pr-1 custom-scrollbar">
                        {[ShipType.Interceptor, ShipType.Cruiser, ShipType.Dreadnought].map((type) => {
                            const cost = activePlayer.blueprints[type].cost;
                            return (
                                <div key={type} className="flex items-center justify-between bg-gray-700/30 p-3 rounded border border-white/5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-200">{type}</span>
                                        <span className="text-xs text-gray-500">{cost} Materials</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => handleQueueChange(type, -1)}
                                            className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-4 text-center font-mono font-bold text-lg">{buildQueue[type]}</span>
                                        <button 
                                            onClick={() => handleQueueChange(type, 1)}
                                            className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <div className="w-12 text-right font-mono text-gray-400 text-sm">
                                        {cost * buildQueue[type]}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Colony Ship Special Entry */}
                        <div className="flex items-center justify-between bg-gray-700/30 p-3 rounded border border-white/5">
                            <div className="flex flex-col">
                                <span className="font-bold text-green-300">Colony Ship</span>
                                <span className="text-xs text-gray-500">2 Materials</span>
                            </div>
                             <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setBuildColonyShipQueue(Math.max(0, buildColonyShipQueue - 1))}
                                    className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-colors"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="w-4 text-center font-mono font-bold text-lg">{buildColonyShipQueue}</span>
                                <button 
                                    onClick={() => setBuildColonyShipQueue(buildColonyShipQueue + 1)}
                                    className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <div className="w-12 text-right font-mono text-gray-400 text-sm">
                                {2 * buildColonyShipQueue}
                            </div>
                        </div>
                   </div>
                   
                   <div className="flex justify-between items-center bg-black/40 p-3 rounded">
                       <span className="text-gray-400 uppercase text-xs font-bold">Total Cost</span>
                       <span className={`font-mono font-bold text-lg ${getTotalBuildCost() > activePlayer.resources[ResourceType.Materials] ? 'text-red-500' : 'text-white'}`}>
                           {getTotalBuildCost()} Mat
                       </span>
                   </div>

                   <div className="flex gap-2">
                       <button onClick={() => setShowBuildModal(false)} className="flex-1 py-3 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold uppercase text-xs">Cancel</button>
                       <button 
                            onClick={executeBuild} 
                            disabled={getTotalBuildCost() === 0 || getTotalBuildCost() > activePlayer.resources[ResourceType.Materials]}
                            className="flex-1 py-3 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase text-xs shadow-lg shadow-orange-900/50"
                        >
                           Confirm Production
                       </button>
                   </div>
              </div>
          </div>
      )}

      {showCombatModal && playerFleetStatus && enemyStatus && (
           <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-4xl bg-space-800 border border-gray-600 rounded-xl flex flex-col h-[85vh] shadow-2xl overflow-hidden">
                   {/* Header */}
                   <div className="bg-space-900 p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
                       <h2 className="text-white font-bold flex items-center gap-2 uppercase tracking-widest text-red-500">
                           <AlertTriangle size={20} /> Tactical Engagement
                       </h2>
                       {combatResult && (
                           <button onClick={() => setShowCombatModal(false)} className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs uppercase font-bold">
                               Close Report
                           </button>
                       )}
                   </div>

                   {/* Visual Arena */}
                   <div className="flex-1 bg-black/50 relative overflow-hidden flex flex-col">
                        <div className="flex-1 flex items-center justify-between px-4 md:px-12 py-8 relative z-10">
                            {/* Player Side */}
                            <div className={`flex flex-col items-center gap-4 transition-transform duration-100 ${triggerPlayerHit ? 'animate-shake' : ''}`}>
                                <div className={`relative ${triggerPlayerHit ? 'animate-flash-red' : ''}`}>
                                     <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-900/20 rounded-full border-4 border-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                        <Rocket size={48} className="text-blue-400" />
                                     </div>
                                     {playerFleetStatus.hasShields && (
                                         <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-pulse scale-110"></div>
                                     )}
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-blue-300 text-lg md:text-2xl">{playerFleetStatus.name}</div>
                                    <div className="w-32 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className="h-full bg-green-500 transition-all duration-500" 
                                            style={{ width: `${Math.max(0, (playerFleetStatus.hull / playerFleetStatus.maxHull) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs font-mono text-gray-400 mt-1">{playerFleetStatus.hull}/{playerFleetStatus.maxHull} Hull</div>
                                </div>
                            </div>

                            {/* Dice Area (Center) */}
                            <div className="flex flex-col items-center justify-center w-32 md:w-48 h-32">
                                {combatResult ? (
                                    <div className={`text-4xl md:text-6xl font-black uppercase tracking-widest transform -rotate-6 animate-in zoom-in duration-500 ${combatResult === 'victory' ? 'text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]'}`}>
                                        {combatResult}
                                    </div>
                                ) : (
                                    <>
                                        {turnIndicator && (
                                            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500 animate-pulse">
                                                {turnIndicator === 'player' ? "Your Turn" : "Enemy Turn"}
                                            </div>
                                        )}
                                        <div className="flex gap-4">
                                            {currentDice.map((d, i) => (
                                                <Die key={i} value={d} isRolling={isRolling} color={turnIndicator === 'player' ? 'blue' : 'red'} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Enemy Side */}
                             <div className={`flex flex-col items-center gap-4 transition-transform duration-100 ${triggerEnemyHit ? 'animate-shake' : ''}`}>
                                <div className={`relative ${triggerEnemyHit ? 'animate-flash-red' : ''}`}>
                                     <div className="w-24 h-24 md:w-32 md:h-32 bg-red-900/20 rounded-full border-4 border-red-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                                        {enemyStatus.name.includes("G.C.D.S") ? <Skull size={48} className="text-red-500" /> : <ShieldAlert size={48} className="text-red-500" />}
                                     </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-red-400 text-lg md:text-2xl">{enemyStatus.name}</div>
                                    <div className="w-32 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className="h-full bg-red-500 transition-all duration-500" 
                                            style={{ width: `${Math.max(0, (enemyStatus.hull / enemyStatus.maxHull) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs font-mono text-gray-400 mt-1">{enemyStatus.hull}/{enemyStatus.maxHull} Hull</div>
                                </div>
                            </div>
                        </div>

                        {/* Combat Log */}
                        <div ref={combatScrollRef} className="h-48 bg-space-900/80 border-t border-gray-700 p-4 font-mono text-xs md:text-sm overflow-y-auto space-y-1">
                            {combatLogs.map((log, i) => (
                                <div key={i} className={`
                                    ${log.type === 'player' ? 'text-blue-300' : log.type === 'enemy' ? 'text-red-300' : 'text-gray-400 italic'}
                                `}>
                                    <span className="opacity-50 mr-2">[{log.round}]</span>
                                    {log.message}
                                </div>
                            ))}
                        </div>
                   </div>
              </div>
           </div>
      )}
    </div>
  );
};

export default App;
