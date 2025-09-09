import { it, expect } from 'vitest';
import { initGame, playCardForSidePure } from '../engine';

it('played minion with shield has shield flag set', () => {
	let gs = initGame();
	gs.mulliganDone = true;
	gs.turn = 'PLAYER';
	// Ensure shield minion in hand
	gs.player.hand.push('c_minion_shield_bearer');
	const idx = gs.player.hand.length - 1;
	gs = playCardForSidePure(gs, 'PLAYER', idx);
	const inst = gs.player.board.find(m => m.cardId === 'c_minion_shield_bearer');
	expect(inst).toBeDefined();
	expect(inst?.shield).toBe(true);
});
