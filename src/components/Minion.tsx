import React from 'react';
import './Minion.css';
import heartUrl from '../assets/icons/hearth.svg';
import attackUrl from '../assets/icons/attack.svg';
import getCardImageById from '../game/cardImages';
import { motion } from 'framer-motion';
import { CARDS } from '../game/cards';
import type { MinionInstance, MinionCard } from '../game/types';

interface MinionProps { m: MinionInstance; highlighted?: boolean; dimmed?: boolean; isAttacker?: boolean; onClick?: () => void; }

export const Minion: React.FC<MinionProps> = ({ m, highlighted, dimmed, isAttacker, onClick }) => {
  const c = CARDS[m.cardId] as MinionCard;
  const ready = m.canAttack && (!m.justSummoned || c.rush);
  const isPlayed = m.owner === 'PLAYER';
  const keywords: string[] = [];
  if (c.taunt) keywords.push('TAUNT');
  if (c.rush) keywords.push('RUSH');

  return (
    <motion.div
      data-minion={m.entityId}
      onClick={onClick}
  // Disable initial mount animation to prevent flicker when board updates
  initial={false}
  animate={{ scale: isPlayed ? 1.06 : 1, opacity: 1, y: isPlayed ? -8 : 0 }}
  transition={{ type: 'tween', duration: 0.12 }}
      className={`relative w-24 h-32 rounded-2xl px-2 py-2 text-white shadow transition
  ${m.owner === 'PLAYER' ? (ready ? 'ring-2 ring-emerald-300 cursor-pointer bg-gradient-to-b from-emerald-600 to-emerald-500' : 'opacity-80 bg-gradient-to-b from-emerald-700 to-emerald-600') : 'bg-gradient-to-b from-red-600 to-red-500'}
        ${dimmed ? 'opacity-40' : ''}
        ${highlighted ? 'ring-4 ring-indigo-400 animate-pulse' : ''}
        ${isAttacker ? 'translate-y-[-12px]' : ''}
  ${(CARDS[m.cardId] as MinionCard).rush && m.justSummoned && m.canAttack ? 'before:content-[""] before:absolute before:-inset-2 before:rounded-3xl before:bg-emerald-400/20 before:blur-xl before:animate-pulse' : ''}
      `}
    >
      
  {/* Artwork for played minion: similar placement to hand cards */}
  <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-[92%] flex items-center justify-center pointer-events-none z-0">
        {(() => {
          const img = getCardImageById(c.id);
          if (img) return <img src={img} alt={c.name} className="w-full h-16 object-contain rounded-md" />;
          return <div className="w-full h-16 rounded-md bg-white/80 flex items-center justify-center text-xs text-gray-700">ART</div>;
        })()}
      </div>
  <div className="mt-12 text-xs font-semibold leading-tight text-center">{c.name}</div>
      {/* Pojedyncze znaczniki usunięte – zostaje zunifikowany pasek poniżej */}
      <div className="minion-stats">
        <div className="minion-attack">
          <img src={attackUrl} className="minion-attack-icon" alt="atk" />
          <div className="minion-attack-value">{m.baseAttack}</div>
        </div>
        <div className="minion-health">
          <img src={heartUrl} className="minion-health-icon" alt="hp" />
          <div className="minion-health-value">{m.currentHealth}</div>
        </div>
      </div>
      {/* Unified keyword row bottom overlay */}
      {keywords.length > 0 && (
            <div className="absolute inset-x-0 top-0 flex gap-1 justify-center pt-1">
              {keywords.map(k => (
                <span
                  key={k}
                  className={k === 'TAUNT'
                    ? 'px-1.5 rounded text-[11px] font-bold tracking-wide bg-indigo-500/80'
                    : 'px-1 rounded text-[8px] font-bold tracking-wide bg-amber-500/80'}
                >
                  {k === 'TAUNT' ? 'Prowokacja' : k}
                </span>
              ))}
            </div>
          )}
    </motion.div>
  );
};
