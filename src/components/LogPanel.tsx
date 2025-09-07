import React, { useEffect, useRef, useState } from 'react';

interface LogPanelProps { entries: string[]; }

export const LogPanel: React.FC<LogPanelProps> = ({ entries }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(0);
  const [stick, setStick] = useState(true); // auto-scroll stick to bottom

  // Handle stick / user scroll detection
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
      setStick(atBottom);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll when new entries and stick enabled
  useEffect(() => {
    if (!containerRef.current) return;
    if (stick) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries.length, stick]);

  // Determine which of the currently shown lines are new to apply animation
  const sliceSize = 40; // show last N (room for grouping)
  const shown = entries.slice(-sliceSize);
  const newCount = Math.max(0, entries.length - prevLenRef.current);
  // After render update prevLenRef
  useEffect(() => { prevLenRef.current = entries.length; }, [entries.length]);

  const classify = (l: string) => {
    if (l.startsWith('YOU:')) return 'you';
    if (l.startsWith('AI:')) return 'ai';
    if (l.startsWith('---')) return 'turn';
    return 'other';
  };
  const icon = (t: string) => t === 'you' ? '🟢' : t === 'ai' ? '🔴' : t === 'turn' ? '⏱' : '•';

  return (
    <div className="relative w-72 max-h-60 overflow-auto rounded-xl p-3 pr-2 text-[12.5px] leading-snug space-y-1 font-mono scroll-hidden bg-gradient-to-b from-slate-900/70 to-slate-800/50 border border-white/15 shadow-xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-md" ref={containerRef}>
      {/* Decorative overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40 mix-blend-overlay" />
      {shown.map((l, i) => {
        const t = classify(l);
        const isNew = i >= shown.length - newCount; // last newCount lines
        if (t === 'turn') {
          return (
            <div key={i} className={`relative flex items-center gap-2 text-amber-300 uppercase tracking-wide font-semibold text-[11px] pt-1 ${isNew ? 'animate-log-new' : ''}`}>
              <div className="flex-1 h-px bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-transparent" />
              <span className="whitespace-nowrap drop-shadow">{l.replace(/^-+\s*/,'').replace(/\s*-+$/,'')}</span>
              <div className="flex-1 h-px bg-gradient-to-l from-amber-400/60 via-amber-300/40 to-transparent" />
            </div>
          );
        }
        const color = t === 'you' ? 'text-emerald-300' : t === 'ai' ? 'text-rose-300' : 'text-slate-200';
        return (
          <div key={i} className={`group flex items-start gap-1.5 ${color} ${isNew ? 'animate-log-new' : ''} transition`}>            
            <span className="opacity-70 leading-5 select-none text-[11px] mt-[1px]">{icon(t)}</span>
            <span className="flex-1 truncate group-hover:whitespace-normal group-hover:break-words pr-1 drop-shadow-sm">{l}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes log-new { 0%{opacity:0; transform:translateY(4px);} 40%{opacity:1;} 100%{opacity:1; transform:translateY(0);} }
        .animate-log-new { animation: log-new .5s cubic-bezier(.4,.8,.2,1); }
        .scroll-hidden::-webkit-scrollbar { width: 6px; }
        .scroll-hidden::-webkit-scrollbar-track { background: transparent; }
        .scroll-hidden::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(255,255,255,0.05)); border-radius: 3px; }
        .scroll-hidden:hover::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.15)); }
      `}</style>
    </div>
  );
};
