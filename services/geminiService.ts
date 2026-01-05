
import { Room, EncounterType, Enemy, PathChoice, Item, ItemType, ArmorWeight, PlayerClass } from "../types";
import { STATIC_DUNGEON_IMAGE } from "../constants";

// --- PROCEDURAL GENERATION DATA ---

const ADJECTIVES = [
  "Dark", "Ancient", "Crumbling", "Whispering", "Forgotten", "Bloodstained", 
  "Silent", "Echoing", "Frozen", "Burning", "Cursed", "Hollow", "Shattered", 
  "Abyssal", "Mossy", "Iron", "Obsidian", "Spectral", "Venomous", "Gilded", 
  "Hidden", "Opulent"
];

const NOUNS = [
  "Chamber", "Hall", "Corridor", "Crypt", "Sanctum", "Passage", "Oubliette", 
  "Archives", "Vault", "Bridge", "Atrium", "Dungeon", "Catacomb", "Prison", 
  "Gallery", "Nave", "Cloister", "Sepulcher", "Market", "Alcove", "Study"
];

const FLAVOR_TEXTS = [
  "The air is thick with the metallic scent of old blood.",
  "Dust motes dance in the pale light of a single flickering torch.",
  "You hear the distant scratching of claws against stone.",
  "A cold draft chills you to the bone, carrying whispers of the dead.",
  "Shadows seem to lengthen and grasp at your feet as you walk.",
  "Ancient runes glow faintly on the walls, pulsing with a sick light.",
  "The silence here is oppressive, heavy like a physical weight.",
  "Water drips rhythmically from the ceiling, echoing in the darkness.",
  "Bones litter the floor, remnants of those who came before.",
  "A strange violet mist clings to the ground.",
  "Tattered tapestries depicting forgotten wars hang from the walls.",
  "The smell of incense and rot mingles in the air."
];

const MERCHANT_FLAVOR = [
  "A hooded figure sits by a campfire, wares spread on a rug.",
  "A goblin merchant grins, displaying gold teeth and strange potions.",
  "An ethereal spirit offers spectral goods for a price.",
  "A wandering blacksmith sharpens a blade, nodding as you approach."
];

const SECRET_FLAVOR = [
  "A draft from behind a bookshelf reveals a hidden passage.",
  "You notice the mortar on this wall is fresh. A loose brick gives way.",
  "Illusionary magic fades, revealing a door where none stood before.",
  "A false floor panel clicks beneath your boot."
];

const PUZZLE_FLAVOR = [
  "A massive stone door stands shut, lacking a keyhole but covered in movable tiles.",
  "Statues line the walls, their heads turned in different directions.",
  "A pool of water reflects a constellation that does not exist in the sky.",
  "Runes carved into the floor glow when stepped on in sequence."
];

const ENEMY_PREFIXES = ["Cursed", "Feral", "Undead", "Void", "Armored", "Skeletal", "Ragebound", "Shadow", "Plague", "Infernal", "Elite"];
const ENEMIES = ["Skeleton", "Spider", "Cultist", "Rat", "Golem", "Wraith", "Bandit", "Horror", "Knight", "Beast", "Sorcerer"];

const PATH_DESCRIPTIONS = [
  "A narrow passage winding into gloom.",
  "A heavy iron door, slightly ajar and creaking.",
  "A crumbling archway leading into darkness.",
  "A well-lit corridor with strange markings.",
  "A steep staircase ascending into mist.",
  "A rough-hewn tunnel that smells of sulfur.",
  "A grand doorway flanked by gargoyles.",
  "A path slick with moss and water.",
  "A corridor echoing with distant chimes."
];

// --- ADVANCED ITEM GENERATION CONFIG ---

// Affixes modify name and stats
const PREFIXES = [
  { name: "Broken", stat: "atk", mod: 0.5, rarity: "COMMON" },
  { name: "Rusted", stat: "def", mod: 0.6, rarity: "COMMON" },
  { name: "Dull", stat: "atk", mod: 0.8, rarity: "COMMON" },
  { name: "Iron", stat: "def", mod: 1.0, rarity: "COMMON" },
  { name: "Steel", stat: "atk", mod: 1.1, rarity: "UNCOMMON" },
  { name: "Reinforced", stat: "def", mod: 1.2, rarity: "UNCOMMON" },
  { name: "Serrated", stat: "atk", mod: 1.2, rarity: "UNCOMMON" },
  { name: "Hardened", stat: "def", mod: 1.3, rarity: "RARE" },
  { name: "Mithril", stat: "mag", mod: 1.3, rarity: "RARE" },
  { name: "Adamant", stat: "def", mod: 1.5, rarity: "RARE" },
  { name: "Void-Forged", stat: "atk", mod: 1.6, rarity: "LEGENDARY" },
  { name: "Divine", stat: "mag", mod: 1.6, rarity: "LEGENDARY" },
  { name: "Runebound", stat: "mana", mod: 20, isFlat: true, rarity: "RARE" }
];

