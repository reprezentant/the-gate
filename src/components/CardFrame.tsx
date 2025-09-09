// import React not required with new JSX transform
import { CARDS } from '../game/cards';
import type { MinionCard } from '../game/types';
import { motion } from 'framer-motion';
import './card-anim.css';
import heartUrl from '../assets/icons/hearth.svg';
import attackUrl from '../assets/icons/attack.svg';
import getCardImageById from '../game/cardImages';

interface CardFrameProps { id: string; playable?: boolean; pending?: boolean; marked?: boolean; selectable?: boolean; onClick?: () => void; handIndex?: number; mulliganMode?: boolean; }

export const CardFrame: React.FC<CardFrameProps> = ({ id, playable, pending, marked, selectable, onClick, handIndex, mulliganMode }) => {
  const c = CARDS[id];
  const isMinion = c.type === 'MINION';
  const typeClass = c.type === 'MINION'
    ? 'from-emerald-500 to-emerald-600 border-emerald-700 text-white'
    : c.type === 'SPELL'
      ? 'from-purple-600 to-purple-700 border-purple-800 text-white'
      : 'from-gray-200 to-gray-300 border-white/10 text-gray-900';
  const costGradId = `cost-${id}-grad`;
  const costStrokeId = `cost-${id}-stroke`;
  const CostHex = ({ value }: { value:number }) => (
    <div className="relative w-8 h-8 -ml-3 -mt-3 select-none" aria-label={`Koszt many: ${value}`}>
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
  // removed stroke gradient (frames simplified)
    const sizeClass = small ? 'w-8 h-8' : 'w-10 h-10';
  const numFont = small ? 18 : 30; // slightly smaller
  return (
      <div className={`relative ${sizeClass} select-none pointer-events-none`}>
        <img src={isAtk ? attackUrl : heartUrl} alt={isAtk ? 'atk' : 'hp'} className="absolute inset-0 w-full h-full object-contain z-10 drop-shadow-[0_2px_7px_rgba(0,0,0,0.55)]" />
        <div className="relative z-20 flex items-center justify-center font-extrabold text-white" style={{ fontSize: numFont, WebkitTextStroke: '1.5px #000', textShadow: 'none', transform: 'translateY(-4px)' }}>{value}</div>
      </div>
    );
  };
  const interactive = playable || selectable;
  const hoverClass = mulliganMode ? (selectable ? 'cursor-pointer' : 'cursor-default opacity-70 grayscale brightness-75 saturate-50') : (interactive ? 'cursor-pointer hover:brightness-105 active:brightness-95' : 'cursor-default opacity-70 grayscale brightness-75 saturate-50');
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
  ${hoverClass}
  duration-120 ease-out
  ${c.type === 'MINION' ? 'bg-gradient-to-b from-emerald-700 to-emerald-600 border-emerald-300/70' : 'bg-gradient-to-b from-purple-800 to-purple-700 border-purple-300/70'} shadow-sm`}
  data-hand-idx={handIndex}
    >
  <div className="relative z-20 flex justify-between items-start text-[14px] font-semibold">
    <CostHex value={c.manaCost} />
      </div>
  {/* Artwork placeholder: positioned to slightly protrude above the card top */}
  <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-[90%] flex items-center justify-center z-0 pointer-events-none">
    {(() => {
      const img = getCardImageById(c.id);
  if (img) return <img src={img} alt={c.name} className="w-full h-24 object-contain rounded-md bg-transparent" />;
  return <div className="w-full h-24 rounded-md bg-gradient-to-b from-white/90 to-white/70 flex items-center justify-center text-sm font-semibold text-gray-600">ART</div>;
    })()}
  </div>
  <div className="text-[18px] font-extrabold text-center leading-tight px-1 tracking-wide mt-14 drop-shadow-sm">{c.name}</div>
  {c.text && (
  <div className="mt-2 text-[13px] text-white/90 leading-snug px-1 font-medium line-clamp-3 min-h-[2.5rem] text-center">
      {c.text}
    </div>
  )}
      {isMinion && (
        <>
          <div className="absolute -left-3 -bottom-3 flex items-end pointer-events-none">
            <div className="scale-[0.85] origin-bottom-left drop-shadow-[0_2px_7px_rgba(0,0,0,0.55)]"><StatHex kind="ATK" value={(c as MinionCard).attack} /></div>
          </div>
          <div className="absolute -right-3 -bottom-3 flex items-end pointer-events-none">
            <div className="scale-[0.85] origin-bottom-right drop-shadow-[0_2px_7px_rgba(0,0,0,0.55)]"><StatHex kind="HP" value={(c as MinionCard).health} /></div>
          </div>
        </>
      )}
  {playable && c.type === 'MINION' && <div className="absolute -inset-[3px] rounded-xl ring-2 ring-emerald-300 animate-softPulseMinor pointer-events-none" />}
  {playable && c.type === 'SPELL' && !pending && <div className="absolute -inset-[3px] rounded-xl ring-2 ring-purple-300 animate-softPulseSpell pointer-events-none" />}
  {pending && <div className="absolute -inset-1 rounded-xl ring-4 ring-purple-300 shadow-[0_0_14px_#7e22ce] animate-targetPulse pointer-events-none" />}
  {/* Type label: centered at the very bottom, slightly protruding over the card edge */}
  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 z-30 pointer-events-none">
    <div className={`px-2 py-0.5 rounded-md text-[12px] font-semibold bg-gradient-to-b ${typeClass} border`} style={{ textShadow: 'none' }}>
      {c.type}
    </div>
  </div>
      {mulliganSelected && !pending && (
        <>
          {/* larger negative inset so the orange ring isn't clipped by parent stacking/overflow */}
          <div className="absolute -inset-3 rounded-xl pointer-events-none z-[5] animate-mulliganGlow" />
        </>
      )}
    </motion.div>
  );
};
