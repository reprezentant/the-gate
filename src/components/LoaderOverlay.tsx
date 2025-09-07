import React, { useEffect, useState } from 'react';

interface LoaderOverlayProps { done: boolean; progress: number; }

// Elegant animated boot loader: shimmering title + rotating gate + particle orbit + progress bar
export const LoaderOverlay: React.FC<LoaderOverlayProps> = ({ done, progress }) => {
  const [hide, setHide] = useState(false);
  useEffect(()=> { if (done) { const t = setTimeout(()=> setHide(true), 650); return ()=> clearTimeout(t); } }, [done]);
  if (hide) return null;
  return (
    <div className={`fixed inset-0 z-[120] flex items-center justify-center overflow-hidden ${done ? 'pointer-events-none' : ''}`}>      
      {/* Backdrop gradient + subtle vignette */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#1b2733_0%,#0d1217_70%)] transition-opacity duration-700 ${done ? 'opacity-0' : 'opacity-100'}`} />
      <div className={`absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(255,255,255,0)_28%)] mix-blend-overlay pointer-events-none`} />
      <div className={`absolute inset-0 pointer-events-none`} style={{boxShadow:'inset 0 0 180px 40px rgba(0,0,0,0.85)'}} />
      {/* Ambient floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({length:30}).map((_,i)=>{
          const delay = (Math.random()*4).toFixed(2)+'s';
          const dur = (6+Math.random()*6).toFixed(2)+'s';
          const size = 3+Math.random()*4;
          const left = Math.random()*100;
          const top = Math.random()*100;
          const opacity = (0.15+Math.random()*0.35).toFixed(2);
          return <span key={i} className="absolute rounded-full animate-floatingDot" style={{left:left+'%', top:top+'%', width:size, height:size, background:'radial-gradient(circle,#b1f5ff,#3aa8d8 60%,#13628a)', opacity, animationDelay:delay, animationDuration:dur, filter:'drop-shadow(0 0 6px rgba(100,200,255,0.5))'}} />;
        })}
      </div>
      {/* Content */}
      <div className={`relative flex flex-col items-center gap-10 px-8 ${done ? 'animate-loaderExit' : ''}`}>
        {/* Title */}
        <div className="relative select-none">
          <h1 className={`text-[clamp(3.2rem,8vw,6.2rem)] font-black tracking-[0.08em] leading-none text-transparent bg-clip-text bg-gradient-to-br from-sky-200 via-cyan-200 to-emerald-200 drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)]`} style={{filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.75))'}}>
            <span className="relative inline-block animate-titleSheen">The Gate</span>
          </h1>
          <div className="absolute -inset-x-6 -bottom-4 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-70" />
        </div>
        {/* Loader visual */}
        <div className="relative w-[240px] h-[240px]">
          {/* Outer rotating ring segments */}
          <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="loader-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4dd6ff" />
                <stop offset="60%" stopColor="#2fa6ff" />
                <stop offset="100%" stopColor="#0a6bb8" />
              </linearGradient>
              <filter id="ring-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#4cc7ff" floodOpacity="0.35" />
              </filter>
            </defs>
            {Array.from({length: 32}).map((_,i)=>{
              const angle = (Math.PI*2/32)*i;
              const r = 90;
              const x = 100 + Math.cos(angle)*r;
              const y = 100 + Math.sin(angle)*r;
              const w = 10; const h = 22;
              const rot = angle*180/Math.PI + 90;
              return <rect key={i} x={x-w/2} y={y-h/2} width={w} height={h} rx={3} ry={3} fill="url(#loader-ring)" opacity={(i%2===0)?0.85:0.4} transform={`rotate(${rot} ${x} ${y})`} className="origin-center animate-ringPulse" style={{animationDelay: (i*0.035)+'s'}} />; 
            })}
          </svg>
          {/* Inner rotating aperture */}
          <div className="absolute inset-[44px] rounded-full border border-cyan-300/30 bg-cyan-300/5 backdrop-blur-[2px] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_30px_-6px_rgba(60,180,255,0.45)] overflow-hidden">
            <div className="absolute inset-0 animate-apertureSpin opacity-80 bg-[conic-gradient(from_0deg,rgba(40,160,255,0)_0deg,rgba(40,160,255,0.85)_60deg,rgba(40,160,255,0)_120deg)]" />
            <div className="absolute inset-0 animate-apertureReverse mix-blend-plus-lighter bg-[conic-gradient(from_0deg,rgba(90,255,200,0)_0deg,rgba(90,255,200,0.75)_50deg,rgba(90,255,200,0)_110deg)]" />
            {/* Swirling particles */}
            {Array.from({length:18}).map((_,i)=>{
              const delay = (i*0.12)+'s';
              return <span key={i} className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-gradient-to-br from-cyan-200 to-sky-500 animate-orbit" style={{animationDelay:delay, filter:'drop-shadow(0 0 6px rgba(90,220,255,0.8))'}} />;
            })}
          </div>
          {/* Progress numeric */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-cyan-100 font-semibold tracking-widest text-[11px] uppercase opacity-70">Wczytywanie</span>
              <span className="text-4xl font-extrabold tabular-nums tracking-wider bg-gradient-to-br from-cyan-200 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]">{Math.min(100,Math.round(progress))}<span className="text-[22px] align-top ml-0.5">%</span></span>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative w-[420px] max-w-[80vw] h-3 rounded-full bg-white/10 overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.07)]">
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 shadow-[0_0_8px_2px_rgba(90,220,255,0.6)] animate-progressBar" style={{width: `${progress}%`}} />
          <div className="absolute inset-0 mix-blend-overlay bg-[repeating-linear-gradient(60deg,rgba(255,255,255,0.25)_0_14px,rgba(255,255,255,0)_14px_28px)] opacity-25 animate-scan" />
        </div>
      </div>
      <style>{`
        @keyframes titleSheen { 0%,12%{background-position:-200% 0;} 55%{background-position:200% 0;} 100%{background-position:200% 0;} }
        .animate-titleSheen{ background-image:linear-gradient(120deg,#fff,#b1ecff 15%,#64d3ff 35%,#b1ecff 55%,#fff 70%); background-size:300% 100%; animation:titleSheen 5.5s ease-in-out infinite; }
        @keyframes ringPulse { 0%{transform:scale(0.92); opacity:.25;} 50%{transform:scale(1); opacity:1;} 100%{transform:scale(0.92); opacity:.25;} }
        .animate-ringPulse{ animation:ringPulse 2.4s ease-in-out infinite; }
        @keyframes apertureSpin { to { transform:rotate(360deg); } }
        .animate-apertureSpin { animation:apertureSpin 9s linear infinite; }
        .animate-apertureReverse { animation:apertureSpin 14s linear infinite reverse; }
        @keyframes orbit { 0%{ transform:rotate(0deg) translateX(36px) rotate(0deg) scale(.6); opacity:0;} 6%{opacity:1;} 70%{opacity:1; transform:rotate(300deg) translateX(36px) rotate(-300deg) scale(1);} 100%{ transform:rotate(360deg) translateX(36px) rotate(-360deg) scale(.4); opacity:0;} }
        .animate-orbit { animation:orbit 3.8s cubic-bezier(.55,.2,.35,1) infinite; }
        @keyframes floatingDot { 0%{ transform:translateY(0) scale(.6);} 50%{ transform:translateY(-40px) scale(1);} 100%{ transform:translateY(0) scale(.6);} }
        .animate-floatingDot { animation:floatingDot linear infinite; }
        @keyframes progressBar { 0%{filter:brightness(.9);} 50%{filter:brightness(1.15);} 100%{filter:brightness(.9);} }
        .animate-progressBar { animation:progressBar 3s ease-in-out infinite; }
        @keyframes scan { 0%{background-position:0 0;} 100%{background-position:400px 0;} }
        .animate-scan { animation:scan 4s linear infinite; }
        @keyframes loaderExit { 0%{opacity:1; transform:translateY(0);} 55%{opacity:0; transform:translateY(-30px);} 100%{opacity:0;} }
        .animate-loaderExit { animation:loaderExit .65s cubic-bezier(.55,.2,.3,1) forwards; }
      `}</style>
    </div>
  );
};
