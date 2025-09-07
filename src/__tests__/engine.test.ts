import { describe, it, expect } from 'vitest';
import { initGame, performMulligan, ensureCheapCardAfterMulligan, playCardForSidePure, heroPowerAction, drawCards, startTurnFor, HERO_POWER_COST, HERO_POWER_DAMAGE } from '../game/engine';
import { CARDS } from '../game/cards';

describe('engine basic', () => {
	it('initGame gives starting hand size and maybe cheap card guarantee (post-mulligan responsibility)', () => {
		const gs = initGame();
		expect(gs.player.hand.length).toBeGreaterThan(0);
	});

	it('mulligan replaces selected cards and preserves hand size', () => {
		const gs = initGame();
		const original = [...gs.player.hand];
		const idxToReplace = [0];
		const after = performMulligan(gs, idxToReplace);
		expect(gs.player.hand.length).toBe(original.length);
		expect(after.player.hand.length).toBe(original.length);
	});

	it('ensureCheapCardAfterMulligan enforces at least one cost<=1 card', () => {
		const gs = initGame();
		// Remove cheap cards from hand + deck
		gs.player.hand = gs.player.hand.filter(id => CARDS[id].manaCost > 1);
		gs.player.deck = gs.player.deck.filter(id => CARDS[id].manaCost > 1);
		// Insert one cheap into deck tail to be swapped in
		gs.player.deck.push('c_minion_young_warrior');
		ensureCheapCardAfterMulligan(gs);
		expect(gs.player.hand.some(id => CARDS[id].manaCost <= 1)).toBe(true);
	});

	it('playCardForSidePure consumes mana and moves minion to board', () => {
		const gs = initGame();
		gs.mulliganDone = true; gs.turn='PLAYER';
		// Guarantee a playable minion cost 1
		gs.player.hand.push('c_minion_young_warrior');
		const handIndex = gs.player.hand.lastIndexOf('c_minion_young_warrior');
		const beforeCount = gs.player.hand.filter(id=> id==='c_minion_young_warrior').length;
		gs.player.mana = 1; gs.player.maxMana = 1;
		const next = playCardForSidePure(gs,'PLAYER',handIndex);
		const afterCount = next.player.hand.filter(id=> id==='c_minion_young_warrior').length;
		expect(afterCount).toBe(beforeCount - 1);
		expect(next.player.board.some(m => m.cardId === 'c_minion_young_warrior')).toBe(true);
		expect(next.player.mana).toBe(0);
	});

	it('hero power costs mana and flags used', () => {
		let gs = initGame();
		gs.mulliganDone = true; gs.turn='PLAYER';
		gs.player.mana = HERO_POWER_COST;
		const before = gs.ai.heroHp;
		gs = heroPowerAction(gs,'PLAYER');
		expect(gs.player.heroPowerUsed).toBe(true);
		expect(gs.ai.heroHp).toBe(before - HERO_POWER_DAMAGE);
	});

	it('drawCards triggers fatigue damage when deck empty', () => {
		const gs = initGame();
		gs.mulliganDone = true;
		gs.player.deck = [];
		const hpBefore = gs.player.heroHp;
		drawCards(gs,'PLAYER',2);
		expect(gs.player.fatigueCounter).toBe(2);
		expect(hpBefore - gs.player.heroHp).toBe(3); // 1 + 2
	});

	it('startTurnFor increases maxMana up to 10 and readies minions', () => {
		const gs = initGame();
		gs.mulliganDone = true; gs.turn='PLAYER';
		gs.player.maxMana = 9; gs.player.mana = 0;
		gs.player.board.push({ entityId:'x', cardId:'c_minion_young_warrior', owner:'PLAYER', baseAttack:1, currentHealth:2, canAttack:false, justSummoned:true });
		startTurnFor(gs,'PLAYER');
		expect(gs.player.maxMana).toBe(10);
		expect(gs.player.mana).toBe(10);
		expect(gs.player.board[0].canAttack).toBe(true);
		expect(gs.player.board[0].justSummoned).toBe(false);
	});
});