const SUFFIXES = [
  { name: "of the Bear", stat: "vit", mod: 2, rarity: "UNCOMMON" },
  { name: "of the Owl", stat: "int", mod: 2, rarity: "UNCOMMON" },
  { name: "of the Wolf", stat: "dex", mod: 2, rarity: "UNCOMMON" },
  { name: "of the Bull", stat: "str", mod: 2, rarity: "UNCOMMON" },
  { name: "of Vitality", stat: "hp", mod: 20, rarity: "COMMON" },
  { name: "of Power", stat: "atk", mod: 3, rarity: "RARE" },
  { name: "of Swiftness", stat: "crit", mod: 2, rarity: "RARE" },
  { name: "of the Void", stat: "mag", mod: 4, rarity: "LEGENDARY" },
  { name: "of Kings", stat: "cha", mod: 3, rarity: "RARE" },
];

const UNIQUE_ITEMS: Partial<Item>[] = [
    { name: "Widowmaker", type: "WEAPON", rarity: "LEGENDARY", description: "A crimson blade that seems to weep blood.", icon: "🗡️", stats: { atk: 45, crit: 10, str: 5 } },
    { name: "Aegis of the Immortals", type: "OFFHAND", rarity: "LEGENDARY", description: "A shield polished to a mirror sheen, deflecting fate itself.", icon: "🛡️", stats: { def: 30, hp: 100, vit: 8 } },
    { name: "Crown of Madness", type: "HELM", rarity: "LEGENDARY", description: "Whispers fill the mind of whoever wears this jagged circlet.", icon: "👑", stats: { mag: 25, int: 10, mana: 50, def: -5 } },
    { name: "Boots of Haste", type: "BOOTS", rarity: "RARE", description: "You feel lighter on your feet.", icon: "👢", stats: { dex: 5, dodge: 10, def: 5 } },
    { name: "Ring of Greed", type: "RING", rarity: "UNCOMMON", description: "A gold band that feels heavy.", icon: "💍", stats: { cha: 5, crit: 2 } },
    { name: "Tome of Lost Knowledge", type: "OFFHAND", rarity: "RARE", description: "Pages filled with shifting runes.", icon: "📖", stats: { mag: 15, int: 8, mana: 30 } }
];

const ARMOR_DATA = {
    LIGHT: {
        HELM: ["Hood", "Cap", "Mask", "Cowl"],
        CHEST: ["Tunic", "Vest", "Jerkin", "Robes"],
        GLOVES: ["Wraps", "Gloves", "Handguards"],
        BOOTS: ["Sandals", "Shoes", "Boots", "Walkers"]
    },
    MEDIUM: {
        HELM: ["Coif", "Sallet", "Helm"],
        CHEST: ["Chainmail", "Brigandine", "Scale"],
        GLOVES: ["Vambraces", "Mitts"],
        BOOTS: ["Greaves", "Striders"]
    },
    HEAVY: {
        HELM: ["Greathelm", "Visor", "Bascinet"],
        CHEST: ["Plate", "Cuirass", "Breastplate"],
        GLOVES: ["Gauntlets", "Fists"],
        BOOTS: ["Sabatons", "Iron Boots"]
    }
};

const WEAPON_DATA: Record<PlayerClass, string[]> = {
    WARRIOR: ["Longsword", "Broadsword", "Mace", "Waraxe"],
    BARBARIAN: ["Greataxe", "Maul", "Zweihander", "Club"],
    MAGE: ["Staff", "Wand", "Scepter", "Rod"],
    CLERIC: ["Morningstar", "Hammer", "Censer", "Staff"],
    ROGUE: ["Dagger", "Kris", "Shortsword", "Kukri"],
    ARCHER: ["Shortbow", "Longbow", "Crossbow", "Recurve"]
};

const ACCESSORY_NAMES = {
    AMULET: ["Amulet", "Pendant", "Necklace", "Talisman", "Charm"],
    BELT: ["Belt", "Sash", "Girdle", "Cinch", "Waistguard"],
    RING: ["Ring", "Band", "Signet", "Loop", "Coil"]
};

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- LOOT GENERATION LOGIC ---

