#!/usr/bin/env node
import runSingleGame from './singleGame';
import { createCollector } from './telemetry';

async function main() {
  const args = process.argv.slice(2);
  const n = Number(args[0] || 100);
  console.log(`Uruchamiam ${n} gier (sanity)...`);
  const coll = createCollector();
  for (let i = 0; i < n; i++) {
    try {
      const r = await runSingleGame({ maxTurns: 30 });
      coll.record(r);
      if ((i+1) % 10 === 0) console.log(`  done ${i+1}/${n}`);
    } catch (e) {
      console.error('Game error', e);
    }
  }
  const out = coll.finalize();
  const p = coll.saveTo(`reports/sim-${Date.now()}.json`);
  console.log('Done. Report saved to', p);
  console.log('Summary:', out);
}

main().catch(e => { console.error(e); process.exit(1); });
