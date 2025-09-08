import React from 'react';
import { CARDS } from '../game/cards';
import type { MinionCard } from '../game/types';
import { motion } from 'framer-motion';
import './card-anim.css';

interface CardFrameProps { id: string; playable?: boolean; pending?: boolean; marked?: boolean; selectable?: boolean; onClick?: () => void; handIndex?: number; mulliganMode?: boolean; }

export const CardFrame: React.FC<CardFrameProps> = ({ id, playable, pending, marked, selectable, onClick, handIndex, mulliganMode }) => {
  const c = CARDS[id];
  const isMinion = c.type === 'MINION';
  const costGradId = `cost-${id}-grad`;
  const costStrokeId = `cost-${id}-stroke`;
  const CostHex = ({ value }: { value:number }) => (
    <div className="relative w-8 h-8 -ml-0.5 -mt-0.5 select-none" aria-label={`Koszt many: ${value}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={costGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#102b55" />
            <stop offset="55%" stopColor="#134074" />
            <stop offset="100%" stopColor="#061529" />
          </linearGradient>
          <linearGradient id={costStrokeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7ec9ff" />
            <stop offset="100%" stopColor="#2d74b5" />
          </linearGradient>
          <filter id={`${costGradId}-sh`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodColor="#000" floodOpacity="0.55" />
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#5ebdff" floodOpacity="0.25" />
          </filter>
        </defs>
        <polygon points="50,0 93,25 93,75 50,100 7,75 7,25" fill={`url(#${costGradId})`} opacity="0.95" />
  <polygon points="50,0 93,25 93,75 50,100 7,75 7,25" fill="none" stroke={`url(#${costStrokeId})`} strokeWidth="7" strokeLinejoin="round" filter={`url(#${costGradId}-sh)`} />
  <polygon points="50,4 88,27 88,73 50,96 12,73 12,27" fill="none" stroke="#bfe7ff" strokeWidth="1.8" strokeLinejoin="round" opacity="0.42" />
        <text x="50" y="60" textAnchor="middle" fontSize="54" fontWeight="800" fill="#fff" stroke="#000" strokeWidth="6" paintOrder="stroke" fontFamily="inherit">{value}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="54" fontWeight="800" fill="#fff" fontFamily="inherit">{value}</text>
      </svg>
    </div>
  );
  const StatHex = ({ kind, value, small }: { kind:'ATK'|'HP'; value:number; small?:boolean }) => {
    const isAtk = kind==='ATK';
  const gradId = `${isAtk?'hatk':'hhp'}-grad`;
  // removed stroke gradient (frames simplified)
    const sizeClass = small ? 'w-8 h-8' : 'w-10 h-10';
    const fontSize = small ? 34 : 46;
  return (
      <div className={`relative ${sizeClass} select-none pointer-events-none`}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              {isAtk ? (
                <>
                  <stop offset="0%" stopColor="#fff4dc" />
                  <stop offset="35%" stopColor="#ffd58f" />
                  <stop offset="65%" stopColor="#ffb44a" />
                  <stop offset="100%" stopColor="#7e4105" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#ffe5e7" />
                  <stop offset="35%" stopColor="#ff7d89" />
                  <stop offset="65%" stopColor="#ff3b4d" />
                  <stop offset="100%" stopColor="#93202b" />
                </>
              )}
            </linearGradient>
            <filter id={`${gradId}-sh`} x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.55" />
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={isAtk ? '#ffcf96' : '#ff6d78'} floodOpacity="0.18" />
            </filter>
          </defs>
      <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill={`url(#${gradId})`} opacity="0.93" filter={`url(#${gradId}-sh)`} />
          <text x="50" y="59" textAnchor="middle" fontSize={fontSize} fontWeight="800" fill="#fff" stroke="#000" strokeWidth="6" paintOrder="stroke" fontFamily="inherit" style={{filter:'drop-shadow(0 2px 2px rgba(0,0,0,0.55))'}}>{value}</text>
          <text x="50" y="59" textAnchor="middle" fontSize={fontSize} fontWeight="800" fill="#fff" fontFamily="inherit">{value}</text>
        </svg>
      </div>
    );
  };
  const interactive = playable || selectable;
  const mulliganSelected = !!marked && !!mulliganMode; // stronger explicit flag
  return (
    <motion.div
      // Zastąpiono animacje whileHover / whileTap stabilnymi klasami CSS, aby uniknąć "skakania" przy szybkim najeżdżaniu
      onClick={onClick}
      // Removed mount animation to prevent flicker when hand re-renders
      initial={false}
  aria-pressed={mulliganSelected || undefined}
  data-mulligan-sel={mulliganSelected ? '1' : undefined}
  className={`relative w-[7.4rem] h-44 rounded-xl p-2 flex flex-col font-sans border-[1.5px] transition select-none text-white
  ${interactive ? 'cursor-pointer hover:brightness-105 active:brightness-95' : 'cursor-default opacity-70 grayscale brightness-75 saturate-50'}
  will-change-filter duration-150 ease-out
  ${c.type === 'MINION' ? 'bg-gradient-to-b from-emerald-700 to-emerald-600 border-emerald-300/70' : 'bg-gradient-to-b from-purple-800 to-purple-700 border-purple-300/70'} shadow-sm`}
  data-hand-idx={handIndex}
    >
  <div className="flex justify-between items-start text-[14px] font-semibold">
    <CostHex value={c.manaCost} />
  <span className="text-[13px] font-semibold tracking-wide uppercase text-white/80 leading-none mt-1 pr-0.5">{c.type}</span>
      </div>
  <div className="text-[18px] font-extrabold text-center leading-tight px-1 tracking-wide mt-0.5 drop-shadow-sm">{c.name}</div>
  {c.text && (
  <div className="mt-0.5 text-[13px] text-white/90 leading-snug px-1 font-medium line-clamp-3 min-h-[2.5rem] text-center">
      {c.text}
    </div>
  )}
      {isMinion && (
        <div className="absolute bottom-1 right-1 flex items-end pointer-events-none">
          <div className="scale-[0.85] origin-bottom-right drop-shadow-[0_2px_7px_rgba(0,0,0,0.55)]"><StatHex kind="ATK" value={(c as MinionCard).attack} /></div>
          <div className="scale-[0.85] -ml-2 origin-bottom-right drop-shadow-[0_2px_7px_rgba(0,0,0,0.55)]"><StatHex kind="HP" value={(c as MinionCard).health} /></div>
        </div>
      )}
  {playable && c.type === 'MINION' && <div className="absolute -inset-[3px] rounded-xl ring-2 ring-emerald-300 animate-softPulseMinor pointer-events-none" />}
  {playable && c.type === 'SPELL' && !pending && <div className="absolute -inset-[3px] rounded-xl ring-2 ring-purple-300 animate-softPulseSpell pointer-events-none" />}
  {pending && <div className="absolute -inset-1 rounded-xl ring-4 ring-purple-300 shadow-[0_0_14px_#7e22ce] animate-targetPulse pointer-events-none" />}
      {mulliganSelected && !pending && (
        <>
          <div className="absolute -inset-1 rounded-xl ring-2 ring-amber-300/70 bg-amber-300/10 animate-mulliganGlow pointer-events-none z-[5]" />
          {/* Strong outer soft glow */}
          <div className="absolute -inset-2 rounded-xl pointer-events-none z-[4] opacity-75 mulligan-glow-outer" />
        </>
      )}
    </motion.div>
  );
};