export function generateLoot(depth: number, source: 'CHEST' | 'ENEMY' | 'BOSS' | 'MERCHANT'): Item[] {
    const drops: Item[] = [];
    let count = 0;

    // Determine count based on source
    if (source === 'BOSS') count = Math.floor(Math.random() * 3) + 2; // 2-4 items
    else if (source === 'CHEST') count = Math.floor(Math.random() * 2) + 1; // 1-2 items
    else if (source === 'MERCHANT') count = 4;
    else count = Math.random() < 0.4 ? 1 : 0; // 40% chance for trash mobs

    for (let i = 0; i < count; i++) {
        const uniqueRoll = Math.random();
        // Higher unique chance for bosses or high depth
        const uniqueThreshold = source === 'BOSS' ? 0.15 : 0.02 + (depth * 0.005);
        
        if (uniqueRoll < uniqueThreshold) {
            const template = getRandom(UNIQUE_ITEMS);
            drops.push({
                ...template,
                id: Math.random().toString(36).substr(2, 9),
                value: (template.value || 200) + (depth * 50),
                type: template.type as ItemType,
                rarity: 'LEGENDARY',
                weightClass: 'NONE', // Simplified for uniques
            } as Item);
        } else {
            drops.push(generateProceduralItem(depth, source));
        }
    }
    
    return drops;
}

