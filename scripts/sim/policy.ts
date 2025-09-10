import { CARDS } from '../../src/game/cards';
import type { GameState, Side } from '../../src/game/types';

function randomChoice<T>(arr: T[]) { return arr[Math.floor(Math.random()*arr.length)]; }

export const policy = {
  choosePlays(gs: GameState, side: Side): number[] {
    const ps = side === 'PLAYER' ? gs.player : gs.ai;
    const toPlay: number[] = [];
    // naive: play first playable cards greedily left-to-right
    let availableMana = ps.mana;
    for (let hi = 0; hi < ps.hand.length; hi++) {
      const cid = ps.hand[hi];
      const card = CARDS[cid];
      if (card.manaCost <= availableMana) {
        toPlay.push(hi);
        // consume locally only
        availableMana -= card.manaCost;
      }
    }
    return toPlay;
  },

  chooseAttacks(gs: GameState, side: Side) {
    const attackers = (side === 'PLAYER' ? gs.player.board : gs.ai.board)
      .filter(m => m.canAttack && (!m.justSummoned || (CARDS[m.cardId] as any).rush));
    const opponent = side === 'PLAYER' ? 'AI' : 'PLAYER';
    const oppBoard = opponent === 'PLAYER' ? gs.player.board : gs.ai.board;
    const mappings: { attackerId: string; target: any }[] = [];
    for (const a of attackers) {
      const targets: any[] = [];
      if (oppBoard.length) targets.push(...oppBoard.map(m => ({ entityId: m.entityId })));
      if (!targets.length) targets.push('HERO');
      mappings.push({ attackerId: a.entityId, target: randomChoice(targets) });
    }
    return mappings;
  }
};

export default policy;
