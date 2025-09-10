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

  // Precompute x positions for proximity hover
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

  // Hover state
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
    clearRef.current = window.setTimeout(() => { setHoveredIndex(null); clearRef.current = null; }, 70);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!fanActive || xPositions.length === 0) return;
    if (moveRaf.current) return; // throttle
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
      if (closest !== hoveredIndex) {
        if (hoveredIndex === null) {
          setHover(closest);
        } else {
          const prevDist = Math.abs(relX - xPositions[hoveredIndex]);
          const HYSTERESIS_PX = 28;
          if (best + HYSTERESIS_PX < prevDist) {
            const candidate = closest;
            // micro-check on next RAF to avoid jitter
            window.requestAnimationFrame(() => {
              const rect2 = wrap.getBoundingClientRect();
              const relX2 = e.clientX - (rect2.left + rect2.width / 2);
              let best2 = Infinity; let closest2 = 0;
              for (let j = 0; j < xPositions.length; j++) {
                const d2 = Math.abs(relX2 - xPositions[j]);
                if (d2 < best2) { best2 = d2; closest2 = j; }
              }
              if (closest2 === candidate) setHover(candidate);
            });
          }
        }
      }
    });
  };

  const onWrapperPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const slots = slotRefs.current;
    if (!slots || !slots.length) return;
    for (let i = 0; i < slots.length; i++) {
      const el = slots[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
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

    const style: React.CSSProperties = fanActive ? {
      transform: 'translate(-50%,0)',
      zIndex: 100 + i,
      transition: 'transform 300ms ease'
    } : {
      transform: undefined,
      zIndex: 100 + i,
      transition: 'transform 300ms ease'
    };
    const liftClass = 'hand-fan-cardLift';
    if (fanActive) {
      const angle = startAngle + i * step;
      const rad = angle * Math.PI / 180;
      const x = Math.sin(rad) * radius * horizontalCompression;
      const y = (1 - Math.cos(rad)) * radius;
      const finalY = y - centerYOffset;
      const baseRotate = angle;
      style.transform = `translate(-50%,0) translateX(${x.toFixed(1)}px) translateY(${finalY.toFixed(1)}px) rotate(${baseRotate.toFixed(2)}deg)`;
      style.zIndex = 100 + i;
      if (hoveredIndex === i) {
        const PUSH_PX = 12;
        const pushX = Math.sin(rad) * PUSH_PX * 0.7;
        const pushY = -Math.cos(rad) * PUSH_PX * 0.5;
        const liftTransform = `translateX(${pushX.toFixed(1)}px) translateY(${(-18 + pushY).toFixed(1)}px) scale(1.02)`;
        // merge into slot style so slot remains hover target
        style.transform = `${style.transform} ${liftTransform}`;
        style.zIndex = 2200 + i;
      }
    }

    const slotClass = fanActive ? ('hand-fan-slot' + (hoveredIndex === i ? ' lifted' : '')) : (hidden ? 'opacity-0 scale-75 pointer-events-none transition-all duration-300' : 'opacity-100 transition');

    return (
      <div
        key={i}
        ref={el => { slotRefs.current[i] = el; }}
        className={slotClass}
        style={style}
        data-hand-idx={i}
        onPointerEnter={() => { if (!hidden) setHover(i); }}
        onPointerLeave={() => { if (!hidden) scheduleClear(); }}
      >
        <div className={liftClass}
          onPointerDown={(e) => {
            if (hidden) return;
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