function generateProceduralItem(depth: number, source: string): Item {
    const isPotion = Math.random() < 0.20;
    
    // POTION LOGIC
    if (isPotion) {
        const isHealth = Math.random() > 0.5;
        const tier = Math.min(3, Math.floor(depth / 3) + 1);
        const size = tier === 1 ? 'Minor' : tier === 2 ? 'Regular' : 'Greater';
        return {
            id: Math.random().toString(36).substr(2, 9),
            name: `${size} ${isHealth ? 'Health' : 'Mana'} Potion`,
            type: 'POTION',
            rarity: 'COMMON',
            value: 15 * tier,
            description: `Restores ${tier * 40} ${isHealth ? 'HP' : 'Mana'}.`,
            weightClass: 'NONE',
            effect: { type: isHealth ? 'HEAL' : 'MANA', value: tier * 40 },
            icon: isHealth ? '🧪' : '⚗️'
        };
    }

    // GEAR LOGIC
    // 1. Determine Rarity Base
    const rarityRoll = Math.random() + (depth * 0.05) + (source === 'BOSS' ? 0.3 : 0);
    let rarity: Item['rarity'] = 'COMMON';
    let statMult = 1;
    let affixCount = 0;

    if (rarityRoll > 0.98) { rarity = 'LEGENDARY'; statMult = 3; affixCount = 2; }
    else if (rarityRoll > 0.8) { rarity = 'RARE'; statMult = 2; affixCount = 2; }
    else if (rarityRoll > 0.5) { rarity = 'UNCOMMON'; statMult = 1.5; affixCount = 1; }

    // 2. Determine Slot
    const slotRoll = Math.random();
    let type: ItemType;
    let baseName = "";
    let icon = "📦";
    let weightClass: ArmorWeight = 'NONE';
    const stats: Item['stats'] = {};
    let classRestrictions: PlayerClass[] | undefined;

    const baseVal = Math.floor((3 + depth * 1.5) * statMult);

    if (slotRoll < 0.3) {
        // Weapon
        type = 'WEAPON';
        const classes = Object.keys(WEAPON_DATA) as PlayerClass[];
        const targetClass = getRandom(classes);
        classRestrictions = [targetClass];
        baseName = getRandom(WEAPON_DATA[targetClass]);
        stats.atk = Math.floor(baseVal * 2);
        icon = '⚔️';
    } else if (slotRoll < 0.7) {
        // Armor
        const slots: ItemType[] = ['HELM', 'CHEST', 'GLOVES', 'BOOTS'];
        type = getRandom(slots);
        
        const wRoll = Math.random();
        if (wRoll < 0.33) {
            weightClass = 'LIGHT';
            baseName = getRandom(ARMOR_DATA.LIGHT[type as keyof typeof ARMOR_DATA.LIGHT]);
            stats.def = Math.floor(baseVal * 0.5);
            stats.dodge = Math.floor(baseVal * 0.2);
        } else if (wRoll < 0.66) {
            weightClass = 'MEDIUM';
            baseName = getRandom(ARMOR_DATA.MEDIUM[type as keyof typeof ARMOR_DATA.MEDIUM]);
            stats.def = Math.floor(baseVal * 0.8);
            stats.hp = Math.floor(baseVal * 2);
        } else {
            weightClass = 'HEAVY';
            baseName = getRandom(ARMOR_DATA.HEAVY[type as keyof typeof ARMOR_DATA.HEAVY]);
            stats.def = Math.floor(baseVal * 1.2);
        }

        if (type === 'HELM') icon = '⛑️';
        if (type === 'CHEST') icon = '👕';
        if (type === 'GLOVES') icon = '🧤';
        if (type === 'BOOTS') icon = '👢';
    } else if (slotRoll < 0.9) {
        // Accessory
        const slots: ItemType[] = ['AMULET', 'BELT', 'RING'];
        type = getRandom(slots);
        baseName = getRandom(ACCESSORY_NAMES[type as keyof typeof ACCESSORY_NAMES]);
        if (type === 'AMULET') { stats.int = Math.floor(baseVal * 0.3); icon = '📿'; }
        if (type === 'BELT') { stats.vit = Math.floor(baseVal * 0.3); icon = '🎗️'; }
        if (type === 'RING') { stats.crit = Math.floor(Math.random() * 2) + 1; icon = '💍'; }
    } else {
        type = 'OFFHAND';
        baseName = "Shield";
        stats.def = baseVal;
        icon = '🛡️';
    }

    // 3. Apply Affixes
    let finalName = baseName;
    
    // Add Prefix (if allowed)
    if (affixCount > 0 && Math.random() > 0.3) {
        const validPrefixes = PREFIXES.filter(p => p.rarity === 'COMMON' || (rarity !== 'COMMON'));
        const prefix = getRandom(validPrefixes);
        finalName = `${prefix.name} ${finalName}`;
        
        // Apply Mod
        const statKey = prefix.stat as keyof typeof stats;
        const currentVal = stats[statKey] || 0;
        if (prefix.isFlat) {
             stats[statKey] = currentVal + prefix.mod;
        } else {
             // If stat exists, multiply. If not (e.g. adding atk to boots), add base amount
             stats[statKey] = currentVal > 0 ? Math.floor(currentVal * prefix.mod) : Math.floor(baseVal * 0.3);
        }
        
        // Sometimes upgrade rarity if prefix is cool
        if (prefix.rarity === 'LEGENDARY') rarity = 'LEGENDARY';
    }

    // Add Suffix (if allowed)
    if (affixCount > 1 || (affixCount === 1 && finalName === baseName)) {
        const validSuffixes = SUFFIXES.filter(s => s.rarity === 'COMMON' || (rarity !== 'COMMON'));
        const suffix = getRandom(validSuffixes);
        finalName = `${finalName} ${suffix.name}`;
        
        const statKey = suffix.stat as keyof typeof stats;
        const currentVal = stats[statKey] || 0;
        stats[statKey] = currentVal + (suffix.mod < 10 ? suffix.mod : suffix.mod); // Simply add for attributes
    }

    return {
        id: Math.random().toString(36).substr(2, 9),
        name: finalName,
        type,
        rarity,
        value: Math.floor(baseVal * 10),
        description: `A ${rarity.toLowerCase()} item.`,
        weightClass,
        classRestrictions,
        stats,
        icon
    };
}

// --- ROOM & ENEMY GENERATION WRAPPERS ---

export async function generateInitialRoom(biome: string, depth: number): Promise<Room> {
  return generateNextRoom({ 
      id: "start", 
      title: "Entrance Hall", 
      description: "The heavy doors slam shut behind you. There is no turning back.", 
      imageUrl: STATIC_DUNGEON_IMAGE, 
      encounterType: EncounterType.STORY, 
      depth: 0, 
      choices: [],
      x: 0,
      y: 0
  }, 0, 0, biome, 'LOW');
}

