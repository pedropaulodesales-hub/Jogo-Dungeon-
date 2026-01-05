
import React from 'react';
import { Skill, PlayerClass, Attributes } from './types';

// Using a high-quality static background that matches the description (Stone archway, torch, blue light)
export const STATIC_DUNGEON_IMAGE = "https://img.itch.zone/aW1hZ2UvMjczMjczNC8xNjMwMDMzMC5qcGc=/original/wKkUAM.jpg"; 

export const CLASS_DATA: Record<PlayerClass, {
  name: string;
  description: string;
  attributes: Attributes;
  hp: number;
  mp: number;
  atk: number;
  mag: number;
  def: number;
  crit: number;
  icon: string;
  skills: string[];
}> = {
  WARRIOR: {
    name: 'Warrior',
    description: 'Balanced melee fighter with strong defense and reliable damage.',
    attributes: { str: 14, dex: 10, vit: 12, int: 6, cha: 8 },
    hp: 140, mp: 53, atk: 20, mag: 12, def: 7, crit: 5,
    icon: '🛡️',
    skills: ['strike', 'bash']
  },
  ROGUE: {
    name: 'Rogue',
    description: 'Agile assassin with high critical hits and evasion.',
    attributes: { str: 8, dex: 16, vit: 8, int: 8, cha: 10 },
    hp: 108, mp: 65, atk: 15, mag: 15, def: 5, crit: 15,
    icon: '🗡️',
    skills: ['strike', 'poison_tip']
  },
  MAGE: {
    name: 'Mage',
    description: 'Arcane master dealing devastating magical damage.',
    attributes: { str: 5, dex: 8, vit: 6, int: 18, cha: 8 },
    hp: 92, mp: 125, atk: 10, mag: 30, def: 3, crit: 4,
    icon: '🔮',
    skills: ['nova', 'freeze']
  },
  CLERIC: {
    name: 'Cleric',
    description: 'Divine healer with supportive magic and holy power.',
    attributes: { str: 8, dex: 8, vit: 12, int: 14, cha: 10 },
    hp: 140, mp: 101, atk: 13, mag: 24, def: 5, crit: 4,
    icon: '✨',
    skills: ['smite', 'ward']
  },
  BARBARIAN: {
    name: 'Barbarian',
    description: 'Unstoppable berserker with massive health and brutal attacks.',
    attributes: { str: 18, dex: 8, vit: 14, int: 4, cha: 6 },
    hp: 156, mp: 41, atk: 23, mag: 9, def: 9, crit: 4,
    icon: '🪓',
    skills: ['strike', 'enrage']
  },
  ARCHER: {
    name: 'Archer',
    description: 'Precision marksman with deadly accuracy and range.',
    attributes: { str: 10, dex: 18, vit: 8, int: 6, cha: 8 },
    hp: 108, mp: 53, atk: 18, mag: 12, def: 5, crit: 6,
    icon: '🏹',
    skills: ['strike', 'cripple']
  }
};

export const SKILL_LIBRARY: Record<string, Skill> = {
  strike: {
    id: 'strike',
    name: 'Runic Strike',
    description: 'A focused mana-infused blow.',
    manaCost: 8,
    cooldown: 3500,
    damageMult: 1.6,
    lastUsed: 0,
    icon: '⚔️'
  },
  bash: {
    id: 'bash',
    name: 'Shield Bash',
    description: 'Slams the enemy, possibly stunning them.',
    manaCost: 15,
    cooldown: 8000,
    damageMult: 1.2,
    lastUsed: 0,
    icon: '🛡️',
    applyEffect: { type: 'STUN', duration: 2500, value: 1, chance: 0.6 }
  },
  poison_tip: {
    id: 'poison_tip',
    name: 'Venom Blade',
    description: 'Coats weapon in poison.',
    manaCost: 12,
    cooldown: 6000,
    damageMult: 1.1,
    lastUsed: 0,
    icon: '🧪',
    applyEffect: { type: 'POISON', duration: 8000, value: 5, chance: 1.0 }
  },
  nova: {
    id: 'nova',
    name: 'Spirit Nova',
    description: 'Explosive mana release.',
    manaCost: 22,
    cooldown: 9000,
    damageMult: 2.4,
    lastUsed: 0,
    icon: '🔥',
    applyEffect: { type: 'BURN', duration: 4000, value: 8, chance: 0.5 }
  },
  freeze: {
    id: 'freeze',
    name: 'Glacial Spike',
    description: 'Chills the enemy, slowing their actions.',
    manaCost: 18,
    cooldown: 7000,
    damageMult: 1.8,
    lastUsed: 0,
    icon: '❄️',
    applyEffect: { type: 'SLOW', duration: 6000, value: 0.5, chance: 0.8 }
  },
  smite: {
    id: 'smite',
    name: 'Holy Smite',
    description: 'Calls down light to burn the wicked.',
    manaCost: 15,
    cooldown: 5000,
    damageMult: 1.9,
    lastUsed: 0,
    icon: '⚡',
    applyEffect: { type: 'BURN', duration: 3000, value: 10, chance: 0.4 }
  },
  enrage: {
    id: 'enrage',
    name: 'Furious Blow',
    description: 'A reckless attack that ignores pain.',
    manaCost: 10,
    cooldown: 4000,
    damageMult: 2.2,
    lastUsed: 0,
    icon: '😡'
  },
  cripple: {
    id: 'cripple',
    name: 'Leg Shot',
    description: 'Aims for mobility to slow the target.',
    manaCost: 12,
    cooldown: 6000,
    damageMult: 1.4,
    lastUsed: 0,
    icon: '🦵',
    applyEffect: { type: 'SLOW', duration: 5000, value: 0.4, chance: 1.0 }
  },
  ward: {
    id: 'ward',
    name: 'Runic Ward',
    description: 'Restores 15 Mana instantly and clears effects.',
    manaCost: 0,
    cooldown: 15000,
    damageMult: 0,
    lastUsed: 0,
    icon: '💠'
  }
};

export const BIOMES = [
  'Whispering Crypts',
  'Iron Spires of Aethelgard',
  'Sanguine Halls',
  'Void Rift Delta',
  'Cursed Library of Irem',
  'Infernal Foundations'
];

export const ORNATE_BORDER = (
  <div className="absolute inset-0 pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-slate-500 opacity-40"></div>
    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-500 opacity-40"></div>
    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-slate-500 opacity-40"></div>
    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-slate-500 opacity-40"></div>
    
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-slate-900 text-[10px] text-slate-600 exocet-font animate-pulse-rune">᚛ ᛟ ᚜</div>
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 bg-slate-900 text-[10px] text-slate-600 exocet-font animate-pulse-rune">᚛ ᚦ ᚜</div>
    
    <div className="absolute inset-1 border border-slate-800/50 pointer-events-none"></div>
  </div>
);

export const RUNE_GLYPHS = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚻ", "ᚼ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛋ", "ᛏ", "ᛒ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];
