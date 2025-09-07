import React from 'react';
import './hand-fan.css';
import { CARDS } from '../game/cards';
import type { GameState } from '../game/types';
import { CardFrame } from './CardFrame';

interface HandProps {
  gs: GameState;
  pendingSpell: number | null;
  onPlayMinion: (index: number) => void;
  onToggleSpellTargeting: (index: number) => void;
  mulliganMode?: boolean;
  mulliganMarked?: Set<number>;
  onToggleMulligan?: (index: number) => void;
  hiddenIndices?: Set<number>;
}

export const Hand: React.FC<HandProps> = ({
  gs,
  pendingSpell,
  onPlayMinion,
  onToggleSpellTargeting,
  mulliganMode,
  mulliganMarked,
  onToggleMulligan,
  hiddenIndices
}) => {
  const cards = gs.player.hand;
  const n = cards.length;
  const fanActive = !mulliganMode;

  // Geometry
  const maxSpreadDeg = 62;
  const maxPerStep = 11;
  const step = n > 1 ? Math.min(maxPerStep, maxSpreadDeg / (n - 1)) : 0;
  const startAngle = -step * (n - 1) / 2;
  const radius = 440;
  const centerYOffset = 100;
  const horizontalCompression = 1.38;

  // Precompute x positions for proximity hover (stabilne, brak jittera bo brak rotacji zmian)
  const xPositions = React.useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * step;
      const rad = angle * Math.PI / 180;
      const x = Math.sin(rad) * radius * horizontalCompression;
      arr.push(x);
    }
    return arr;
  }, [n, startAngle, step, radius, horizontalCompression]);

  // Hover state (simple per-card events, no global mouse math)
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const clearRef = React.useRef<number | null>(null);
  const moveRaf = React.useRef<number | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const setHover = (idx: number | null) => {
    if (clearRef.current) { window.clearTimeout(clearRef.current); clearRef.current = null; }
    setHoveredIndex(idx);
  };
  const scheduleClear = () => {
    if (clearRef.current) window.clearTimeout(clearRef.current);
    // lekkie opóźnienie (krótsze niż poprzednio) – responsywność ale bez migania
    clearRef.current = window.setTimeout(() => { setHoveredIndex(null); clearRef.current = null; }, 120);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!fanActive || xPositions.length === 0) return;
    if (moveRaf.current) return; // throttle do ~1 frame
    const wrap = wrapperRef.current;
    if (!wrap) return;
    moveRaf.current = window.requestAnimationFrame(() => {
      moveRaf.current = null;
      const rect = wrap.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      let closest = 0; let best = Infinity;
      for (let i = 0; i < xPositions.length; i++) {
        const d = Math.abs(relX - xPositions[i]);
        if (d < best) { best = d; closest = i; }
      }
      if (closest !== hoveredIndex) setHover(closest);
    });
  };

  React.useEffect(() => () => { if (moveRaf.current) cancelAnimationFrame(moveRaf.current); }, []);

  const renderCards = () => cards.map((id, i) => {
    const card = CARDS[id];
    const playable = !mulliganMode && gs.turn === 'PLAYER' && card.manaCost <= gs.player.mana;
    const pending = pendingSpell === i;
    const marked = mulliganMode && mulliganMarked?.has(i);
    const hidden = hiddenIndices?.has(i);

    let style: React.CSSProperties | undefined;
    const liftClass = 'hand-fan-cardLift';
    let liftTransform: string | undefined;
    if (fanActive) {
      const angle = startAngle + i * step;
      const rad = angle * Math.PI / 180;
      const x = Math.sin(rad) * radius * horizontalCompression;
      const y = (1 - Math.cos(rad)) * radius;
      const finalY = y - centerYOffset;
      const baseRotate = angle;
      // SLOT: tylko podstawowa pozycja łuku (bez hover lift)
      style = {
        transform: `translate(-50%,0) translateX(${x.toFixed(1)}px) translateY(${finalY.toFixed(1)}px) rotate(${baseRotate.toFixed(2)}deg)`,
        zIndex: 100 + i,
        transition: 'transform 300ms ease'
      };
      if (hoveredIndex === i) {
        liftTransform = 'translateY(-14px) scale(1.01)';
        style.zIndex = 900 + i;
      }
    }

    return (
      <div
        key={i}
        className={fanActive ? 'hand-fan-slot' : (hidden ? 'opacity-0 scale-75 pointer-events-none transition-all duration-300' : 'opacity-100 transition')}
        style={style}
        data-hand-idx={i}
        onMouseEnter={() => setHover(i)}
        onMouseLeave={scheduleClear}
      >
  {/* Bufor – powiększa faktyczny box slotu, więc uniesiona karta nadal jest w obrębie hover */}
  {/* usunięty bufor – hover zapewnia teraz proximity pointerMove */}
  <div className={liftClass} style={liftTransform ? { transform: liftTransform, filter:'drop-shadow(0 10px 18px rgba(0,0,0,.48))', transition:'transform 140ms cubic-bezier(.32,.72,.28,1), filter 200ms ease' } : undefined}>
          <div style={{ transform: 'scale(0.94)', transformOrigin: '50% 100%' }}>
            <CardFrame
              id={id}
              handIndex={i}
              playable={playable && !hidden}
              pending={pending}
              marked={marked}
              selectable={mulliganMode && !hidden}
              mulliganMode={mulliganMode}
              onClick={() => {
                if (hidden) return;
                if (mulliganMode) { onToggleMulligan?.(i); return; }
                if (!playable) return;
                if (card.type === 'SPELL') {
                  if (pending) onToggleSpellTargeting(-1); else onToggleSpellTargeting(i);
                } else {
                  onPlayMinion(i);
                }
              }}
            />
          </div>
        </div>
      </div>
    );
  });

  if (fanActive) {
    return (
      <div className="hand-fan-viewport">
        <div
          ref={wrapperRef}
          className="hand-fan-wrapper hand-fan-wrapper-shifted hand-fan-wrapper-interactive"
          style={{ zIndex: 80 }}
          onMouseLeave={scheduleClear}
          onPointerMove={onPointerMove}
        >
          {renderCards()}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-end gap-4 py-6 select-none flex-wrap min-h-[13rem]">
      {renderCards()}
    </div>
  );
};
