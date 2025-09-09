import { useState, useRef, useMemo, useEffect } from 'react';
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
  const xPositions = useMemo(() => {
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const clearRef = useRef<number | null>(null);
  const moveRaf = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const setHover = (idx: number | null) => {
    if (clearRef.current) { window.clearTimeout(clearRef.current); clearRef.current = null; }
    setHoveredIndex(idx);
  };
  const scheduleClear = () => {
    if (clearRef.current) window.clearTimeout(clearRef.current);
  // lekkie opóźnienie – responsywność bez migania
  clearRef.current = window.setTimeout(() => { setHoveredIndex(null); clearRef.current = null; }, 70);
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
        // Hysteresis: avoid switching when distances are similar (prevents flicker when circling inside one card)
        if (closest !== hoveredIndex) {
          if (hoveredIndex === null) {
            setHover(closest);
          } else {
            const prevDist = Math.abs(relX - xPositions[hoveredIndex]);
            // require new candidate to be noticeably closer than previous (threshold in px)
            const HYSTERESIS_PX = 18;
            if (best + HYSTERESIS_PX < prevDist) setHover(closest);
          }
        }
    });
  };

  const onWrapperPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // Hit-test against slot bounding rects so clicks on overflowed parts register
    const slots = slotRefs.current;
    if (!slots || !slots.length) return;
    for (let i = 0; i < slots.length; i++) {
      const el = slots[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        // emulate pointer down behavior for that slot
        const id = i;
        const cardid = cards[id];
        const card = CARDS[cardid];
        const playable = !mulliganMode && gs.turn === 'PLAYER' && card.manaCost <= gs.player.mana;
        const pending = pendingSpell === id;
        const hidden = hiddenIndices?.has(id);
        if (hidden) return;
        if (mulliganMode) { onToggleMulligan?.(id); e.preventDefault(); return; }
        if (!playable) return;
        if (card.type === 'SPELL') {
          if (pending) onToggleSpellTargeting(-1); else onToggleSpellTargeting(id);
        } else {
          onPlayMinion(id);
        }
        e.preventDefault();
        return;
      }
    }
  };

  useEffect(() => () => { if (moveRaf.current) cancelAnimationFrame(moveRaf.current); }, []);

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
  // Delicate lift: small upward raise + tiny outward push along the card's radial angle
  // compute a subtle push in px along the radial direction so the card 'wysuwa' from the fan
  const PUSH_PX = 4; // reduced push for subtler effect
        const pushX = Math.sin(rad) * PUSH_PX * 0.6; // horizontal component
        const pushY = -Math.cos(rad) * PUSH_PX * 0.35; // small vertical offset along radial
        // combine with a mild upward translate and tiny scale for polish
  liftTransform = `translateX(${pushX.toFixed(1)}px) translateY(${( -6 + pushY ).toFixed(1)}px) scale(1.005)`;
        style.zIndex = 900 + i;
      }
    }

    return (
      <div
        key={i}
  ref={el => { slotRefs.current[i] = el; }}
        className={fanActive ? 'hand-fan-slot' : (hidden ? 'opacity-0 scale-75 pointer-events-none transition-all duration-300' : 'opacity-100 transition')}
        style={style}
        data-hand-idx={i}
      >
  {/* Bufor – powiększa faktyczny box slotu, więc uniesiona karta nadal jest w obrębie hover */}
  {/* usunięty bufor – hover zapewnia teraz proximity pointerMove */}
  <div className={liftClass} style={liftTransform ? { transform: liftTransform, filter:'drop-shadow(0 8px 14px rgba(0,0,0,.36))', transition:'transform 140ms cubic-bezier(.32,.72,.28,1), filter 200ms ease' } : undefined}
       onPointerDown={(e) => {
         if (hidden) return;
         // Immediate action on pointer down for snappy mulligan selection
         if (mulliganMode) { onToggleMulligan?.(i); e.preventDefault(); return; }
         if (!playable) return;
         if (card.type === 'SPELL') {
           if (pending) onToggleSpellTargeting(-1); else onToggleSpellTargeting(i);
         } else {
           onPlayMinion(i);
         }
       }}
  >
          <div style={{ transform: 'scale(0.94)', transformOrigin: '50% 100%' }}>
            <CardFrame
              id={id}
              handIndex={i}
              playable={playable && !hidden}
              pending={pending}
              marked={marked}
              selectable={mulliganMode && !hidden}
              mulliganMode={mulliganMode}
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
          onPointerDown={onWrapperPointerDown}
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
