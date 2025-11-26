
import { GameState, GamePhase, ResourceType, TechCategory, ShipType, Tech, Hex, ShipBlueprint, ShipPart, Player } from './types';

export const INITIAL_TECHS: Tech[] = [
  // Military (Linear Progression)
  { id: 'm1', name: 'Plasma Physics', category: TechCategory.Military, cost: 3, description: 'Unlock Plasma Cannons (Dmg Bonus)', unlocked: false },
  { id: 'm2', name: 'Ballistics', category: TechCategory.Military, cost: 4, description: 'Unlock Ion Cannons (Anti-Shield)', unlocked: false, prerequisite: 'm1' },
  { id: 'm3', name: 'Missile Tech', category: TechCategory.Military, cost: 5, description: 'Unlock Guided Missiles (Reroll 1s)', unlocked: false, prerequisite: 'm2' },
  { id: 'm4', name: 'Antimatter', category: TechCategory.Military, cost: 8, description: 'Unlock Mass Bombardment', unlocked: false, prerequisite: 'm3' },
  
  // Grid (Linear Progression)
  { id: 'g1', name: 'Power Sources', category: TechCategory.Grid, cost: 3, description: 'Unlock Fusion Reactor (Energy)', unlocked: false },
  { id: 'g2', name: 'Quantum Comp', category: TechCategory.Grid, cost: 4, description: 'Unlock Target Comp (Initiative)', unlocked: false, prerequisite: 'g1' },
  { id: 'g3', name: 'Deflectors', category: TechCategory.Grid, cost: 5, description: 'Unlock Shield Generators', unlocked: false, prerequisite: 'g2' },
  { id: 'g4', name: 'Warp Drives', category: TechCategory.Grid, cost: 6, description: 'Unlock Warp Drive (+1 Move)', unlocked: false, prerequisite: 'g3' },

  // Nano (Linear Progression)
  { id: 'n1', name: 'Materials Sci', category: TechCategory.Nano, cost: 3, description: 'Unlock Reinforced Hull (+HP)', unlocked: false },
  { id: 'n2', name: 'Civil Eng', category: TechCategory.Nano, cost: 4, description: 'Mining Bonus (+Materials)', unlocked: false, prerequisite: 'n1' },
  { id: 'n3', name: 'Xenobiology', category: TechCategory.Nano, cost: 5, description: 'Terraforming (+Pop Cap)', unlocked: false, prerequisite: 'n2' },
  { id: 'n4', name: 'Logistics', category: TechCategory.Nano, cost: 6, description: 'Field Repairs', unlocked: false, prerequisite: 'n3' },
];

export const SHIP_PARTS_DB: ShipPart[] = [
  // Weapons
  { id: 'plasma_cannon', name: 'Plasma Cannon', type: 'Weapon', cost: 2, reqTech: 'm1', stats: { damage: 2 }, special: 'Plasma', description: '+2 Damage' },
  { id: 'ion_cannon', name: 'Ion Cannon', type: 'Weapon', cost: 2, reqTech: 'm2', stats: { damage: 1 }, special: 'Ion', description: 'Bypasses Shields' },
  { id: 'missile_launcher', name: 'Missile Launcher', type: 'Weapon', cost: 3, reqTech: 'm3', stats: { damage: 1 }, special: 'Missile', description: '+1 Accuracy' },
  
  // Defense
  { id: 'shield_gen', name: 'Shield Generator', type: 'Defense', cost: 3, reqTech: 'g3', stats: { hull: 1 }, special: 'Shield', description: 'Absorbs 2 Dmg' },
  { id: 'reinforced_hull', name: 'Reinforced Plating', type: 'Defense', cost: 2, reqTech: 'n1', stats: { hull: 3 }, description: '+3 Hull Integrity' },
  
  // Support
  { id: 'target_comp', name: 'Targeting Comp', type: 'Support', cost: 2, reqTech: 'g2', stats: { initiative: 2 }, description: '+2 Initiative' },
  { id: 'fusion_reactor', name: 'Fusion Reactor', type: 'Support', cost: 2, reqTech: 'g1', stats: { initiative: 1 }, description: '+1 Init (Power)' },
  
  // Drives
  { id: 'warp_drive', name: 'Warp Drive', type: 'Drive', cost: 3, reqTech: 'g4', stats: { movement: 1 }, description: '+1 Movement Range' },
];

