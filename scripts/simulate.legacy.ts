import { initGame, clone, playCardForSidePure, startTurnFor, processDeaths, damageMinion, drawCards, computePotentialLethal, applyWinner } from '../src/game/engine';
import { CARDS } from '../src/game/cards';
import type { GameState, Side } from '../src/game/types';

function randomChoice<T>(arr: T[]) { return arr[Math.floor(Math.random()*arr.length)]; }

type Stats = { games: number; playerWins: number; aiWins: number; draws: number; avgTurns: number; poisonTriggers: number; deathrattleTriggers: number };

async function runSimulations(n=1000) {
  const stats: Stats = { games: n, playerWins: 0, aiWins: 0, draws: 0, avgTurns: 0, poisonTriggers: 0, deathrattleTriggers: 0 };

  for (let i=0;i<n;i++) {
    let gs = initGame();
    // quick random mulligan: keep 0-2 random cards
    const replaceIndices = [] as number[];
    // simple policy: randomly replace none/one/two
    const toReplace = Math.floor(Math.random()*3);
    for (let r=0;r<toReplace;r++) replaceIndices.push(r);
    gs = (await Promise.resolve()).then(()=>require('../src/game/engine').performMulligan(gs, replaceIndices)) as unknown as GameState;

    // simulate until winner or max turns
    const maxTurns = 30; let turnCount = 0;
    // Naive policy: on your turn, play a random playable card + end turn. Attack: if can attack, attack random valid target.
    while (!gs.winner && turnCount < maxTurns) {
      const side: Side = gs.turn;
      // start turn (draw handled there) but engine expects startTurnFor to be called by player controlling loop
      gs = (await Promise.resolve()).then(()=>require('../src/game/engine').startTurnFor(gs, side)) as unknown as GameState;

      // simple play: try playing first playable card until mana exhausted
      const ps = side === 'PLAYER' ? gs.player : gs.ai;
      for (let hi = 0; hi < ps.hand.length; ) {
        const cid = ps.hand[hi];
        const card = CARDS[cid];
        if (card.manaCost <= ps.mana) {
          gs = (await Promise.resolve()).then(()=>require('../src/game/engine').playCardForSidePure(gs, side, hi)) as unknown as GameState;
          // after play, process deaths in case of spells/minion interactions
          gs = (await Promise.resolve()).then(()=>require('../src/game/engine').processDeaths(gs)) as unknown as GameState;
        } else hi++;
      }

      // attack phase: for each ready attacker, pick random valid target (minion preferred, hero last)
      const attackers = (side === 'PLAYER' ? gs.player.board : gs.ai.board).filter(m => m.canAttack && (!m.justSummoned || (CARDS[m.cardId] as any).rush));
      for (const a of attackers) {
        // gather possible targets respecting taunt
        const opponent = side === 'PLAYER' ? 'AI' : 'PLAYER';
        const oppBoard = opponent === 'PLAYER' ? gs.player.board : gs.ai.board;
        // prefer minion target if any
        let targets: ('HERO' | {entityId:string})[] = [];
        if (oppBoard.length) {
          targets = oppBoard.map(m => ({ entityId: m.entityId } as any));
        }
        // if no minions, target hero
        if (!targets.length) targets.push('HERO');
        const t = randomChoice(targets);
        if (t === 'HERO') {
          if (side === 'PLAYER') gs.ai.heroHp -= a.baseAttack; else gs.player.heroHp -= a.baseAttack;
        } else {
          // apply damage with poisonous check
          gs = (await Promise.resolve()).then(()=>require('../src/game/engine').damageMinion(gs, opponent as Side, t.entityId, a.baseAttack, 'attack', a.entityId),) as unknown as GameState;
        }
        // mark attacker as used
        const attSideBoard = side === 'PLAYER' ? gs.player.board : gs.ai.board;
        const att = attSideBoard.find(x=>x.entityId===a.entityId);
        if (att) att.canAttack = false;
        gs = (await Promise.resolve()).then(()=>require('../src/game/engine').processDeaths(gs)) as unknown as GameState;
      }

      // end turn
      gs.turn = side === 'PLAYER' ? 'AI' : 'PLAYER';
      gs = (await Promise.resolve()).then(()=>require('../src/game/engine').applyWinner(gs)) as unknown as GameState;
      turnCount++;
    }

    // collect stats
    if (gs.winner === 'PLAYER') stats.playerWins++; else if (gs.winner === 'AI') stats.aiWins++; else if (gs.winner === 'DRAW') stats.draws++;
    stats.avgTurns += turnCount;
    // rough parse logs for triggers
    gs.log.forEach(l => { if (l.includes('poisonous')) stats.poisonTriggers++; if (l.includes('Deathrattle')) stats.deathrattleTriggers++; });
  }

  stats.avgTurns = stats.avgTurns / n;
  return stats;
}

(async ()=>{
  console.log('Uruchamiam symulacje (1000 gier)...');
  const res = await runSimulations(1000);
  console.log('Wyniki:', res);
})();
