
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

// --- ITEM GENERATION CONFIG ---

const ITEM_PREFIXES = ["Broken", "Rusty", "Iron", "Steel", "Reinforced", "Enchanted", "Runic", "Void", "Divine", "Godly"];

const ARMOR_DATA = {
    LIGHT: {
        HELM: ["Leather Cap", "Hood", "Bandana"],
        CHEST: ["Leather Armor", "Tunic", "Vest"],
        GLOVES: ["Leather Gloves", "Wraps"],
        BOOTS: ["Sandals", "Soft Boots"]
    },
    MEDIUM: {
        HELM: ["Chain Coif", "Soldier Helm"],
        CHEST: ["Chainmail", "Scale Mail", "Breastplate"],
        GLOVES: ["Bracers", "Chain Gloves"],
        BOOTS: ["Leather Boots", "Reinforced Boots"]
    },
    HEAVY: {
        HELM: ["Iron Helm", "Great Helm", "Visor"],
        CHEST: ["Plate Armor", "Cuirass", "Heavy Plate"],
        GLOVES: ["Gauntlets", "Plate Gauntlets"],
        BOOTS: ["Plated Boots", "Greaves"]
    }
};

const WEAPON_DATA: Record<PlayerClass, string[]> = {
    WARRIOR: ["Long Sword", "Claymore", "Bastard Sword", "Battle Axe", "Mace"],
    BARBARIAN: ["Battle Axe", "Great Axe", "Warhammer", "Maul"],
    MAGE: ["Staff", "Wand", "Arcane Staff"],
    CLERIC: ["Staff", "Mace", "Holy Mace", "Flail"],
    ROGUE: ["Dagger", "Rapier", "Stiletto", "Kris"],
    ARCHER: ["Bow", "Crossbow", "Longbow", "Composite Bow"]
};

