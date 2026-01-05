
export enum EncounterType {
  BATTLE = 'BATTLE',
  TREASURE = 'TREASURE',
  TRAP = 'TRAP',
  MERCHANT = 'MERCHANT',
  PUZZLE = 'PUZZLE',
  SECRET = 'SECRET',
  STORY = 'STORY',
  REST = 'REST'
}

export type PlayerClass = 'WARRIOR' | 'ROGUE' | 'MAGE' | 'CLERIC' | 'BARBARIAN' | 'ARCHER';

export interface Attributes {
  str: number;
  dex: number;
  vit: number;
  int: number;
  cha: number;
}

export type StatusType = 'POISON' | 'BURN' | 'STUN' | 'SLOW' | 'REGEN' | 'WEAKNESS';

export interface StatusEffect {
  id: string;
  type: StatusType;
  duration: number; // in milliseconds
  value: number; // damage amount, slow percentage, etc.
  source: 'PLAYER' | 'ENEMY';
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldown: number; // in milliseconds
  damageMult: number;
  lastUsed: number;
  icon: string;
  applyEffect?: {
      type: StatusType;
      duration: number;
      value: number;
      chance: number; // 0-1
  };
}

export type EquipmentSlot = 'HELM' | 'CHEST' | 'GLOVES' | 'BOOTS' | 'OFFHAND' | 'AMULET' | 'BELT' | 'RING1' | 'RING2' | 'WEAPON';
export type ItemType = 'HELM' | 'CHEST' | 'GLOVES' | 'BOOTS' | 'OFFHAND' | 'AMULET' | 'BELT' | 'RING' | 'WEAPON' | 'POTION';
export type ArmorWeight = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'NONE';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  value: number;
  description: string;
  weightClass: ArmorWeight;
  classRestrictions?: PlayerClass[];
  stats?: {
    atk?: number;
    def?: number;
    hp?: number;
    mana?: number;
    mag?: number;
    crit?: number;
    dodge?: number;
    str?: number;
    dex?: number;
    int?: number;
    vit?: number;
    cha?: number;
  };
  effect?: {
    type: 'HEAL' | 'MANA';
    value: number;
  };
  icon?: string;
}

export interface Character {
  name: string;
  classType: PlayerClass;
  level: number;
  xp: number;
  xpToNext: number;
  maxHp: number;
  hp: number;
  maxMana: number;
  mana: number;
  attack: number;
  magic: number;
  defense: number;
  crit: number; // percentage
  gold: number;
  attributes: Attributes;
  inventory: Item[];
  equipment: Record<EquipmentSlot, Item | null>;
  statusEffects: StatusEffect[];
}

export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  speed: number;
  rewardXp: number;
  rewardGold: number;
  imagePrompt: string;
  statusEffects: StatusEffect[];
}

export interface Room {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  encounterType: EncounterType;
  depth: number;
  choices: PathChoice[];
  encounterData?: {
    merchantStock?: Item[];
    loot?: Item[];
    goldReward?: number;
    puzzleSolved?: boolean;
    secretFound?: boolean;
    chestOpened?: boolean;
    trapDisarmed?: boolean;
  }; 
  x: number;
  y: number;
}

export interface PathChoice {
  label: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  dx: number;
  dy: number;
}

export interface GameState {
  character: Character;
  currentRoom: Room | null;
  history: string[];
  isCombatActive: boolean;
  currentEnemy: Enemy | null;
  logs: string[];
}
