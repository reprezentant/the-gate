import { useState, useRef, useEffect } from "react";
import type { CSSProperties, RefObject } from 'react';
import type { GameState, MinionInstance, Side, MinionCard, SpellCard } from './game/types';
import { CARDS } from './game/cards';
import { initGame, playCardForSidePure, startTurnFor, heroPowerAction, BOARD_LIMIT, HAND_LIMIT, HERO_POWER_COST, HERO_POWER_DAMAGE, processDeaths, applyWinner, clone, performMulligan, onDraw, computePotentialLethal, canAttackTargetRespectingTaunt, damageMinion } from './game/engine';
// Removed unused legacy non-animated AI import
import { Hero } from './components/Hero';
import { LoaderOverlay } from './components/LoaderOverlay';
import { BoardRow } from './components/BoardRow';
import { Hand as HandComp } from './components/Hand';
import { LogPanel } from './components/LogPanel';
import { StatsPanel } from './components/StatsPanel';
import './hero-anim.css';

// Floating Hero Power button (bottom-right) with decagon frame + sword emoji + mana spend animation
function HeroPowerFloating({ activeTurn, used, mana, cost, onUse, hidden = false }: { activeTurn: boolean; used: boolean; mana: number; cost: number; onUse: () => void; hidden?: boolean }) {
  const canUse = activeTurn && !used && mana >= cost;
  interface P { id:number; tx:number; ty:number; rot:number; }
  const [particles, setParticles] = useState<P[]>([]);
  const [spendId, setSpendId] = useState<number | null>(null);
  // Cleanup timers
  useEffect(()=> {
    if (!particles.length) return;
    const t = setTimeout(()=> setParticles([]), 900);
    return ()=> clearTimeout(t);
  }, [particles]);
  useEffect(()=> {
    if (spendId===null) return;
    const t = setTimeout(()=> setSpendId(null), 1100);
    return ()=> clearTimeout(t);
  }, [spendId]);
  const trigger = () => {
    if (!canUse) return;
    const created: P[] = Array.from({length:9}).map((_,i)=>{
      const a = Math.random()*Math.PI*2; const d = 22+Math.random()*30; return { id: Date.now()+i, tx: Math.cos(a)*d, ty: Math.sin(a)*d, rot: Math.random()*360 }; });
    setParticles(created); setSpendId(Date.now()); onUse();
  };
  if (hidden) return null;
  return (
    <div className="pointer-events-none select-none">
  <div className="fixed bottom-6 right-6 z-[60] pointer-events-auto group">
        <button
          disabled={!canUse}
          aria-label="Moc Bohatera"
          onClick={trigger}
          className={`relative w-24 h-24 font-bold uppercase tracking-wide transition-transform focus:outline-none ${canUse ? 'hover:scale-105 active:scale-95' : 'opacity-60 cursor-not-allowed'} `}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -z-10 overflow-visible" style={{filter: canUse ? '' : 'grayscale(1) brightness(.6)'}}>
            <defs>
              <linearGradient id="hpwr-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d1630" />
                <stop offset="55%" stopColor="#111f3f" />
                <stop offset="100%" stopColor="#080d1c" />
              </linearGradient>
              <linearGradient id="hpwr-stroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6cb3ff" />
                <stop offset="100%" stopColor="#1d5aa8" />
              </linearGradient>
              <linearGradient id="hpwr-stroke-inner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cae9ff" />
                <stop offset="100%" stopColor="#4aa0ff" />
              </linearGradient>
              <filter id="hpwr-shadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.65" />
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#5ebdff" floodOpacity="0.22" />
              </filter>
              <filter id="hpwr-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#5ebdff" floodOpacity="0.28" />
              </filter>
              <radialGradient id="hpwr-flare" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#e2f3ff" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#7bc8ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0077ff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="url(#hpwr-fill)" opacity="0.94" />
            <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="url(#hpwr-stroke)" strokeWidth="8" strokeLinejoin="round" filter="url(#hpwr-shadow)" />
            <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="url(#hpwr-stroke)" strokeWidth="4.5" strokeLinejoin="round" opacity="0.85" />
            <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="url(#hpwr-stroke-inner)" strokeWidth="1.8" strokeLinejoin="round" opacity="0.45" />
            {canUse && <circle className="pointer-events-none animate-ping" cx="50" cy="50" r="15" fill="url(#hpwr-flare)" opacity="0.28" />}
          </svg>
          <span className={`relative z-10 flex items-center justify-center h-full w-full ${canUse ? 'text-sky-100' : 'text-slate-400'} select-none`}>
            <span className="text-3xl">⚔️</span>
          </span>
          <div className="hpwr-particles absolute inset-0 pointer-events-none overflow-visible">
            {particles.map(p => {
              const style = { ['--tx' as string]: p.tx + 'px', ['--ty' as string]: p.ty + 'px', ['--rot' as string]: p.rot + 'deg' } as CSSProperties;
              return <span key={p.id} className="hpwr-particle" style={style} />;
            })}
          </div>
          {/* Removed textual 'Użyta' overlay per request; greyscale/disabled styling remains */}
        </button>
        {spendId && (
          <div key={spendId} className="hpwr-spend-floating select-none text-[15px]">-{cost} mana</div>
        )}
      </div>
      <style>{`
        .hpwr-particle { position:absolute; width:5px; height:5px; background:radial-gradient(circle at 30% 30%, #eaffff, #6ec8ff 60%, #0a5fa8 95%); border-radius:9999px; animation:hpwr-pop .85s ease-out forwards; pointer-events:none; transform:translate(-50%,-50%) scale(.4) rotate(var(--rot)); box-shadow:0 0 6px rgba(102,197,255,0.55); }
        @keyframes hpwr-pop { 0% { opacity:0; transform:translate(-50%,-50%) scale(.2); } 10% { opacity:1; } 60% { opacity:1; transform:translate(calc(-50% + var(--tx)/1.4), calc(-50% + var(--ty)/1.4)) scale(1); } 100% { opacity:0; transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(.1); } }
        .hpwr-spend-floating { position:absolute; bottom:100%; right:50%; transform:translateX(50%) translateY(0); font-size:18px; font-weight:800; letter-spacing:.05em; font-family:inherit; padding:.15rem .55rem; color:#bfe7ff; text-shadow:0 2px 4px rgba(0,0,0,.65),0 0 6px rgba(134,210,255,.55); animation:hpwr-spend-float 1.1s ease-out forwards; pointer-events:none; background:linear-gradient(to right, rgba(35,80,120,0.55), rgba(15,40,70,0.3)); border:1px solid rgba(160,220,255,0.25); border-radius:.6rem; backdrop-filter:blur(2px); }
        @keyframes hpwr-spend-float { 0% { opacity:0; transform:translateX(50%) translateY(10px) scale(.6); } 12% { opacity:1; } 70% { opacity:1; } 100% { opacity:0; transform:translateX(50%) translateY(-34px) scale(.9); } }
      `}</style>
    </div>
  );
}

// =========================================================
// MVP CARD GAME — Player attacks (select attacker -> target), fixes & polish
// =========================================================

// (definitions moved to game/)


// AI logic moved to game/ai.ts

// =========================================================
// UI Components
// =========================================================

// ManaCrystals HUD removed (replaced by circular meter next to hero)

// (Inline card / hero / minion components replaced by dedicated components in /components)

// =========================================================
// Game Component
// =========================================================