const OFFHAND_DATA = ["Buckler", "Kite Shield", "Tower Shield", "Orb", "Tome"];
const ACCESSORY_DATA = {
    AMULET: ["Amulet", "Pendant", "Necklace"],
    BELT: ["Leather Belt", "Sash", "Girdle"],
    RING: ["Ring", "Signet", "Band"]
};

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateItem(depth: number, forceType?: 'POTION'): Item {
    const isPotion = forceType === 'POTION' || Math.random() < 0.25;
    
    // POTIONS
    if (isPotion) {
        const isHealth = Math.random() > 0.5;
        const tier = Math.floor(depth / 3) + 1;
        const size = tier === 1 ? 'Minor' : tier === 2 ? 'Regular' : 'Greater';
        return {
            id: Math.random().toString(36).substr(2, 9),
            name: `${size} ${isHealth ? 'Health' : 'Mana'} Potion`,
            type: 'POTION',
            rarity: 'COMMON',
            value: 15 * tier,
            description: `Restores ${tier * 40} ${isHealth ? 'HP' : 'Mana'}.`,
            weightClass: 'NONE',
            effect: {
                type: isHealth ? 'HEAL' : 'MANA',
                value: tier * 40
            },
            icon: isHealth ? '🧪' : '⚗️'
        };
    }

    // GEAR GENERATION
    const rarityRoll = Math.random() + (depth * 0.05);
    let rarity: Item['rarity'] = 'COMMON';
    let multiplier = 1;
    
    if (rarityRoll > 0.95) { rarity = 'LEGENDARY'; multiplier = 3; }
    else if (rarityRoll > 0.8) { rarity = 'RARE'; multiplier = 2; }
    else if (rarityRoll > 0.5) { rarity = 'UNCOMMON'; multiplier = 1.5; }

    const prefix = ITEM_PREFIXES[Math.min(ITEM_PREFIXES.length - 1, Math.floor((depth + (multiplier * 2)) / 3))];
    const itemRoll = Math.random();
    
    let type: ItemType;
    let name = "";
    let weightClass: ArmorWeight = 'NONE';
    let classRestrictions: PlayerClass[] | undefined;
    let icon = "📦";
    let stats: Item['stats'] = {};

    const baseStatVal = Math.floor((3 + depth * 1.5) * multiplier);

    if (itemRoll < 0.3) {
        // WEAPON
        type = 'WEAPON';
        const classes = Object.keys(WEAPON_DATA) as PlayerClass[];
        const targetClass = getRandom(classes);
        classRestrictions = [targetClass];
        name = getRandom(WEAPON_DATA[targetClass]);
        stats.atk = Math.floor(baseStatVal * 2);
        icon = '⚔️';
    } else if (itemRoll < 0.7) {
        // ARMOR (Helm, Chest, Gloves, Boots)
        const slots: ItemType[] = ['HELM', 'CHEST', 'GLOVES', 'BOOTS'];
        type = getRandom(slots);
        
        // Determine Weight Class logic based on Class types for simplicity in generation, 
        // though items can be generic. Let's make items with specific weights.
        const wRoll = Math.random();
        if (wRoll < 0.33) {
            weightClass = 'LIGHT';
            classRestrictions = ['ROGUE', 'ARCHER'];
            name = getRandom(ARMOR_DATA.LIGHT[type as keyof typeof ARMOR_DATA.LIGHT]);
            stats.def = Math.floor(baseStatVal * 0.5);
            stats.dodge = 2 * multiplier;
        } else if (wRoll < 0.66) {
            weightClass = 'MEDIUM';
            classRestrictions = ['MAGE', 'CLERIC'];
            name = getRandom(ARMOR_DATA.MEDIUM[type as keyof typeof ARMOR_DATA.MEDIUM]);
            stats.def = Math.floor(baseStatVal * 0.8);
            stats.hp = Math.floor(baseStatVal * 5);
        } else {
            weightClass = 'HEAVY';
            classRestrictions = ['WARRIOR', 'BARBARIAN'];
            name = getRandom(ARMOR_DATA.HEAVY[type as keyof typeof ARMOR_DATA.HEAVY]);
            stats.def = Math.floor(baseStatVal * 1.2);
            // Heavy might reduce dodge or just give high def
        }
        
        if (type === 'HELM') icon = '⛑️';
        if (type === 'CHEST') icon = '👕';
        if (type === 'GLOVES') icon = '🧤';
        if (type === 'BOOTS') icon = '👢';

    } else if (itemRoll < 0.85) {
        // ACCESSORY
        const slots: ItemType[] = ['AMULET', 'BELT', 'RING'];
        type = getRandom(slots);
        name = getRandom(ACCESSORY_DATA[type as keyof typeof ACCESSORY_DATA]);
        
        // Accessories give attributes
        if (type === 'AMULET') { stats.int = Math.floor(baseStatVal / 2); icon = '📿'; }
        if (type === 'BELT') { stats.vit = Math.floor(baseStatVal / 2); icon = '🎗️'; }
        if (type === 'RING') { stats.crit = multiplier; icon = '💍'; }
    } else {
        // OFFHAND
        type = 'OFFHAND';
        name = getRandom(OFFHAND_DATA);
        stats.def = Math.floor(baseStatVal * 0.8);
        icon = '🛡️';
    }

    return {
        id: Math.random().toString(36).substr(2, 9),
        name: `${prefix} ${name}`,
        type,
        rarity,
        value: Math.floor(baseStatVal * 10),
        description: `A ${rarity.toLowerCase()} item found in the depths.`,
        weightClass,
        classRestrictions,
        stats,
        icon
    };
}

// --- GENERATION LOGIC ---

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
  let encounterType = EncounterType.BATTLE; // Default

  // Strict Type Selection: BATTLE, TRAP, MERCHANT, TREASURE, PUZZLE, SECRET
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
      // Medium
      if (rand < 0.40) encounterType = EncounterType.BATTLE;
      else if (rand < 0.55) encounterType = EncounterType.TRAP;
      else if (rand < 0.70) encounterType = EncounterType.PUZZLE;
      else if (rand < 0.85) encounterType = EncounterType.TREASURE;
      else encounterType = EncounterType.MERCHANT;
  }

  // Populate Specific Encounter Data
  let encounterData: Room['encounterData'] = {};

  if (encounterType === EncounterType.MERCHANT) {
      description = getRandom(MERCHANT_FLAVOR);
      encounterData.merchantStock = [
          generateItem(depth, 'POTION'),
          generateItem(depth),
          generateItem(depth),
          generateItem(depth)
      ];
  } else if (encounterType === EncounterType.TREASURE) {
      description = "A magnificent chest sits in the center of the room, awaiting a key or a crowbar.";
      encounterData.loot = generateItem(depth);
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
      description = "The floor here is uneven, and small holes line the walls at waist height.";
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
  return {
    name,
    hp: baseHp,
    maxHp: baseHp,
    attack: baseAtk,
    speed: 10,
    rewardXp: 30 + (depth * 10),
    rewardGold: 15 + (depth * 5),
    imagePrompt: "" 
  };
}

export async function generateDungeonImage(prompt: string): Promise<string> {
  return STATIC_DUNGEON_IMAGE;
}
