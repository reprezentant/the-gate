import { describe, it, expect } from 'vitest';
import { initGame, canAttackTargetRespectingTaunt, computePotentialLethal } from '../engine';

describe('taunt behavior', () => {
  it('blocks hero targeting when taunt present', () => {
    const gs = initGame();
    gs.mulliganDone = true; gs.turn = 'PLAYER';
    // Place a taunt on AI board
    gs.ai.board.push({ entityId: 't1', cardId: 'c_minion_stone_defender', owner: 'AI', baseAttack: 1, currentHealth: 4, canAttack: false });
    // Player attacker placeholder
    gs.player.board.push({ entityId: 'a1', cardId: 'c_minion_berserker', owner: 'PLAYER', baseAttack: 3, currentHealth: 2, canAttack: true });
    const heroAllowed = canAttackTargetRespectingTaunt(gs, 'PLAYER', { type: 'HERO' });
    expect(heroAllowed).toBe(false);
    // Attack allowed only to taunt minion
    const allowedToTaunt = canAttackTargetRespectingTaunt(gs, 'PLAYER', { type: 'MINION', entityId: 't1' });
    expect(allowedToTaunt).toBe(true);
  });

  it('computePotentialLethal accounts for taunt clearing', () => {
    const gs = initGame();
    gs.mulliganDone = true; gs.turn = 'PLAYER';
    // AI has one taunt with 4 hp and hero at 5
    gs.ai.heroHp = 5;
    gs.ai.board.push({ entityId: 't1', cardId: 'c_minion_stone_defender', owner: 'AI', baseAttack: 1, currentHealth: 4, canAttack: false });
    // Player has two attackers: 3 and 3 attack
    gs.player.board.push({ entityId: 'p1', cardId: 'c_minion_berserker', owner: 'PLAYER', baseAttack: 3, currentHealth: 2, canAttack: true });
    gs.player.board.push({ entityId: 'p2', cardId: 'c_minion_berserker', owner: 'PLAYER', baseAttack: 3, currentHealth: 2, canAttack: true });
    // Should be able to clear taunt (3+3 >=4) and then have 2 face damage left -> lethal false because hero is 5
    const lethal = computePotentialLethal(gs, 'PLAYER');
    expect(lethal).toBe(false);
  });
});
