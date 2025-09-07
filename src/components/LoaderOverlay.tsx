import React, { useEffect, useState } from 'react';

interface LoaderOverlayProps { done: boolean; progress: number; }

// Simplified fantasy card loader: soft vignette, title, single rotating card sigil, minimal bar.
export const LoaderOverlay: React.FC<LoaderOverlayProps> = ({ done, progress }) => {
  const [hide, setHide] = useState(false);
  useEffect(() => { if (done) { const t = setTimeout(()=> setHide(true), 500); return ()=> clearTimeout(t); } }, [done]);
  if (hide) return null;
  return (
    <div className={`fixed inset-0 z-[120] flex items-center justify-center ${done ? 'pointer-events-none' : ''}`}> 
      {/* Subtle dark parchment / arcane backdrop */}
      <div className={`absolute inset-0 transition-opacity duration-600 ${done ? 'opacity-0' : 'opacity-100'}`}
           style={{background:'radial-gradient(circle at 50% 42%, #1a1f26 0%, #10151b 70%)'}} />
      <div className="absolute inset-0 pointer-events-none" style={{boxShadow:'inset 0 0 140px 40px rgba(0,0,0,0.85)'}} />

      {/* Sparse drifting motes (reduced) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({length:10}).map((_,i)=>{
          const size = 2 + Math.random()*3;
          const left = Math.random()*100;
            const delay = (Math.random()*5).toFixed(2)+'s';
          const dur = (7+Math.random()*6).toFixed(2)+'s';
          return <span key={i} className="absolute rounded-full animate-mote" style={{left:left+'%', top:'105%', width:size, height:size, background:'radial-gradient(circle,#ffe8b5,#c79334 60%,#7a4e10)', animationDelay:delay, animationDuration:dur, opacity:0.35}} />;
        })}
      </div>

      {/* Content cluster */}
      <div className={`relative flex flex-col items-center gap-10 px-6 ${done ? 'animate-fadeUpOut' : ''}`}>
        {/* Rotating card sigil moved above title */}
        <div className="relative w-[180px] h-[220px]">
          <div className="absolute inset-0 rounded-[1.1rem] border border-amber-400/25 bg-gradient-to-br from-[#272723] via-[#23221d] to-[#181916] shadow-[0_6px_22px_-6px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden animate-cardSway will-change-transform" style={{backfaceVisibility:'hidden'}}>
            <div className="absolute inset-0 opacity-55 mix-blend-overlay bg-[radial-gradient(circle_at_35%_28%,rgba(255,220,150,0.28),rgba(60,40,10,0)_70%)]" />
            {/* New Gate rune: circular ring + doorway + central spark */}
            <svg viewBox="0 0 100 140" className="absolute inset-0 w-full h-full opacity-75">
              <defs>
                <linearGradient id="rune" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f9e9c4" />
                  <stop offset="100%" stopColor="#d7a23a" />
                </linearGradient>
                <filter id="runeGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffe4b0" floodOpacity="0.55" />
                </filter>
              </defs>
              <circle cx="50" cy="70" r="34" fill="none" stroke="url(#rune)" strokeWidth="5" strokeLinecap="round" strokeDasharray="6 10" filter="url(#runeGlow)" />
              <path d="M38 92 V56 Q50 48 62 56 V92" fill="none" stroke="url(#rune)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="50" cy="70" r="8" fill="#fbe1b2" stroke="#d7a23a" strokeWidth="2" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-[1.1rem] border border-amber-500/10 bg-gradient-to-br from-amber-600/10 to-amber-900/5 blur-xl opacity-35 scale-[0.92]" />
        </div>

        {/* Title now below rune card */}
        <div className="text-center select-none">
          <h1
            className="tg-title tg-title-plain relative text-[clamp(2.6rem,7vw,5rem)] font-extrabold tracking-[0.085em] leading-none mx-auto"
          >
            <span className="relative inline-block tg-title-inner">The Gate
              {/* Spark layer */}
              <span className="tg-sparks" aria-hidden="true">
                {Array.from({length:12}).map((_,i)=>{
                  const left = (6 + Math.random()*88).toFixed(2)+'%';
                  const top = (8 + Math.random()*84).toFixed(2)+'%';
                  const scale = (0.4 + Math.random()*0.9).toFixed(2);
                  const dur = (18 + Math.random()*14).toFixed(2)+'s'; // slower drift 18s - 32s
                  const delay = (Math.random()*6).toFixed(2)+'s';
                  const dx = (Math.random()*10 - 5).toFixed(1)+'px'; // reduced travel distance
                  const dy = (Math.random()*12 - 6).toFixed(1)+'px';
                  const o = (0.25 + Math.random()*0.25).toFixed(2); // slightly dimmer
                  const style: React.CSSProperties & Record<string,string> = { left, top, animationDuration:dur, animationDelay:delay };
                  style['--spark-scale']=scale; style['--dx']=dx; style['--dy']=dy; style['--o']=o;
                  return <span key={i} className="tg-spark tg-spark-drift" style={style}/>;
                })}
              </span>
            </span>
          </h1>
          <div className="mt-4 h-px w-56 mx-auto bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
        </div>

        {/* Progress / percentage */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-[320px] max-w-[70vw] h-2.5 rounded-full bg-white/10 overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.12),rgba(255,255,255,0)_60%)]" />
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 transition-[width] duration-200 ease-out" style={{width: `${progress}%`}} />
          </div>
          <div className="text-amber-200/85 font-semibold tracking-wider text-xs tabular-nums select-none">{Math.min(100, Math.round(progress))}%</div>
        </div>
      </div>

      <style>{`
        @keyframes cardSway { 0%{ transform:translateY(0) rotateY(-6deg) rotateX(3deg) rotateZ(-2deg);} 25%{ transform:translateY(-2px) rotateY(0deg) rotateX(4deg) rotateZ(2deg);} 50%{ transform:translateY(0) rotateY(6deg) rotateX(3deg) rotateZ(-1deg);} 75%{ transform:translateY(2px) rotateY(0deg) rotateX(2deg) rotateZ(1deg);} 100%{ transform:translateY(0) rotateY(-6deg) rotateX(3deg) rotateZ(-2deg);} }
        .animate-cardSway { animation:cardSway 6.5s ease-in-out infinite; }
        @keyframes mote { 0%{ transform:translateY(0); opacity:0;} 10%{opacity:.4;} 85%{opacity:.4;} 100%{ transform:translateY(-120vh); opacity:0;} }
        .animate-mote { animation:mote linear infinite; }
        @keyframes fadeUpOut { 0%{opacity:1; transform:translateY(0);} 70%{opacity:0; transform:translateY(-18px);} 100%{opacity:0;} }
        .animate-fadeUpOut { animation:fadeUpOut .5s ease forwards; }
    /* Title styling (plain, no gradient, removed background ovals) */
  .tg-title { color:#f5e7cc; text-shadow:0 1px 0 #ffffffb0, 0 0 2px rgba(255,235,200,0.35), 0 2px 4px rgba(0,0,0,0.65); letter-spacing:0.085em; }
  .tg-title-plain { position:relative; }
  .tg-title-plain:before, .tg-title-plain:after { content:none; }
  /* removed animated gradient + aura for constant subtle sheen */
        .tg-title-inner { padding:0 .15em; filter:drop-shadow(0 6px 12px rgba(0,0,0,0.65)); position:relative; }
        .tg-title-inner:after { content:none; }
  /* sheen removed */
  /* Spark system (slow drift) */
  .tg-sparks { position:absolute; inset:0; pointer-events:none; }
  .tg-spark { position:absolute; width:6px; height:6px; margin:-3px 0 0 -3px; background:radial-gradient(circle,#fff8e6 0%,#ffd793 55%,#d28b25 100%); border-radius:50%; opacity:var(--o,0.55); transform:translate(0,0) scale(var(--spark-scale,1)); box-shadow:0 0 6px 2px rgba(255,210,140,0.45); filter:blur(.2px); }
  .tg-spark-drift { animation:tgSparkDrift linear infinite alternate; }
  @keyframes tgSparkDrift { 0%{ transform:translate(0,0) scale(var(--spark-scale,1)); opacity:var(--o,0.55);} 50%{ transform:translate(calc(var(--dx)/2), calc(var(--dy)/2)) scale(calc(var(--spark-scale,1)*1.03)); opacity:calc(var(--o,0.55)*0.9);} 100%{ transform:translate(var(--dx), var(--dy)) scale(var(--spark-scale,1)); opacity:var(--o,0.55);} }
  @media (prefers-reduced-motion:reduce){ .tg-spark-drift{animation:none;} }
        @media (prefers-reduced-motion:reduce){ .tg-title-sheen{animation:none; opacity:.25; transform:none; } .animate-cardSway{animation:none;} }
      `}</style>
    </div>
  );
};
