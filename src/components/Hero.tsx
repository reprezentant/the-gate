import React, { useEffect, useRef, useState } from 'react';
import type { Side } from '../game/types';

interface HeroProps { side: Side; name: string; hp: number; onTarget?: () => void; active?: boolean; lethalHighlight?: boolean; maxHp?: number; mana?: number; maxMana?: number; avatarSrc?: string; deckCount?: number; handCount?: number; }

export const Hero: React.FC<HeroProps> = ({ side, name, hp, onTarget, active, lethalHighlight, maxHp = 20, mana, maxMana, avatarSrc, deckCount, handCount }) => {
  const prevHp = useRef(hp);
  const BIG_HIT_THRESHOLD = 5; // dmg >= threshold => big variant
  const [hitType, setHitType] = useState<'none' | 'small' | 'big'>('none');
  const [bloodBursts, setBloodBursts] = useState<{id:number; x:number; y:number; big:boolean;}[]>([]);

  useEffect(() => {
    if (hp < prevHp.current) {
      const delta = prevHp.current - hp;
      const big = delta >= BIG_HIT_THRESHOLD;
      setHitType(big ? 'big' : 'small');
      // Spawn bursts – bigger hits spawn up to 6, larger size range
      const maxCount = big ? 6 : 3;
      const count = Math.min(maxCount, Math.max(1, delta));
      const bursts = Array.from({length: count}).map((_,i) => ({ id: Date.now()+i, x: (Math.random()*70)-35, y: (Math.random()*70)-35, big }));
      setBloodBursts(b => [...b, ...bursts]);
      const t = setTimeout(()=> setHitType('none'), big ? 420 : 260);
      const cleanup = setTimeout(()=> setBloodBursts(b => b.slice(count)), big ? 1600 : 1200);
      prevHp.current = hp;
      return () => { clearTimeout(t); clearTimeout(cleanup); };
    }
    prevHp.current = hp;
  }, [hp]);

  const shakeClass = hitType === 'big' ? 'animate-hero-big-shake' : (hitType === 'small' ? 'animate-hero-shake' : '');
  const damageClass = hitType === 'big' ? 'animate-hero-big-damage' : (hitType === 'small' ? 'animate-hero-damage' : '');

  // HP meter fraction
  const frac = Math.max(0, Math.min(1, hp / maxHp));
  const manaFrac = (mana !== undefined && maxMana) ? Math.max(0, Math.min(1, mana / maxMana)) : 0;
  const labelText = side === 'PLAYER' ? 'PLAYER' : 'AI';
  // Auto width based on character count (min 3ch, max 8ch baseline + padding)
  const labelStyle: React.CSSProperties = { width: `calc(${Math.min(Math.max(labelText.length,3),8)}ch + 1.1rem)` };
  return (
  <div data-hero={side} className={`relative flex items-center gap-0 select-none ${onTarget ? 'cursor-crosshair' : ''} ${shakeClass}`} onClick={onTarget}>
      {/* Mana left side */}
      {mana !== undefined && maxMana !== undefined && (
        <div className="relative w-[4.75rem] h-[4.75rem] hero-meter order-1 mt-2 -mr-4 z-20">
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
              {/* Decagon clip for mana */}
              <clipPath id={`mana-clip-${side}`}>
                <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" />
              </clipPath>
              <linearGradient id={`mana-grad-${side}`} x1="0" y1="0" x2="0" y2="1">
                {/* Extra vivid mana gradient */}
                <stop offset="0%" stopColor="#c9f9ff" />
                <stop offset="40%" stopColor="#47d8ff" />
                <stop offset="70%" stopColor="#1796ff" />
                <stop offset="100%" stopColor="#054b74" />
              </linearGradient>
              <linearGradient id={`mana-stroke-grad-${side}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d4f7d" />
                <stop offset="100%" stopColor="#021b30" />
              </linearGradient>
              <filter id={`meter-stroke-shadow-${side}`} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.55" />
                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#0bb4ff" floodOpacity="0.12" />
              </filter>
            </defs>
            {/* Decagon frame for mana */}
            <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke={`url(#mana-stroke-grad-${side})`} strokeWidth="7" strokeLinejoin="round" filter={`url(#meter-stroke-shadow-${side})`} />
            <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="#b5ecff" strokeWidth="2" strokeLinejoin="round" opacity="0.18" />
            {/* Inset content */}
            <g transform="translate(50 50) scale(.90) translate(-50 -50)">
              <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="#0c2538" />
              <g clipPath={`url(#mana-clip-${side})`}>
                <g style={{ transform:`translateY(${(1-manaFrac)*100}px)`, transition:'transform .75s cubic-bezier(.4,.8,.2,1)' }}>
                  <g className="mana-liquid-scroll" style={{ width:'200%', height:'100%' }}>
                    <rect x="0" y="0" width="200%" height="100" fill={`url(#mana-grad-${side})`} />
                    <path className="mana-wave-front" d="M0 0 Q25 6 50 0 T100 0 T150 0 T200 0 V100 H0 Z" fill="rgba(255,255,255,0.38)" />
                    <path className="mana-wave-back" d="M0 3 Q25 8 50 3 T100 3 T150 3 T200 3 V100 H0 Z" fill="rgba(0,0,0,0.22)" />
                  </g>
                </g>
              </g>
            </g>
            <text x="50" y="44" textAnchor="middle" fontSize="24" fontWeight="700" fill="#fff" stroke="#02122a" strokeWidth="2" paintOrder="stroke" fontFamily="inherit">{mana}</text>
            <text x="50" y="69" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff" stroke="#02122a" strokeWidth="1.4" paintOrder="stroke" fontFamily="inherit">MANA</text>
          </svg>
          <div className="absolute inset-0 hero-decagon animate-meter-pulse" style={{boxShadow:'0 0 0 4px rgba(125,211,252,0.12)'}} />
          {deckCount !== undefined && (
            <div className="absolute -top-11 left-[84%] -translate-x-1/2 w-[2.9rem] h-[2.9rem] hero-decagon overflow-hidden flex items-center justify-center text-white text-[10px] font-semibold tracking-wide bg-transparent shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <defs>
                  <linearGradient id={`deck-mini-fill-${side}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#13071e" />
                    <stop offset="55%" stopColor="#1a0b2d" />
                    <stop offset="100%" stopColor="#26113f" />
                  </linearGradient>
                  <linearGradient id={`deck-mini-stroke-${side}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#354048" />
                    <stop offset="55%" stopColor="#172025" />
                    <stop offset="100%" stopColor="#060c0f" />
                  </linearGradient>
                  <linearGradient id={`deck-mini-stroke-inner-${side}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#55616a" />
                    <stop offset="100%" stopColor="#141d22" />
                  </linearGradient>
                  <filter id={`deck-mini-shadow-${side}`} x="-60%" y="-60%" width="220%" height="220%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.55" />
                    <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#0ab1ff" floodOpacity="0.10" />
                  </filter>
                </defs>
                {/* Fill + strokes */}
                <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill={`url(#deck-mini-fill-${side})`} opacity="0.95" />
                <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke={`url(#deck-mini-stroke-${side})`} strokeWidth="7" strokeLinejoin="round" filter={`url(#deck-mini-shadow-${side})`} />
                <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke={`url(#deck-mini-stroke-inner-${side})`} strokeWidth="4" strokeLinejoin="round" opacity="0.85" />
                <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="#c4dae6" strokeWidth="1.6" strokeLinejoin="round" opacity="0.15" />
              </svg>
              <div className="relative z-10 flex flex-col items-center leading-tight pt-[0.4rem] select-none">
                <span className="text-[9px] font-medium tracking-wider text-slate-200/85">TALIA</span>
                <span className="text-[12px] -mt-0.5 font-extrabold text-sky-100/90 drop-shadow">{deckCount}</span>
              </div>
            </div>
          )}
        </div>
      )}
  <div className="relative order-2 flex flex-col items-center z-0 -mt-4">
  <div className={`relative w-32 h-32 flex items-center justify-center text-white text-3xl font-black overflow-visible ${damageClass} hero-avatar`}>        
          {/* Inner clipped avatar content (dodecagon) */}
          <div className="absolute inset-0 hero-dodecagon overflow-hidden">
            {avatarSrc ? (
              <img src={avatarSrc} alt={name} draggable={false} className="w-full h-full object-cover select-none pointer-events-none" />
            ) : name[0]}
            {active && <div className="absolute inset-0 hero-octagon ring-4 ring-emerald-400/60 animate-pulse pointer-events-none" />}
            {hitType !== 'none' && (
              <div className={`absolute inset-0 ${hitType==='big' ? 'bg-red-500/50' : 'bg-red-500/40'} mix-blend-screen pointer-events-none`} />
            )}
            {hitType === 'big' && <div className="hero-shockwave absolute inset-0 pointer-events-none" />}
          </div>
          {/* HP-style frame around avatar (gradient stroke + inner highlight) */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <defs>
              <linearGradient id={`avatar-stroke-grad-${side}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7a1a24" />
                <stop offset="100%" stopColor="#140408" />
              </linearGradient>
              <filter id={`avatar-stroke-shadow-${side}`} x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodColor="#000" floodOpacity="0.55" />
                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ff4545" floodOpacity="0.10" />
              </filter>
            </defs>
            <polygon points="50,0 68,7 83,25 100,50 83,75 68,93 50,100 32,93 17,75 0,50 17,25 32,7" fill="none" stroke={`url(#avatar-stroke-grad-${side})`} strokeWidth="10" strokeLinejoin="round" filter={`url(#avatar-stroke-shadow-${side})`} />
              <polygon points="50,0 68,7 83,25 100,50 83,75 68,93 50,100 32,93 17,75 0,50 17,25 32,7" fill="none" stroke={`url(#avatar-stroke-grad-${side})`} strokeWidth="7" strokeLinejoin="round" filter={`url(#avatar-stroke-shadow-${side})`} />
              <polygon points="50,0 68,7 83,25 100,50 83,75 68,93 50,100 32,93 17,75 0,50 17,25 32,7" fill="none" stroke="#ffb1b1" strokeWidth="2" strokeLinejoin="round" opacity="0.22" />
          </svg>
          {!active && lethalHighlight && (
            <div className="absolute inset-0 pointer-events-none group">
              <div className="absolute inset-0 hero-octagon ring-4 ring-red-500/70 animate-pulse" />
              <div className="absolute -inset-2 hero-octagon ring-4 ring-red-400/30 animate-ping" />
              <div className="absolute -top-2 -right-2 bg-red-600/90 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg ring-1 ring-red-300/70 tracking-wide select-none pointer-events-auto" title="Potencjalny lethal">
                LETHAL
              </div>
              <div className="absolute -top-10 right-1 bg-black/80 text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow">
                Potencjalny lethal
              </div>
            </div>
          )}
          {bloodBursts.map(b => (
            <span
              key={b.id}
              className={`absolute select-none animate-blood-pop pointer-events-none ${b.big ? 'text-2xl' : 'text-xl'}`}
              style={{ left:'50%', top:'50%', transform:`translate(calc(-50% + ${b.x}px), calc(-50% + ${b.y}px))` }}
            >🩸</span>
          ))}
          {/* Sliding bottom label with avatar-style framed decagon (narrowed 30%) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.65rem] flex items-center justify-center pointer-events-none" style={labelStyle}>
            <div className={`relative w-full h-full hero-label-frame ${active ? 'is-active' : ''}`}>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
                <defs>
                  {/* Default (inactive) red themed gradient */}
                  <linearGradient id={`label-stroke-grad-${side}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7a1a24" />
                    <stop offset="100%" stopColor="#140408" />
                  </linearGradient>
                  {/* Active (player turn) emerald themed gradient */}
                  <linearGradient id={`label-stroke-active-grad-${side}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0fcf7a" />
                    <stop offset="55%" stopColor="#067d4a" />
                    <stop offset="100%" stopColor="#022c1a" />
                  </linearGradient>
                  <filter id={`label-stroke-shadow-${side}`} x="-50%" y="-60%" width="220%" height="240%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.55" />
                    <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#ff4545" floodOpacity="0.10" />
                  </filter>
                  <filter id={`label-stroke-shadow-active-${side}`} x="-50%" y="-60%" width="220%" height="240%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.55" />
                    <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodColor="#24ffb0" floodOpacity="0.18" />
                  </filter>
                </defs>
                {(() => {
                  const outerStroke = active ? `url(#label-stroke-active-grad-${side})` : `url(#label-stroke-grad-${side})`;
                  const filterId = active ? `url(#label-stroke-shadow-active-${side})` : `url(#label-stroke-shadow-${side})`;
                  const midOpacity = active ? 0.95 : 0.9;
                  const innerColor = active ? '#c2ffe9' : '#ffb1b1';
                  const fill = active ? 'rgba(0,40,25,0.55)' : 'rgba(0,0,0,0.52)';
                  return (
                    <g>
                      <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill={fill} stroke={outerStroke} strokeWidth="6" strokeLinejoin="round" filter={filterId} />
                      <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke={outerStroke} strokeWidth="3.5" strokeLinejoin="round" opacity={midOpacity} />
                      <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke={innerColor} strokeWidth="1.4" strokeLinejoin="round" opacity={active ? 0.26 : 0.22} />
                    </g>
                  );
                })()}
              </svg>
              <div className={`hero-label absolute inset-0 flex items-center justify-center text-[11px] font-bold tracking-wide uppercase text-white/90 drop-shadow-sm ${active ? 'hero-label-active' : ''}`}>
                {labelText}
              </div>
            </div>
          </div>
    {/* Combined Talia/Ręka bar removed; using separate mini octagons above meters */}
        </div>
      </div>
      {/* Circular HP meter with animated liquid (resized to match mana) */}
  <div className="relative w-[4.75rem] h-[4.75rem] hero-meter order-3 mt-2 -ml-4 z-20">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
            <clipPath id={`hp-clip-${side}`}>
              <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" />
            </clipPath>
              <linearGradient id={`hp-grad-${side}`} x1="0" y1="0" x2="0" y2="1">
              {/* Extra vivid HP gradient */}
              <stop offset="0%" stopColor="#ff9090" />
              <stop offset="45%" stopColor="#ff2b3f" />
              <stop offset="100%" stopColor="#75111a" />
            </linearGradient>
            <linearGradient id={`hp-stroke-grad-${side}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a1a24" />
              <stop offset="100%" stopColor="#140408" />
            </linearGradient>
            <filter id={`hp-stroke-shadow-${side}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.4" floodColor="#000" floodOpacity="0.55" />
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ff4545" floodOpacity="0.10" />
            </filter>
          </defs>
          {/* Decagon frame HP */}
          <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke={`url(#hp-stroke-grad-${side})`} strokeWidth="7" strokeLinejoin="round" filter={`url(#hp-stroke-shadow-${side})`} />
          <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="#ffc4c4" strokeWidth="2" strokeLinejoin="round" opacity="0.18" />
          {/* Inset content */}
          <g transform="translate(50 50) scale(.90) translate(-50 -50)">
            <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="#142c3e" />
            <g clipPath={`url(#hp-clip-${side})`}>
              <g style={{ transform:`translateY(${(1-frac)*100}px)`, transition:'transform .75s cubic-bezier(.4,.8,.2,1)' }}>
                <g className="hp-liquid-scroll" style={{ width:'200%', height:'100%' }}>
                  <rect x="0" y="0" width="200%" height="100" fill={`url(#hp-grad-${side})`} />
                  <path className="hp-wave-front" d="M0 0 Q25 6 50 0 T100 0 T150 0 T200 0 V100 H0 Z" fill="rgba(255,255,255,0.40)" />
                  <path className="hp-wave-back" d="M0 3 Q25 8 50 3 T100 3 T150 3 T200 3 V100 H0 Z" fill="rgba(0,0,0,0.22)" />
                </g>
              </g>
            </g>
          </g>
          <text x="50" y="44" textAnchor="middle" fontSize="28" fontWeight="700" fill="#fff" stroke="#02122a" strokeWidth="2" paintOrder="stroke" fontFamily="inherit">{hp}</text>
          <text x="50" y="69" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" stroke="#02122a" strokeWidth="1.6" paintOrder="stroke" fontFamily="inherit">HP</text>
        </svg>
  <div className="absolute inset-0 hero-decagon animate-meter-pulse" style={{boxShadow:'0 0 0 4px rgba(248,113,113,0.12)'}} />
        {handCount !== undefined && (
          <div className="absolute -top-11 left-[16%] -translate-x-1/2 w-[2.9rem] h-[2.9rem] hero-decagon overflow-hidden flex items-center justify-center text-white text-[10px] font-semibold tracking-wide bg-transparent shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <linearGradient id={`hand-mini-fill-${side}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#13071e" />
                  <stop offset="55%" stopColor="#1a0b2d" />
                  <stop offset="100%" stopColor="#26113f" />
                </linearGradient>
                <linearGradient id={`hand-mini-stroke-${side}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#354048" />
                  <stop offset="55%" stopColor="#172025" />
                  <stop offset="100%" stopColor="#060c0f" />
                </linearGradient>
                <linearGradient id={`hand-mini-stroke-inner-${side}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#55616a" />
                  <stop offset="100%" stopColor="#141d22" />
                </linearGradient>
                <filter id={`hand-mini-shadow-${side}`} x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#000" floodOpacity="0.55" />
                  <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#0ab1ff" floodOpacity="0.10" />
                </filter>
              </defs>
              <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill={`url(#hand-mini-fill-${side})`} opacity="0.95" />
              <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke={`url(#hand-mini-stroke-${side})`} strokeWidth="7" strokeLinejoin="round" filter={`url(#hand-mini-shadow-${side})`} />
              <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke={`url(#hand-mini-stroke-inner-${side})`} strokeWidth="4" strokeLinejoin="round" opacity="0.85" />
              <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="#c4dae6" strokeWidth="1.6" strokeLinejoin="round" opacity="0.15" />
            </svg>
            <div className="relative z-10 flex flex-col items-center leading-tight pt-[0.4rem] select-none">
              <span className="text-[9px] font-medium tracking-wider text-slate-200/85">RĘKA</span>
              <span className="text-[12px] -mt-0.5 font-extrabold text-sky-100/90 drop-shadow">{handCount}</span>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes meter-pulse { 0%,100% { transform: scale(1); opacity:.55 } 50% { transform: scale(1.04); opacity:.9 } }
        .animate-meter-pulse { animation: meter-pulse 3.2s ease-in-out infinite; }
        @keyframes liquid-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .mana-liquid-scroll, .hp-liquid-scroll { animation: liquid-scroll 9s linear infinite; }
        .mana-wave-back, .hp-wave-back { opacity:.55; filter:blur(1px); }
  /* Octagonal avatar clip */
  .hero-octagon { clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%); }
  /* Removed hero-oval; unified on dodecagon */
  /* Decagon shape (10 sides) */
  .hero-decagon { clip-path: polygon(50% 0%, 79% 10%, 98% 35%, 98% 65%, 79% 91%, 50% 100%, 21% 91%, 2% 65%, 2% 35%, 21% 10%); }
  /* Dodecagon (12 sides) kept for avatar */
  .hero-dodecagon { clip-path: polygon(50% 0%, 68% 7%, 83% 25%, 100% 50%, 83% 75%, 68% 93%, 50% 100%, 32% 93%, 17% 75%, 0% 50%, 17% 25%, 32% 7%); }
  .hero-avatar { filter: drop-shadow(0 4px 6px rgba(0,0,0,0.55)) drop-shadow(0 0 4px rgba(0,0,0,0.35)); transition: filter .25s ease; }
  .hero-avatar:hover { filter: drop-shadow(0 6px 10px rgba(0,0,0,0.6)) drop-shadow(0 0 6px rgba(0,0,0,0.4)); }
  .hero-label { transform: translateY(100%); animation: hero-label-in .55s .15s cubic-bezier(.4,.8,.2,1) forwards; }
  .hero-label-active { text-shadow: 0 0 4px rgba(255,255,255,0.35), 0 0 6px rgba(29,255,170,0.35); }
  @keyframes hero-label-in { to { transform: translateY(0); } }
  .hero-label-frame { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55)); }
  .hero-label-frame .hero-label { letter-spacing: 0.08em; }
  .hero-label-frame.is-active .hero-label { color:#fff; text-shadow:0 0 4px rgba(255,255,255,0.35); }
  /* Removed .hero-deckhand styles (replaced by mini octagons) */
      `}</style>
    </div>
  );
};

// Tailwind arbitrary animations via global layer
// We rely on existing Tailwind setup; if not loaded, these will be ignored.
