import React from 'react';
import type { Side, MinionCard, MinionInstance } from '../game/types';
import { CARDS } from '../game/cards';
import { Minion } from './Minion';

interface BoardRowProps {
  side: Side;
  list: MinionInstance[];
  attackerId: string | null;
  pendingSpell: boolean;
  onEnemyMinionTarget: (side: Side, id: string) => void;
  onSelectFriendly: (m: MinionInstance) => void;
}

export const BoardRow: React.FC<BoardRowProps> = ({ side, list, attackerId, pendingSpell, onEnemyMinionTarget, onSelectFriendly }) => {
  const isEnemy = side === 'AI';
  const selecting = attackerId || pendingSpell;
  const enemyTauntIds = isEnemy ? list.filter(m => (CARDS[m.cardId] as MinionCard).taunt).map(m => m.entityId) : [];
  const hasEnemyTaunt = enemyTauntIds.length > 0;
  return (
  <div className="flex items-end justify-center gap-5 min-h-40 py-1 relative">
  {list.length === 0 && <div className="text-white/60 text-sm italic">(pusto)</div>}
      {list.map(m => {
        const card = CARDS[m.cardId] as MinionCard;
  const dimmed = !!(isEnemy && selecting && hasEnemyTaunt && !card.taunt);
  const highlighted = !!(isEnemy && selecting && card.taunt);
        return (
          <div key={m.entityId} className="relative" onClick={() => {
            if (pendingSpell && isEnemy) return onEnemyMinionTarget('AI', m.entityId);
            if (isEnemy && attackerId) return onEnemyMinionTarget('AI', m.entityId);
            if (!isEnemy) onSelectFriendly(m);
          }}>
            <Minion m={m} highlighted={highlighted} dimmed={dimmed} isAttacker={attackerId === m.entityId} />
            {highlighted && <div className="absolute -inset-2 rounded-2xl ring-2 ring-indigo-300/70 pointer-events-none" />}
          </div>
        );
      })}
    </div>
  );
};
