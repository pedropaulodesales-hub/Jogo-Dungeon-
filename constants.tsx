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
    skills: ['strike', 'ward']
  },
  ROGUE: {
    name: 'Rogue',
    description: 'Agile assassin with high critical hits and evasion.',
    attributes: { str: 8, dex: 16, vit: 8, int: 8, cha: 10 },
    hp: 108, mp: 65, atk: 15, mag: 15, def: 5, crit: 15,
    icon: '🗡️',
    skills: ['strike', 'siphon']
  },
  MAGE: {
    name: 'Mage',
    description: 'Arcane master dealing devastating magical damage.',
    attributes: { str: 5, dex: 8, vit: 6, int: 18, cha: 8 },
    hp: 92, mp: 125, atk: 10, mag: 30, def: 3, crit: 4,
    icon: '🔮',
    skills: ['nova', 'ward']
  },
  CLERIC: {
    name: 'Cleric',
    description: 'Divine healer with supportive magic and holy power.',
    attributes: { str: 8, dex: 8, vit: 12, int: 14, cha: 10 },
    hp: 140, mp: 101, atk: 13, mag: 24, def: 5, crit: 4,
    icon: '✨',
    skills: ['siphon', 'ward']
  },
  BARBARIAN: {
    name: 'Barbarian',
    description: 'Unstoppable berserker with massive health and brutal attacks.',
    attributes: { str: 18, dex: 8, vit: 14, int: 4, cha: 6 },
    hp: 156, mp: 41, atk: 23, mag: 9, def: 9, crit: 4,
    icon: '🪓',
    skills: ['strike', 'nova']
  },
  ARCHER: {
    name: 'Archer',
    description: 'Precision marksman with deadly accuracy and range.',
    attributes: { str: 10, dex: 18, vit: 8, int: 6, cha: 8 },
    hp: 108, mp: 53, atk: 18, mag: 12, def: 5, crit: 6,
    icon: '🏹',
    skills: ['strike', 'siphon']
  }
};

export const SKILL_LIBRARY: Record<string, Skill> = {
  strike: {
    id: 'strike',
    name: 'Runic Strike',
    description: 'A focused mana-infused blow. Deals 160% weapon damage.',
    manaCost: 8,
    cooldown: 3500,
    damageMult: 1.6,
    lastUsed: 0,
    icon: '⚔️'
  },
  nova: {
    id: 'nova',
    name: 'Spirit Nova',
    description: 'Explosive mana release. Deals 240% damage to all nearby essence.',
    manaCost: 22,
    cooldown: 9000,
    damageMult: 2.4,
    lastUsed: 0,
    icon: '❄️'
  },
  siphon: {
    id: 'siphon',
    name: 'Essence Drain',
    description: 'Tear life-force from the enemy. 130% damage and heals for 8% of max HP.',
    manaCost: 14,
    cooldown: 7000,
    damageMult: 1.3,
    lastUsed: 0,
    icon: '🩸'
  },
  ward: {
    id: 'ward',
    name: 'Runic Ward',
    description: 'Envelop yourself in protective runes. Restores 15 Mana instantly.',
    manaCost: 0,
    cooldown: 15000,
    damageMult: 0,
    lastUsed: 0,
    icon: '🛡️'
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