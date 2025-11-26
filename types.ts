
export enum ResourceType {
  Money = 'Money',
  Science = 'Science',
  Materials = 'Materials',
}

export enum TechCategory {
  Military = 'Military', // Red
  Grid = 'Grid',         // Blue
  Nano = 'Nano',         // Green
}

export interface Tech {
  id: string;
  name: string;
  category: TechCategory;
  cost: number;
  description: string;
  unlocked: boolean;
  prerequisite?: string; // ID of the tech required before this one
}

export enum ShipType {
  Interceptor = 'Interceptor',
  Cruiser = 'Cruiser',
  Dreadnought = 'Dreadnought',
}

export interface ShipPart {
  id: string;
  name: string;
  type: 'Weapon' | 'Defense' | 'Support' | 'Drive';
  cost: number; // Material Cost
  reqTech?: string; // Tech ID required
  stats: {
    hull?: number;
    initiative?: number;
    movement?: number;
    damage?: number;
  };
  special?: 'Missile' | 'Ion' | 'Plasma' | 'Shield';
  description: string;
}

export interface ShipBlueprint {
  type: ShipType;
  slots: number;
  installedParts: (string | null)[]; // Array of Part IDs or null if empty
  baseHull: number;
  baseInitiative: number;
  baseMovement: number;
  baseDamage: number;
  cost: number;
}

export interface Fleet {
  id: string;
  ownerId: number | 'enemy'; // Number corresponds to Player Index, 'enemy' is AI
  hexId: string; // Location
  ships: {
    [key in ShipType]: number;
  };
}

export interface Hex {
  q: number; // Axial coordinate q
  r: number; // Axial coordinate r
  id: string;
  name: string;
  type: 'Core' | 'Inner' | 'Middle' | 'Outer' | 'Start';
  resources: ResourceType[];
  ownerId: number | null; // Index of the player who controls this, or null
  hasEnemy: boolean;
  hasArtifact: boolean;
  isGCDS: boolean;
  description?: string;
  revealed: boolean;
  structure: 'Starbase' | 'Monolith' | null;
  population: number; // Number of cubes on this planet
}

export enum GamePhase {
  Setup = 'Setup',
  Action = 'Action Phase',
  Combat = 'Combat Phase',
  Maintenance = 'Maintenance Phase',
  Cleanup = 'Cleanup Phase',
}

export interface Player {
  id: number;
  name: string;
  color: string; // Tailwind color class key (e.g., 'blue', 'orange')
  resources: {
    [key in ResourceType]: number;
  };
  income: {
    [key in ResourceType]: number;
  };
  influence: {
    current: number;
    max: number;
  };
  inventory: {
    population: number; 
    colonyShips: number; 
    starbases: number; 
  };
  reputation: number[];
  victoryPoints: number;
  techs: Tech[];
  blueprints: { [key in ShipType]: ShipBlueprint };
}

export interface GameState {
  round: number; // 1 to 9
  phase: GamePhase;
  players: Player[];
  activePlayerIndex: number; // Whose turn is it?
  fleets: Fleet[];
  map: Hex[];
  actionsTaken: number;
}
