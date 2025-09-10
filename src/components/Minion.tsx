import React from 'react';
import './Minion.css';
import heartUrl from '../assets/icons/hearth.svg';
import attackUrl from '../assets/icons/attack.svg';
import shieldUrl from '../assets/icons/shield.svg';
import poisonUrl from '../assets/icons/poison.svg';
import rushUrl from '../assets/icons/rush.svg';
import deathUrl from '../assets/icons/death.svg';
import { getCardImage } from '../game/cardImages';
import { getDisplayName } from '../game/cards';
import { motion } from 'framer-motion';
import { CARDS } from '../game/cards';
import type { MinionInstance, MinionCard } from '../game/types';

interface MinionProps { m: MinionInstance; highlighted?: boolean; dimmed?: boolean; isAttacker?: boolean; onClick?: () => void; }

export const Minion: React.FC<MinionProps> = ({ m, highlighted, dimmed, isAttacker, onClick }) => {
  const c = CARDS[m.cardId] as MinionCard;
  const ready = m.canAttack && (!m.justSummoned || c.rush);
  // isPlayed removed: played minions now use uniform sizing
  const keywords: string[] = [];
  if (c.taunt) keywords.push('TAUNT');
  if (c.rush) keywords.push('RUSH');

  const displayName = getDisplayName(c.id, m.owner);

  return (
    <motion.div
      data-minion={m.entityId}
      onClick={onClick}
  // Disable initial mount animation to prevent flicker when board updates
  initial={false}
  // Uniform slight enlargement for all played minions; AI minions nudged down slightly
  animate={{ scale: 1.06, opacity: 1, y: m.owner === 'AI' ? 6 : 0 }}
  transition={{ type: 'tween', duration: 0.12 }}
      className={`relative w-28 h-36 rounded-2xl px-2 py-2 text-white shadow transition
  ${m.owner === 'PLAYER' ? (ready ? 'ring-2 ring-emerald-300 cursor-pointer bg-gradient-to-b from-emerald-600 to-emerald-500' : 'opacity-80 bg-gradient-to-b from-emerald-700 to-emerald-600') : 'bg-gradient-to-b from-red-600 to-red-500'}
        ${dimmed ? 'opacity-40' : ''}
        ${highlighted ? 'ring-4 ring-indigo-400 animate-pulse' : ''}
        ${isAttacker ? 'translate-y-[-12px]' : ''}
  ${(CARDS[m.cardId] as MinionCard).rush && m.justSummoned && m.canAttack ? 'before:content-[""] before:absolute before:-inset-2 before:rounded-3xl before:bg-emerald-400/20 before:blur-xl before:animate-pulse' : ''}
      `}
    >
      
  {/* Artwork for played minion: similar placement to hand cards */}
  <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-[94%] flex items-center justify-center pointer-events-none z-0">
        {(() => {
          const img = getCardImage(c.id, m.owner);
    if (img) return <img src={img} alt={displayName} className="w-full h-24 object-contain rounded-md" />;
          return <div className="w-full h-24 rounded-md bg-white/80 flex items-center justify-center text-xs text-gray-700">ART</div>;
        })()}
      </div>
    {/* Shield badge: top-right corner when minion has shield */}
    {m.shield && (
      // Position the shield so it overlaps the top-right corner of the card (nudged slightly left)
      <div className="absolute -top-3 -right-2 w-8 h-8 z-30 pointer-events-none">
  <img src={shieldUrl} alt="Tarcza" className="w-full h-full object-contain" />
      </div>
    )}
    {/* Deathrattle icon: positioned similar to Shield when the card has a deathrattle */}
    {c.deathrattle && (
      <div className="absolute -top-3 -right-2 w-8 h-8 z-30 pointer-events-none">
        <img src={deathUrl} alt="Deathrattle" className="w-full h-full object-contain" />
      </div>
    )}
    {/* Poison badge: top-right corner overlapping the card edge */}
    {c.poisonous && (
      <div className="absolute -top-3 -right-2 w-8 h-8 z-40 pointer-events-none">
  <img src={poisonUrl} alt="Poison" className="w-full h-full object-contain" />
      </div>
    )}
    {/* Rush icon for played minions */}
    {c.rush && (
      <div className="absolute -top-3 -right-2 w-8 h-8 z-40 pointer-events-none">
        <img src={rushUrl} alt="Rush" className="w-full h-full object-contain" />
      </div>
    )}
  <div className="text-sm font-semibold leading-tight text-center" style={{ marginTop: 'calc(3.5rem + 8px)', textShadow: 'none' }}>{displayName}</div>
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
          {/* Unified keyword row (except TAUNT and RUSH which are shown under the name) */}
          {keywords.filter(k => k !== 'TAUNT' && k !== 'RUSH').length > 0 && (
                <div className="absolute inset-x-0 top-0 flex gap-1 justify-center pt-1">
                  {keywords.filter(k => k !== 'TAUNT' && k !== 'RUSH').map(k => (
                    <span
                      key={k}
                      className={'px-1 rounded text-[8px] font-bold tracking-wide bg-amber-500/80'}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}

      {/* Taunt (Prowokacja) label placed under the name, green for player and red for AI */}
      {(keywords.includes('TAUNT') || c.taunt) && (
        <div className={`mt-1 flex justify-center`}>
          <div className={`px-2 py-0.5 rounded text-[11px] font-bold text-white ${m.owner === 'PLAYER' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            Prowokacja
          </div>
        </div>
      )}
      {/* Rush label also placed under the name */}
      {(keywords.includes('RUSH') || c.rush) && (
        <div className={`mt-1 flex justify-center`}>
          <div className={`px-2 py-0.5 rounded text-[11px] font-bold text-white bg-amber-500/90`}>
            Szarża
          </div>
        </div>
      )}
    </motion.div>
  );
};
