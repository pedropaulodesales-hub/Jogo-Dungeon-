
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Character, Room, Enemy, Skill, EncounterType, 
  PathChoice, PlayerClass, Attributes, Item, EquipmentSlot, ItemType,
  StatusEffect, StatusType, GameState
} from './types';
import { 
  CLASS_DATA, SKILL_LIBRARY, BIOMES, RUNE_GLYPHS, STATIC_DUNGEON_IMAGE
} from './constants';
import * as Gemini from './services/geminiService';
import RunePanel from './components/RunePanel';

// --- AUTH & FIREBASE IMPORTS ---
import { auth, db } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AuthScreen from './components/AuthScreen';

// --- Interfaces ---

interface LootVisual {
    id: number;
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
    vx: number;
    vy: number;
    icon: string;
    life: number;
    color: string;
    scale: number;
}

interface LootNotification {
    id: string;
    item: Item;
}

// --- Drag Source Type ---
type DragSourceType = 'INVENTORY' | EquipmentSlot;

// --- Components ---

const StatusIcon: React.FC<{ type: StatusType; duration: number }> = ({ type, duration }) => {
    let color = '';
    let icon = '';
    switch(type) {
        case 'POISON': color = 'text-green-500'; icon = '☠️'; break;
        case 'BURN': color = 'text-orange-500'; icon = '🔥'; break;
        case 'STUN': color = 'text-yellow-300'; icon = '💫'; break;
        case 'SLOW': color = 'text-blue-300'; icon = '❄️'; break;
        default: color = 'text-white'; icon = '✨';
    }

    return (
        <div className={`flex flex-col items-center justify-center w-8 h-8 bg-black/60 rounded border border-white/10 ${color} animate-bounce`} style={{ animationDuration: '2s' }}>
            <span className="text-sm leading-none">{icon}</span>
            <span className="text-[8px] font-black leading-none mt-0.5">{(duration/1000).toFixed(0)}s</span>
        </div>
    );
}