export async function generateNextRoom(
    prevRoom: Room | null, 
    x: number, 
    y: number, 
    biome: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
): Promise<Room> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const depth = prevRoom ? prevRoom.depth + 1 : 1;
  const title = `${getRandom(ADJECTIVES)} ${getRandom(NOUNS)}`;
  let description = getRandom(FLAVOR_TEXTS);
  
  const rand = Math.random();
  let encounterType = EncounterType.BATTLE; 

  if (riskLevel === 'HIGH') {
      if (rand < 0.50) encounterType = EncounterType.BATTLE;
      else if (rand < 0.70) encounterType = EncounterType.TRAP;
      else if (rand < 0.90) encounterType = EncounterType.TREASURE;
      else encounterType = EncounterType.SECRET;
  } else if (riskLevel === 'LOW') {
      if (rand < 0.20) encounterType = EncounterType.BATTLE;
      else if (rand < 0.50) encounterType = EncounterType.MERCHANT;
      else if (rand < 0.70) encounterType = EncounterType.PUZZLE;
      else if (rand < 0.90) encounterType = EncounterType.SECRET;
      else encounterType = EncounterType.TREASURE;
  } else {
      if (rand < 0.40) encounterType = EncounterType.BATTLE;
      else if (rand < 0.55) encounterType = EncounterType.TRAP;
      else if (rand < 0.70) encounterType = EncounterType.PUZZLE;
      else if (rand < 0.85) encounterType = EncounterType.TREASURE;
      else encounterType = EncounterType.MERCHANT;
  }

  let encounterData: Room['encounterData'] = {};

  if (encounterType === EncounterType.MERCHANT) {
      description = getRandom(MERCHANT_FLAVOR);
      encounterData.merchantStock = generateLoot(depth, 'MERCHANT');
  } else if (encounterType === EncounterType.TREASURE) {
      description = "A magnificent chest sits in the center of the room.";
      encounterData.loot = generateLoot(depth, 'CHEST');
      encounterData.goldReward = Math.floor(Math.random() * 50 * depth) + 50;
      encounterData.chestOpened = false;
  } else if (encounterType === EncounterType.PUZZLE) {
      description = getRandom(PUZZLE_FLAVOR);
      encounterData.puzzleSolved = false;
  } else if (encounterType === EncounterType.SECRET) {
      description = getRandom(SECRET_FLAVOR);
      encounterData.secretFound = false;
      encounterData.goldReward = Math.floor(Math.random() * 100 * depth) + 100;
  } else if (encounterType === EncounterType.TRAP) {
      description = "The floor here is uneven, and small holes line the walls.";
      encounterData.trapDisarmed = false;
  }

  const directions = [
    { label: "North", dx: 0, dy: -1 },
    { label: "South", dx: 0, dy: 1 },
    { label: "East", dx: 1, dy: 0 },
    { label: "West", dx: -1, dy: 0 }
  ];

  let selectedDirs: typeof directions = [];
  let requiredDirIndex = -1;
  if (prevRoom) {
      const backDx = prevRoom.x - x;
      const backDy = prevRoom.y - y;
      requiredDirIndex = directions.findIndex(d => d.dx === backDx && d.dy === backDy);
  }

  if (requiredDirIndex !== -1) {
      selectedDirs.push(directions[requiredDirIndex]);
      const pool = directions.filter((_, i) => i !== requiredDirIndex);
      const numExtras = Math.floor(Math.random() * 3) + 1;
      const extras = pool.sort(() => 0.5 - Math.random()).slice(0, numExtras);
      selectedDirs.push(...extras);
  } else {
      const numChoices = Math.floor(Math.random() * 2) + 2; 
      selectedDirs = directions.sort(() => 0.5 - Math.random()).slice(0, numChoices);
  }

  const choices: PathChoice[] = selectedDirs.map(dir => ({
    label: dir.label,
    description: getRandom(PATH_DESCRIPTIONS),
    riskLevel: Math.random() > 0.5 ? 'MEDIUM' : (Math.random() > 0.5 ? 'HIGH' : 'LOW'),
    dx: dir.dx,
    dy: dir.dy
  }));

  return {
    id: Math.random().toString(36).substr(2, 9),
    title,
    description,
    imageUrl: STATIC_DUNGEON_IMAGE,
    encounterType,
    depth,
    choices,
    encounterData,
    x,
    y
  };
}

export async function generateEnemy(biome: string, depth: number): Promise<Enemy> {
  const name = `${getRandom(ENEMY_PREFIXES)} ${getRandom(ENEMIES)}`;
  const baseHp = 40 + (depth * 15);
  const baseAtk = 8 + (depth * 3);
  
  // Speed Scaling: Roughly 8-20 range to match player's new slower ATB pacing
  const baseSpeed = 8 + (depth * 0.8);
  const randomSpeed = baseSpeed + (Math.random() * 4 - 2);

  return {
    name,
    hp: baseHp,
    maxHp: baseHp,
    attack: baseAtk,
    speed: Math.max(5, Math.floor(randomSpeed)),
    rewardXp: 30 + (depth * 10),
    rewardGold: 15 + (depth * 5),
    imagePrompt: "",
    statusEffects: []
  };
}

export async function generateDungeonImage(prompt: string): Promise<string> {
  return STATIC_DUNGEON_IMAGE;
}
