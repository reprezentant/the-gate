import React from 'react';
import { motion } from 'framer-motion';
import { CARDS, getDisplayName } from '../game/cards';
import type { MinionInstance, MinionCard } from '../game/types';

interface MinionProps { m: MinionInstance; highlighted?: boolean; dimmed?: boolean; isAttacker?: boolean; onClick?: () => void; }

export const Minion: React.FC<MinionProps> = ({ m, highlighted, dimmed, isAttacker, onClick }) => {
  const c = CARDS[m.cardId] as MinionCard;
  const ready = m.canAttack && (!m.justSummoned || c.rush);
  const keywords: string[] = [];
  if (c.taunt) keywords.push('TAUNT');
  if (c.rush) keywords.push('RUSH');

  const StatHex = ({ kind, value }: { kind:'ATK'|'HP'; value:number }) => {
    const isAtk = kind==='ATK';
  const gradId = `${isAtk?'atk':'hp'}-grad`;
  // removed stroke gradient id (frames stripped)
  return (
  <div className="relative w-10 h-10 select-none pointer-events-none" aria-label={isAtk ? 'Atak' : 'Zdrowie'}>
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
          <text x="50" y="59" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff" stroke="#000" strokeWidth="6" paintOrder="stroke" fontFamily="inherit" style={{filter:'drop-shadow(0 2px 2px rgba(0,0,0,0.55))'}}>{value}</text>
          <text x="50" y="59" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff" fontFamily="inherit">{value}</text>
        </svg>
        {/* Optional small icon badge */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-[11px] font-bold text-white shadow" style={{backdropFilter:'blur(2px)'}}>
          {isAtk ? '⚔️' : '❤'}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      data-minion={m.entityId}
      onClick={onClick}
      // Disable initial mount animation to prevent flicker when board updates
      initial={false}
      animate={{ scale: 1, opacity: 1 }}
  className={`relative w-[7.4rem] h-36 rounded-xl px-2 py-2.5 text-white shadow-lg transition border-2 scale-[0.91]
    ${m.owner === 'PLAYER' ? (ready ? 'ring-2 ring-emerald-300 cursor-pointer bg-gradient-to-b from-emerald-600 to-emerald-500 border-emerald-300/70' : 'opacity-90 bg-gradient-to-b from-emerald-700 to-emerald-600 border-emerald-400/50') : 'bg-gradient-to-b from-red-600 to-red-500 border-red-300/60'}
    ${dimmed ? 'opacity-45' : ''}
    ${highlighted ? 'ring-4 ring-indigo-400 animate-pulse' : ''}
    ${isAttacker ? 'translate-y-[-14px]' : ''}
  ${(CARDS[m.cardId] as MinionCard).rush && m.justSummoned && m.canAttack ? 'before:content-["" ] before:absolute before:-inset-2 before:rounded-xl before:bg-emerald-400/25 before:blur-xl before:animate-pulse' : ''}
  `}
    >
  <div className="mt-1 text-[16px] font-extrabold leading-tight text-center px-1 tracking-wide">{getDisplayName(c.id, m.owner)}</div>
      {/* Bottom-right compact hex stat icons */}
      <div className="absolute bottom-1 right-1 flex items-end pointer-events-none gap-2 pr-0.5">
        <div className="origin-bottom-right drop-shadow-[0_2px_7px_rgba(0,0,0,0.55)] scale-[0.96]"><StatHex kind="ATK" value={m.baseAttack} /></div>
        <div className="origin-bottom-right drop-shadow-[0_2px_7px_rgba(0,0,0,0.55)] scale-[0.96]"><StatHex kind="HP" value={m.currentHealth} /></div>
      </div>
      {/* Unified keyword row bottom overlay */}
      {keywords.length > 0 && (
        <div className="absolute inset-x-0 top-0 flex gap-1 justify-center pt-0.5">
          {keywords.map(k => (
              <span key={k} className={`px-1.5 rounded text-[10px] font-bold tracking-wide ${k==='TAUNT' ? 'bg-indigo-500/80' : 'bg-amber-500/80'}`}>{k}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
};
