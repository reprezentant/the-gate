import _noopPolicy from './policy';
import { record } from './telemetry';

export type GameResult = { winner: 'PLAYER' | 'AI' | 'DRAW'; turns: number };

export function runSingleGame(seed?: number): GameResult {
	// Minimal deterministic placeholder simulation.
	void seed; // reserved for deterministic RNG later
	// reference policy to keep import in place for future simulation logic
	void _noopPolicy;
	record({ type: 'sim:start' });
	const res: GameResult = { winner: 'DRAW', turns: 0 };
	record({ type: 'sim:end', payload: res });
	return res;
}

export default runSingleGame;
