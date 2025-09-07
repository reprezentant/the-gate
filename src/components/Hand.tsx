import React from 'react';
import './hand-fan.css';
import { CARDS } from '../game/cards';
import type { GameState } from '../game/types';
import { CardFrame } from './CardFrame';

interface HandProps { gs: GameState; pendingSpell: number | null; onPlayMinion: (index: number) => void; onToggleSpellTargeting: (index: number) => void; mulliganMode?: boolean; mulliganMarked?: Set<number>; onToggleMulligan?: (index: number) => void; hiddenIndices?: Set<number>; }

export const Hand: React.FC<HandProps> = ({ gs, pendingSpell, onPlayMinion, onToggleSpellTargeting, mulliganMode, mulliganMarked, onToggleMulligan, hiddenIndices }) => {
  const cards = gs.player.hand;
  const n = cards.length;
  const fanActive = !mulliganMode; // prosty warunek – mulligan trzyma karty w siatce

  // Parametry wachlarza
  // Delikatnie zwiększone kąty vs poprzednia wersja (więcej ekspozycji kart)
  const maxSpreadDeg = 62; // lekko większy kąt dla większego odstępu
  const maxPerStep = 11;   // limit pojedynczego kroku zachowany
  const step = n > 1 ? Math.min(maxPerStep, maxSpreadDeg / (n - 1)) : 0;
  const startAngle = -step * (n - 1) / 2;
  const radius = 440; // lekko zmniejszony promień
  const centerYOffset = 100; // podniesienie wachlarza
  // Większy odstęp: wartość bliżej 1 = mniej kompresji (więcej przestrzeni). Można uczynić adaptacyjne w przyszłości.
  const horizontalCompression = 1.38; // więcej spacingu ( >1 = rozszerzenie poziome )

  const [hoveredTarget, setHoveredTarget] = React.useState<number | null>(null); // docelowy indeks pod kursorem
  const [hoveredAnim, setHoveredAnim] = React.useState<number | null>(null); // płynnie interpolowany indeks (float)
  const hoverClearRef = React.useRef<number | null>(null);
  const rafHoverRef = React.useRef<number | null>(null);
  const animRafRef = React.useRef<number | null>(null);

  // Płynna interpolacja hoveredAnim -> hoveredTarget
  React.useEffect(() => {
    if (hoveredTarget == null) {
      // cofamy płynnie
      if (hoveredAnim == null) return;
    }
    const tick = () => {
      setHoveredAnim(prev => {
        if (hoveredTarget == null) {
          if (prev == null) return null;
          const next = prev + ( -0.3 - prev) * 0.18; // schodzimy poniżej 0 = brak
          if (next < -0.25) return null;
          return next;
        }
        if (prev == null) return hoveredTarget; // pierwszy skok – potem wygładzanie
        const diff = hoveredTarget - prev;
        if (Math.abs(diff) < 0.01) return hoveredTarget; // konwergencja
        return prev + diff * 0.24; // współczynnik wygładzania
      });
      animRafRef.current = requestAnimationFrame(tick);
    };
    animRafRef.current = requestAnimationFrame(tick);
    return () => { if (animRafRef.current) cancelAnimationFrame(animRafRef.current); };
  }, [hoveredTarget, hoveredAnim]);
  const setHoveredSafe = (idx: number | null) => {
    if (hoverClearRef.current) { window.clearTimeout(hoverClearRef.current); hoverClearRef.current = null; }
    setHoveredTarget(idx);
  };
  const scheduleHoverClear = () => {
    if (hoverClearRef.current) window.clearTimeout(hoverClearRef.current);
    hoverClearRef.current = window.setTimeout(()=> { setHoveredTarget(null); hoverClearRef.current = null; }, 90); // małe opóźnienie anty-glitch
  };

  const renderCards = () => cards.map((id, i) => {
  const card = CARDS[id];
        const playable = !mulliganMode && gs.turn === 'PLAYER' && card.manaCost <= gs.player.mana;
        const pending = pendingSpell === i;
        const marked = mulliganMode && mulliganMarked?.has(i);
        const hidden = hiddenIndices?.has(i);

  let style: React.CSSProperties | undefined;
  let liftClass = 'hand-fan-cardLift';
        if (fanActive) {
          const angle = startAngle + i * step; // w stopniach
          const rad = angle * Math.PI / 180;
          // Wylicz lokalną pozycję na łuku – ograniczamy do transform, a pozycjonujemy absolutnie względem wrappera
          const x = Math.sin(rad) * radius * horizontalCompression; // kompresja osi X dla overlapu
          const y = (1 - Math.cos(rad)) * radius; // przesunięcie pionowe (łuk)
          // Korekta bazowa w dół aby dół kart był prawie w jednej linii
          const finalY = y - centerYOffset;

          const zIndex = 100 + i;
          const baseRotate = angle; // bez manipulacji rotacją podczas hover – stabilność

          if (hoveredAnim != null) {
            const dFloat = i - hoveredAnim;
            const ad = Math.abs(dFloat);
            const liftFactor = Math.max(0, 1 - Math.min(1, ad)); // 0..1
            // Podnoszenie i skalowanie płynne (append do transform)
            const extraY = -26 * liftFactor; // maksymalne uniesienie
            const extraScale = 1 + 0.04 * liftFactor;
            style = {
              ...(style||{}),
              transform: `translate(-50%, 0) translateX(${x.toFixed(1)}px) translateY(${finalY.toFixed(1)}px) rotate(${baseRotate.toFixed(2)}deg) translateY(${extraY.toFixed(1)}px) scale(${extraScale.toFixed(3)})`,
              zIndex: zIndex + Math.round(liftFactor * 900),
              transition: 'opacity 260ms ease',
              filter: liftFactor > 0.01 ? `drop-shadow(0 ${8+8*liftFactor}px ${14+8*liftFactor}px rgba(0,0,0,${0.30+0.25*liftFactor}))` : undefined,
              opacity: hoveredAnim != null && liftFactor < 0.95 ? 0.87 : 1
            };
            if (liftFactor > 0.95) liftClass += ' is-lifted';
          } else {
            // default style (already computed below)
          }

          if (!style) {
            style = {
              transform: `translate(-50%, 0) translateX(${x.toFixed(1)}px) translateY(${finalY.toFixed(1)}px) rotate(${baseRotate.toFixed(2)}deg)`,
              zIndex,
              transition: 'opacity 260ms ease'
            };
          }
        }

  return (
          <div
            key={i}
            className={fanActive ? 'hand-fan-slot' : (hidden ? 'opacity-0 scale-75 pointer-events-none transition-all duration-300' : 'opacity-100 transition')}
            style={style}
            data-hand-idx={i}
          >
            <div className={liftClass}>
              <div style={{transform:'scale(0.94)', transformOrigin:'50% 100%'}}>
              <CardFrame
                id={id}
                handIndex={i}
                playable={playable && !hidden}
                pending={pending}
                marked={marked}
                selectable={mulliganMode && !hidden}
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

  const onWrapperMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!fanActive) return;
  if (rafHoverRef.current) cancelAnimationFrame(rafHoverRef.current);
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width/2);
    // Precompute x centers for each card (same formula as layout)
    let closest = 0; let closestDist = Infinity;
    for (let i=0;i<n;i++) {
      const angle = startAngle + i * step;
      const rad = angle * Math.PI/180;
      const x = Math.sin(rad) * radius * horizontalCompression; // center X for card i
      const d = Math.abs(relX - x);
      if (d < closestDist) { closestDist = d; closest = i; }
    }
  rafHoverRef.current = requestAnimationFrame(()=> { setHoveredSafe(closest); });
  };

  if (fanActive) {
    return (
      <div className="hand-fan-viewport">
        <div
          className="hand-fan-wrapper hand-fan-wrapper-shifted hand-fan-wrapper-interactive"
          style={{zIndex:80}}
          onMouseMove={onWrapperMouseMove}
          onMouseLeave={() => scheduleHoverClear()}
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