const ActionGauge: React.FC<{ value: number; color?: string; label?: string; textColor?: string }> = ({ value, color = "bg-white", label, textColor = "text-slate-400" }) => (
    <div className="w-full flex flex-col">
        {label && (
             <div className="flex justify-between text-[9px] font-black mb-1.5 tracking-[0.2em] uppercase">
                <span className={textColor}>{label}</span>
                <span className="text-slate-300 font-bold">{Math.floor(value)}%</span>
             </div>
        )}
        <div className="w-full h-2 bg-black/80 border border-white/10 rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)]"></div>
            <div 
                className={`h-full ${color} shadow-[0_0_8px_currentColor] transition-all duration-75 ease-linear relative`} 
                style={{ width: `${Math.max(1, Math.min(100, value))}%` }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_4px_#fff]"></div>
            </div>
        </div>
    </div>
);

const RiskParticles: React.FC<{ risk: 'LOW' | 'MEDIUM' | 'HIGH' }> = ({ risk }) => {
    const config = useMemo(() => {
        switch(risk) {
            case 'HIGH': return { 
                count: 20, 
                color: 'bg-red-600', 
                duration: [0.8, 1.5], 
                shadow: '0 0 8px #dc2626',
                gradient: 'from-red-900/40' 
            };
            case 'MEDIUM': return { 
                count: 12, 
                color: 'bg-orange-500', 
                duration: [1.5, 2.5], 
                shadow: '0 0 5px #f97316',
                gradient: 'from-orange-900/30'
            };
            case 'LOW': default: return { 
                count: 8, 
                color: 'bg-emerald-400', 
                duration: [3, 5], 
                shadow: '0 0 3px #34d399',
                gradient: 'from-emerald-900/20'
            };
        }
    }, [risk]);

    const particles = useMemo(() => {
        return Array.from({ length: config.count }).map((_, i) => ({
            left: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: config.duration[0] + Math.random() * (config.duration[1] - config.duration[0]),
            delay: Math.random() * -5,
        }));
    }, [config]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className={`absolute inset-0 bg-gradient-to-t ${config.gradient} to-transparent opacity-60`}></div>
            {particles.map((p, i) => (
                <div
                    key={i}
                    className={`absolute rounded-full ${config.color} opacity-60 mix-blend-screen`}
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        boxShadow: config.shadow,
                        animation: `cardRise ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        bottom: '-10px'
                    }}
                />
            ))}
        </div>
    );
};

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
    const CELL_SIZE = 14;

    return (
        <div className="w-[200px] h-[200px] ui-panel border-[#444] rounded-sm relative overflow-hidden shadow-2xl group pointer-events-auto bg-[#0b0b0e]">
             <div className="absolute top-3 left-3 flex flex-col z-20 pointer-events-none">
                <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black exocet-font">Cartography</span>
                <span className="text-[8px] text-slate-600 font-serif italic">Sector {currentRoom.depth}</span>
             </div>
             
             {/* Legend */}
             <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-20 pointer-events-none bg-black/40 p-2 rounded border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-sm shadow-[0_0_4px_rgba(245,158,11,0.5)]"></div><span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Loot</span></div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-sm shadow-[0_0_4px_rgba(59,130,246,0.5)]"></div><span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Safe</span></div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-900 rounded-sm"></div><span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Cleared</span></div>
             </div>

             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="relative w-0 h-0 transition-transform duration-500 ease-out"> 
                     {Object.values(visitedRooms).map((room: Room) => {
                         const relX = (room.x - currentRoom.x) * (CELL_SIZE + 8);
                         const relY = (room.y - currentRoom.y) * (CELL_SIZE + 8);
                         const isCurrent = room.x === currentRoom.x && room.y === currentRoom.y;
                         const isStart = room.x === 0 && room.y === 0;

                         let baseClasses = "absolute rounded-[1px] border transition-all duration-300 z-10 cursor-pointer flex items-center justify-center shadow-lg";
                         let sizeClasses = "w-4 h-4";
                         let colorClasses = "bg-slate-800 border-slate-600";
                         let content = null;

                         // Type styling
                         switch (room.encounterType) {
                            case EncounterType.TREASURE:
                                if (room.encounterData?.chestOpened) {
                                    colorClasses = "bg-amber-950/40 border-amber-900/40 opacity-80";
                                } else {
                                    colorClasses = "bg-amber-600 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)] z-15";
                                    content = <span className="text-[8px] leading-none text-amber-100 font-bold">?</span>;
                                }
                                break;
                            case EncounterType.MERCHANT:
                                colorClasses = "bg-blue-900 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)] z-15";
                                content = <span className="text-[8px] leading-none text-blue-200">💎</span>;
                                break;
                            case EncounterType.BATTLE:
                                colorClasses = "bg-red-950/60 border-red-900/60 opacity-90"; 
                                break;
                            case EncounterType.STORY:
                            case EncounterType.PUZZLE:
                                colorClasses = "bg-purple-900 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)] z-15";
                                content = <span className="text-[8px] leading-none text-purple-200">❂</span>;
                                break;
                            case EncounterType.TRAP:
                                colorClasses = room.encounterData?.trapDisarmed 
                                    ? "bg-stone-800 border-stone-600" 
                                    : "bg-orange-900/80 border-orange-600";
                                break;
                            default:
                                break;
                         }

                         if (isStart) {
                             colorClasses = "bg-emerald-900 border-emerald-500";
                             content = <span className="text-[8px] leading-none text-emerald-200">⌂</span>;
                         }

                         if (isCurrent) {
                             baseClasses += " z-30 scale-125 ring-1 ring-amber-100";
                             colorClasses = "bg-amber-500 border-amber-200 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.8)]";
                             content = <div className="w-1 h-1 bg-white rounded-full shadow-sm" />;
                         } else {
                             baseClasses += " hover:scale-110 hover:z-20 hover:border-white/50 hover:shadow-xl";
                         }

                         return (
                             <div 
                                key={`${room.x},${room.y}`}
                                onClick={() => onTravel(room)}
                                className={`${baseClasses} ${sizeClasses} ${colorClasses}`}
                                style={{ transform: `translate(${relX}px, ${relY}px) translate(-50%, -50%)` }}
                                title={`${room.title} (${room.encounterType})`}
                             >
                                 {content}
                             </div>
                         );
                     })}
                 </div>
             </div>
             
             {/* Radial gradient overlay */}
             <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.8)_100%)]"></div>
             {/* Grid */}
             <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px] [background-position:center]"></div>
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
            {!isVisited && !isEmpty && <RiskParticles risk={choice.riskLevel} />}
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
                    isVisited ? 'text-blue-500' : choice.riskLevel === 'HIGH' ? 'text-red-600' : choice.riskLevel === 'MEDIUM' ? 'text-orange-500' : 'text-emerald-500'
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
                    {!isVisited(north) && <RiskParticles risk={north.riskLevel} />}
                    <div className="flex justify-between items-center mb-0.5 relative z-10">
                        <span className={`exocet-font text-lg uppercase tracking-widest ${isVisited(north) ? 'text-blue-300' : 'text-slate-200'}`}>Forward</span>
                        <span className="text-amber-500/30 text-xl">↑</span>
                    </div>
                    <p className="text-xs text-slate-500 italic truncate opacity-80 relative z-10">"{isVisited(north) ? 'Known territory.' : north.description}"</p>
                </div>
            ) : <div className="flex-1 bg-black/40" />}

            {south ? (
                <div 
                    onClick={() => onChoice(south)}
                    className={`flex-1 flex flex-col justify-center px-6 relative cursor-pointer hover:bg-white/5 transition-all ${isVisited(south) ? 'bg-blue-950/20' : ''}`}
                >
                    {!isVisited(south) && <RiskParticles risk={south.riskLevel} />}
                    <div className="flex justify-between items-center mb-0.5 relative z-10">
                        <span className={`exocet-font text-lg uppercase tracking-widest ${isVisited(south) ? 'text-blue-300' : 'text-slate-200'}`}>Back</span>
                        <span className="text-amber-500/30 text-xl">↓</span>
                    </div>
                    <p className="text-xs text-slate-500 italic truncate opacity-80 relative z-10">"{isVisited(south) ? 'A path revisited.' : south.description}"</p>
                </div>
            ) : <div className="flex-1 bg-black/40" />}
        </div>
    );
};

// --- TOOLTIP COMPONENT ---

const ItemTooltip: React.FC<{ item: Item; position: { x: number, y: number } }> = ({ item, position }) => {
    const stats = item.stats || {};
    
    return (
        <div 
            className="fixed z-[9999] w-72 bg-[#0a0a0c] border border-amber-500/50 p-4 shadow-[0_0_30px_rgba(0,0,0,0.95)] rounded-sm pointer-events-none"
            style={{ 
                left: position.x, 
                top: position.y,
                transform: 'translate(-50%, -100%) translateY(-10px)'
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none"></div>
            
            {/* Header */}
            <div className="relative border-b border-white/10 pb-2 mb-2">
                <h4 className={`text-base font-bold exocet-font uppercase tracking-wider ${
                    item.rarity === 'LEGENDARY' ? 'text-amber-500 rune-glow-gold' :
                    item.rarity === 'RARE' ? 'text-blue-400' :
                    item.rarity === 'UNCOMMON' ? 'text-green-500' : 'text-slate-200'
                }`}>{item.name}</h4>
                
                <div className="flex justify-between items-baseline mt-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                        {item.rarity} {item.type}
                    </span>
                    {item.weightClass && item.weightClass !== 'NONE' && (
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border border-slate-700 px-1.5 rounded bg-slate-900/50">
                             {item.weightClass}
                         </span>
                    )}
                </div>
            </div>

            {/* Main Stats Row */}
            {(stats.atk || stats.def) && (
                <div className="flex gap-4 mb-3 bg-white/5 p-2 rounded border border-white/5">
                    {stats.atk && (
                        <div className="flex-1 text-center border-r border-white/10 last:border-0">
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Attack</div>
                            <div className="text-lg text-red-400 font-bold exocet-font">{stats.atk}</div>
                        </div>
                    )}
                    {stats.def && (
                        <div className="flex-1 text-center border-r border-white/10 last:border-0">
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Defense</div>
                            <div className="text-lg text-slate-300 font-bold exocet-font">{stats.def}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Description */}
            <p className="text-xs text-slate-400 italic font-serif mb-3 leading-relaxed opacity-80">"{item.description}"</p>

            {/* Attributes Grid */}
            <div className="space-y-1 mb-3">
                {/* Primary Attributes */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {stats.str && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">STRENGTH</span> <span className="text-red-400">+{stats.str}</span></div>}
                    {stats.dex && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">DEXTERITY</span> <span className="text-green-400">+{stats.dex}</span></div>}
                    {stats.int && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">INTELLECT</span> <span className="text-blue-400">+{stats.int}</span></div>}
                    {stats.vit && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">VITALITY</span> <span className="text-amber-400">+{stats.vit}</span></div>}
                    {stats.cha && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">CHARISMA</span> <span className="text-purple-400">+{stats.cha}</span></div>}
                </div>

                {/* Secondary Stats */}
                {(stats.crit || stats.dodge || stats.hp || stats.mana || stats.mag) && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 mt-1 border-t border-white/5">
                        {stats.hp && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">MAX HP</span> <span className="text-red-500">+{stats.hp}</span></div>}
                        {stats.mana && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">MAX MANA</span> <span className="text-blue-500">+{stats.mana}</span></div>}
                        {stats.mag && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">MAGIC</span> <span className="text-purple-500">+{stats.mag}</span></div>}
                        {stats.crit && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">CRIT CHANCE</span> <span className="text-yellow-500">+{stats.crit}%</span></div>}
                        {stats.dodge && <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-500">DODGE</span> <span className="text-emerald-500">+{stats.dodge}%</span></div>}
                    </div>
                )}
            </div>

            {/* Effect */}
            {item.effect && (
                <div className="mb-3 p-2 bg-emerald-900/20 border border-emerald-500/30 rounded flex items-center gap-2">
                    <div className="text-lg">⚗️</div>
                    <div>
                        <div className="text-[9px] text-emerald-500 font-black uppercase tracking-wider">On Use</div>
                        <div className="text-xs text-emerald-100 font-bold">Restores {item.effect.value} {item.effect.type}</div>
                    </div>
                </div>
            )}
            
            {/* Footer */}
            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                <span className="text-[10px] text-amber-500 font-bold">Value: {item.value} Gold</span>
                <span className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
                    {item.type === 'POTION' ? 'Right Click' : 'Drag'}
                </span>
            </div>
        </div>
    );
};

// --- EQUIPMENT WINDOW COMPONENT ---
const EquipmentWindow: React.FC<{
    character: Character;
    onUnequip: (slot: EquipmentSlot) => void;
    onEquip: (item: Item, slot: EquipmentSlot) => void;
    onClose: () => void;
    dragItem: { item: Item, source: DragSourceType } | null;
    setDragItem: (val: { item: Item, source: DragSourceType } | null) => void;
    onHover: (item: Item | null, e?: React.MouseEvent) => void;
}> = ({ character, onUnequip, onEquip, onClose, dragItem, setDragItem, onHover }) => {
    
    const handleDragStart = (e: React.DragEvent, item: Item, slot: EquipmentSlot) => {
        setDragItem({ item, source: slot });
        e.dataTransfer.effectAllowed = 'move';
        onHover(null); // Hide tooltip on drag
    };

    const handleDropOnSlot = (e: React.DragEvent, targetSlot: EquipmentSlot) => {
        e.preventDefault();
        if (!dragItem) return;
        
        let isValid = false;
        if (dragItem.item.type === 'WEAPON' && targetSlot === 'WEAPON') isValid = true;
        else if (dragItem.item.type === 'OFFHAND' && targetSlot === 'OFFHAND') isValid = true;
        else if (targetSlot === dragItem.item.type) isValid = true;
        else if (dragItem.item.type === 'RING' && (targetSlot === 'RING1' || targetSlot === 'RING2')) isValid = true;

        if (isValid) {
            onEquip(dragItem.item, targetSlot);
        }
        setDragItem(null);
    };

    const renderEquipmentSlot = (slot: EquipmentSlot, top: string, left: string) => {
        const item = character.equipment[slot];
        return (
            <div 
                className="absolute"
                style={{ top, left, transform: 'translate(-50%, -50%)' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnSlot(e, slot)}
                onMouseEnter={(e) => item && onHover(item, e)}
                onMouseLeave={() => onHover(null)}
            >
                <div 
                    draggable={!!item}
                    onDragStart={(e) => item && handleDragStart(e, item, slot)}
                    onClick={() => item && onUnequip(slot)}
                    onContextMenu={(e) => { e.preventDefault(); if(item) onUnequip(slot); }}
                    className={`w-14 h-14 border-2 flex items-center justify-center relative bg-black/80 transition-all duration-300 group
                        ${item 
                            ? (item.rarity === 'LEGENDARY' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 
                               item.rarity === 'RARE' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                               'border-slate-600') 
                            : 'border-slate-800/60 hover:border-amber-500/50 hover:bg-white/5'}
                    `}
                >
                    {item ? (
                        <>
                            <span className="text-3xl filter drop-shadow-lg">{item.icon}</span>
                        </>
                    ) : (
                        <span className="text-slate-700 text-[10px] font-black uppercase tracking-widest opacity-50">{slot.replace(/[0-9]/g, '').substring(0,3)}</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="absolute bottom-6 right-[468px] z-[100] w-[400px] shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-[#0a0a0c] border border-[#333] animate-in fade-in slide-in-from-right-10 duration-300 rounded-sm">
             <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#111115]">
                <h2 className="text-lg font-bold exocet-font text-amber-500 uppercase tracking-[0.2em] rune-glow-gold">Equipment</h2>
                <button onClick={onClose} className="w-6 h-6 flex items-center justify-center border border-red-900/50 text-red-500 hover:bg-red-900/20 rounded">✕</button>
             </div>
             
             <div className="relative h-[550px] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                 <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_rgba(197,160,89,0.15),_transparent_70%)] pointer-events-none"></div>
                 
                 <div className="relative w-full h-full">
                     {renderEquipmentSlot('HELM', '15%', '50%')}
                     {renderEquipmentSlot('AMULET', '28%', '50%')}
                     {renderEquipmentSlot('CHEST', '45%', '50%')}
                     {renderEquipmentSlot('BELT', '62%', '50%')}
                     {renderEquipmentSlot('BOOTS', '85%', '50%')}

                     <div className="absolute top-[45%] left-[20%] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-slate-700 font-bold">MAIN</div>
                     <div className="absolute top-[45%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-slate-700 font-bold">OFF</div>
                     
                     {renderEquipmentSlot('WEAPON', '45%', '20%')}
                     {renderEquipmentSlot('OFFHAND', '45%', '80%')}
                     {renderEquipmentSlot('GLOVES', '65%', '20%')}
                     {renderEquipmentSlot('RING1', '75%', '28%')}
                     {renderEquipmentSlot('RING2', '75%', '72%')}
                 </div>

                 <div className="absolute bottom-0 left-0 right-0 bg-[#0d0d10] border-t border-[#333] p-3 flex justify-between px-6">
                      <div className="text-center"><div className="text-[10px] text-slate-500 font-bold">ATK</div><div className="text-lg text-amber-500 font-bold exocet-font">{character.attack}</div></div>
                      <div className="text-center"><div className="text-[10px] text-slate-500 font-bold">DEF</div><div className="text-lg text-slate-300 font-bold exocet-font">{character.defense}</div></div>
                      <div className="text-center"><div className="text-[10px] text-slate-500 font-bold">MAG</div><div className="text-lg text-blue-400 font-bold exocet-font">{character.magic}</div></div>
                      <div className="text-center"><div className="text-[10px] text-slate-500 font-bold">CRIT</div><div className="text-lg text-yellow-500 font-bold exocet-font">{character.crit}%</div></div>
                 </div>
            </div>
        </div>
    );
};

// --- INVENTORY WINDOW COMPONENT ---
const InventoryWindow: React.FC<{
    character: Character;
    onEquip: (item: Item) => void;
    onUse: (item: Item) => void;
    onUnequip: (slot: EquipmentSlot) => void;
    onClose: () => void;
    dragItem: { item: Item, source: DragSourceType } | null;
    setDragItem: (val: { item: Item, source: DragSourceType } | null) => void;
    onHover: (item: Item | null, e?: React.MouseEvent) => void;
}> = ({ character, onEquip, onUse, onUnequip, onClose, dragItem, setDragItem, onHover }) => {

    const groupedInventory = useMemo(() => {
        const groups: { item: Item, count: number, allItems: Item[] }[] = [];
        character.inventory.forEach(item => {
            if (item.type === 'POTION') {
                const existing = groups.find(g => g.item.name === item.name);
                if (existing) { existing.count++; existing.allItems.push(item); } 
                else { groups.push({ item, count: 1, allItems: [item] }); }
            } else {
                groups.push({ item, count: 1, allItems: [item] });
            }
        });
        return groups;
    }, [character.inventory]);

    const handleDragStart = (e: React.DragEvent, item: Item) => {
        setDragItem({ item, source: 'INVENTORY' });
        e.dataTransfer.effectAllowed = 'move';
        onHover(null); // Hide tooltip on drag
    };

    const handleDropOnInventory = (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragItem) return;
        if (dragItem.source !== 'INVENTORY') {
            onUnequip(dragItem.source as EquipmentSlot);
        }
        setDragItem(null);
    };

    return (
        <div className="absolute bottom-6 right-6 z-[100] w-[420px] shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-[#111115] border border-[#333] animate-in fade-in slide-in-from-right-10 duration-300 rounded-sm">
             <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#15151a]">
                 <h2 className="text-lg font-bold exocet-font text-slate-200 uppercase tracking-[0.2em]">Inventory</h2>
                 <div className="flex items-center gap-3">
                    <span className="text-amber-500 font-bold text-lg tracking-wider">{character.gold} <span className="text-[9px] text-amber-700">GOLD</span></span>
                    <button onClick={onClose} className="w-6 h-6 flex items-center justify-center border border-red-900/50 text-red-500 hover:bg-red-900/20 rounded">✕</button>
                 </div>
             </div>

             <div className="p-4 h-[500px] overflow-y-auto bg-[#0d0d10]" onDragOver={e => e.preventDefault()} onDrop={handleDropOnInventory}>
                 {groupedInventory.length === 0 ? (
                     <div className="h-full flex items-center justify-center text-slate-700 italic font-serif">Satchel is empty.</div>
                 ) : (
                     <div className="grid grid-cols-5 gap-2 content-start">
                         {groupedInventory.map((group, idx) => {
                             const { item, count, allItems } = group;
                             const isLegendary = item.rarity === 'LEGENDARY';
                             const isRare = item.rarity === 'RARE';
                             const isUncommon = item.rarity === 'UNCOMMON';
                             return (
                                 <div 
                                     key={`${item.id}_${idx}`}
                                     className={`
                                         relative aspect-square border bg-black/40 cursor-grab active:cursor-grabbing group hover:bg-white/5 transition-colors
                                         flex items-center justify-center
                                         ${isLegendary ? 'border-amber-500/60 bg-amber-900/10' : 
                                           isRare ? 'border-blue-500/60 bg-blue-900/10' : 
                                           isUncommon ? 'border-green-500/60 bg-green-900/10' : 'border-[#333]'}
                                     `}
                                     draggable
                                     onDragStart={(e) => handleDragStart(e, allItems[0])}
                                     onClick={() => item.type === 'POTION' ? onUse(allItems[0]) : onEquip(allItems[0])}
                                     onContextMenu={(e) => { e.preventDefault(); item.type === 'POTION' ? onUse(allItems[0]) : onEquip(allItems[0]); }}
                                     onMouseEnter={(e) => onHover(item, e)}
                                     onMouseLeave={() => onHover(null)}
                                 >
                                     <span className="text-2xl filter drop-shadow-md">{item.icon}</span>
                                     {count > 1 && <div className="absolute bottom-0 right-0 bg-black/80 text-white text-[9px] font-bold px-1">{count}</div>}
                                     {item.type === 'POTION' && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_red]"></div>}
                                 </div>
                             );
                         })}
                         {Array.from({ length: Math.max(0, 25 - groupedInventory.length) }).map((_, i) => (
                             <div key={`empty_${i}`} className="aspect-square border border-[#222] bg-black/20" />
                         ))}
                     </div>
                 )}
             </div>
             
             <div className="p-2 border-t border-[#333] bg-[#0d0d10] text-center">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Right Click to Use</p>
             </div>
        </div>
    );
};

const updateCharacterStats = (char: Character, item: Item, isEquipping: boolean): Character => {
    const mod = isEquipping ? 1 : -1;
    const stats = item.stats || {};
    
    // HP and Mana logic: changing max affects max. Current is clamped.
    const newMaxHp = char.maxHp + (stats.hp || 0) * mod;
    const newMaxMana = char.maxMana + (stats.mana || 0) * mod;
    
    return {
        ...char,
        maxHp: newMaxHp,
        hp: Math.min(char.hp, newMaxHp), // Clamp HP if max decreases
        maxMana: newMaxMana,
        mana: Math.min(char.mana, newMaxMana),
        attack: char.attack + (stats.atk || 0) * mod,
        defense: char.defense + (stats.def || 0) * mod,
        magic: char.magic + (stats.mag || 0) * mod,
        crit: char.crit + (stats.crit || 0) * mod,
        attributes: {
            str: char.attributes.str + (stats.str || 0) * mod,
            dex: char.attributes.dex + (stats.dex || 0) * mod,
            vit: char.attributes.vit + (stats.vit || 0) * mod,
            int: char.attributes.int + (stats.int || 0) * mod,
            cha: char.attributes.cha + (stats.cha || 0) * mod,
        }
    };
};

const calculateDamage = (attackerAtk: number, defenderDef: number, multiplier: number = 1): number => {
    // Basic Formula: Damage = (Atk * Multiplier) - (Def * 0.5)
    // Randomized variance +/- 20%
    const base = (attackerAtk * multiplier) - (defenderDef * 0.5);
    const variance = 0.8 + Math.random() * 0.4;
    return Math.max(1, Math.floor(base * variance));
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [gameState, setGameState] = useState<'CREATION' | 'ADVENTURE' | 'GAME_OVER'>('CREATION');
  
  // Independent Window States
  const [showInventory, setShowInventory] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  
  // Tooltip State
  const [hoveredItem, setHoveredItem] = useState<{ item: Item, x: number, y: number } | null>(null);

  // Lifted Drag State for interaction between windows
  const [dragItem, setDragItem] = useState<{ item: Item, source: DragSourceType } | null>(null);
  
  const [creationName, setCreationName] = useState('');
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);

  const [character, setCharacter] = useState<Character | null>(null);
  const [visitedRooms, setVisitedRooms] = useState<Record<string, Room>>({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [isCombatActive, setIsCombatActive] = useState(false);
  
  // COMBAT STATE (Action Gauge)
  const [playerAtb, setPlayerAtb] = useState(0); // 0 to 100
  const [enemyAtb, setEnemyAtb] = useState(0); // 0 to 100
  
  // Refs for Combat Loop to access latest state without staleness
  const characterRef = useRef<Character | null>(null);
  const enemyRef = useRef<Enemy | null>(null);
  const combatStateRef = useRef({ 
      playerAtb: 0, 
      enemyAtb: 0, 
      lastTick: 0,
      isActive: false
  });
  
  const combatFrameRef = useRef<number>(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [logs, setLogs] = useState<string[]>(["A new soul awakens..."]);
  const [biome, setBiome] = useState(BIOMES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Loot Particle State
  const [lootVisuals, setLootVisuals] = useState<LootVisual[]>([]);
  const [lootNotifications, setLootNotifications] = useState<LootNotification[]>([]);

  // Sync Refs
  useEffect(() => { characterRef.current = character; }, [character]);
  useEffect(() => { enemyRef.current = currentEnemy; }, [currentEnemy]);
  useEffect(() => { combatStateRef.current.isActive = isCombatActive; }, [isCombatActive]);

  // --- AUTH & CLOUD SAVE ---

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        
        if (currentUser) {
            await loadGame(currentUser.uid);
        } else {
            // Reset to defaults if logged out
            setCharacter(null);
            setGameState('CREATION');
        }
    });
    return () => unsubscribe();
  }, []);

  const loadGame = async (uid: string) => {
      setIsLoading(true);
      try {
          // CLOUD LOAD: Replaces localStorage logic
          const docRef = doc(db, "users", uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.character) {
                  // Rehydrate data
                  setCharacter(data.character);
                  setVisitedRooms(data.visitedRooms || {});
                  // If they were in adventure, restore state
                  if (data.character.hp > 0) {
                       setGameState('ADVENTURE');
                       // Restore room logic could go here, but starting fresh room might be safer to prevent stuck states
                  }
              }
          }
      } catch (err) {
          console.error("Failed to load save:", err);
      } finally {
          setIsLoading(false);
      }
  };

  const saveGame = useCallback((force: boolean = false) => {
      if (!user || !characterRef.current) return;
      
      const saveData = {
          character: characterRef.current,
          visitedRooms,
          lastSaved: Date.now()
      };

      const doSave = async () => {
          setIsSaving(true);
          try {
              // CLOUD SAVE: Syncs to Firestore
              // Fix: Firestore rejects 'undefined' values. JSON stringify/parse removes undefined keys.
              const cleanData = JSON.parse(JSON.stringify(saveData));
              await setDoc(doc(db, "users", user.uid), cleanData, { merge: true });
          } catch (e) {
              console.error("Cloud Save Failed", e);
          } finally {
              setIsSaving(false);
          }
      };

      if (force) {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          doSave();
      } else {
          // Debounce save (e.g., don't save every frame of combat, save after events)
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(doSave, 2000);
      }
  }, [user, visitedRooms]);

  // Auto-save on major state changes
  useEffect(() => {
      if (gameState === 'ADVENTURE' && character) {
          saveGame();
      }
  }, [character?.gold, character?.inventory, character?.xp, currentRoom, gameState, saveGame]);


  // --- GAME LOGIC ---

  const handleItemHover = (item: Item | null, e?: React.MouseEvent) => {
      if (!item || !e) {
          setHoveredItem(null);
          return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredItem({
          item,
          x: rect.left + rect.width / 2,
          y: rect.top
      });
  };

  // Loot Particle Animation Loop
  useEffect(() => {
    if (lootVisuals.length === 0) return;
    const timer = requestAnimationFrame(() => {
       setLootVisuals(prev => prev.map(p => ({
           ...p,
           x: p.x + p.vx,
           y: p.y + p.vy,
           vy: p.vy + 0.1, // Gravity
           life: p.life - 0.02
       })).filter(p => p.life > 0));
    });
    return () => cancelAnimationFrame(timer);
  }, [lootVisuals]);

  // Trigger function for visual effects
  const triggerLootDrop = (items: Item[], gold: number) => {
    const newParticles: LootVisual[] = [];
    const centerX = 50; 
    const centerY = 40; 
    const goldCount = Math.min(12, Math.floor(gold / 10) + 3);
    for (let i = 0; i < goldCount; i++) {
        newParticles.push({
            id: Math.random(),
            x: centerX,
            y: centerY,
            vx: (Math.random() - 0.5) * 0.8, 
            vy: (Math.random() * -1.5) - 0.5, 
            icon: '🪙',
            life: 1.0 + Math.random() * 0.5,
            color: '#fbbf24',
            scale: 0.5 + Math.random() * 0.5
        });
    }
    items.forEach(item => {
        newParticles.push({
            id: Math.random(),
            x: centerX,
            y: centerY,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() * -2.0) - 1.0, 
            icon: item.icon || '📦',
            life: 2.0,
            color: item.rarity === 'LEGENDARY' ? '#f59e0b' : item.rarity === 'RARE' ? '#60a5fa' : '#e5e7eb',
            scale: 1.2
        });
    });
    setLootVisuals(prev => [...prev, ...newParticles]);
  };

  const triggerLootShowcase = (items: Item[]) => {
      const newNotifs = items.map(item => ({
          id: Math.random().toString(36).substr(2, 9),
          item
      }));
      setLootNotifications(prev => [...prev, ...newNotifs]);
      newNotifs.forEach((n, index) => {
          setTimeout(() => {
              setLootNotifications(prev => prev.filter(x => x.id !== n.id));
          }, 4000 + (index * 500));
      });
  };

  // Adventure Start
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
  }, [gameState, currentRoom]); // Added currentRoom dep to prevent loop but ensure load

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
      inventory: [
          { id: 'start_pot_1', name: 'Minor Health Potion', type: 'POTION', rarity: 'COMMON', value: 10, description: 'Restores 40 HP', weightClass: 'NONE', effect: { type: 'HEAL', value: 40 }, icon: '🧪' },
          { id: 'start_pot_2', name: 'Minor Health Potion', type: 'POTION', rarity: 'COMMON', value: 10, description: 'Restores 40 HP', weightClass: 'NONE', effect: { type: 'HEAL', value: 40 }, icon: '🧪' }
      ],
      equipment: {
          HELM: null, CHEST: null, GLOVES: null, BOOTS: null, 
          OFFHAND: null, AMULET: null, BELT: null, 
          RING1: null, RING2: null, WEAPON: null
      },
      statusEffects: []
    };
    setCharacter(newHero);
    setSkills(data.skills.map(id => ({ ...SKILL_LIBRARY[id] })));
    setGameState('ADVENTURE');
    setVisitedRooms({});
  };

  const handleRestart = () => {
      // Cloud logic: Clear specific user data or just reset state?
      // For permadeath feel, we should wipe the save.
      if (user) {
          setDoc(doc(db, "users", user.uid), { character: null }, { merge: true });
      }
      setCharacter(null);
      setCurrentRoom(null);
      setVisitedRooms({});
      setGameState('CREATION');
      setLogs(["A new soul awakens..."]);
  };

  // --- COMBAT LOGIC ---

  const processStatusEffects = (entity: Character | Enemy, deltaTime: number): { updatedEntity: any, damageTaken: number } => {
      let damageTaken = 0;
      const updatedEffects: StatusEffect[] = [];
      entity.statusEffects.forEach(effect => {
          effect.duration -= deltaTime;
          if (effect.type === 'POISON' || effect.type === 'BURN') {
              const tickDamage = (effect.value * deltaTime) / 1000;
              damageTaken += tickDamage;
          }
          if (effect.duration > 0) {
              updatedEffects.push(effect);
          }
      });
      return {
          updatedEntity: { ...entity, statusEffects: updatedEffects },
          damageTaken
      };
  };

  const getStatusMultiplier = (effects: StatusEffect[], type: 'SPEED' | 'DAMAGE'): number => {
      let mult = 1;
      effects.forEach(e => {
          if (type === 'SPEED' && e.type === 'SLOW') mult *= (1 - e.value); 
          if (type === 'SPEED' && e.type === 'STUN') mult = 0;
      });
      return mult;
  };

  // Physics-based Combat Loop
  const combatLoop = (time: number) => {
    if (!combatStateRef.current.isActive) return;
    
    // Initialize tick
    if (combatStateRef.current.lastTick === 0) {
        combatStateRef.current.lastTick = time;
        combatFrameRef.current = requestAnimationFrame(combatLoop);
        return;
    }

    const deltaTime = time - combatStateRef.current.lastTick;
    combatStateRef.current.lastTick = time;

    // Use Refs for latest state to avoid stale closures
    const char = characterRef.current;
    const enemy = enemyRef.current;

    if (!char || !enemy) {
         combatFrameRef.current = requestAnimationFrame(combatLoop);
         return;
    }

    // Logic Variables
    let nextChar = { ...char };
    let nextEnemy = { ...enemy };
    let stateChanged = false;

    // 1. Process DoTs
    const charProcess = processStatusEffects(nextChar, deltaTime);
    const enemyProcess = processStatusEffects(nextEnemy, deltaTime);
    
    nextChar = charProcess.updatedEntity;
    nextChar.hp -= charProcess.damageTaken;
    nextEnemy = enemyProcess.updatedEntity;
    nextEnemy.hp -= enemyProcess.damageTaken;

    if (charProcess.damageTaken > 0 || enemyProcess.damageTaken > 0) stateChanged = true;

    // 2. Process ATB
    // Slower Pacing Formula: Speed = % fill per second
    // Player Base: 10 + (DEX * 0.8) 
    // Example: 10 DEX = 18 Speed (5.5s turn). 20 DEX = 26 Speed (3.8s turn).
    const charSpeed = 10 + (nextChar.attributes.dex * 0.8);
    // Enemy: Fallback or from stats. 
    const enemySpeed = nextEnemy.speed || 15; 
    
    const charSpeedMult = getStatusMultiplier(nextChar.statusEffects, 'SPEED');
    const enemySpeedMult = getStatusMultiplier(nextEnemy.statusEffects, 'SPEED');

    // DeltaTime is ms. divide by 1000 to get seconds.
    // Speed is %/sec. 
    let pAtb = combatStateRef.current.playerAtb + (charSpeed * charSpeedMult * (deltaTime / 1000));
    let eAtb = combatStateRef.current.enemyAtb + (enemySpeed * enemySpeedMult * (deltaTime / 1000));

    // Player Auto Attack (Idle)
    if (pAtb >= 100) {
        pAtb = 0;
        const dmg = calculateDamage(char.attack, 5);
        nextEnemy.hp -= dmg;
        stateChanged = true;
    }

    // Enemy Auto Attack
    if (eAtb >= 100 && nextEnemy.hp > 0) {
        eAtb = 0;
        const dmg = calculateDamage(enemy.attack, char.defense);
        nextChar.hp -= dmg;
        stateChanged = true;
    }

    // Update Local Refs
    combatStateRef.current.playerAtb = pAtb;
    combatStateRef.current.enemyAtb = eAtb;

    // Commit to React State if necessary
    if (stateChanged) {
        // Check Death
        if (nextChar.hp <= 0) {
             setGameState('GAME_OVER');
             setIsCombatActive(false);
             return; 
        }
        // Enemy death handled in useEffect to avoid loop sync issues, but we set HP here
        setCharacter(nextChar);
        setCurrentEnemy(nextEnemy);
    }
    
    // Always update ATB state for UI animation
    setPlayerAtb(Math.min(100, pAtb));
    setEnemyAtb(Math.min(100, eAtb));

    combatFrameRef.current = requestAnimationFrame(combatLoop);
  };

  // Start/Stop Combat Loop
  useEffect(() => {
      if (isCombatActive) {
          combatStateRef.current.lastTick = 0;
          combatStateRef.current.playerAtb = 0;
          combatStateRef.current.enemyAtb = 0;
          combatFrameRef.current = requestAnimationFrame(combatLoop);
      } else {
          cancelAnimationFrame(combatFrameRef.current);
          setPlayerAtb(0);
          setEnemyAtb(0);
      }
      return () => cancelAnimationFrame(combatFrameRef.current);
  }, [isCombatActive]);

  // Separate Effect to handle Victory Condition when Enemy HP hits 0
  useEffect(() => {
      if (isCombatActive && currentEnemy && currentEnemy.hp <= 0) {
          handleVictory(currentEnemy);
      }
  }, [currentEnemy, isCombatActive]);

  const handleVictory = (enemy: Enemy) => {
    setIsCombatActive(false);
    addLog(`The ${enemy.name} has been vanquished.`);
    
    const drops = Gemini.generateLoot(currentRoom?.depth || 1, 'ENEMY');
    if (drops.length > 0) {
        addLog(`Looted ${drops.map(d => d.name).join(', ')}`);
        triggerLootDrop(drops, enemy.rewardGold);
        triggerLootShowcase(drops);
    } else {
        triggerLootDrop([], enemy.rewardGold);
    }

    setCharacter(prev => {
      if (!prev) return null;
      let nextXp = prev.xp + enemy.rewardXp;
      let level = prev.level;
      let xpToNext = prev.xpToNext;
      if (nextXp >= xpToNext) {
        level++; nextXp -= xpToNext; xpToNext = Math.floor(xpToNext * 1.5);
        addLog(`Power surges through you. Level ${level} reached.`);
        return { 
            ...prev, 
            xp: nextXp, level, xpToNext, 
            gold: prev.gold + enemy.rewardGold, 
            hp: prev.maxHp, mana: prev.maxMana,
            statusEffects: [], 
            inventory: [...prev.inventory, ...drops]
        };
      }
      return { 
          ...prev, 
          xp: nextXp, level, xpToNext, 
          gold: prev.gold + enemy.rewardGold,
          statusEffects: [],
          inventory: [...prev.inventory, ...drops]
      };
    });
  };

  const useSkill = (skill: Skill) => {
    if (!character || !isCombatActive || !currentEnemy) return;
    if (character.mana < skill.manaCost) return;
    const now = Date.now();
    if (now - skill.lastUsed < skill.cooldown) return;
    
    // 1. Pay Cost & Cooldown
    const nextChar = { ...character, mana: character.mana - skill.manaCost };
    
    // 2. Calculate Effect
    let damage = 0;
    if (skill.damageMult > 0) {
        const baseStat = skill.id === 'nova' || skill.id === 'smite' ? nextChar.magic : nextChar.attack;
        damage = calculateDamage(baseStat, 0, skill.damageMult);
    }

    // 3. Apply Self Effects
    if (skill.id === 'ward') {
        nextChar.mana = Math.min(nextChar.maxMana, nextChar.mana + 15);
        nextChar.statusEffects = [];
        addLog("Runic Ward clears your mind.");
    }

    // 4. Update State
    setCharacter(nextChar);
    setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, lastUsed: now } : s));

    // 5. Update Enemy
    const nextEnemy = { ...currentEnemy };
    nextEnemy.hp = Math.max(0, nextEnemy.hp - damage);
    
    if (skill.applyEffect) {
        // Simple logic for adding effect
        const newId = Math.random().toString(36).substr(2, 5);
        nextEnemy.statusEffects = [...nextEnemy.statusEffects.filter(e => e.type !== skill.applyEffect!.type), {
            id: newId,
            type: skill.applyEffect.type,
            duration: skill.applyEffect.duration,
            value: skill.applyEffect.value,
            source: 'PLAYER'
        }];
        addLog(`${skill.name} applied ${skill.applyEffect.type}!`);
    }

    if (damage > 0) addLog(`${skill.name} deals ${damage} damage!`);
    setCurrentEnemy(nextEnemy);
  };

  const handleEquip = (item: Item, targetSlot?: EquipmentSlot) => {
    if (!character) return;
    let slot: EquipmentSlot | null = null;
    
    if (targetSlot) {
        slot = targetSlot;
    } else {
        // Auto-determine
        if (item.type === 'RING') {
            if (!character.equipment.RING1) slot = 'RING1';
            else if (!character.equipment.RING2) slot = 'RING2';
            else slot = 'RING1'; 
        } else if (['HELM', 'CHEST', 'GLOVES', 'BOOTS', 'OFFHAND', 'AMULET', 'BELT', 'WEAPON'].includes(item.type)) {
            slot = item.type as EquipmentSlot;
        }
    }

    if (!slot) return;
    const currentEquip = character.equipment[slot];
    let newChar = { ...character };
    newChar.inventory = newChar.inventory.filter(i => i.id !== item.id);
    if (currentEquip) {
        newChar = updateCharacterStats(newChar, currentEquip, false); 
        newChar.inventory.push(currentEquip);
    }
    newChar = updateCharacterStats(newChar, item, true);
    newChar.equipment[slot] = item;
    setCharacter(newChar);
    addLog(`Equipped ${item.name}.`);
  };

  const handleUnequip = (slot: EquipmentSlot) => {
      if (!character || !character.equipment[slot]) return;
      const item = character.equipment[slot]!;
      let newChar = { ...character };
      newChar = updateCharacterStats(newChar, item, false); 
      newChar.equipment[slot] = null;
      newChar.inventory.push(item);
      setCharacter(newChar);
      addLog(`Unequipped ${item.name}.`);
  };

  const handleUseItem = (item: Item) => {
      if (!character) return;
      if (item.type === 'POTION') {
          let newChar = { ...character };
          if (item.effect?.type === 'HEAL') {
              const heal = item.effect.value;
              newChar.hp = Math.min(newChar.maxHp, newChar.hp + heal);
              addLog(`Used ${item.name}. Healed for ${heal} HP.`);
          } else if (item.effect?.type === 'MANA') {
              const mana = item.effect.value;
              newChar.mana = Math.min(newChar.maxMana, newChar.mana + mana);
              addLog(`Used ${item.name}. Restored ${mana} Mana.`);
          }
          newChar.inventory = newChar.inventory.filter(i => i.id !== item.id);
          setCharacter(newChar);
      } else {
          handleEquip(item);
      }
  };

  const handleLootChest = () => {
      if (!currentRoom?.encounterData?.loot || !character) return;
      const items = currentRoom.encounterData.loot;
      const gold = currentRoom.encounterData.goldReward || 0;
      
      const newChar = { ...character, gold: character.gold + gold, inventory: [...character.inventory, ...items] };
      setCharacter(newChar);
      
      triggerLootDrop(items, gold); 
      triggerLootShowcase(items); 

      const updatedRoom = { 
          ...currentRoom, 
          encounterData: { ...currentRoom.encounterData, loot: undefined, chestOpened: true },
          description: "An empty chest sits here, its treasures claimed."
      };
      setCurrentRoom(updatedRoom);
      setVisitedRooms(prev => ({ ...prev, [`${updatedRoom.x},${updatedRoom.y}`]: updatedRoom }));
      
      addLog(`Looted ${items.map(i => i.name).join(', ')} and ${gold} Gold!`);
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
            setCurrentEnemy({ ...enemy, statusEffects: [] });
            setIsCombatActive(true);
            setPlayerAtb(0);
            setEnemyAtb(0);
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

  // --- RENDER ---

  if (authLoading) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center text-slate-500 font-serif">
              <div className="animate-pulse">CONNECTING TO AETHER...</div>
          </div>
      );
  }

  if (!user) {
      return <AuthScreen />;
  }

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
                <div className="flex gap-4 items-center">
                    <button onClick={() => auth.signOut()} className="text-[10px] uppercase tracking-[0.4em] font-black text-red-500 hover:text-red-300 transition-colors py-2 px-4">
                        Logout
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (gameState === 'GAME_OVER') {
      return (
          <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center font-serif text-slate-200">
             <div className="absolute inset-0 bg-red-950/20 pointer-events-none"></div>
             <h1 className="text-8xl exocet-font text-red-600 tracking-[0.2em] mb-4 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)] animate-in fade-in zoom-in duration-1000">YOU DIED</h1>
             <p className="text-xl italic text-slate-500 mb-8 font-serif">Your soul fades into the abyss...</p>
             <div className="flex gap-12 mb-12">
                 <div className="text-center">
                     <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-1">Level Reached</div>
                     <div className="text-4xl font-bold text-amber-500">{character?.level}</div>
                 </div>
                 <div className="text-center">
                     <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-1">Gold Collected</div>
                     <div className="text-4xl font-bold text-amber-500">{character?.gold}</div>
                 </div>
             </div>
             <button onClick={handleRestart} className="px-12 py-4 ui-panel border-[#444] hover:border-amber-500 text-slate-300 hover:text-amber-100 transition-all uppercase tracking-[0.3em] text-sm font-bold z-10">
                 Try Again
             </button>
          </div>
      );
  }

  if (!character) return null;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-serif select-none">
      <BackgroundLayer image={currentRoom?.imageUrl || STATIC_DUNGEON_IMAGE} isLoading={isLoading} />
      
      {/* Save Indicator */}
      {isSaving && (
          <div className="absolute top-4 right-4 z-[300] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-[10px] text-amber-500 uppercase tracking-widest font-black">Syncing</span>
          </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
             <div className="text-6xl text-amber-500 animate-pulse exocet-font mb-4 tracking-[0.5em]">ᚠᚢᚦᚨᚱᚲ</div>
             <div className="exocet-font text-xl text-slate-500 tracking-[0.2em] uppercase">Divining the Path</div>
        </div>
      )}

      {/* Loot Visual Layer */}
      <div className="absolute inset-0 pointer-events-none z-[200] overflow-hidden">
        {lootVisuals.map(p => (
            <div 
                key={p.id}
                className="absolute text-4xl drop-shadow-md transition-opacity"
                style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    opacity: p.life,
                    transform: `scale(${p.scale})`,
                    color: p.color
                }}
            >
                {p.icon}
            </div>
        ))}
      </div>

      {/* LOOT SHOWCASE */}
      <div className="absolute top-1/2 -translate-y-1/2 right-[20%] z-[150] flex flex-col items-end gap-2 pointer-events-none">
          {lootNotifications.map(note => (
              <div 
                  key={note.id} 
                  className={`loot-toast relative w-64 bg-[#0a0a0c] border p-3 rounded shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center gap-3 overflow-hidden
                    ${note.item.rarity === 'LEGENDARY' ? 'border-amber-500/60' : 
                      note.item.rarity === 'RARE' ? 'border-blue-500/60' : 
                      note.item.rarity === 'UNCOMMON' ? 'border-green-500/60' : 'border-[#333]'}
                  `}
              >
                   {/* Background Gradient */}
                   <div className={`absolute inset-0 opacity-20 bg-gradient-to-r 
                        ${note.item.rarity === 'LEGENDARY' ? 'from-amber-900 via-amber-600/20 to-transparent' : 
                          note.item.rarity === 'RARE' ? 'from-blue-900 via-blue-600/20 to-transparent' : 
                          note.item.rarity === 'UNCOMMON' ? 'from-green-900 via-green-600/20 to-transparent' : 'from-slate-800 to-transparent'}
                   `}></div>
                   
                   {/* Icon */}
                   <div className={`relative z-10 w-10 h-10 flex items-center justify-center text-2xl bg-black/40 rounded border shadow-inner
                        ${note.item.rarity === 'LEGENDARY' ? 'border-amber-500/50 text-amber-500' : 
                          note.item.rarity === 'RARE' ? 'border-blue-500/50 text-blue-400' : 
                          note.item.rarity === 'UNCOMMON' ? 'border-green-500/50 text-green-500' : 'border-slate-700 text-slate-400'}
                   `}>
                       {note.item.icon}
                   </div>

                   {/* Text */}
                   <div className="relative z-10 flex-1 min-w-0">
                       <div className={`text-xs font-black uppercase tracking-wider truncate
                            ${note.item.rarity === 'LEGENDARY' ? 'text-amber-100' : 'text-slate-200'}
                       `}>{note.item.name}</div>
                       <div className={`text-[9px] font-bold uppercase tracking-[0.1em]
                            ${note.item.rarity === 'LEGENDARY' ? 'text-amber-500' : 
                              note.item.rarity === 'RARE' ? 'text-blue-400' : 
                              note.item.rarity === 'UNCOMMON' ? 'text-green-500' : 'text-slate-500'}
                       `}>{note.item.rarity} {note.item.type}</div>
                   </div>
              </div>
          ))}
      </div>

      {showEquipment && (
          <EquipmentWindow 
              character={character} 
              onEquip={handleEquip} 
              onUnequip={handleUnequip} 
              onClose={() => setShowEquipment(false)} 
              dragItem={dragItem}
              setDragItem={setDragItem}
              onHover={handleItemHover}
          />
      )}

      {showInventory && (
          <InventoryWindow 
              character={character} 
              onEquip={handleEquip} 
              onUnequip={handleUnequip} 
              onUse={handleUseItem}
              onClose={() => setShowInventory(false)} 
              dragItem={dragItem}
              setDragItem={setDragItem}
              onHover={handleItemHover}
          />
      )}
      
      {/* Global Fixed Tooltip */}
      {hoveredItem && (
          <ItemTooltip item={hoveredItem.item} position={{ x: hoveredItem.x, y: hoveredItem.y }} />
      )}

      {/* COMPACT HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between z-50 pointer-events-none">
         <div className="flex items-start gap-4 pointer-events-auto">
             <div className="relative">
                 <div className="w-16 h-16 ui-panel rounded border-[#444] shadow-xl flex items-center justify-center overflow-hidden">
                      <div className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{CLASS_DATA[character.classType].icon}</div>
                 </div>
                 {/* Status Effects Container */}
                 <div className="absolute top-full left-0 mt-2 flex gap-1">
                     {character.statusEffects.map(effect => (
                         <StatusIcon key={effect.id} type={effect.type} duration={effect.duration} />
                     ))}
                 </div>
             </div>
             
             <div className="flex flex-col gap-2">
                  <div className="ui-panel bg-black/80 border-[#333] px-5 py-1.5 rounded-sm flex items-center gap-3">
                      <span className="text-amber-100 font-bold tracking-[0.2em] text-lg uppercase exocet-font rune-glow-gold">{character.name}</span>
                      <div className="h-4 w-[1px] bg-white/10"></div>
                      <span className="text-[10px] text-slate-500 font-black tracking-[0.15em] uppercase">LV {character.level} {character.classType}</span>
                  </div>
                  <div className="ui-panel bg-black/90 border-[#333] p-4 flex items-center gap-6 rounded-sm shadow-xl">
                      <div className="flex flex-col w-32">
                          <div className="flex justify-between text-[9px] font-black mb-1.5 text-red-500 tracking-[0.1em] uppercase">
                             <span>HP</span> <span className="text-[10px]">{Math.floor(character.hp)} / {character.maxHp}</span>
                          </div>
                          <div className="h-2 bg-black/50 border border-white/5 rounded-full overflow-hidden bar-shimmer">
                             <div className="h-full bg-gradient-to-r from-red-950 to-red-600 shadow-[0_0_8px_rgba(255,0,0,0.4)] transition-all duration-500" style={{width: `${(character.hp / character.maxHp)*100}%`}}></div>
                          </div>
                      </div>
                      <div className="flex flex-col w-32">
                          <div className="flex justify-between text-[9px] font-black mb-1.5 text-blue-500 tracking-[0.1em] uppercase">
                             <span>MP</span> <span className="text-[10px]">{Math.floor(character.mana)} / {character.maxMana}</span>
                          </div>
                          <div className="h-2 bg-black/50 border border-white/5 rounded-full overflow-hidden bar-shimmer">
                             <div className="h-full bg-gradient-to-r from-blue-950 to-blue-600 shadow-[0_0_8px_rgba(0,0,255,0.4)] transition-all duration-500" style={{width: `${(character.mana / character.maxMana)*100}%`}}></div>
                          </div>
                      </div>
                      <div className="flex flex-col w-40">
                          <ActionGauge value={playerAtb} color="bg-amber-400" label="AUTO ATTACK" />
                      </div>
                      <div className="flex items-center gap-2 text-amber-500 font-black text-3xl tracking-[0.05em] ml-2">
                         <span className="rune-glow-gold text-2xl">◎</span> <span>{character.gold}</span>
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
                 <button className="px-5 ui-panel bg-[#1a1a20] border-[#444] text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] hover:text-white hover:border-amber-600 transition-all rounded shadow-lg opacity-50 cursor-not-allowed">Skills</button>
                 <button onClick={() => setShowEquipment(!showEquipment)} className={`px-5 ui-panel border-[#444] text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:border-amber-600 transition-all rounded shadow-lg ${showEquipment ? 'bg-amber-900/40 text-amber-100 border-amber-600' : 'bg-[#1a1a20] text-amber-500'}`}>Equip</button>
                 <button onClick={() => setShowInventory(!showInventory)} className={`px-5 ui-panel border-[#444] text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:border-amber-600 transition-all rounded shadow-lg ${showInventory ? 'bg-amber-900/40 text-amber-100 border-amber-600' : 'bg-[#1a1a20] text-amber-500'}`}>Bag</button>
                 <button onClick={() => { auth.signOut(); }} className="px-5 ui-panel bg-[#1a1a20] border-[#444] text-[10px] text-red-500 font-black uppercase tracking-[0.2em] hover:text-white hover:border-red-600 transition-all rounded shadow-lg">Exit</button>
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
                    {currentRoom?.encounterType === EncounterType.TREASURE && !currentRoom.encounterData?.chestOpened && (
                        <div className="mt-4 pointer-events-auto">
                            <button onClick={handleLootChest} className="px-8 py-3 bg-amber-900/40 border border-amber-600/50 text-amber-100 uppercase font-black tracking-widest hover:bg-amber-800/60 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse">
                                Open Chest
                            </button>
                        </div>
                    )}
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
                 <div className="mb-12 text-center w-full relative">
                    <div className="text-red-600 text-[9px] tracking-[0.8em] uppercase mb-4 font-black animate-pulse">MALIGNANT ESSENCE</div>
                    <h1 className="text-4xl exocet-font text-red-50 drop-shadow-[0_0_30px_rgba(255,0,0,0.5)] uppercase tracking-[0.2em] mb-8">{currentEnemy?.name}</h1>
                    
                    {/* Enemy Status Icons */}
                    <div className="absolute top-0 right-0 flex flex-col gap-1">
                        {currentEnemy?.statusEffects.map(effect => (
                             <StatusIcon key={effect.id} type={effect.type} duration={effect.duration} />
                        ))}
                    </div>

                    <div className="w-[600px] h-3 bg-black/90 border border-red-900/40 rounded-full overflow-hidden mx-auto shadow-xl bar-shimmer">
                         <div className="h-full bg-gradient-to-r from-red-950 to-red-600 transition-all duration-300" style={{ width: `${((currentEnemy?.hp || 0) / (currentEnemy?.maxHp || 1))*100}%` }}></div>
                    </div>
                    
                    {/* Enemy Action Bar */}
                    <div className="w-[400px] mx-auto mt-4">
                         <ActionGauge value={enemyAtb} color="bg-red-500" label="ENEMY ACTION" />
                    </div>

                    <div className="mt-4 text-red-500/80 font-black text-[10px] tracking-[0.4em] uppercase font-mono">{Math.floor(currentEnemy?.hp || 0)} ESSENCE REMAINING</div>
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
