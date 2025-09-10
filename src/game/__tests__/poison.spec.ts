import { describe, it, expect } from 'vitest';
import { initGame, processDeaths, damageMinion } from '../engine';

describe('poisonous', () => {
  it('poisonous minion kills damaged minion if no shield', () => {
    const gs = initGame();
    gs.mulliganDone = true; gs.turn = 'PLAYER';
  gs.player.board.push({ entityId: 'p1', cardId: 'c_minion_haunted_wailer', owner: 'PLAYER', baseAttack: 2, currentHealth: 1, canAttack: true });
    gs.ai.board.push({ entityId: 'e1', cardId: 'c_minion_young_warrior', owner: 'AI', baseAttack: 1, currentHealth: 2, canAttack: true });

    const applied = damageMinion(gs, 'AI', 'e1', 2, 'test', 'p1');
    expect(applied).toBeGreaterThan(0);
    processDeaths(gs);
    expect(gs.ai.board.find(m => m.entityId === 'e1')).toBeUndefined();
  });

  it('poisonous is blocked by shield (shield consumed, minion survives)', () => {
    const gs = initGame();
    gs.mulliganDone = true; gs.turn = 'PLAYER';
  gs.player.board.push({ entityId: 'p1', cardId: 'c_minion_haunted_wailer', owner: 'PLAYER', baseAttack: 2, currentHealth: 1, canAttack: true });
    gs.ai.board.push({ entityId: 'e2', cardId: 'c_minion_young_warrior', owner: 'AI', baseAttack: 1, currentHealth: 2, canAttack: true, shield: true });

    const applied = damageMinion(gs, 'AI', 'e2', 2, 'test', 'p1');
    // Shield should consume and applied == 0
    expect(applied).toBe(0);
    // After processDeaths the minion should still be present and shield should be false
    processDeaths(gs);
    const m = gs.ai.board.find(x => x.entityId === 'e2');
    expect(m).toBeDefined();
    expect(m?.shield).toBe(false);
  });
});
