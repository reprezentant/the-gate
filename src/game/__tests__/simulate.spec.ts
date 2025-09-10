/* eslint-disable @typescript-eslint/no-explicit-any, no-constant-condition */
import { describe, it, expect } from 'vitest';
import { initGame, playCardForSidePure, startTurnFor, processDeaths, damageMinion, applyWinner } from '../engine';
import { CARDS } from '../cards';
import type { Side } from '../types';

// Lightweight telemetry counters
type Telemetry = {
  poisonTriggers: number;
  deathrattleTriggers: number;
  shieldConsumes: number;
  wins: { PLAYER: number; AI: number; DRAW: number };
  gameLengths: number[];
};

function runRandomGame(): Telemetry & { rounds: number } {
  const t: Telemetry = { poisonTriggers: 0, deathrattleTriggers: 0, shieldConsumes: 0, wins: { PLAYER: 0, AI: 0, DRAW: 0 }, gameLengths: [] };
  let gs = initGame();
  // Simple random/greedy policy: each turn, play the cheapest playable card; then attack randomly if possible.
  let rounds = 0;
  while (!gs.winner && rounds < 200) {
    const side: Side = gs.turn;
    // start turn upkeep
    startTurnFor(gs, side);
    // Play cheapest playable card repeatedly
    const ps = side === 'PLAYER' ? gs.player : gs.ai;
    do {
      const playable = ps.hand.map((id: string, idx: number) => ({ id, idx })).filter((x: { id: string; idx: number }) => !!x.id && (CARDS[x.id].manaCost <= ps.mana));
      if (!playable.length) break;
      // choose cheapest
      playable.sort((a: { id: string }, b: { id: string }) => CARDS[a.id].manaCost - CARDS[b.id].manaCost);
      gs = playCardForSidePure(gs, side, playable[0].idx);
    } while (true);

    // Attack phase: each ready minion attacks random legal target (hero if allowed)
    const attackerState = side === 'PLAYER' ? gs.player : gs.ai;
    const defenderSide: Side = side === 'PLAYER' ? 'AI' : 'PLAYER';
    const defenderState = defenderSide === 'PLAYER' ? gs.player : gs.ai;
  for (const m of attackerState.board.slice()) {
      if (!m.canAttack) continue;
      // choose target: prefer minions if any, else hero
  const legalMinions = defenderState.board.filter((b: any) => b.currentHealth > 0);
      if (legalMinions.length) {
        const tgt = legalMinions[Math.floor(Math.random()*legalMinions.length)];
        // apply mutual damage like typical card games: attacker deals attack to target and target deals its attack back
        // use damageMinion which handles shield and poisonous when attackerEntityId provided
        const dealt = damageMinion(gs, defenderSide, tgt.entityId, m.baseAttack, 'attack', m.entityId);
  if (dealt && (CARDS[m.cardId] as any).poisonous) t.poisonTriggers++;
        // target strikes back if still alive
        if (tgt.currentHealth > 0) {
          const dealtBack = damageMinion(gs, side, m.entityId, tgt.baseAttack, 'counter', tgt.entityId);
          if (dealtBack && (CARDS[tgt.cardId] as any).poisonous) t.poisonTriggers++;
        }
        // process any deaths
        const beforeLogLen = gs.log.length;
        gs = processDeaths(gs);
        // count deathrattles by searching log for "Deathrattle" entries (simple heuristic)
        const newEntries = gs.log.slice(beforeLogLen);
        for (const e of newEntries) if (String(e).includes('Deathrattle')) t.deathrattleTriggers++;
      } else {
        // attack hero
        const opp = defenderSide === 'PLAYER' ? gs.player : gs.ai;
        opp.heroHp -= m.baseAttack;
        gs.log.push(`${side}: atakuje bohatera ${defenderSide} za ${m.baseAttack}`);
        gs = applyWinner(gs);
      }
      // mark as used
  const found = attackerState.board.find((x: any) => x.entityId === m.entityId);
      if (found) found.canAttack = false;
      if (gs.winner) break;
    }

    // end turn swap
    gs.turn = side === 'PLAYER' ? 'AI' : 'PLAYER';
    rounds++;
  }

  // record winner
  if (gs.winner) t.wins[gs.winner as keyof Telemetry['wins']] = 1; else t.wins['DRAW'] = 1;
  t.gameLengths.push(rounds);
  return { ...t, rounds };
}

describe('monte-carlo-simulations', () => {
  it('runs many random games and reports telemetry (skipped by default)', async () => {
    const N = 1000;
    const agg = { poisonTriggers:0, deathrattleTriggers:0, shieldConsumes:0, wins:{PLAYER:0,AI:0,DRAW:0}, gameLengths:[] as number[] };
    for (let i=0;i<N;i++) {
      const r = runRandomGame();
      agg.poisonTriggers += r.poisonTriggers;
      agg.deathrattleTriggers += r.deathrattleTriggers;
      agg.gameLengths.push(r.rounds);
      for (const k of ['PLAYER','AI','DRAW'] as const) agg.wins[k] += r.wins[k as keyof typeof r.wins];
    }
    const avgLength = agg.gameLengths.reduce((s,n)=>s+n,0)/agg.gameLengths.length;
    console.log('\n=== Monte Carlo summary ===');
    console.log('games:', N);
    console.log('avg rounds:', avgLength.toFixed(2));
    console.log('poison triggers total:', agg.poisonTriggers);
    console.log('deathrattle triggers total:', agg.deathrattleTriggers);
    console.log('wins:', agg.wins);
    // trivial assertion so test runner can show the output when explicitly run
    expect(true).toBe(true);
  }, 120000);
});
