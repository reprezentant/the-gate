import { initGame, startTurnFor, playCardForSidePure, processDeaths, damageMinion, applyWinner } from '../../src/game/engine';
import type { GameState } from '../../src/game/types';
import policy from './policy';

export type GameResult = { winner?: string; turns: number; poisonTriggers: number; deathrattleTriggers: number; log: string[] };

export async function runSingleGame(opts?: { maxTurns?: number }): Promise<GameResult> {
  const maxTurns = opts?.maxTurns ?? 30;
  let gs: GameState = initGame();
  let turns = 0;
  while (!gs.winner && turns < maxTurns) {
    const side = gs.turn;
    // start turn
    startTurnFor(gs, side);
    // plays
    const plays = policy.choosePlays(gs, side as any);
    for (const hi of plays) {
      gs = playCardForSidePure(gs, side, hi);
      gs = processDeaths(gs);
    }
    // attacks
    const attacks = policy.chooseAttacks(gs, side as any);
    for (const a of attacks) {
      // resolve attacker entity from current boards
      const attackerEntityId = a.attackerId;
      const attacker = [...gs.player.board, ...gs.ai.board].find(x => x.entityId === attackerEntityId);
      const atkValue = attacker ? attacker.baseAttack : 0;
      if (a.target === 'HERO') {
        if (side === 'PLAYER') gs.ai.heroHp -= atkValue; else gs.player.heroHp -= atkValue;
      } else {
        damageMinion(gs, side === 'PLAYER' ? 'AI' : 'PLAYER', a.target.entityId, atkValue, 'attack', attackerEntityId);
      }
      gs = processDeaths(gs);
    }

    // end turn
    gs.turn = side === 'PLAYER' ? 'AI' : 'PLAYER';
  applyWinner(gs);
    turns++;
  }

  const res: GameResult = { winner: gs.winner, turns, poisonTriggers: 0, deathrattleTriggers: 0, log: gs.log };
  gs.log.forEach(l => { if (l.includes('poisonous')) res.poisonTriggers++; if (l.includes('Deathrattle')) res.deathrattleTriggers++; });
  return res;
}

export default runSingleGame;
