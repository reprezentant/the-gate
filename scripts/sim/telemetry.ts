import fs from 'fs';
import path from 'path';

export type Telemetry = { games: number; playerWins: number; aiWins: number; draws: number; avgTurns: number; poisonTriggers: number; deathrattleTriggers: number };

export function createCollector() {
  const state = { games: 0, playerWins: 0, aiWins: 0, draws: 0, avgTurns: 0, poisonTriggers: 0, deathrattleTriggers: 0 } as Telemetry;
  return {
    record(res: any) {
      state.games += 1;
      if (res.winner === 'PLAYER') state.playerWins++; else if (res.winner === 'AI') state.aiWins++; else if (res.winner === 'DRAW') state.draws++;
      state.avgTurns += res.turns;
      state.poisonTriggers += res.poisonTriggers || 0;
      state.deathrattleTriggers += res.deathrattleTriggers || 0;
    },
    finalize() {
      if (state.games) state.avgTurns = state.avgTurns / state.games;
      return state;
    },
    saveTo(fileName: string) {
      const out = this.finalize();
      const outPath = path.resolve(process.cwd(), fileName);
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
      return outPath;
    }
  };
}
