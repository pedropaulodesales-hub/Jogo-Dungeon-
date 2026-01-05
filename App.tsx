
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Character, Room, Enemy, Skill, EncounterType, 
  PathChoice, PlayerClass, Attributes, Item, EquipmentSlot, ItemType
} from './types';
import { 
  CLASS_DATA, SKILL_LIBRARY, BIOMES, RUNE_GLYPHS, STATIC_DUNGEON_IMAGE
} from './constants';
import * as Gemini from './services/geminiService';
import RunePanel from './components/RunePanel';

// --- Components ---

const EmberParticles: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      left: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 5 + 8,
      delay: Math.random() * -10,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {particles.map((p, i) => (
        <div
          key={i}
          className="ember"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

const GoldParticles: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 2 + 3,
      delay: Math.random() * -2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-amber-400 opacity-60 animate-pulse"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            boxShadow: '0 0 4px rgba(251, 191, 36, 0.8)',
            animation: `rise ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

const BackgroundLayer: React.FC<{ image: string; isLoading?: boolean }> = ({ image, isLoading }) => (
    <div className="absolute inset-0 z-0 select-none overflow-hidden">
         <img 
             src={image} 
             className="w-full h-full object-cover transition-transform duration-[20s] ease-linear"
             style={{ 
                 transform: isLoading ? 'scale(1.15)' : 'scale(1.05)',
                 opacity: 0.5 
             }}
             alt="Background"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 z-10 pointer-events-none"></div>
         <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 z-10 pointer-events-none"></div>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] z-10 pointer-events-none"></div>
         <EmberParticles />
    </div>
);

const MiniMap: React.FC<{ 
    currentRoom: Room | null; 
    visitedRooms: Record<string, Room>;
    onTravel: (room: Room) => void;
}> = ({ currentRoom, visitedRooms, onTravel }) => {
    if (!currentRoom) return null;
    const CELL_SIZE = 12;

    return (
        <div className="w-[150px] h-[150px] ui-panel border-[#444] rounded-sm relative overflow-hidden shadow-2xl group pointer-events-auto">
             <div className="absolute top-2 left-2 text-[8px] text-slate-500 uppercase tracking-[0.2em] font-bold z-20 pointer-events-none">Cartography</div>
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="relative w-0 h-0"> 
                     {Object.values(visitedRooms).map((room: Room) => {
                         const relX = (room.x - currentRoom.x) * (CELL_SIZE + 4);
                         const relY = (room.y - currentRoom.y) * (CELL_SIZE + 4);
                         const isCurrent = room.x === currentRoom.x && room.y === currentRoom.y;
                         const isStart = room.x === 0 && room.y === 0;

                         return (
                             <div 
                                key={`${room.x},${room.y}`}
                                onClick={() => onTravel(room)}
                                className={`absolute rounded-[1px] border transition-all duration-300 z-10 cursor-pointer hover:scale-125 ${
                                    isCurrent 
                                        ? 'bg-amber-500 border-amber-200 w-3.5 h-3.5 z-20 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse' 
                                        : isStart
                                            ? 'bg-green-800/80 border-green-600/50 w-2.5 h-2.5'
                                            : 'bg-slate-800 border-slate-600 w-2.5 h-2.5'
                                }`}
                                style={{ transform: `translate(${relX}px, ${relY}px) translate(-50%, -50%)` }}
                             />
                         );
                     })}
                 </div>
             </div>
             <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:15px_15px]"></div>
        </div>
    );
};

const PathCard: React.FC<{
    choice: PathChoice | undefined;
    labelOverride?: string;
    onClick: (c: PathChoice) => void;
    visitedRoom?: Room;
    isEmpty?: boolean;
    className?: string;
}> = ({ choice, labelOverride, onClick, visitedRoom, isEmpty, className = "" }) => {
    if (!choice || isEmpty) return <div className={`h-48 w-full opacity-0 pointer-events-none ${className}`} />;
    const isVisited = !!visitedRoom;

    return (
        <div 
            onClick={() => onClick(choice)}
            className={`group relative ui-panel p-6 rounded-[2px] transition-all duration-500 cursor-pointer flex flex-col h-48 justify-between overflow-hidden w-full path-card-hover ${
                isVisited ? 'border-blue-500/40' : 'border-[#333]'
            } ${className}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${isVisited ? 'from-blue-900/20' : 'from-amber-900/0'}`}></div>
            
            <div className="flex justify-between items-start relative z-10">
                <span className={`exocet-font text-xl uppercase tracking-widest ${isVisited ? 'text-blue-200' : 'text-slate-200 group-hover:text-amber-100 transition-colors'}`}>
                    {labelOverride || (choice.label === 'North' ? 'Forward' : choice.label === 'South' ? 'Back' : choice.label)}
                </span>
                <span className="text-amber-500/50 text-2xl opacity-40 group-hover:opacity-100 transition-opacity">
                    {choice.label === 'North' ? '↑' : choice.label === 'South' ? '↓' : choice.label === 'East' ? '→' : '←'}
                </span>
            </div>

            <p className="text-slate-400 text-sm font-serif italic group-hover:text-slate-200 transition-colors relative z-10 leading-relaxed line-clamp-2">
                "{isVisited ? 'The path you walked once before.' : choice.description}"
            </p>
            
            <div className="flex items-center justify-between relative z-10 mt-2 border-t border-white/5 pt-3">
                <span className={`text-[11px] font-black tracking-[0.2em] uppercase ${
                    isVisited ? 'text-blue-500' : choice.riskLevel === 'HIGH' ? 'text-red-600' : 'text-amber-600'
                }`}>
                    {isVisited ? 'Explored' : `${choice.riskLevel} Risk`}
                </span>
            </div>
        </div>
    );
};

const DualPathCard: React.FC<{
    north: PathChoice | undefined;
    south: PathChoice | undefined;
    onChoice: (c: PathChoice) => void;
    isVisited: (c?: PathChoice) => Room | undefined;
}> = ({ north, south, onChoice, isVisited }) => {
    return (
        <div className="ui-panel h-48 w-full flex flex-col overflow-hidden border-[#444] shadow-2xl transition-colors hover:border-amber-600/50">
            {north ? (
                <div 
                    onClick={() => onChoice(north)}
                    className={`flex-1 flex flex-col justify-center px-6 relative cursor-pointer hover:bg-white/5 transition-all border-b border-white/5 ${isVisited(north) ? 'bg-blue-950/20' : ''}`}
                >
                    <div className="flex justify-between items-center mb-0.5">
                        <span className={`exocet-font text-lg uppercase tracking-widest ${isVisited(north) ? 'text-blue-300' : 'text-slate-200'}`}>Forward</span>
                        <span className="text-amber-500/30 text-xl">↑</span>
                    </div>
                    <p className="text-xs text-slate-500 italic truncate opacity-80">"{isVisited(north) ? 'Known territory.' : north.description}"</p>
                </div>
            ) : <div className="flex-1 bg-black/40" />}

            {south ? (
                <div 
                    onClick={() => onChoice(south)}
                    className={`flex-1 flex flex-col justify-center px-6 relative cursor-pointer hover:bg-white/5 transition-all ${isVisited(south) ? 'bg-blue-950/20' : ''}`}
                >
                    <div className="flex justify-between items-center mb-0.5">
                        <span className={`exocet-font text-lg uppercase tracking-widest ${isVisited(south) ? 'text-blue-300' : 'text-slate-200'}`}>Back</span>
                        <span className="text-amber-500/30 text-xl">↓</span>
                    </div>
                    <p className="text-xs text-slate-500 italic truncate opacity-80">"{isVisited(south) ? 'A path revisited.' : south.description}"</p>
                </div>
            ) : <div className="flex-1 bg-black/40" />}
        </div>
    );
};

const EquipmentSlotIcon: React.FC<{ type: EquipmentSlot; item: Item | null; onClick: () => void }> = ({ type, item, onClick }) => (
    <div 
        onClick={onClick}
        className={`w-14 h-14 border rounded flex items-center justify-center cursor-pointer transition-all relative group shadow-2xl ${
            item ? 'border-amber-500/40 bg-amber-950/20' : 'border-slate-800 bg-black/60'
        }`}
    >
        <span className="text-3xl filter drop-shadow-lg opacity-80 group-hover:opacity-100 transition-all">
            {item?.icon || '◌'}
        </span>
        <div className="absolute -bottom-1 -right-1 text-[8px] font-black text-slate-500 bg-black/90 px-1 py-0.5 rounded border border-slate-800 uppercase tracking-tighter">
            {type.substring(0, 3)}
        </div>
    </div>
);

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'CREATION' | 'ADVENTURE'>('CREATION');
  const [showLore, setShowLore] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  
  const [creationName, setCreationName] = useState('');
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);

  const [character, setCharacter] = useState<Character | null>(() => {
    const saved = localStorage.getItem('runebound_hero_v3');
    return saved ? JSON.parse(saved) : null;
  });

  const [visitedRooms, setVisitedRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [logs, setLogs] = useState<string[]>(["A new soul awakens..."]);
  const [biome, setBiome] = useState(BIOMES[0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
     if (character && Object.keys(visitedRooms).length === 0) {
         const savedMap = localStorage.getItem('runebound_map_v3');
         if (savedMap) setVisitedRooms(JSON.parse(savedMap));
     }
  }, [character]);

  useEffect(() => {
    if (character) {
        localStorage.setItem('runebound_hero_v3', JSON.stringify(character));
        setGameState('ADVENTURE');
    }
  }, [character]);

  useEffect(() => {
    if (gameState === 'ADVENTURE' && !currentRoom) {
      const startAdventure = async () => {
        setIsLoading(true);
        const room = await Gemini.generateInitialRoom(biome, 1);
        setCurrentRoom(room);
        setVisitedRooms({ [`${room.x},${room.y}`]: room });
        setIsLoading(false);
      };
      startAdventure();
    }
  }, [gameState]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50));
  }, []);

  const finalizeCreation = () => {
    if (!creationName || !selectedClass) return;
    const data = CLASS_DATA[selectedClass];
    const newHero: Character = {
      name: creationName,
      classType: selectedClass,
      level: 1, xp: 0, xpToNext: 100,
      maxHp: data.hp, hp: data.hp,
      maxMana: data.mp, mana: data.mp,
      attack: data.atk, magic: data.mag, defense: data.def,
      crit: data.crit, gold: 80,
      attributes: { ...data.attributes },
      inventory: [],
      equipment: {
          HELM: null, CHEST: null, GLOVES: null, BOOTS: null, 
          OFFHAND: null, AMULET: null, BELT: null, 
          RING1: null, RING2: null, WEAPON: null
      }
    };
    setCharacter(newHero);
    setSkills(data.skills.map(id => ({ ...SKILL_LIBRARY[id] })));
    setGameState('ADVENTURE');
    setVisitedRooms({});
  };

  useEffect(() => {
    if (!isCombatActive || !currentEnemy || !character) return;
    const combatTimer = setInterval(() => {
      const playerDmg = Math.floor(character.attack * (0.8 + Math.random() * 0.4));
      setCurrentEnemy(prev => {
        if (!prev) return null;
        const newHp = Math.max(0, prev.hp - playerDmg);
        if (newHp === 0) { handleVictory(prev); return null; }
        return { ...prev, hp: newHp };
      });
      setCharacter(prev => {
        if (!prev) return null;
        const enemyDmg = Math.max(2, Math.floor(currentEnemy.attack * (0.7 + Math.random() * 0.6)) - prev.defense);
        const newHp = Math.max(0, prev.hp - enemyDmg);
        if (newHp === 0) handleDefeat();
        return { ...prev, hp: newHp };
      });
    }, 1800);
    return () => clearInterval(combatTimer);
  }, [isCombatActive, currentEnemy, character?.attack]);

  const handleVictory = (enemy: Enemy) => {
    setIsCombatActive(false);
    addLog(`The ${enemy.name} has been vanquished.`);
    setCharacter(prev => {
      if (!prev) return null;
      let nextXp = prev.xp + enemy.rewardXp;
      let level = prev.level;
      let xpToNext = prev.xpToNext;
      if (nextXp >= xpToNext) {
        level++; nextXp -= xpToNext; xpToNext = Math.floor(xpToNext * 1.5);
        addLog(`Power surges through you. Level ${level} reached.`);
      }
      return { ...prev, xp: nextXp, level, xpToNext, gold: prev.gold + enemy.rewardGold };
    });
  };

  const handleDefeat = () => {
      setIsCombatActive(false);
      setCurrentEnemy(null);
      setCharacter(null);
      setGameState('CREATION');
      alert("Death claims you.");
  };

  const useSkill = (skill: Skill) => {
    if (!character || !isCombatActive || !currentEnemy) return;
    if (character.mana < skill.manaCost) return;
    const now = Date.now();
    if (now - skill.lastUsed < skill.cooldown) return;
    
    const dmg = Math.floor((skill.id === 'nova' ? character.magic : character.attack) * skill.damageMult);
    setCharacter(prev => prev ? { ...prev, mana: prev.mana - skill.manaCost } : null);
    setCurrentEnemy(prev => {
        if (!prev) return null;
        const newHp = Math.max(0, prev.hp - dmg);
        if (newHp === 0) { handleVictory(prev); return null; }
        return { ...prev, hp: newHp };
    });
    setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, lastUsed: now } : s));
  };

  const handleChoice = async (choice: PathChoice) => {
    if (!currentRoom) return;
    setIsLoading(true);
    const nextX = currentRoom.x + choice.dx;
    const nextY = currentRoom.y + choice.dy;
    const coordKey = `${nextX},${nextY}`;
    let nextRoom: Room;

    if (visitedRooms[coordKey]) {
        nextRoom = visitedRooms[coordKey];
        addLog("Returning to familiar ground.");
    } else {
        nextRoom = await Gemini.generateNextRoom(currentRoom, nextX, nextY, biome, choice.riskLevel);
    }
    setCurrentRoom(nextRoom);
    setVisitedRooms(prev => ({ ...prev, [coordKey]: nextRoom }));
    setIsLoading(false);
    
    if (!visitedRooms[coordKey]) {
        if (nextRoom.encounterType === EncounterType.BATTLE) {
            const enemy = await Gemini.generateEnemy(biome, nextRoom.depth);
            setCurrentEnemy(enemy);
            setIsCombatActive(true);
            addLog(`A hostile ${enemy.name} emerges!`);
        } else if (nextRoom.encounterType === EncounterType.TREASURE) {
            addLog("A hidden cache awaits.");
        }
    }
  };

  const handleMapTravel = (room: Room) => {
    if (isCombatActive) return;
    setCurrentRoom(room);
    addLog(`Traveling back to the ${room.title}.`);
  };

  const isChoiceVisited = useCallback((choice?: PathChoice) => {
    if (!currentRoom || !choice) return undefined;
    const targetX = currentRoom.x + choice.dx;
    const targetY = currentRoom.y + choice.dy;
    return visitedRooms[`${targetX},${targetY}`];
  }, [currentRoom, visitedRooms]);

  const northChoice = currentRoom?.choices.find(c => c.label === 'North');
  const southChoice = currentRoom?.choices.find(c => c.label === 'South');
  const eastChoice = currentRoom?.choices.find(c => c.label === 'East');
  const westChoice = currentRoom?.choices.find(c => c.label === 'West');

  if (gameState === 'CREATION') {
    return (
      <div className="relative min-h-screen w-full bg-[#050505] text-slate-300 font-serif overflow-hidden">
        <BackgroundLayer image={STATIC_DUNGEON_IMAGE} />
        
        <div className="relative z-10 flex flex-col items-center min-h-screen pt-12 pb-24 px-4 w-full max-w-[1920px] mx-auto overflow-y-auto">
            <div className="text-center mb-8 animate-in fade-in duration-1000">
                <h1 className="text-6xl md:text-7xl exocet-font text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-700 rune-glow-gold tracking-[0.2em] uppercase">
                    Create Your Hero
                </h1>
            </div>

            <div className="w-full max-w-xl mb-12 flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-500 mb-3">Character Name</span>
                <div className="relative w-full">
                    <input 
                        type="text" 
                        maxLength={20} 
                        placeholder="ENTER YOUR NAME..."
                        className="w-full bg-black/60 border border-slate-700/50 text-center py-4 px-6 text-xl exocet-font text-amber-100 placeholder:text-slate-800 outline-none shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] tracking-[0.15em] focus:border-amber-500/50 transition-all rounded-sm"
                        value={creationName} 
                        onChange={(e) => setCreationName(e.target.value.toUpperCase())}
                    />
                </div>
            </div>

            <div className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-500 mb-6">Choose Your Class</div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 w-full px-8 mb-16 max-w-[1800px]">
                {(Object.keys(CLASS_DATA) as PlayerClass[]).map(c => {
                    const data = CLASS_DATA[c];
                    const isSelected = selectedClass === c;
                    return (
                        <div 
                            key={c} 
                            onClick={() => setSelectedClass(c)}
                            className={`group relative ui-panel p-6 rounded-md cursor-pointer transition-all duration-500 flex flex-col min-h-[600px] border-[1px] overflow-hidden transform ${
                                isSelected 
                                    ? 'border-amber-500 shadow-[0_0_40px_rgba(197,160,89,0.25)] bg-gradient-to-b from-[#1a1a20] to-[#0d0d10] scale-[1.05] z-10 ring-1 ring-amber-500/50' 
                                    : 'border-slate-800/60 bg-[#0a0a0c] hover:border-amber-700/50 hover:bg-[#111115] grayscale-[0.7] hover:grayscale-0 hover:scale-[1.02] hover:z-10'
                            }`}
                        >
                            {/* Selection Highlight/Glow Background */}
                            {isSelected && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-amber-500/5 pointer-events-none animate-pulse"></div>
                                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
                                    <GoldParticles /> 
                                </>
                            )}

                            {/* Ornate Corner Accents */}
                            <div className={`absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 transition-colors duration-300 ${isSelected ? 'border-amber-500' : 'border-slate-800 group-hover:border-slate-600'}`}></div>
                            <div className={`absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 transition-colors duration-300 ${isSelected ? 'border-amber-500' : 'border-slate-800 group-hover:border-slate-600'}`}></div>
                            <div className={`absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 transition-colors duration-300 ${isSelected ? 'border-amber-500' : 'border-slate-800 group-hover:border-slate-600'}`}></div>
                            <div className={`absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 transition-colors duration-300 ${isSelected ? 'border-amber-500' : 'border-slate-800 group-hover:border-slate-600'}`}></div>

                            {/* Icon Container */}
                            <div className={`w-28 h-28 mx-auto mb-6 relative transition-transform duration-500 mt-4 ${isSelected ? 'scale-110' : 'scale-100'}`}>
                                <div className={`absolute inset-0 border-2 rotate-45 transition-colors duration-500 ${isSelected ? 'border-amber-500/60 bg-amber-900/20 shadow-[0_0_20px_rgba(197,160,89,0.2)]' : 'border-slate-800 bg-black/40'}`}></div>
                                <div className={`absolute inset-2 border rotate-45 transition-colors duration-500 ${isSelected ? 'border-amber-500/30' : 'border-slate-800/50'}`}></div>
                                <div className="absolute inset-0 flex items-center justify-center text-6xl filter drop-shadow-lg z-10 pb-1 pr-1">
                                    {data.icon}
                                </div>
                            </div>

                            {/* Name */}
                            <h3 className={`text-2xl font-bold exocet-font text-center mb-2 tracking-[0.2em] transition-colors duration-300 uppercase ${isSelected ? 'text-amber-100 rune-glow-gold' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                {data.name}
                            </h3>

                            {/* Description */}
                            <p className={`text-xs text-center font-serif leading-relaxed mb-8 px-2 h-16 flex items-center justify-center italic transition-colors duration-300 ${isSelected ? 'text-amber-100/90' : 'text-slate-500'}`}>
                                {data.description}
                            </p>

                            {/* Attributes Section */}
                            <div className="mb-6 relative z-10">
                                <div className="flex items-center justify-center mb-4 opacity-80">
                                    <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-slate-700"></div>
                                    <span className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-500 mx-3">Attributes</span>
                                    <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-slate-700"></div>
                                </div>
                                <div className="space-y-2 px-2">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                            <span className="text-[10px] font-black text-slate-500 tracking-wider">STR</span>
                                        </div>
                                        <span className={`text-sm font-bold ${isSelected ? 'text-red-400' : 'text-slate-400'}`}>{data.attributes.str}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-900"></span>
                                            <span className="text-[10px] font-black text-slate-500 tracking-wider">DEX</span>
                                        </div>
                                        <span className={`text-sm font-bold ${isSelected ? 'text-green-400' : 'text-slate-400'}`}>{data.attributes.dex}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-900"></span>
                                            <span className="text-[10px] font-black text-slate-500 tracking-wider">VIT</span>
                                        </div>
                                        <span className={`text-sm font-bold ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>{data.attributes.vit}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
                                            <span className="text-[10px] font-black text-slate-500 tracking-wider">INT</span>
                                        </div>
                                        <span className={`text-sm font-bold ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>{data.attributes.int}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-900"></span>
                                            <span className="text-[10px] font-black text-slate-500 tracking-wider">CHA</span>
                                        </div>
                                        <span className={`text-sm font-bold ${isSelected ? 'text-purple-400' : 'text-slate-400'}`}>{data.attributes.cha}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Section - Grid Layout for compact info */}
                            <div className="mt-auto relative z-10 bg-black/20 p-3 rounded border border-white/5">
                                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-600">HP</span>
                                        <span className={`text-xs font-bold ${isSelected ? 'text-red-300' : 'text-slate-400'}`}>{data.hp}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-600">MP</span>
                                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>{data.mp}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-600">ATK</span>
                                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>{data.atk}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-600">MAG</span>
                                        <span className={`text-xs font-bold ${isSelected ? 'text-purple-300' : 'text-slate-400'}`}>{data.mag}</span>
                                    </div>
                                    <div className="flex justify-between items-center col-span-2 border-t border-white/5 pt-1 mt-1">
                                        <span className="text-[9px] font-black text-slate-600">CRIT CHANCE</span>
                                        <span className={`text-xs font-bold ${isSelected ? 'text-yellow-300' : 'text-slate-400'}`}>{data.crit}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col items-center gap-4">
                <button 
                    disabled={!creationName || !selectedClass} 
                    onClick={finalizeCreation} 
                    className={`px-24 py-5 ui-panel exocet-font text-2xl tracking-[0.3em] transition-all relative overflow-hidden group/btn ${
                        !creationName || !selectedClass ? 'opacity-20 grayscale cursor-not-allowed' : 'text-amber-500 hover:text-amber-100 hover:border-amber-400 border-amber-800/60'
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent group-hover/btn:translate-x-full duration-1000 transition-transform -translate-x-full"></div>
                    BEGIN ADVENTURE
                </button>
                <button className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600 hover:text-slate-300 transition-colors py-2 px-4">
                    ← Back to Menu
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (!character) return null;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-serif select-none">
      <BackgroundLayer image={currentRoom?.imageUrl || STATIC_DUNGEON_IMAGE} isLoading={isLoading} />
      
      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
             <div className="text-6xl text-amber-500 animate-pulse exocet-font mb-4 tracking-[0.5em]">ᚠᚢᚦᚨᚱᚲ</div>
             <div className="exocet-font text-xl text-slate-500 tracking-[0.2em] uppercase">Divining the Path</div>
        </div>
      )}

      {/* COMPACT HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between z-50 pointer-events-none">
         <div className="flex items-start gap-4 pointer-events-auto">
             <div className="w-16 h-16 ui-panel rounded border-[#444] shadow-xl flex items-center justify-center overflow-hidden">
                  <div className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{CLASS_DATA[character.classType].icon}</div>
             </div>
             <div className="flex flex-col gap-2">
                  <div className="ui-panel bg-black/80 border-[#333] px-4 py-1.5 rounded-sm flex items-center gap-3">
                      <span className="text-amber-100 font-bold tracking-[0.2em] text-base uppercase exocet-font rune-glow-gold">{character.name}</span>
                      <div className="h-3 w-[1px] bg-white/10"></div>
                      <span className="text-[9px] text-slate-500 font-black tracking-[0.15em] uppercase">LV {character.level} {character.classType}</span>
                  </div>
                  <div className="ui-panel bg-black/90 border-[#333] p-3 flex items-center gap-6 rounded-sm shadow-xl">
                      <div className="flex flex-col w-32">
                          <div className="flex justify-between text-[8px] font-black mb-1.5 text-red-500 tracking-[0.1em] uppercase">
                             <span>HP</span> <span>{Math.floor(character.hp)}</span>
                          </div>
                          <div className="h-2 bg-black/50 border border-white/5 rounded-full overflow-hidden bar-shimmer">
                             <div className="h-full bg-gradient-to-r from-red-950 to-red-600 shadow-[0_0_8px_rgba(255,0,0,0.4)] transition-all duration-500" style={{width: `${(character.hp / character.maxHp)*100}%`}}></div>
                          </div>
                      </div>
                      <div className="flex flex-col w-32">
                          <div className="flex justify-between text-[8px] font-black mb-1.5 text-blue-500 tracking-[0.1em] uppercase">
                             <span>MP</span> <span>{Math.floor(character.mana)}</span>
                          </div>
                          <div className="h-2 bg-black/50 border border-white/5 rounded-full overflow-hidden bar-shimmer">
                             <div className="h-full bg-gradient-to-r from-blue-950 to-blue-600 shadow-[0_0_8px_rgba(0,0,255,0.4)] transition-all duration-500" style={{width: `${(character.mana / character.maxMana)*100}%`}}></div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 text-amber-500 font-black text-xl tracking-[0.05em] ml-2">
                         <span className="rune-glow-gold text-lg">◎</span> <span>{character.gold}</span>
                      </div>
                  </div>
             </div>
         </div>

         <div className="flex items-start gap-3 pointer-events-auto">
              <div className="h-14 w-24 ui-panel bg-black/80 border-[#333] flex flex-col items-center justify-center rounded shadow-xl">
                 <span className="text-[8px] text-slate-500 font-black tracking-[0.2em] mb-0.5">LOC</span>
                 <span className="text-xl text-amber-500 font-bold exocet-font rune-glow-gold">᚛{biome[0]}᚜</span>
              </div>
              <div className="flex gap-2 h-14">
                 <button className="px-5 ui-panel bg-[#1a1a20] border-[#444] text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] hover:text-white hover:border-amber-600 transition-all rounded shadow-lg">Skills</button>
                 <button onClick={() => setShowInventory(true)} className="px-5 ui-panel bg-[#1a1a20] border-[#444] text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] hover:text-white hover:border-amber-600 transition-all rounded shadow-lg">Gear</button>
              </div>
         </div>
      </div>

      {/* BOTTOM AREA */}
      <div className="absolute bottom-6 left-6 z-50 flex items-end gap-8 pointer-events-none">
          <MiniMap currentRoom={currentRoom} visitedRooms={visitedRooms} onTravel={handleMapTravel} />
          <div className="w-[320px] pb-3">
              <div className="space-y-2 opacity-90">
                  {logs.slice(0, 4).map((log, i) => (
                    <div key={i} className={`text-xs font-serif tracking-wide transition-all duration-700 ${i === 0 ? 'text-amber-100 opacity-100 translate-x-2 drop-shadow-md' : 'text-slate-500 opacity-40 translate-x-0'}`}>
                        <span className="mr-3 text-amber-700 font-bold text-base">᚛</span> {log}
                    </div>
                  ))}
              </div>
          </div>
      </div>

      {/* CENTRAL AREA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24">
          {!isCombatActive ? (
            <>
                <div className="text-center space-y-4 mb-24 animate-in fade-in zoom-in duration-1000">
                    <div className="w-60 h-[1px] bg-gradient-to-r from-transparent via-amber-700/50 to-transparent mx-auto"></div>
                    <h1 className="text-3xl exocet-font text-transparent bg-clip-text bg-gradient-to-b from-amber-50 to-amber-700 tracking-[0.25em] uppercase leading-tight filter drop-shadow-2xl">
                        {currentRoom?.title || "Limbo"}
                    </h1>
                    <p className="text-slate-300 text-sm max-w-2xl mx-auto font-serif italic text-shadow-xl opacity-80 leading-relaxed text-center">
                        {currentRoom?.description}
                    </p>
                    <div className="w-60 h-[1px] bg-gradient-to-r from-transparent via-amber-700/50 to-transparent mx-auto"></div>
                </div>
                
                <div className="flex gap-4 w-full max-w-[1100px] absolute bottom-24 px-8 items-end justify-center pointer-events-none">
                    <div className="flex-1 pointer-events-auto">
                        <PathCard choice={westChoice} onClick={handleChoice} visitedRoom={isChoiceVisited(westChoice)} />
                    </div>
                    <div className="flex-1 pointer-events-auto">
                        <DualPathCard north={northChoice} south={southChoice} onChoice={handleChoice} isVisited={isChoiceVisited} />
                    </div>
                    <div className="flex-1 pointer-events-auto">
                        <PathCard choice={eastChoice} onClick={handleChoice} visitedRoom={isChoiceVisited(eastChoice)} />
                    </div>
                </div>
            </>
          ) : (
            <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in zoom-in duration-500">
                 <div className="mb-12 text-center w-full">
                    <div className="text-red-600 text-[9px] tracking-[0.8em] uppercase mb-4 font-black animate-pulse">MALIGNANT ESSENCE</div>
                    <h1 className="text-4xl exocet-font text-red-50 drop-shadow-[0_0_30px_rgba(255,0,0,0.5)] uppercase tracking-[0.2em] mb-8">{currentEnemy?.name}</h1>
                    <div className="w-[600px] h-3 bg-black/90 border border-red-900/40 rounded-full overflow-hidden mx-auto shadow-xl bar-shimmer">
                         <div className="h-full bg-gradient-to-r from-red-950 to-red-600 transition-all duration-300" style={{ width: `${((currentEnemy?.hp || 0) / (currentEnemy?.maxHp || 1))*100}%` }}></div>
                    </div>
                    <div className="mt-4 text-red-500/80 font-black text-[10px] tracking-[0.4em] uppercase font-mono">{currentEnemy?.hp} ESSENCE REMAINING</div>
                 </div>
                 <div className="ui-panel bg-black/90 p-6 rounded-sm w-full max-w-4xl border-[#444] shadow-[0_0_80px_rgba(0,0,0,0.9)] pointer-events-auto">
                     <div className="grid grid-cols-4 gap-6">
                         {skills.map(skill => {
                             const now = Date.now();
                             const remaining = Math.max(0, skill.cooldown - (now - skill.lastUsed));
                             const isCooldown = remaining > 0;
                             const hasMana = character.mana >= skill.manaCost;
                             return (
                                 <button key={skill.id} disabled={isCooldown || !hasMana} onClick={() => useSkill(skill)} className={`relative group h-20 ui-panel border-[#333] rounded flex items-center p-4 transition-all ${isCooldown || !hasMana ? 'opacity-30 grayscale' : 'hover:-translate-y-1 hover:border-amber-500/50 hover:bg-white/5'}`}>
                                     <div className="text-3xl mr-4 filter drop-shadow-xl group-hover:scale-110 transition-transform">{skill.icon}</div>
                                     <div className="flex flex-col text-left">
                                         <span className="exocet-font text-sm text-slate-100 uppercase tracking-widest leading-none mb-1">{skill.name}</span>
                                         <span className="text-[9px] text-blue-500 font-black tracking-[0.15em]">{skill.manaCost} MANA</span>
                                     </div>
                                     {isCooldown && <div className="absolute inset-0 bg-black/90 flex items-center justify-center"><span className="text-amber-500 font-mono text-base font-bold">{(remaining/1000).toFixed(1)}s</span></div>}
                                 </button>
                             )
                         })}
                     </div>
                 </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default App;
