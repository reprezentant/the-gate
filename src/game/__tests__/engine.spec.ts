import { describe, it, expect } from 'vitest';
import { initGame, performMulligan, STARTING_HAND_SIZE, playCardForSidePure, heroPowerAction, HERO_POWER_DAMAGE, HERO_POWER_COST, processDeaths, drawCards, ensureCheapCardAfterMulligan, BOARD_LIMIT, HAND_LIMIT } from '../engine';
import { CARDS } from '../cards';
import type { GameState, MinionCard } from '../types';

function cheapCount(gs: GameState) { return gs.player.hand.filter(id => CARDS[id].manaCost <= 1).length; }

describe('engine basic', () => {
  it('initGame draws starting hand size', () => {
    const gs0 = initGame();
    expect(gs0.player.hand.length).toBe(STARTING_HAND_SIZE);
  });

  it('mulligan preserves cheap guarantee', () => {
    let gs = initGame();
    // Force mulligan artificial (perform with all indices) if not done
    const replaceIdx = gs.player.hand.map((_,i)=>i);
    gs = performMulligan(gs, replaceIdx);
    expect(gs.mulliganDone).toBe(true);
    expect(cheapCount(gs)).toBeGreaterThan(0);
  });

  it('hero power deals correct damage and consumes mana', () => {
  let gs = initGame();
    gs.mulliganDone = true;
    const before = gs.ai.heroHp;
    gs.player.mana = HERO_POWER_COST; gs.player.heroPowerUsed = false; gs.turn='PLAYER';
    gs = heroPowerAction(gs,'PLAYER');
    expect(gs.ai.heroHp).toBe(before - HERO_POWER_DAMAGE);
    expect(gs.player.heroPowerUsed).toBe(true);
  });

  it('playCardForSidePure plays minion and sets justSummoned', () => {
    let gs = initGame();
    gs.mulliganDone = true; gs.turn='PLAYER';
    // Find first minion in hand affordable
    let idx = gs.player.hand.findIndex(id => CARDS[id].type==='MINION' && CARDS[id].manaCost <= gs.player.mana);
    if (idx === -1) {
      // Inject cheap minion deterministically
      gs.player.hand.push('c_minion_young_warrior');
      idx = gs.player.hand.length - 1;
    }
    const cardId = gs.player.hand[idx];
    const card = CARDS[cardId] as MinionCard;
    gs = playCardForSidePure(gs,'PLAYER', idx);
    const inst = gs.player.board.find(m => m.cardId === card.id);
    expect(inst?.justSummoned).toBe(true);
  });

  it('deathrattle triggers on processDeaths', () => {
    const gs = initGame();
    gs.mulliganDone = true;
    // Inject a minion with 0 health and a deathrattle effect directly to board
    const deathrattleCardId = 'c_minion_haunted_wailer';
    gs.player.board.push({ entityId: 'X', cardId: deathrattleCardId, owner:'PLAYER', baseAttack:1, currentHealth:0, canAttack:false });
    const before = gs.ai.heroHp;
    processDeaths(gs);
    expect(gs.ai.heroHp).toBe(before - 1); // its deathrattle deals 1 to enemy hero
  });
});

describe('engine extended cases', () => {
  it('fatigue damage accumulates correctly when drawing from empty deck', () => {
    const gs = initGame();
    gs.mulliganDone = true;
    // Empty player deck & hand to isolate fatigue
    gs.player.deck = [];
    gs.player.hand = [];
    const startHp = gs.player.heroHp;
    drawCards(gs, 'PLAYER', 2); // two fatigue draws -> 1 + 2 = 3 total damage
    expect(gs.player.fatigueCounter).toBe(2);
    expect(startHp - gs.player.heroHp).toBe(3);
  });

  it('board limit prevents playing additional minion and refunds mana', () => {
    let gs = initGame();
    gs.mulliganDone = true; gs.turn='PLAYER';
    gs.player.mana = 10; gs.player.maxMana = 10;
    // Fill board manually
    for (let i=0;i<BOARD_LIMIT;i++) {
      gs.player.board.push({ entityId: 'b'+i, cardId: 'c_minion_young_warrior', owner:'PLAYER', baseAttack:1, currentHealth:2, canAttack:true });
    }
    // Ensure we have a minion in hand to try to play
    const minionId = gs.player.hand.find(id => CARDS[id].type==='MINION') || 'c_minion_young_warrior';
    if (!gs.player.hand.includes(minionId)) gs.player.hand.push(minionId);
    const manaBefore = gs.player.mana;
    gs = playCardForSidePure(gs,'PLAYER', gs.player.hand.indexOf(minionId));
    expect(gs.player.board.length).toBe(BOARD_LIMIT);
    expect(gs.player.mana).toBe(manaBefore); // refunded
    expect(gs.log.some(l => l.includes('brak miejsca na planszy'))).toBe(true);
  });

  it('hand limit burns drawn card', () => {
    const gs = initGame();
    gs.mulliganDone = true;
    // Fill hand to limit and put a single card in deck
    while (gs.player.hand.length < HAND_LIMIT) gs.player.hand.push('c_minion_young_warrior');
    gs.player.deck = ['c_minion_berserker'];
    const deckBefore = gs.player.deck.length;
    drawCards(gs,'PLAYER',1);
    expect(gs.player.hand.length).toBe(HAND_LIMIT); // no increase
    expect(gs.player.deck.length).toBe(deckBefore-1); // burned
    expect(gs.log.some(l => l.includes('limit ręki'))).toBe(true);
  });

  it('ensureCheapCardAfterMulligan no-op when no cheap card exists in deck', () => {
    const gs = initGame();
    // Remove all cost <=1 from hand and deck
    gs.player.hand = gs.player.hand.filter(id => CARDS[id].manaCost > 1);
    gs.player.deck = gs.player.deck.filter(id => CARDS[id].manaCost > 1);
    const beforeHand = [...gs.player.hand];
    ensureCheapCardAfterMulligan(gs);
    expect(gs.player.hand).toEqual(beforeHand); // unchanged
  });

  it('deathrattle AOE damages enemy minions (but does not chain remove in same pass)', () => {
    const gs = initGame();
    gs.mulliganDone = true;
    // Add exploding goblin at 0 HP
    gs.player.board.push({ entityId: 'boom', cardId: 'c_minion_exploding_goblin', owner:'PLAYER', baseAttack:3, currentHealth:0, canAttack:false });
    // Add two enemy minions with 2 health each
    gs.ai.board.push({ entityId: 'e1', cardId: 'c_minion_young_warrior', owner:'AI', baseAttack:1, currentHealth:2, canAttack:true });
    gs.ai.board.push({ entityId: 'e2', cardId: 'c_minion_young_warrior', owner:'AI', baseAttack:1, currentHealth:2, canAttack:true });
    processDeaths(gs);
  // Enemy minions should have reduced health (2 dmg) -> now 0
  expect(gs.ai.board.every(m => m.currentHealth === 0)).toBe(true);
  });
});
