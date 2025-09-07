import { describe, it, expect } from 'vitest';
import { initGame, computePotentialLethal, canAttackTargetRespectingTaunt } from '../engine';

// Helper to create a minimal custom state from init
function base(afterMulligan = true) {
  const gs = initGame();
  if (afterMulligan) gs.mulliganDone = true;
  gs.turn = 'PLAYER';
  // Clear random starting hand/board for deterministic layout
  gs.player.hand = [];
  gs.player.board = [];
  gs.ai.board = [];
  return gs;
}

describe('computePotentialLethal', () => {
  it('returns true when sum of ready attacks >= enemy HP (no taunts)', () => {
    const gs = base();
    gs.ai.heroHp = 5;
    // Add two attackers 3 + 2
    gs.player.board.push({ entityId:'a1', cardId:'c_minion_colossus', owner:'PLAYER', baseAttack:4, currentHealth:4, canAttack:true, justSummoned:false });
    gs.player.board.push({ entityId:'a2', cardId:'c_minion_berserker', owner:'PLAYER', baseAttack:3, currentHealth:2, canAttack:true, justSummoned:false });
    // Adjust attack to produce exactly lethal (4+3 >=5)
    expect(computePotentialLethal(gs,'PLAYER')).toBe(true);
  });

  it('returns false when taunt soaking requires too much attack leaving insufficient face damage', () => {
    const gs = base();
    gs.ai.heroHp = 6;
    // Hero Power available but will add only 1
    gs.player.mana = 10; gs.player.maxMana=10; gs.player.heroPowerUsed=false;
    // Attackers: 3 and 3 (total face 6) but taunt with 5 HP so min required 5 leaving only 1 face + hero power 1 = 2 < 6 -> false
    gs.player.board.push({ entityId:'a1', cardId:'c_minion_berserker', owner:'PLAYER', baseAttack:3, currentHealth:2, canAttack:true, justSummoned:false });
    gs.player.board.push({ entityId:'a2', cardId:'c_minion_berserker', owner:'PLAYER', baseAttack:3, currentHealth:2, canAttack:true, justSummoned:false });
    // Taunt 5 HP (guardian 2/5 taunt)
    gs.ai.board.push({ entityId:'t1', cardId:'c_minion_guardian', owner:'AI', baseAttack:2, currentHealth:5, canAttack:true, justSummoned:false });
    expect(computePotentialLethal(gs,'PLAYER')).toBe(false);
  });

  it('accounts for hero power in lethal calculation behind no taunts', () => {
    const gs = base();
    gs.ai.heroHp = 3;
    gs.player.mana = 2; gs.player.maxMana=2; gs.player.heroPowerUsed=false;
    // Single minion 2 attack + hero power 1 = 3 lethal
    gs.player.board.push({ entityId:'a', cardId:'c_minion_young_warrior', owner:'PLAYER', baseAttack:1, currentHealth:2, canAttack:true, justSummoned:false });
    // Adjust attack manually
    gs.player.board[0].baseAttack = 2;
    expect(computePotentialLethal(gs,'PLAYER')).toBe(true);
  });
});

describe('Taunt targeting (canAttackTargetRespectingTaunt)', () => {
  function setupTaunt(): ReturnType<typeof initGame> {
    const gs = initGame();
    gs.mulliganDone = true; gs.turn='PLAYER';
    // Clear for determinism
    gs.player.board = [];
    gs.ai.board = [];
    return gs;
  }

  it('allows attacking hero when no taunts present', () => {
    const gs = setupTaunt();
    gs.ai.board.push({ entityId:'e1', cardId:'c_minion_berserker', owner:'AI', baseAttack:3, currentHealth:2, canAttack:true, justSummoned:false });
    expect(canAttackTargetRespectingTaunt(gs,'PLAYER',{type:'HERO'})).toBe(true);
  });

  it('blocks attacking hero when a taunt exists', () => {
    const gs = setupTaunt();
    gs.ai.board.push({ entityId:'t1', cardId:'c_minion_stone_defender', owner:'AI', baseAttack:1, currentHealth:4, canAttack:true, justSummoned:false });
    expect(canAttackTargetRespectingTaunt(gs,'PLAYER',{type:'HERO'})).toBe(false);
  });

  it('blocks attacking non-taunt minion while taunt alive', () => {
    const gs = setupTaunt();
    gs.ai.board.push({ entityId:'t1', cardId:'c_minion_stone_defender', owner:'AI', baseAttack:1, currentHealth:4, canAttack:true, justSummoned:false });
    gs.ai.board.push({ entityId:'m2', cardId:'c_minion_berserker', owner:'AI', baseAttack:3, currentHealth:2, canAttack:true, justSummoned:false });
    expect(canAttackTargetRespectingTaunt(gs,'PLAYER',{type:'MINION', entityId:'m2'})).toBe(false);
  });

  it('allows attacking the taunt minion itself', () => {
    const gs = setupTaunt();
    gs.ai.board.push({ entityId:'t1', cardId:'c_minion_stone_defender', owner:'AI', baseAttack:1, currentHealth:4, canAttack:true, justSummoned:false });
    expect(canAttackTargetRespectingTaunt(gs,'PLAYER',{type:'MINION', entityId:'t1'})).toBe(true);
  });

  it('allows attacking hero again after taunt dies', () => {
    const gs = setupTaunt();
    gs.ai.board.push({ entityId:'t1', cardId:'c_minion_stone_defender', owner:'AI', baseAttack:1, currentHealth:0, canAttack:true, justSummoned:false });
    // currentHealth 0 -> considered dead; function treats only >0 as alive
    expect(canAttackTargetRespectingTaunt(gs,'PLAYER',{type:'HERO'})).toBe(true);
  });
});