export default function CardGameMVP() {
  const [bootProgress, setBootProgress] = useState(0);
  const [bootDone, setBootDone] = useState(false);
  // Simulated boot loading (assets / warming). Replace with real preloads if available later.
  useEffect(()=> {
    if (bootDone) return;
    let mounted = true;
    const start = performance.now();
    function tick(now:number){
      if (!mounted) return;      
      const elapsed = now - start; // ms
      // Ease-out progress curve (cap 100) ~1.6s
      const pct = Math.min(100, (elapsed/16)); // ~1600ms to 100
      // Add slight smoothing
      setBootProgress(p => p < pct ? pct : p);
      if (pct >= 100) {
        setTimeout(()=> mounted && setBootDone(true), 250); // short dwell
        return;
      }
      requestAnimationFrame(tick);
    }
    const r = requestAnimationFrame(tick);
    return ()=> { mounted=false; cancelAnimationFrame(r); };
  }, [bootDone]);
  const [gs, setGs] = useState<GameState>(() => initGame());
  const [attackerId, setAttackerId] = useState<string | null>(null);
  const [pendingSpell, setPendingSpell] = useState<number | null>(null); // index zaklęcia czekającego na cel
  const [pointer, setPointer] = useState<{x:number;y:number}>({x:0,y:0});
  // Parallax offset (smooth) for background
  const [parallax, setParallax] = useState<{x:number;y:number}>({x:0,y:0});
  useEffect(()=> {
    const handle = requestAnimationFrame(() => {
      // Smooth interpolation to pointer center delta
      if (!arenaRef.current) return;
      const rect = arenaRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const dx = (pointer.x - cx) / rect.width; // ~ -0.5..0.5
      const dy = (pointer.y - cy) / rect.height;
      // Limit and ease (smaller movement)
      setParallax(p => ({
        x: p.x + (dx*20 - p.x)*0.08,
        y: p.y + (dy*14 - p.y)*0.08
      }));
    });
    return () => cancelAnimationFrame(handle);
  }, [pointer]);
  const [arrowOrigin, setArrowOrigin] = useState<{x:number;y:number}|null>(null);
  const [showRules, setShowRules] = useState(false);
  const [mulliganMarked, setMulliganMarked] = useState<Set<number>>(new Set());
  // Single-step undo: previous GameState when player plays a card (allow takeback until end turn)
  const [undoGs, setUndoGs] = useState<GameState | null>(null);
  const [lethalReady, setLethalReady] = useState(false);
  const lethalPrevRef = useRef(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'stats' | 'rules' | 'log'>('stats');
  const scaleRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // Responsive scaling (fit height while keeping 16/9)
  useEffect(() => {
    const handle = () => {
      if (!scaleRef.current) return;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const targetW = vw; // we fill width but keep aspect
      const baseRatio = 16/9;
      const targetH = targetW / baseRatio;
      let s = 1;
      if (targetH > vh) {
        s = vh / targetH;
      }
      setScale(Math.max(0.6, Math.min(1, s)));
    };
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  // Unified cancel for targeting (spell or attack)
  const cancelInteractions = () => { setPendingSpell(null); setAttackerId(null); };

  // Global listeners: Escape or right-click (context menu) cancels when aiming
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (attackerId || pendingSpell !== null)) {
        cancelInteractions();
      }
    };
    const onContext = (e: MouseEvent) => {
      if (attackerId || pendingSpell !== null) {
        e.preventDefault();
        cancelInteractions();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('contextmenu', onContext);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('contextmenu', onContext);
    };
  }, [attackerId, pendingSpell]);
  
  // Lethal detection using engine helper
  useEffect(() => {
    const lethal = computePotentialLethal(gs,'PLAYER');
    setLethalReady(lethal);
    if (lethal && !lethalPrevRef.current) {
      // edge trigger: add log entry
      setGs(prev => ({ ...prev, log: [...prev.log, 'YOU: potencjalny LETHAL dostępny'] }));
    }
    lethalPrevRef.current = lethal;
  }, [gs]);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [damageFx, setDamageFx] = useState<{ id: string; x: number; y: number; value: number; key: string }[]>([]);
  // Subscribe to draw events for animation (player only for now)
  useEffect(() => {
    const handler = (e: { side: Side }) => {
      if (e.side !== 'PLAYER') return; // animate only player draws
      // Wait a tick for state to include new card so we know its slot index
      requestAnimationFrame(() => {
        if (!arenaRef.current) return;
        const handCards = Array.from(arenaRef.current.querySelectorAll('[data-hand-idx]')) as HTMLElement[];
        const lastIdx = handCards.length - 1;
        if (lastIdx < 0) return;
        const targetEl = handCards[lastIdx];
        const deckPosEl = arenaRef.current.querySelector('[data-hero="PLAYER"]') as HTMLElement | null; // approximate deck source near player hero
        const ar = arenaRef.current.getBoundingClientRect();
        const tbr = targetEl.getBoundingClientRect();
        const sbr = deckPosEl ? deckPosEl.getBoundingClientRect() : tbr;
        const start = { x: sbr.left + sbr.width/2 - ar.left, y: sbr.top + sbr.height/2 - ar.top - 40 };
        const end = { x: tbr.left + tbr.width/2 - ar.left, y: tbr.top + tbr.height/2 - ar.top };
        const key = Math.random().toString(36).slice(2);
        setDrawFx(fx => [...fx, { id: 'draw', x: start.x, y: start.y, tx: end.x, ty: end.y, key }]);
        setHiddenHandSlots(prev => { const n = new Set(prev); n.add(lastIdx); return n; });
        setTimeout(() => {
          // Remove effect & unhide slot
          setDrawFx(fx => fx.filter(f => f.key !== key));
          setHiddenHandSlots(prev => { const n = new Set(prev); n.delete(lastIdx); return n; });
        }, 550);
      });
    };
    onDraw(handler);
  }, []);
  const [drawFx, setDrawFx] = useState<{ id:string; x:number; y:number; tx:number; ty:number; key:string }[]>([]);
  const [hiddenHandSlots, setHiddenHandSlots] = useState<Set<number>>(new Set());
  const spawnDamage = (selector: string, value: number) => {
    if (value <= 0) return;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el || !arenaRef.current) return;
    const br = el.getBoundingClientRect();
    const ar = arenaRef.current.getBoundingClientRect();
    const x = br.left + br.width/2 - ar.left;
    const y = br.top + 10 - ar.top;
    const key = Math.random().toString(36).slice(2);
    setDamageFx(fx => [...fx, { id: selector, x, y, value, key }]);
    setTimeout(() => setDamageFx(fx => fx.filter(f => f.key !== key)), 900);
  };

  // Helpers
  const chooseAttacker = (m: MinionInstance) => {
    if (gs.turn !== "PLAYER") return;
    const card = CARDS[m.cardId] as MinionCard;
    if (!m.canAttack) return;
    if (m.justSummoned && !card.rush) return; // only Rush bypasses summoning sickness (but hero attack still blocked elsewhere)
    setAttackerId(m.entityId);
  };

  // --- Targeted spell application ---
  const applySpellTarget = (target: { kind: 'HERO' | 'MINION'; side: Side; entityId?: string }) => {
    if (pendingSpell === null) return;
    const idx = pendingSpell;
    const cardId = gs.player.hand[idx];
    const card = cardId ? CARDS[cardId] : undefined;
    if (!card || card.type !== 'SPELL') { setPendingSpell(null); return; }
    if (card.manaCost > gs.player.mana) { setPendingSpell(null); return; }
    let next = clone(gs);
    const realIdx = next.player.hand.indexOf(cardId);
    if (realIdx === -1) { setPendingSpell(null); return; }
    next.player.mana -= card.manaCost;
    next.player.hand.splice(realIdx, 1);
    const eff = (card as SpellCard).effects[0];
    const dmg = eff.amount ?? 0;
  if (target.kind === 'HERO') {
      const hs = target.side === 'PLAYER' ? next.player : next.ai;
      const before = hs.heroHp;
      hs.heroHp -= dmg;
      spawnDamage(target.side === 'PLAYER' ? '[data-hero="PLAYER"]' : '[data-hero="AI"]', before - hs.heroHp);
      next.log.push(`YOU: czar ${card.name} (${dmg} dmg w ${target.side === 'PLAYER' ? 'Twojego bohatera' : 'bohatera AI'})`);
    } else {
      const bs = target.side === 'PLAYER' ? next.player : next.ai;
      const minion = bs.board.find(m => m.entityId === target.entityId);
      if (minion) {
        const applied = damageMinion(next, target.side, minion.entityId, dmg, card.name);
        if (applied > 0) spawnDamage(`[data-minion='${minion.entityId}']`, applied);
        next.log.push(`YOU: czar ${card.name} (${dmg} dmg w ${CARDS[minion.cardId].name})`);
      }
    }
    const beforePlayerHp = next.player.heroHp, beforeAiHp = next.ai.heroHp;
    processDeaths(next);
    // Deathrattle hero damage spawning (diff after processDeaths)
    if (next.player.heroHp < beforePlayerHp) spawnDamage('[data-hero="PLAYER"]', beforePlayerHp - next.player.heroHp);
    if (next.ai.heroHp < beforeAiHp) spawnDamage('[data-hero="AI"]', beforeAiHp - next.ai.heroHp);
    next = applyWinner(next);
    setPendingSpell(null);
    setAttackerId(null);
    setGs(next);
  };

  const cancelPendingSpell = () => setPendingSpell(null);

  // Attack animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [attackAnim, setAttackAnim] = useState<null | {
    owner: 'PLAYER' | 'AI';
    attackerId: string;
    targetType: 'HERO' | 'MINION';
    targetSide: Side;
    targetMinionId?: string;
    start: {x:number;y:number};
    end: {x:number;y:number};
  }>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const gsRef = useRef<GameState>(gs);
  useEffect(()=> { gsRef.current = gs; }, [gs]);

  // ===================== AI TURN (ANIMATED HELPERS INSIDE COMPONENT) =====================
  interface AiActionBase { kind: string }
  interface AiPlayMinion extends AiActionBase { kind: 'PLAY_MINION'; handIndex: number }
  interface AiPlaySpellHero extends AiActionBase { kind: 'PLAY_SPELL_HERO'; handIndex: number; dmg: number }
  interface AiPlaySpellMinion extends AiActionBase { kind: 'PLAY_SPELL_MINION'; handIndex: number; targetId: string; dmg: number }
  interface AiAttackMinion extends AiActionBase { kind: 'ATTACK_MINION'; attackerId: string; targetId: string }
  interface AiAttackHero extends AiActionBase { kind: 'ATTACK_HERO'; attackerId: string }
  interface AiHeroPower extends AiActionBase { kind: 'HERO_POWER' }
  interface AiStart extends AiActionBase { kind: 'START' }
  interface AiEnd extends AiActionBase { kind: 'END' }
  type AiAction = AiPlayMinion|AiPlaySpellHero|AiPlaySpellMinion|AiAttackMinion|AiAttackHero|AiHeroPower|AiStart|AiEnd;

  function buildAiQueue(state: GameState): AiAction[] {
    const gsCopy = clone(state);
    const actions: AiAction[] = [{ kind: 'START' }];
    const evaluateRemovalValue = (m: MinionInstance) => { const c = CARDS[m.cardId] as MinionCard; return c.attack * 2 + c.health; };
    // simulate start
    const aiPlan = gsCopy.ai; aiPlan.maxMana = Math.min(10, aiPlan.maxMana + 1); aiPlan.mana = aiPlan.maxMana; aiPlan.heroPowerUsed=false; aiPlan.board = aiPlan.board.map(m=>({...m, canAttack:true, justSummoned:false}));
    // Simulate draw 1 (basic) so AI has cards to plan with
    if (aiPlan.deck.length && aiPlan.hand.length < HAND_LIMIT) {
      aiPlan.hand.push(aiPlan.deck.shift()!);
    }
    const playerPlan = gsCopy.player;
    let plays = 0;
    while (plays < 3) {
      const choices = aiPlan.hand.map((id,i)=>({id,i,card:CARDS[id]})).filter(x=> x.card.manaCost <= aiPlan.mana);
      if (!choices.length) break;
      const minions = choices.filter(c=> c.card.type==='MINION');
      const spells = choices.filter(c=> c.card.type==='SPELL');
      let bestSpell: { choice: typeof spells[0]; targetMinion?: MinionInstance; targetHero: boolean; score: number } | null = null;
      for (const s of spells) {
        const eff = (s.card as SpellCard).effects[0]; const dmg = eff.amount ?? 0;
        for (const pm of playerPlan.board) { if (pm.currentHealth <= dmg) { const score = 100 + evaluateRemovalValue(pm); if (!bestSpell || score > bestSpell.score) bestSpell = { choice: s, targetMinion: pm, targetHero: false, score }; } }
        const faceScore = (eff.amount ?? 0) * 3;
        if (!bestSpell || faceScore > bestSpell.score) bestSpell = { choice: s, targetMinion: undefined, targetHero: true, score: faceScore };
      }
      const bestMinion = minions.sort((a,b)=> b.card.manaCost - a.card.manaCost)[0];
      let decided: 'SPELL' | 'MINION' | null = null;
      if (bestSpell && bestMinion) { const minionScore = bestMinion.card.manaCost * 15; decided = bestSpell.score > minionScore ? 'SPELL':'MINION'; }
      else if (bestSpell) decided='SPELL'; else if (bestMinion) decided='MINION'; else break;
      if (decided==='MINION' && bestMinion) {
        actions.push({ kind:'PLAY_MINION', handIndex: bestMinion.i });
        aiPlan.mana -= bestMinion.card.manaCost; aiPlan.hand.splice(bestMinion.i,1);
        aiPlan.board.push({ entityId: 'PLN'+Math.random().toString(36).slice(2), cardId: bestMinion.id, owner:'AI', baseAttack:(bestMinion.card as MinionCard).attack, currentHealth:(bestMinion.card as MinionCard).health, canAttack:(bestMinion.card as MinionCard).rush?true:false, justSummoned:true });
      } else if (decided==='SPELL' && bestSpell) {
        const idx = bestSpell.choice.i; const spell = bestSpell.choice.card as SpellCard; aiPlan.mana -= spell.manaCost; aiPlan.hand.splice(idx,1);
        if (bestSpell.targetHero) actions.push({ kind:'PLAY_SPELL_HERO', handIndex: idx, dmg: spell.effects[0].amount ?? 0 });
        else if (bestSpell.targetMinion) actions.push({ kind:'PLAY_SPELL_MINION', handIndex: idx, targetId: bestSpell.targetMinion.entityId, dmg: spell.effects[0].amount ?? 0 });
      }
      plays++;
    }
    for (const m of aiPlan.board) {
      const card = CARDS[m.cardId] as MinionCard; if (!(m.canAttack && (!m.justSummoned || card.rush))) continue;
      const taunts = playerPlan.board.filter(x => (CARDS[x.cardId] as MinionCard).taunt);
      const pool = taunts.length ? taunts : playerPlan.board;
      const favorable = pool.find(pm => pm.currentHealth <= m.baseAttack && (CARDS[pm.cardId] as MinionCard).attack < m.currentHealth);
      if (favorable) { actions.push({ kind:'ATTACK_MINION', attackerId: m.entityId, targetId: favorable.entityId }); continue; }
      const anyKill = pool.find(pm => pm.currentHealth <= m.baseAttack); if (anyKill) { actions.push({ kind:'ATTACK_MINION', attackerId: m.entityId, targetId: anyKill.entityId }); continue; }
      if (taunts.length) continue; if (m.justSummoned && card.rush) continue; actions.push({ kind:'ATTACK_HERO', attackerId: m.entityId });
    }
    actions.push({ kind:'HERO_POWER' });
    actions.push({ kind:'END' });
    return actions;
  }

  function wait(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

  async function executeAiQueue(queue: AiAction[]) {
    for (const action of queue) {
      if (action.kind==='START') {
        setGs(prev => { if (prev.winner) return prev; const next = clone(prev); next.turn='AI'; startTurnFor(next,'AI'); return next; });
        await wait(350); continue;
      }
      if (action.kind==='PLAY_MINION') {
        setGs(prev => { const next = clone(prev); if (next.turn!=='AI') return next; const ai = next.ai; const id = ai.hand[action.handIndex]; if (!id) return next; const card = CARDS[id]; if (card.manaCost>ai.mana) return next; ai.mana -= card.manaCost; ai.hand.splice(action.handIndex,1); if (card.type==='MINION' && ai.board.length<BOARD_LIMIT) { ai.board.push({ entityId: Math.random().toString(36).slice(2), cardId: card.id, owner:'AI', baseAttack:(card as MinionCard).attack, currentHealth:(card as MinionCard).health, canAttack:(card as MinionCard).rush?true:false, justSummoned:true }); next.log.push(`AI: zagrał stwora ${card.name}`); } return next; });
        await wait(420); continue;
      }
      if (action.kind==='PLAY_SPELL_HERO') {
        setGs(prev => { const next = clone(prev); if (next.turn!=='AI') return prev; next.player.heroHp -= action.dmg; next.log.push(`AI: czar ${action.dmg} dmg w bohatera`); return applyWinner(next); });
        spawnDamage('[data-hero="PLAYER"]', action.dmg); await wait(400); continue;
      }
      if (action.kind==='PLAY_SPELL_MINION') {
  setGs(prev => { const next = clone(prev); if (next.turn!=='AI') return prev; const target = next.player.board.find(m=> m.entityId===action.targetId); if (target) { const applied = damageMinion(next, 'PLAYER', target.entityId, action.dmg, 'AI spell'); if (applied > 0) spawnDamage(`[data-minion='${target.entityId}']`, applied); next.log.push(`AI: czar ${action.dmg} dmg w ${CARDS[target.cardId].name}`); processDeaths(next); } return applyWinner(next); }); await wait(440); continue;
      }
      if (action.kind==='ATTACK_MINION') {
        const current = gsRef.current; const atk = current.ai.board.find(m=> m.entityId===action.attackerId); const def = current.player.board.find(m=> m.entityId===action.targetId); if (!atk || !def) continue; const aEl = document.querySelector(`[data-minion='${atk.entityId}']`) as HTMLElement | null; const dEl = document.querySelector(`[data-minion='${def.entityId}']`) as HTMLElement | null; if (!aEl || !dEl) continue; const a=aEl.getBoundingClientRect(), d=dEl.getBoundingClientRect();
        // Replace compact attack + damage line with shield-aware sequence
        setAttackAnim({ owner:'AI', attackerId: atk.entityId, targetType:'MINION', targetSide:'PLAYER', targetMinionId:def.entityId, start:{x:a.left+a.width/2,y:a.top+a.height/2}, end:{x:d.left+d.width/2,y:d.top+d.height/2} });
        await wait(420);
        setGs(prev => {
          const next = clone(prev);
          const A = next.ai.board.find(m => m.entityId === action.attackerId);
          const D = next.player.board.find(m => m.entityId === action.targetId);
          if (A && D) {
            const db = D.currentHealth;
            const ab = A.currentHealth;
            // Divine Shield handling: consume shield before applying damage
            if (D.shield) {
              D.shield = false;
              next.log.push(`${D.owner}: tarcza ${D.cardId} została zużyta (atak AI)`);
            } else {
              D.currentHealth -= A.baseAttack;
            }
            if (A.shield) {
              A.shield = false;
              next.log.push(`${A.owner}: tarcza ${A.cardId} została zużyta (kontratak)`);
            } else {
              A.currentHealth -= (CARDS[D.cardId] as MinionCard).attack;
            }
            spawnDamage(`[data-minion='${D.entityId}']`, db - Math.max(D.currentHealth, 0));
            spawnDamage(`[data-minion='${A.entityId}']`, ab - Math.max(A.currentHealth, 0));
            if (A.currentHealth > 0) A.canAttack = false;
            next.log.push(`AI: atakuje ${CARDS[D.cardId].name}`);
            processDeaths(next);
          }
          return applyWinner(next);
        });
        setAttackAnim(null);
        await wait(140);
        continue;
      }
      if (action.kind==='ATTACK_HERO') {
        const current = gsRef.current; const atk = current.ai.board.find(m=> m.entityId===action.attackerId); if (!atk) continue; const aEl = document.querySelector(`[data-minion='${atk.entityId}']`) as HTMLElement | null; const hEl = document.querySelector('[data-hero="PLAYER"]') as HTMLElement | null; if (!aEl || !hEl) continue; const a=aEl.getBoundingClientRect(), h=hEl.getBoundingClientRect(); setAttackAnim({ owner:'AI', attackerId: atk.entityId, targetType:'HERO', targetSide:'PLAYER', start:{x:a.left+a.width/2,y:a.top+a.height/2}, end:{x:h.left+h.width/2,y:h.top+h.height/2} }); await wait(420); setGs(prev => { const next = clone(prev); const A = next.ai.board.find(m=> m.entityId===action.attackerId); if (A) { const before = next.player.heroHp; next.player.heroHp -= A.baseAttack; spawnDamage('[data-hero="PLAYER"]', before - next.player.heroHp); A.canAttack=false; next.log.push(`AI: atakuje bohatera za ${A.baseAttack}`); processDeaths(next); } return applyWinner(next); }); setAttackAnim(null); await wait(150); continue;
      }
      if (action.kind==='HERO_POWER') {
        setGs(prev => { const next = clone(prev); if (next.turn!=='AI') return prev; if (next.ai.heroPowerUsed) return next; if (next.ai.mana < HERO_POWER_COST) return next; next.ai.mana -= HERO_POWER_COST; next.ai.heroPowerUsed=true; const before = next.player.heroHp; next.player.heroHp -= HERO_POWER_DAMAGE; spawnDamage('[data-hero="PLAYER"]', before - next.player.heroHp); next.log.push(`AI: moc bohatera (${HERO_POWER_DAMAGE} dmg)`); return applyWinner(next); }); await wait(420); continue;
      }
      if (gsRef.current.winner) break;
    }
  setGs(prev => { if (prev.winner) return prev; const next = clone(prev); if (next.turn==='AI') { next.turn='PLAYER'; startTurnFor(next,'PLAYER'); } next.log.push('--- Twoja tura (AI animacje zakończone) ---'); return next; });
  }

  function startAiTurnAnimated() {
    if (aiProcessing) return;
  // clear undo snapshot before AI actions
  setUndoGs(null);
  setAiProcessing(true);
    const queue = buildAiQueue(gsRef.current);
    executeAiQueue(queue).finally(()=> setAiProcessing(false));
  }

  // Ustalanie punktu startowego strzałki
  useEffect(() => {
    // priorytet: pendingSpell potem attacker
    let targetEl: HTMLElement | null = null;
    if (pendingSpell !== null) {
      targetEl = document.querySelector(`[data-hand-idx='${pendingSpell}']`) as HTMLElement | null;
    } else if (attackerId) {
      targetEl = document.querySelector(`[data-minion='${attackerId}']`) as HTMLElement | null;
    }
    if (targetEl) {
      const r = targetEl.getBoundingClientRect();
      setArrowOrigin({ x: r.left + r.width/2, y: r.top + r.height/2 });
    } else {
      setArrowOrigin(null);
    }
  }, [attackerId, pendingSpell, gs.player.hand.length]);

  // Recompute origin on window resize (debounced minimal)
  useEffect(() => {
    const onResize = () => {
      if (!arrowOrigin) return;
      // force recompute by triggering effect dependencies via dummy state toggle? Simpler: recalc here.
      let targetEl: HTMLElement | null = null;
  if (pendingSpell !== null) targetEl = document.querySelector(`[data-hand-idx='${pendingSpell}']`) as HTMLElement | null;
      else if (attackerId) targetEl = document.querySelector(`[data-minion='${attackerId}']`) as HTMLElement | null;
      if (targetEl) {
        const r = targetEl.getBoundingClientRect();
        setArrowOrigin({ x: r.left + r.width/2, y: r.top + r.height/2 });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [arrowOrigin, attackerId, pendingSpell]);

  const resolveAttackOnMinion = (defSide: Side, defId: string) => {
    if (isAnimating) return;
    if (pendingSpell !== null) { applySpellTarget({ kind: 'MINION', side: defSide, entityId: defId }); return; }
    if (!attackerId) return;
    if (gs.turn !== "PLAYER") return;
    if (!canAttackTargetRespectingTaunt(gs,'PLAYER',{ type:'MINION', entityId: defId })) {
      setGs(prev => ({ ...prev, log: [...prev.log, 'YOU: musisz najpierw zaatakować Prowokację'] }));
      setAttackerId(null);
      return;
    }
    const attackerEl = document.querySelector(`[data-minion='${attackerId}']`) as HTMLElement | null;
    const targetEl = document.querySelector(`[data-minion='${defId}']`) as HTMLElement | null;
    if (!attackerEl || !targetEl) return;
    const a = attackerEl.getBoundingClientRect();
    const t = targetEl.getBoundingClientRect();
    setIsAnimating(true);
    setAttackAnim({
      owner: 'PLAYER',
      attackerId,
      targetType: 'MINION',
      targetSide: defSide,
      targetMinionId: defId,
      start: { x: a.left + a.width/2, y: a.top + a.height/2 },
      end: { x: t.left + t.width/2, y: t.top + t.height/2 }
    });
    setTimeout(() => {
      setGs(prev => {
        let next = clone(prev);
        if (next.turn !== 'PLAYER') return next;
        const atk = next.player.board.find(b => b.entityId === attackerId);
        const enemy = defSide === 'AI' ? next.ai : next.player;
        const def = enemy.board.find(b => b.entityId === defId);
        if (atk && def) {
          // record before values removed — we use damageMinion which returns applied amount
          // Use central damage function to handle shield and poisonous logic
          const appliedToDef = damageMinion(next, def.owner, def.entityId, atk.baseAttack, `atak ${CARDS[atk.cardId].name}`, atk.entityId);
          const appliedToAtk = damageMinion(next, atk.owner, atk.entityId, (CARDS[def.cardId] as MinionCard).attack, `kontratak ${CARDS[def.cardId].name}`, def.entityId);
          if (appliedToDef > 0) spawnDamage(`[data-minion='${def.entityId}']`, appliedToDef);
          if (appliedToAtk > 0) spawnDamage(`[data-minion='${atk.entityId}']`, appliedToAtk);
          const atkAlive = next.player.board.find(x => x.entityId === atk.entityId)?.currentHealth ?? 0;
          if (atkAlive > 0) {
            const atkInst = next.player.board.find(x => x.entityId === atk.entityId);
            if (atkInst) atkInst.canAttack = false;
          }
          next.log.push(`YOU: atakujesz stwora ${CARDS[def.cardId].name} (${atk.baseAttack} dmg)`);
          const beforePlayerHp = next.player.heroHp, beforeAiHp = next.ai.heroHp;
          processDeaths(next);
          if (next.player.heroHp < beforePlayerHp) spawnDamage('[data-hero="PLAYER"]', beforePlayerHp - next.player.heroHp);
          if (next.ai.heroHp < beforeAiHp) spawnDamage('[data-hero="AI"]', beforeAiHp - next.ai.heroHp);
          next = applyWinner(next);
        }
        return next;
      });
      setAttackerId(null);
      setAttackAnim(null);
      setIsAnimating(false);
    }, 420);
  };

  const resolveAttackOnHero = (defSide: Side) => {
    if (isAnimating) return;
    if (pendingSpell !== null) { applySpellTarget({ kind: 'HERO', side: defSide }); return; }
    if (!attackerId) return;
    if (gs.turn !== "PLAYER") return;
    if (!canAttackTargetRespectingTaunt(gs,'PLAYER',{ type:'HERO' })) {
      setGs(prev => ({ ...prev, log: [...prev.log, 'YOU: bohater chroniony przez Prowokację'] }));
      setAttackerId(null);
      return;
    }
    const attackerEl = document.querySelector(`[data-minion='${attackerId}']`) as HTMLElement | null;
    const heroEl = document.querySelector(`[data-hero='${defSide}']`) as HTMLElement | null;
    if (!attackerEl || !heroEl) return;
    // Prevent hero attack if attacker is fresh Rush minion
    const atkCheck = gs.player.board.find(b => b.entityId === attackerId);
    if (atkCheck) {
      const cc = CARDS[atkCheck.cardId] as MinionCard;
      if (atkCheck.justSummoned && cc.rush) {
        setGs(prev => ({ ...prev, log: [...prev.log, 'YOU: Rush – nie może atakować bohatera w tej turze'] }));
        setAttackerId(null);
        return;
      }
    }
    const a = attackerEl.getBoundingClientRect();
    const h = heroEl.getBoundingClientRect();
    setIsAnimating(true);
    setAttackAnim({
      owner: 'PLAYER',
      attackerId,
      targetType: 'HERO',
      targetSide: defSide,
      start: { x: a.left + a.width/2, y: a.top + a.height/2 },
      end: { x: h.left + h.width/2, y: h.top + h.height/2 }
    });
    setTimeout(() => {
      setGs(prev => {
        let next = clone(prev);
        if (next.turn !== 'PLAYER') return next;
  const atk = next.player.board.find(b => b.entityId === attackerId);
  if (atk) {
          if (defSide === 'AI') {
            const before = next.ai.heroHp;
            next.ai.heroHp -= atk.baseAttack;
            spawnDamage('[data-hero="AI"]', before - next.ai.heroHp);
            next.log.push(`YOU: atakujesz bohatera AI za ${atk.baseAttack}`);
          } else {
            const before = next.player.heroHp;
            next.player.heroHp -= atk.baseAttack;
            spawnDamage('[data-hero="PLAYER"]', before - next.player.heroHp);
            next.log.push(`YOU: auto-hit bohatera PLAYER (debug)`);
          }
          atk.canAttack = false;
          const beforePlayerHp = next.player.heroHp, beforeAiHp = next.ai.heroHp;
          processDeaths(next);
          if (next.player.heroHp < beforePlayerHp) spawnDamage('[data-hero="PLAYER"]', beforePlayerHp - next.player.heroHp);
          if (next.ai.heroHp < beforeAiHp) spawnDamage('[data-hero="AI"]', beforeAiHp - next.ai.heroHp);
          next = applyWinner(next);
        }
        return next;
      });
      setAttackerId(null);
      setAttackAnim(null);
      setIsAnimating(false);
    }, 420);
  };

  if (gs.winner) {
    const endBgUrl = gs.winner === 'PLAYER' ? '/bg/win.webp' : gs.winner === 'AI' ? '/bg/loose.webp' : gs.winner === 'DRAW' ? '/bg/equal.webp' : undefined;
  const endBgStyle: CSSProperties = endBgUrl ? {
      backgroundImage: `url(${endBgUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    } : {};

    return (
      <div className="min-h-screen flex items-center justify-center relative" style={endBgStyle}>
        {/* dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative w-[min(1100px,94vw)] p-8 rounded-[2.75rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] border border-white/10 bg-gradient-to-br from-white/6 via-transparent to-white/3 backdrop-blur-md text-center text-white">
          <div className="text-4xl md:text-5xl font-extrabold mb-2">
            {gs.winner === 'PLAYER' ? 'Wygrałeś!' : gs.winner === 'AI' ? 'Przegrałeś' : 'Remis!'}
          </div>
          <div className="mb-6 text-sm text-white/80">Dziękujemy za grę — możesz rozpocząć nową rozgrywkę poniżej.</div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => { setAttackerId(null); setGs(initGame()); }}
              aria-label="Zagraj ponownie"
              className={`relative w-96 h-24 px-6 focus:outline-none group select-none ${/* keep subtle transform on hover */ ''} hover:scale-105 active:scale-95 transition-transform`}
            >
              <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full -z-10 overflow-visible" style={{filter: ''}}>
                <defs>
                  <linearGradient id="rp-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4d2200" />
                    <stop offset="55%" stopColor="#672f00" />
                    <stop offset="100%" stopColor="#1a0d00" />
                  </linearGradient>
                  <linearGradient id="rp-stroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffc56b" />
                    <stop offset="100%" stopColor="#ff7a00" />
                  </linearGradient>
                  <linearGradient id="rp-stroke-inner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffe1b1" />
                    <stop offset="100%" stopColor="#ff9a2e" />
                  </linearGradient>
                  <filter id="rp-shadow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.6" />
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffb347" floodOpacity="0.25" />
                  </filter>
                  <filter id="rp-glow" x="-60%" y="-60%" width="220%" height="220%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ffac33" floodOpacity="0.20" />
                  </filter>
                </defs>
                {/* Elongated horizontal hexagon to fit text inside */}
                <polygon points="100,8 180,30 180,70 100,92 20,70 20,30" fill="url(#rp-fill)" opacity="0.94" />
                <polygon points="100,8 180,30 180,70 100,92 20,70 20,30" fill="none" stroke="url(#rp-stroke)" strokeWidth="8" strokeLinejoin="round" filter="url(#rp-shadow)" />
                <polygon points="100,8 180,30 180,70 100,92 20,70 20,30" fill="none" stroke="url(#rp-stroke)" strokeWidth="4" strokeLinejoin="round" opacity="0.85" />
                <polygon points="100,8 180,30 180,70 100,92 20,70 20,30" fill="none" stroke="url(#rp-stroke-inner)" strokeWidth="1.8" strokeLinejoin="round" opacity="0.5" />
                <polygon className="transition-opacity duration-300 opacity-0 group-hover:opacity-100" points="100,8 180,30 180,70 100,92 20,70 20,30" fill="none" stroke="#ffd795" strokeWidth="1.4" strokeLinejoin="round" filter="url(#rp-glow)" />
              </svg>
              <span className="relative z-10 flex items-center justify-center h-full w-full select-none text-base md:text-lg font-extrabold tracking-wider">Zagraj ponownie</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Helper renderers for new layout =====
  const renderBoardRow = (side: Side) => (
    <BoardRow
      side={side}
      list={side === 'AI' ? gs.ai.board : gs.player.board}
      attackerId={attackerId}
      pendingSpell={pendingSpell !== null}
      onEnemyMinionTarget={(s, id) => resolveAttackOnMinion(s, id)}
      onSelectFriendly={(m) => chooseAttacker(m)}
    />
  );

  const Hand = () => (
    <HandComp
      gs={gs}
      pendingSpell={pendingSpell}
      onPlayMinion={(i) => {
        // save undo snapshot before playing card
        try { setUndoGs(clone(gs)); } catch { setUndoGs(null); }
        setGs(playCardForSidePure(gs, 'PLAYER', i));
      }}
      onToggleSpellTargeting={(i) => { if (i === -1) setPendingSpell(null); else { setPendingSpell(i); setAttackerId(null); } }}
  mulliganMode={!gs.mulliganDone}
  mulliganMarked={mulliganMarked}
  onToggleMulligan={(i)=> setMulliganMarked(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
  hiddenIndices={hiddenHandSlots}
    />
  );

  // Stałe tło (arena.webp) – bez systemu skórek
  const arenaBgStyle: CSSProperties = {
    backgroundImage: 'url(/bg/arena.webp)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#1b242d',
    transform: `translate3d(${parallax.x.toFixed(2)}px, ${parallax.y.toFixed(2)}px,0) scale(1.04)`,
    transition: 'transform 60ms linear'
  };

  // Scaled inner container + custom CSS variables for independent hero / hand positioning
  const arenaScaleStyle: CSSProperties & Record<string,string> = {
    transform: `scale(${scale})`,
    width: '100%',
    maxWidth: '1600px',
    '--hand-height': '11rem',
    '--hand-gap': '2.5rem',
    '--hero-offset-base': 'calc(var(--hand-height) + var(--hand-gap))',
  // Move player hero cluster slightly DOWN (increase subtraction -> smaller bottom value)
  '--hero-offset': 'calc(var(--hero-offset-base) - 4.1rem)',
  // Move player hand slightly further down (greater protrusion)
  '--hand-outside': '5.6rem',
  // AI hero section protrusion (top outside)
  '--ai-hero-outside': '3.75rem'
  };

  return (
    <div className="arena-scale-wrapper" onMouseMove={(e)=> setPointer({x:e.clientX,y:e.clientY})}>
      <LoaderOverlay done={bootDone} progress={bootProgress} />
      <div style={arenaScaleStyle} className="arena-scale-inner">
  <div ref={arenaRef} className="relative w-full aspect-[16/9] rounded-[2.75rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] overflow-visible border border-white/15 backdrop-blur-sm bg-white/2 before:content-[''] before:absolute before:inset-0 before:rounded-[2.75rem] before:pointer-events-none before:border before:border-white/5 before:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.04)] after:content-[''] after:absolute after:inset-0 after:rounded-[2.75rem] after:pointer-events-none after:bg-gradient-to-br after:from-white/6 after:via-transparent after:to-white/2">
  {/* Background layer with parallax (rounded clipping) */}
  <div className="absolute inset-0 rounded-[2.75rem] overflow-hidden pointer-events-none">
    <div className="absolute inset-0 will-change-transform" style={arenaBgStyle} />
  {/* Subtle bottom vignette */}
  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.55),rgba(0,0,0,0)_46%)]" />
  </div>

  {/* DEV DEBUG BANNER removed */}

  {/* Central divider line removed (kept only gradient divider between rows) */}

  {/* Top hero row + AI deck info (dim/blur when not their turn) */}
  <div className={`absolute left-0 right-0 flex justify-center gap-16 transition-all ${gs.turn==='PLAYER' ? 'opacity-80' : ''}`} style={{ top: 'calc(-1 * var(--ai-hero-outside))' }}>
          <div className="relative">
            <Hero
              side="AI"
              name="AI"
              hp={gs.ai.heroHp}
              maxHp={20}
              mana={gs.ai.mana}
              maxMana={gs.ai.maxMana}
              active={gs.turn==='AI'}
              lethalHighlight={lethalReady}
              avatarSrc="/avatars/ai-dragon.webp"
              deckCount={gs.ai.deck.length}
              handCount={gs.ai.hand.length}
              onTarget={(attackerId || pendingSpell !== null) ? () => {
                if (pendingSpell !== null) applySpellTarget({ kind: 'HERO', side: 'AI' });
                else if (attackerId) resolveAttackOnHero('AI');
              } : undefined}
            />
          </div>
        </div>

  {/* Player HUD (mana + deck/hand) */}
  <div className="absolute top-4 left-4 z-40 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10 space-y-1 font-[Inter]">
          {/* Mana display removed (now circular) */}
          <div className="text-3xl mt-1 font-sans tracking-wider opacity-95 font-extrabold">{gs.turn === 'PLAYER' ? 'Tura Gracza' : 'Tura AI'}</div>
          {/* Board count and hero power lines removed per UX request */}
          {/* Skórki usunięte */}
        </div>

        {/* End Turn button pinned right (Koniec Tury) */}
  <div className="absolute top-[58%] -translate-y-1/2 right-10 z-40 flex flex-col gap-5 items-end">
          <div className="relative group select-none">
            {/* Undo button: visible when undo snapshot exists and it's player's turn */}
            {undoGs && gs.turn === 'PLAYER' && (
              <button
                onClick={() => { if (!undoGs) return; setGs(undoGs); setUndoGs(null); }}
                aria-label="Cofnij"
                style={{ marginLeft: '-12px' }}
                className={`relative w-20 h-20 mb-2 self-center text-[11px] font-extrabold tracking-wider focus:outline-none transition-transform overflow-visible ${gs.turn==='PLAYER' ? 'text-white hover:scale-105 active:scale-95' : 'text-slate-400 cursor-not-allowed'} translate-y-2`}
              >
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -z-10 overflow-visible" style={{filter: gs.turn==='PLAYER' ? '' : 'grayscale(1) brightness(.55)'}}>
                  <defs>
                    <linearGradient id="undo-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#200033" />
                      <stop offset="55%" stopColor="#3a0a5f" />
                      <stop offset="100%" stopColor="#0b0016" />
                    </linearGradient>
                    <linearGradient id="undo-stroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c8a6ff" />
                      <stop offset="100%" stopColor="#7a3fff" />
                    </linearGradient>
                    <linearGradient id="undo-stroke-inner" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#efe0ff" />
                      <stop offset="100%" stopColor="#b889ff" />
                    </linearGradient>
                    <filter id="undo-shadow" x="-40%" y="-40%" width="180%" height="180%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.6" />
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#8b5cff" floodOpacity="0.18" />
                    </filter>
                    <filter id="undo-glow" x="-60%" y="-60%" width="220%" height="220%">
                      <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#a77aff" floodOpacity="0.16" />
                    </filter>
                    <radialGradient id="undo-flare" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor="#ffeaff" stopOpacity="0.95" />
                      <stop offset="40%" stopColor="#d3b3ff" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#9a5aff" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="url(#undo-fill)" opacity="0.96" />
                  <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="url(#undo-stroke)" strokeWidth="6.5" strokeLinejoin="round" filter="url(#undo-shadow)" />
                  <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="url(#undo-stroke)" strokeWidth="3.2" strokeLinejoin="round" opacity="0.85" />
                  <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="url(#undo-stroke-inner)" strokeWidth="1.2" strokeLinejoin="round" opacity="0.5" />
                  <polygon className="transition-opacity duration-250 opacity-0 group-hover:opacity-100" points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="#f1d7ff" strokeWidth="1.2" strokeLinejoin="round" filter="url(#undo-glow)" />
                  <circle className="pointer-events-none" cx="50" cy="50" r="12" fill="url(#undo-flare)" opacity="0.22" />
                </svg>
                <span className="relative z-10 flex items-center justify-center h-full w-full select-none leading-tight text-[13px] font-black">Cofnij</span>
              </button>
            )}
            <button
              onClick={(e) => { 
                if (gs.turn!=='PLAYER') return; 
                // spawn flare particles
                const btn = e.currentTarget; 
                const container = btn.querySelector('.endturn-particles');
                if (container) {
                  for (let i=0;i<10;i++) {
                    const el = document.createElement('span');
                    el.className = 'endturn-particle';
                    const angle = Math.random()*Math.PI*2;
                    const dist = 28 + Math.random()*26;
                    const x = Math.cos(angle)*dist;
                    const y = Math.sin(angle)*dist;
                    el.style.setProperty('--tx', x+'px');
                    el.style.setProperty('--ty', y+'px');
                    el.style.setProperty('--rot', (Math.random()*360)+'deg');
                    el.style.left = '50%';
                    el.style.top = '50%';
                    container.appendChild(el);
                    setTimeout(()=> el.remove(), 900);
                  }
                }
                // clear undo when ending turn and starting AI
                setUndoGs(null);
                setAttackerId(null); setPendingSpell(null); startAiTurnAnimated(); 
              }}
              aria-label="Koniec tury"
              disabled={gs.turn!=='PLAYER'}
              className={`relative w-28 h-28 text-[11px] font-extrabold tracking-wider uppercase focus:outline-none transition-transform overflow-visible ${gs.turn==='PLAYER' ? 'text-amber-50 hover:scale-105 active:scale-95' : 'text-slate-400 cursor-not-allowed'} `}
            >
              {/* Framed decagon (orange theme) */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -z-10 overflow-visible" style={{filter: gs.turn==='PLAYER' ? '' : 'grayscale(1) brightness(.55)'}}>
                <defs>
                  <linearGradient id="endturn-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4d2200" />
                    <stop offset="55%" stopColor="#672f00" />
                    <stop offset="100%" stopColor="#1a0d00" />
                  </linearGradient>
                  <linearGradient id="endturn-stroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffc56b" />
                    <stop offset="100%" stopColor="#ff7a00" />
                  </linearGradient>
                  <linearGradient id="endturn-stroke-inner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffe1b1" />
                    <stop offset="100%" stopColor="#ff9a2e" />
                  </linearGradient>
                  <filter id="endturn-shadow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.6" />
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffb347" floodOpacity="0.25" />
                  </filter>
                  <filter id="endturn-glow" x="-60%" y="-60%" width="220%" height="220%">
                    <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ffac33" floodOpacity="0.20" />
                  </filter>
                  <radialGradient id="endturn-flare" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#fff2d6" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#ffcf80" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ff922e" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* Base fill (reduced size variant) */}
                <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="url(#endturn-fill)" opacity="0.92" />
                {/* Outer strokes thinner to fit small button */}
                <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="url(#endturn-stroke)" strokeWidth="8" strokeLinejoin="round" filter="url(#endturn-shadow)" />
                <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="url(#endturn-stroke)" strokeWidth="4.6" strokeLinejoin="round" opacity="0.85" />
                <polygon points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="url(#endturn-stroke-inner)" strokeWidth="1.95" strokeLinejoin="round" opacity="0.5" />
                {/* Hover glow overlay */}
                <polygon className="transition-opacity duration-300 opacity-0 group-hover:opacity-100" points="50,0 79,10 98,35 98,65 79,91 50,100 21,91 2,65 2,35 21,10" fill="none" stroke="#ffd795" strokeWidth="1.8" strokeLinejoin="round" filter="url(#endturn-glow)" />
                {gs.turn==='PLAYER' && <circle className="pointer-events-none animate-ping" cx="50" cy="50" r="18" fill="url(#endturn-flare)" opacity="0.25" />}
              </svg>
              <span className="relative z-10 flex flex-col items-center justify-center h-full w-full select-none leading-tight">
                <span className={`text-[10px] font-extrabold tracking-[0.34em] -mb-0.5 ${gs.turn==='PLAYER' ? 'text-amber-200/85' : 'text-slate-400/60'}`}>KONIEC</span>
                <span className={`text-[19px] font-black tracking-[0.20em] ${gs.turn==='PLAYER' ? 'text-amber-50' : 'text-slate-600'}`}>TURY</span>
              </span>
              {/* Particle container */}
              <div className="endturn-particles absolute inset-0 pointer-events-none overflow-visible" />
              {/* Pulsating ring when player's turn */}
              {gs.turn==='PLAYER' && (
                <div className="absolute inset-0 animate-pulse blur-sm opacity-45 rounded-xl" style={{background:'radial-gradient(circle at 50% 50%, rgba(255,191,64,0.30), transparent 70%)'}} />
              )}
            </button>
          </div>
        </div>

        {/* Settings button (gear) */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={()=> setSettingsOpen(o=>!o)}
            aria-label="Ustawienia"
            className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 shadow-lg backdrop-blur text-xl"
          >⚙️</button>
        </div>

    {/* Board zones (raised upward) */}
  <div className={`absolute inset-x-0 top-20 bottom-[19rem] flex flex-col justify-between z-10 pointer-events-auto transition-all`}>  
          {/* Enemy row (only slightly dimmed when it's player's turn) */}
          <div className={`transition-opacity ${gs.turn==='PLAYER' ? 'opacity-80' : 'opacity-100'}`}>
            {renderBoardRow("AI")}
          </div>
          {/* Divider glow */}
          <div className="h-10 flex items-center justify-center">
            <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
          {/* Player row (raised slightly upward) */}
          <div className="-mt-6">
            {renderBoardRow("PLAYER")}
          </div>
        </div>

  {/* Player hero (lowered further) */}
  {/* Player hero positioned independently from hand using CSS vars */}
  <div className="absolute left-0 right-0 flex justify-center z-20" style={{ bottom:'var(--hero-offset)' }}>
          <Hero side="PLAYER" name="Player" hp={gs.player.heroHp} maxHp={20} mana={gs.player.mana} maxMana={gs.player.maxMana} active={gs.turn==='PLAYER'} avatarSrc="/avatars/player-king.webp" deckCount={gs.player.deck.length} handCount={gs.player.hand.length} />
        </div>

  <HeroPowerFloating
    activeTurn={gs.turn==='PLAYER'}
    used={gs.player.heroPowerUsed}
    mana={gs.player.mana}
    cost={HERO_POWER_COST}
    onUse={() => setGs(prev => heroPowerAction(prev,'PLAYER'))}
    hidden={!gs.mulliganDone}
  />

  <style>{`
    .endturn-particle { position:absolute; width:6px; height:6px; background:radial-gradient(circle at 30% 30%, #fff6d9, #ffb13b 55%, #ff7a00 90%); border-radius:9999px; animation:endturn-pop .9s ease-out forwards; pointer-events:none; transform:translate(-50%,-50%) scale(.4) rotate(var(--rot)); box-shadow:0 0 6px rgba(255,184,77,0.55); }
    @keyframes endturn-pop { 0% { opacity:0; transform:translate(-50%,-50%) scale(.2); } 10% { opacity:1; } 60% { opacity:1; transform:translate(calc(-50% + var(--tx)/1.4), calc(-50% + var(--ty)/1.4)) scale(1); } 100% { opacity:0; transform:translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(.1); } }
  `}</style>

  {/* Hand with gradient separator */}
  <div className="absolute left-0 right-0 bottom-0 z-30 pt-4 overflow-visible" style={{ height:'var(--hand-height)', bottom:'calc(-1 * var(--hand-outside))' }}>
    {/* Gradient nad ręką usunięty */}
          {gs.mulliganDone && <Hand />}
        </div>

        {/* Combat / Spell prompt overlay */}
  {(attackerId || pendingSpell !== null) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-[115]">
            {attackerId && <div className="text-base font-semibold bg-amber-500/90 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">Wybierz cel ataku</div>}
            {pendingSpell !== null && (
              <div className="text-base font-semibold bg-fuchsia-500/90 text-white px-4 py-2 rounded-full shadow-lg animate-pulse tracking-wide">
                Wybierz cel dla: {CARDS[gs.player.hand[pendingSpell]]?.name || 'Zaklęcie'}
              </div>
            )}
            {pendingSpell !== null && (
              <button onClick={cancelPendingSpell} className="text-[13px] px-3 py-1 rounded bg-black/60 border border-fuchsia-300/40 hover:border-fuchsia-200 text-white transition font-semibold">Anuluj</button>
            )}
          </div>
        )}

        {/* Mulligan overlay */}
    {!gs.mulliganDone && (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white rounded-[2.75rem] overflow-visible" style={{background: 'transparent', backdropFilter: 'blur(10px) brightness(0.48)', WebkitBackdropFilter: 'blur(10px) brightness(0.48)'}}> 
            <div className="text-3xl md:text-4xl font-extrabold mb-4 text-center">Mulligan! Wybierz karty do wymiany</div>
            <div className="text-sm mb-3 opacity-80 max-w-md text-center">Zmień swoje karty! Wymienisz je na nowe, a gra gwarantuje, że po wymianie wciąż będziesz mieć w ręce przynajmniej jedną tanią kartę (z kosztem 1 lub 0), którą możesz zagrać.</div>
            <div className="w-full max-w-4xl px-6">
              <div className="mb-4">
                {/* Ręka do mulliganu */}
                <div className="relative rounded-xl p-4 backdrop-blur-sm bg-transparent">
                  <Hand />
                </div>
              </div>
                <div className="mb-4 w-full max-w-4xl px-6 mx-auto flex flex-wrap items-center justify-center space-x-6 gap-y-2 text-[13px]">
                {/* Gray hexagon reset button (same size/shape as 'Zaczynamy!') - reduced gap */}
                <button onClick={()=> setMulliganMarked(new Set())} aria-label="Odznacz" className="relative w-72 h-20 px-6 focus:outline-none group select-none hover:scale-105 active:scale-95 transition-transform">
                  <svg viewBox="0 0 220 110" className="absolute inset-0 w-full h-full -z-10 overflow-visible" style={{filter: '', transform: 'translateX(-3px)'}}>
                    <defs>
                      <linearGradient id="reset-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4b5563" />
                        <stop offset="100%" stopColor="#111827" />
                      </linearGradient>
                      <linearGradient id="reset-stroke" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d1d5db" />
                        <stop offset="100%" stopColor="#9ca3af" />
                      </linearGradient>
                      <linearGradient id="reset-stroke-inner" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f3f4f6" />
                        <stop offset="100%" stopColor="#e5e7eb" />
                      </linearGradient>
                      <filter id="reset-shadow" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.55" />
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#9ca3af" floodOpacity="0.08" />
                      </filter>
                      <filter id="reset-glow" x="-60%" y="-60%" width="220%" height="220%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#9ca3af" floodOpacity="0.10" />
                      </filter>
                    </defs>
                    <polygon points="110,10 200,35 200,75 110,100 20,75 20,35" fill="url(#reset-fill)" opacity="0.98" />
                    <polygon points="110,10 200,35 200,75 110,100 20,75 20,35" fill="none" stroke="url(#reset-stroke)" strokeWidth="8" strokeLinejoin="round" filter="url(#reset-shadow)" />
                    <polygon points="110,10 200,35 200,75 110,100 20,75 20,35" fill="none" stroke="url(#reset-stroke)" strokeWidth="4" strokeLinejoin="round" opacity="0.9" />
                    <polygon points="110,10 200,35 200,75 110,100 20,75 20,35" fill="none" stroke="url(#reset-stroke-inner)" strokeWidth="2" strokeLinejoin="round" opacity="0.6" />
                    <polygon className="transition-opacity duration-300 opacity-0 group-hover:opacity-100" points="110,10 200,35 200,75 110,100 20,75 20,35" fill="none" stroke="#eef2f7" strokeWidth="1.4" strokeLinejoin="round" filter="url(#reset-glow)" />
                  </svg>
                  <span className="relative z-10 flex items-center justify-center h-full w-full select-none text-sm md:text-lg font-extrabold tracking-wider text-white px-12 md:px-16 whitespace-nowrap">Odznacz</span>
                </button>

                <div className="px-4 py-1 rounded-full bg-white/10 border border-white/20 text-base md:text-lg font-semibold">Zaznaczone: {mulliganMarked.size}</div>
                <button
                  onClick={()=> { setGs(g => performMulligan(g, Array.from(mulliganMarked))); setMulliganMarked(new Set()); }}
                  aria-label="Zaczynamy!"
                  className="relative w-64 h-20 px-6 focus:outline-none group select-none hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 220 110" className="absolute inset-0 w-full h-full -z-10 overflow-visible" style={{filter: '', transform: 'translateX(0px)'}}>
                    <defs>
                        <linearGradient id="got-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffd27a" />
                          <stop offset="55%" stopColor="#fb923c" />
                          <stop offset="100%" stopColor="#c2410c" />
                        </linearGradient>
                        <linearGradient id="got-stroke" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffe8c2" />
                          <stop offset="100%" stopColor="#fb923c" />
                        </linearGradient>
                        <linearGradient id="got-stroke-inner" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fff7ed" />
                          <stop offset="100%" stopColor="#ffedd5" />
                        </linearGradient>
                        <filter id="got-shadow" x="-40%" y="-40%" width="180%" height="180%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.6" />
                          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.24" />
                        </filter>
                        <filter id="got-glow" x="-60%" y="-60%" width="220%" height="220%">
                          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#fb923c" floodOpacity="0.20" />
                        </filter>
                    </defs>
                    <polygon points="110,10 200,35 200,75 110,100 20,75 20,35" fill="url(#got-fill)" opacity="0.98" />
                      <polygon points="110,10 200,35 200,75 110,100 20,75 20,35" fill="none" stroke="url(#got-stroke)" strokeWidth="8" strokeLinejoin="round" filter="url(#got-shadow)" />
                      <polygon points="110,10 200,35 200,75 110,100 20,75 20,35" fill="none" stroke="url(#got-stroke)" strokeWidth="4" strokeLinejoin="round" opacity="0.9" />
                      <polygon points="110,10 200,35 200,75 110,100 20,75 20,35" fill="none" stroke="url(#got-stroke-inner)" strokeWidth="2" strokeLinejoin="round" opacity="0.6" />
                      <polygon className="transition-opacity duration-300 opacity-0 group-hover:opacity-100" points="110,10 200,35 200,75 110,100 20,75 20,35" fill="none" stroke="#ffedd5" strokeWidth="1.4" strokeLinejoin="round" filter="url(#got-glow)" />
                    {/* Flare element */}
                    <radialGradient id="got-flare" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="45%" stopColor="#9bf6e3" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </radialGradient>
                    <circle className="got-flare pointer-events-none" cx="110" cy="55" r="18" fill="url(#got-flare)" />
                  </svg>
                  <span className="relative z-10 flex items-center justify-center h-full w-full select-none text-base md:text-lg font-extrabold tracking-wider text-white">Zaczynamy!</span>
                </button>
                <style>{`
                  /* Mulligan flare: match end-turn flare visual but slower */
                  .got-flare { transform-box: fill-box; transform-origin: center; animation: got-ping 1.8s cubic-bezier(.4,0,.6,1) infinite; mix-blend-mode: screen; opacity: 0.28; }
                  @keyframes got-ping {
                    0% { transform: scale(1); opacity: 0.35; }
                    50% { opacity: 0.25; }
                    75% { transform: scale(1.8); opacity: 0; }
                    100% { transform: scale(1.8); opacity: 0; }
                  }
                  /* speed up slightly on hover to feel responsive */
                  .group:hover .got-flare { animation-duration: 1s; }
                `}</style>
              </div>
            </div>
              
          </div>
        )}

        {/* Arrow (celowanie) */}
        {arrowOrigin && (attackerId || pendingSpell !== null) && (
          <ArrowOverlay origin={arrowOrigin} pointer={pointer} containerRef={arenaRef} color={pendingSpell !== null ? '#d946ef' : '#f59e0b'} />
        )}

        {/* Attack animation clone */}
        {attackAnim && arenaRef.current && (
          <AttackAnimationClone anim={attackAnim} containerRef={arenaRef} />
        )}

        {/* AI processing overlay */}
        {aiProcessing && (
          <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
            <div className="px-6 py-3 rounded-2xl bg-black/60 border border-white/20 text-white text-base font-semibold animate-pulse shadow-lg">
              AI wykonuje turę...
            </div>
          </div>
        )}
  {/* Parallax glare / edge reflection removed per request */}

        {/* Damage floating numbers */}
        <div className="absolute inset-0 pointer-events-none z-50">
          {damageFx.map(fx => (
            <div key={fx.key} className="absolute text-yellow-300 font-extrabold text-base animate-dmg-float" style={{ left: fx.x, top: fx.y }}>
              -{fx.value}
            </div>
          ))}
          <style>{`@keyframes dmg-float { 0%{transform:translate(-50%,0) scale(0.9); opacity:0} 15%{opacity:1} 80%{opacity:1} 100%{transform:translate(-50%,-40px) scale(1.05); opacity:0} } .animate-dmg-float{animation:dmg-float .9s cubic-bezier(.4,.2,.2,1) forwards;}`}</style>
          {drawFx.map(fx => (
            <div key={fx.key} className="absolute w-24 h-36 -ml-12 -mt-18 rounded-xl bg-gradient-to-b from-indigo-300 to-indigo-500 shadow-lg border border-white/30 animate-draw" style={{ left: fx.x, top: fx.y }} />
          ))}
          <style>{`@keyframes draw-fly { 0%{ opacity:0; transform:translate(-50%,-50%) scale(.4) rotate(-8deg);} 10%{opacity:1} 70%{opacity:1} 100%{opacity:0; transform:translate(var(--dx), var(--dy)) scale(.9) rotate(6deg);} } .animate-draw{ --dx:0px; --dy:0px; animation: draw-fly .55s cubic-bezier(.55,.2,.4,.9) forwards; }`}</style>
        </div>

  {/* Log panel removed from main view (accessible via Settings > Log) */}
        {/* Right settings sidebar */}
        {settingsOpen && (
          <div className="absolute top-0 right-0 h-full w-96 z-50 flex">
            {/* Backdrop click area (optional future) */}
            <div className="flex-1"></div>
            <div className="w-96 h-full bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col animate-[sidebarIn_.45s_cubic-bezier(.4,.8,.2,1)]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="text-sm font-semibold tracking-wide uppercase opacity-80">Ustawienia</div>
                <button onClick={()=> setSettingsOpen(false)} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[13px] font-bold">×</button>
              </div>
              <div className="flex border-b border-white/10 text-[13px]">
                <button onClick={()=> setSettingsTab('stats')} className={`flex-1 px-3 py-2 font-semibold uppercase tracking-wide transition ${settingsTab==='stats' ? 'bg-emerald-500/80 text-black shadow-inner' : 'hover:bg-white/10 text-white/70'}`}>Statystyki</button>
                <button onClick={()=> setSettingsTab('rules')} className={`flex-1 px-3 py-2 font-semibold uppercase tracking-wide transition ${settingsTab==='rules' ? 'bg-emerald-500/80 text-black shadow-inner' : 'hover:bg-white/10 text-white/70'}`}>Zasady</button>
                <button onClick={()=> setSettingsTab('log')} className={`flex-1 px-3 py-2 font-semibold uppercase tracking-wide transition ${settingsTab==='log' ? 'bg-emerald-500/80 text-black shadow-inner' : 'hover:bg-white/10 text-white/70'}`}>Log</button>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-4 text-[13px]">
                {settingsTab==='stats' && <StatsPanel log={gs.log} />}
                {settingsTab==='rules' && (
                  <div className="text-[13px] leading-relaxed space-y-2">
                    <h2 className="text-sm font-bold tracking-wide">Zasady Gry</h2>
                    <ul className="list-disc pl-5 space-y-1 marker:text-emerald-300">
                      <li>Cel: zredukuj HP przeciwnika do 0.</li>
                      <li>Co turę: dobierasz 1 kartę (chyba że talia pusta).</li>
                      <li>Mana rośnie co turę do maks 10.</li>
                      <li>Stronnicy atakują raz na turę po turze zagrania (chyba że Rush).</li>
                      <li>Czary działają natychmiast po zagraniu.</li>
                      <li>Moc bohatera: raz na turę, koszt {HERO_POWER_COST}, zadaje {HERO_POWER_DAMAGE} obrażeń.</li>
                    </ul>
                    <div className="pt-2 text-[11px] opacity-60">Skrócona wersja; pełne zasady w planach.</div>
                  </div>
                )}
                {settingsTab==='log' && (
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold tracking-wide">Log</h2>
                    <LogPanel entries={gs.log} />
                  </div>
                )}
              </div>
              <style>{`@keyframes sidebarIn{0%{transform:translateX(100%);opacity:0;}60%{opacity:1;}100%{transform:translateX(0);opacity:1;}}`}</style>
            </div>
          </div>
        )}

        {showRules && (
          <div className="absolute inset-0 z-50 flex items-start justify-end p-6">
            <div className="relative w-96 max-h-full overflow-y-auto scroll-hidden bg-slate-900/95 border border-white/10 rounded-2xl p-5 text-[13px] leading-relaxed space-y-3 shadow-2xl tracking-wide">
              <button aria-label="Zamknij" onClick={()=> setShowRules(false)} className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-base font-bold">✕</button>
              <h2 className="text-lg font-bold mb-1">Zasady Gry (Mini Hearthstone)</h2>
              <ul className="list-disc pl-4 space-y-1">
                <li>Cel: Zredukować HP przeciwnika do 0.</li>
                <li>Tury: Gracz i AI wykonują tury naprzemiennie.</li>
                <li>Mana: Zwiększa się co turę do maks 10. Wydajesz ją na karty i moc bohatera.</li>
                <li>Dobieranie: 1 karta na start tury. Jeśli talia pusta — zmęczenie zadaje rosnące obrażenia.</li>
                <li>Limit ręki: {HAND_LIMIT} kart — nadmiar spalony.</li>
                <li>Plansza: Maks {BOARD_LIMIT} stronników na stronę.</li>
                <li>Stronnicy: Nie mogą atakować w turze zagrania (oznaczeni). Potem 1 atak na turę.</li>
                <li>Czar: Może zadawać obrażenia bohaterowi lub celowi (w tej wersji: proste dmg).</li>
                <li>Moc Bohatera: Raz na turę, koszt {HERO_POWER_COST} many, zadaje {HERO_POWER_DAMAGE} dmg w przeciwnika.</li>
                <li>Zmęczenie: Każda próba dobrania bez kart = narastające obrażenia (1,2,3...).</li>
                <li>Wygrana: Gdy przeciwnik ma 0 HP (oba 0 = remis).</li>
                <li>Catch-up: Jeśli masz o 2+ mniej stronników na start tury – dobierasz 1 kartę ekstra.</li>
                <li>Rush: Stronnik z Rush może atakować w turze zagrania, ale tylko wrogich stronników (nie bohatera).</li>
              </ul>
              <h3 className="font-semibold pt-2">Sterowanie</h3>
              <ul className="list-disc pl-4 space-y-1">
                <li>Kliknij kartę stronnikową aby ją zagrać.</li>
                <li>Kliknij czar by wejść w tryb celowania (anuluj przyciskiem / ESC / PPM).</li>
                <li>Kliknij własnego stronika by wybrać atak, następnie cel (anuluj ESC / PPM).</li>
                <li>Prowokacja (Taunt): jeśli przeciwnik ma Prowokację, musisz ją zaatakować zanim bohatera lub inne jednostki.</li>
                <li>Przycisk END TURN kończy twoją turę i uruchamia AI.</li>
                <li>Moc bohatera: przycisk pod END TURN (jeśli dostępna).</li>
              </ul>
              <h3 className="font-semibold pt-2">Plany (przyszłość)</h3>
        <ul className="list-disc pl-4 space-y-1 opacity-70">
                <li>Specjalne słowa kluczowe (Prowokacja, Szał, Deathrattle).</li>
                <li>Więcej czarów i efekty AOE.</li>
                <li>Różne klasy z unikalnymi mocami.</li>
              </ul>
              <div className="pt-2 text-[12px] opacity-60">Wersja prototypowa.</div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ========== Damage FX helper ==========
// spawnDamage now defined inside component

// ===================== ARROW OVERLAY =====================
interface ArrowOverlayProps {
  origin: { x: number; y: number };
  pointer: { x: number; y: number };
  containerRef: RefObject<HTMLDivElement | null>;
  color: string;
}

function ArrowOverlay({ origin, pointer, containerRef, color }: ArrowOverlayProps) {
  // Compute line inside container (absolute to viewport -> relative)
  const container = containerRef.current;
  if (!container) return null;
  const rect = container.getBoundingClientRect();
  const ox = origin.x - rect.left;
  const oy = origin.y - rect.top;
  const tx = pointer.x - rect.left;
  const ty = pointer.y - rect.top;
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const angle = Math.atan2(dy, dx);

  const head = 14;
  const shaft = Math.max(0, dist - head);

  return (
  // Raise z-index so arrow is visible above played cards (cards use z ~100+)
  <svg className="pointer-events-none absolute inset-0 overflow-visible z-[110]">
      <g transform={`translate(${ox},${oy}) rotate(${angle*180/Math.PI})`}>
        <line x1={0} y1={0} x2={shaft} y2={0} stroke={color} strokeWidth={4} strokeLinecap="round" strokeOpacity={0.85} />
        <polygon points={`${shaft},0 ${shaft-head},7 ${shaft-head},-7`} fill={color} fillOpacity={0.9} />
        <circle r={6} fill={color} fillOpacity={0.9} />
        <circle r={10} fill={color} fillOpacity={0.25} />
      </g>
    </svg>
  );
}

// ===================== ATTACK ANIMATION CLONE =====================
interface AttackAnimationCloneProps {
  anim: {
    attackerId: string;
    targetType: 'HERO' | 'MINION';
    targetSide: Side;
    targetMinionId?: string;
    start: {x:number;y:number};
    end: {x:number;y:number};
  };
  containerRef: RefObject<HTMLDivElement | null>;
}

function AttackAnimationClone({ anim, containerRef }: AttackAnimationCloneProps & { anim: AttackAnimationCloneProps['anim'] & { owner: 'PLAYER' | 'AI' }}) {
  const container = containerRef.current;
  if (!container) return null;
  const rect = container.getBoundingClientRect();
  const sx = anim.start.x - rect.left;
  const sy = anim.start.y - rect.top;
  const ex = anim.end.x - rect.left;
  const ey = anim.end.y - rect.top;
  const dx = ex - sx;
  const dy = ey - sy;
  const angle = Math.atan2(dy, dx);
  const gradient = anim.owner === 'PLAYER'
    ? 'linear-gradient(to bottom,#10b981,#059669)'
    : 'linear-gradient(to bottom,#dc2626,#b91c1c)';

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      <div
  className="absolute w-24 h-32 -ml-12 -mt-16 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
        style={{
          left: sx,
          top: sy,
          background: gradient,
          transform: `translate(0,0) rotate(${angle*180/Math.PI}deg)`,
          animation: `attack-fly 0.42s cubic-bezier(.55,.2,.4,.9) forwards`
        }}
      >
        {anim.owner === 'PLAYER' ? '⚔️' : '🗡️'}
      </div>
      <style>{`@keyframes attack-fly { to { transform: translate(${dx}px,${dy}px) rotate(${angle*180/Math.PI}deg) scale(0.85); opacity:0.15; } }`}</style>
    </div>
  );
}

// ===================== AI TURN (ANIMATED) =====================
// Lightweight re-implementation of AI logic producing an action queue processed with delays
// (removed unused duplicated AI action type declarations)

// (duplicate AI block removed)
