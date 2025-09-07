import React from 'react';

interface StatsPanelProps {
  log: string[];
  onClose?: () => void;
}

function computeStats(log: string[]) {
  const stats = {
    turns: 0,
    minionsPlayed: 0,
    spellsCast: 0,
    deathrattles: 0,
    fatigueEvents: 0,
    heroPowerUses: 0,
  };
  for (const l of log) {
    if (l.startsWith('---')) stats.turns += 1;
    if (l.includes('zagrał stwora')) stats.minionsPlayed += 1;
    if (l.includes('czar')) stats.spellsCast += 1;
    if (l.includes('Deathrattle')) stats.deathrattles += 1;
    if (l.includes('zmęczenie')) stats.fatigueEvents += 1;
    if (l.includes('moc bohatera')) stats.heroPowerUses += 1;
  }
  return stats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ log, onClose }) => {
  const s = computeStats(log);
  return (
  <div className="w-64 h-[460px] flex flex-col bg-slate-900/95 border border-white/10 rounded-2xl shadow-xl text-[13px] font-medium overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 text-[12px] font-semibold tracking-wide">
        <span>STATYSTYKI</span>
  {onClose && <button onClick={onClose} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-sm">×</button>}
      </div>
      <div className="p-3 space-y-2 overflow-auto">
        <Section title="Tury" value={s.turns} />
        <Section title="Stronnicy zagrani" value={s.minionsPlayed} />
        <Section title="Czary" value={s.spellsCast} />
        <Section title="Deathrattle" value={s.deathrattles} />
        <Section title="Zmęczenie" value={s.fatigueEvents} />
        <Section title="Moc bohatera" value={s.heroPowerUses} />
  <div className="pt-2 border-t border-white/5 text-[12px] leading-relaxed opacity-70">
          Dane liczone z logu (heurystycznie). Po rozbudowie silnika można dodać precyzyjne liczniki.
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{title: string; value: number}> = ({ title, value }) => (
  <div className="flex justify-between items-center bg-white/3 rounded-lg px-2 py-1 border border-white/5">
    <span className="uppercase tracking-wide">{title}</span>
    <span className="font-bold text-emerald-300">{value}</span>
  </div>
);