export const INITIAL_BLUEPRINTS: { [key in ShipType]: ShipBlueprint } = {
  [ShipType.Interceptor]: {
    type: ShipType.Interceptor,
    slots: 2,
    installedParts: [null, null],
    baseHull: 1,
    baseInitiative: 3,
    baseMovement: 2,
    baseDamage: 1,
    cost: 1,
  },
  [ShipType.Cruiser]: {
    type: ShipType.Cruiser,
    slots: 4,
    installedParts: [null, null, null, null],
    baseHull: 2,
    baseInitiative: 2,
    baseMovement: 2,
    baseDamage: 1,
    cost: 3,
  },
  [ShipType.Dreadnought]: {
    type: ShipType.Dreadnought,
    slots: 6,
    installedParts: [null, null, null, null, null, null],
    baseHull: 4,
    baseInitiative: 1,
    baseMovement: 1,
    baseDamage: 1,
    cost: 6,
  },
};

// Player Template Generator
export const createPlayer = (id: number, color: string): Player => ({
  id,
  name: `Commander ${id + 1}`,
  color,
  resources: {
    [ResourceType.Money]: 2,
    [ResourceType.Science]: 3,
    [ResourceType.Materials]: 3,
  },
  income: {
    [ResourceType.Money]: 1,
    [ResourceType.Science]: 1,
    [ResourceType.Materials]: 1,
  },
  influence: {
    current: 16,
    max: 16
  },
  inventory: {
    population: 33,
    colonyShips: 1,
    starbases: 4,
  },
  reputation: [],
  victoryPoints: 0,
  techs: JSON.parse(JSON.stringify(INITIAL_TECHS)), // Deep copy so players have separate trees
  blueprints: JSON.parse(JSON.stringify(INITIAL_BLUEPRINTS)), // Deep copy
});

// Simplified Map Generation for Prototype
// Using Axial Coordinates (q, r)
export const INITIAL_MAP: Hex[] = [
  // Core
  { q: 0, r: 0, id: '001', name: 'Galactic Center', type: 'Core', resources: [], ownerId: null, hasEnemy: true, hasArtifact: true, isGCDS: true, description: 'GCDS Omega Level Threat', revealed: false, structure: null, population: 0 },
  
  // Inner Ring (Radius 1)
  { q: 1, r: 0, id: 'i1', name: 'Alpha Centauri', type: 'Inner', resources: [ResourceType.Money, ResourceType.Materials], ownerId: null, hasEnemy: false, hasArtifact: false, isGCDS: false, revealed: false, structure: null, population: 0 },
  { q: 1, r: -1, id: 'i2', name: 'Barnard Star', type: 'Inner', resources: [ResourceType.Materials, ResourceType.Materials], ownerId: null, hasEnemy: false, hasArtifact: false, isGCDS: false, revealed: false, structure: null, population: 0 },
  { q: 0, r: -1, id: 'i3', name: 'Luyten 726-8', type: 'Inner', resources: [ResourceType.Science, ResourceType.Science], ownerId: null, hasEnemy: false, hasArtifact: false, isGCDS: false, revealed: false, structure: null, population: 0 },
  { q: -1, r: 0, id: 'i4', name: 'Wolf 359', type: 'Inner', resources: [ResourceType.Money], ownerId: null, hasEnemy: false, hasArtifact: false, isGCDS: false, revealed: false, structure: null, population: 0 },
  { q: -1, r: 1, id: 'i5', name: 'Ross 128', type: 'Inner', resources: [ResourceType.Science, ResourceType.Materials], ownerId: null, hasEnemy: false, hasArtifact: false, isGCDS: false, revealed: false, structure: null, population: 0 },
  { q: 0, r: 1, id: 'i6', name: 'Epsilon Eridani', type: 'Inner', resources: [ResourceType.Money, ResourceType.Science, ResourceType.Materials], ownerId: null, hasEnemy: false, hasArtifact: false, isGCDS: false, revealed: false, structure: null, population: 0 },

  // Start Sectors are generated dynamically based on player count in logic
];

export const INITIAL_STATE: GameState = {
  round: 1,
  phase: GamePhase.Setup,
  players: [], // Populated at setup
  activePlayerIndex: 0,
  fleets: [],
  map: INITIAL_MAP,
  actionsTaken: 0,
};
