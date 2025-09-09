import type { GameState, Side, MinionCard, SpellCard, MinionInstance } from './types';
import { CARDS, BASE_DECK } from './cards';

// Simple subscriber list for draw animations (UI can hook)
export type DrawEvent = { side: Side };
const drawListeners: ((e: DrawEvent) => void)[] = [];
export function onDraw(listener: (e: DrawEvent) => void) { drawListeners.push(listener); }
function emitDraw(e: DrawEvent) { drawListeners.forEach(l => l(e)); }

export const STARTING_HAND_SIZE = 3;
export const HAND_LIMIT = 10;
export const BOARD_LIMIT = 7;
export const HERO_POWER_COST = 2;
export const HERO_POWER_DAMAGE = 1;

export const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): string[] {
  return shuffle(BASE_DECK);
}

export function initGame(): GameState {
  const playerDeck = buildDeck();
  const aiDeck = buildDeck();
  const playerHand = playerDeck.splice(0, STARTING_HAND_SIZE);
  const aiHand: string[] = [];
  return {
    player: { heroHp: 20, mana: 1, maxMana: 1, deck: playerDeck, hand: playerHand, board: [], heroPowerUsed: false, fatigueCounter: 0 },
    ai: { heroHp: 20, mana: 1, maxMana: 1, deck: aiDeck, hand: aiHand, board: [], heroPowerUsed: false, fatigueCounter: 0 },
    // Turn will be assigned after mulligan
    turn: 'PLAYER',
    winner: undefined,
    log: ['Start gry: dobrano ' + playerHand.length + ' karty (Mulligan)'],
    mulliganDone: false
  };
}

// Apply cheap card guarantee AFTER mulligan confirm (ensures at least one <=1 cost).
export function ensureCheapCardAfterMulligan(gs: GameState) {
  if (gs.player.hand.some(id => CARDS[id].manaCost <= 1)) return;
  const cheapIdx = gs.player.deck.findIndex(id => CARDS[id].manaCost <= 1);
  if (cheapIdx === -1) return;
  const cheapId = gs.player.deck.splice(cheapIdx, 1)[0];
  const replaced = gs.player.hand.pop();
  if (replaced) gs.player.deck.unshift(replaced);
  gs.player.hand.push(cheapId);
  gs.log.push('YOU: gwarancja taniej karty po mulliganie');
}

export function performMulligan(gs: GameState, replaceIndices: number[]): GameState {
  const next = clone(gs);
  if (next.mulliganDone) return next;
  // Collect cards to replace
  const toReplace = replaceIndices
    .filter(i => i >= 0 && i < next.player.hand.length)
    .sort((a,b)=>b-a); // remove from end first
  const replaced: string[] = [];
  for (const idx of toReplace) {
    const [cid] = next.player.hand.splice(idx,1);
    if (cid) replaced.push(cid);
  }
  // Put replaced cards back into deck then shuffle deck portion (Fisher-Yates only over deck segment)
  next.player.deck.push(...replaced);
  next.player.deck = shuffle(next.player.deck);
  // Draw same number of cards
  for (let i=0;i<replaced.length;i++) {
    if (!next.player.deck.length) break;
    next.player.hand.push(next.player.deck.shift()!);
  }
  ensureCheapCardAfterMulligan(next);
  next.mulliganDone = true;
  next.log.push('YOU: zakończono mulligan (' + replaced.length + ' wymian)');
  return next;
}

export function checkWinner(gs: GameState): Side | 'DRAW' | undefined {
  if (gs.player.heroHp <= 0 && gs.ai.heroHp <= 0) return 'DRAW';
  if (gs.player.heroHp <= 0) return 'AI';
  if (gs.ai.heroHp <= 0) return 'PLAYER';
  return undefined;
}

export function applyWinner(gs: GameState): GameState {
  const winner = checkWinner(gs);
  return winner ? { ...gs, winner, log: [...gs.log, winner === 'DRAW' ? 'Remis' : `Wygrywa ${winner}`] } : gs;
}

export function drawCards(gs: GameState, side: Side, amount: number) {
  const ps = side === 'PLAYER' ? gs.player : gs.ai;
  for (let i = 0; i < amount; i++) {
    if (!ps.deck.length) {
      ps.fatigueCounter += 1;
      ps.heroHp -= ps.fatigueCounter; // fatigue damage increases
      gs.log.push(`${side}: zmęczenie (${ps.fatigueCounter} dmg)`);
      if (gs.winner) break;
      continue;
    }
    if (ps.hand.length >= HAND_LIMIT) { gs.log.push(side + ': limit ręki (karta spalona)'); ps.deck.shift(); continue; }
  const cid = ps.deck.shift()!;
  ps.hand.push(cid);
  emitDraw({ side });
  }
}

export function startTurnFor(next: GameState, side: Side) {
  const ps = side === 'PLAYER' ? next.player : next.ai;
  ps.maxMana = Math.min(10, ps.maxMana + 1);
  ps.mana = ps.maxMana;
  ps.heroPowerUsed = false;
  ps.board = ps.board.map(m => ({ ...m, canAttack: true, justSummoned: false }));
  drawCards(next, side, 1);
  // Catch-up mechanic: if player far behind on board (>=2 difference) draw 1 extra
  if (side === 'PLAYER') {
    const diff = next.ai.board.length - next.player.board.length;
    if (diff >= 2) {
      drawCards(next, 'PLAYER', 1);
      next.log.push('YOU: dobierasz dodatkową kartę (mechanika wyrównania)');
    }
  }
  Object.assign(next, applyWinner(next));
}

export function playCardForSidePure(gs: GameState, side: Side, handIndex: number): GameState {
  const next = clone(gs);
  if (next.winner) return next;
  if (next.turn !== side) return next;
  const ps = side === 'PLAYER' ? next.player : next.ai;
  const es = side === 'PLAYER' ? next.ai : next.player;
  const cardId = ps.hand[handIndex];
  if (!cardId) return next;
  const card = CARDS[cardId];
  if (card.manaCost > ps.mana) return next;
  ps.mana -= card.manaCost;
  // Board limit for minions
  if (card.type === 'MINION' && ps.board.length >= BOARD_LIMIT) {
    next.log.push(`${side}: brak miejsca na planszy (limit ${BOARD_LIMIT})`);
    ps.mana += card.manaCost; // refund
    return next;
  }
  ps.hand.splice(handIndex, 1);
  if (card.type === 'MINION') {
    ps.board.push({
      entityId: Math.random().toString(36).slice(2),
      cardId: card.id,
      owner: side,
  baseAttack: (card as MinionCard).attack,
  currentHealth: (card as MinionCard).health,
  shield: (card as MinionCard).shield ? true : false,
  canAttack: (card as MinionCard).rush ? true : false,
  justSummoned: true
    });
    next.log.push(`${side}: zagrał stwora ${card.name}`);
  } else {
    const dmg = (card as SpellCard).effects[0].amount ?? 0;
    es.heroHp -= dmg;
    next.log.push(`${side}: zagrał czar ${card.name} (${dmg} dmg w bohatera)`);
  }
  return applyWinner(next);
}

export function heroPowerAction(gs: GameState, side: Side): GameState {
  const next = clone(gs);
  if (next.winner) return next;
  if (next.turn !== side) return next;
  const ps = side === 'PLAYER' ? next.player : next.ai;
  const es = side === 'PLAYER' ? next.ai : next.player;
  if (ps.heroPowerUsed) return next;
  if (ps.mana < HERO_POWER_COST) return next;
  ps.mana -= HERO_POWER_COST;
  ps.heroPowerUsed = true;
  es.heroHp -= HERO_POWER_DAMAGE;
  next.log.push(`${side}: moc bohatera (${HERO_POWER_DAMAGE} dmg w przeciwnika)`);
  return applyWinner(next);
}
function applyEffectOnSide(gs: GameState, side: Side, eff: { type: string; amount?: number; target: string }, source: string) {
  const opponent: Side = side === 'PLAYER' ? 'AI' : 'PLAYER';
  switch (eff.type) {
    case 'DAMAGE': {
      const dmg = eff.amount ?? 0;
      if (eff.target === 'ENEMY_HERO') {
        (opponent === 'AI' ? gs.ai : gs.player).heroHp -= dmg;
        gs.log.push(`${side}: Deathrattle ${source} -> ${dmg} dmg w bohatera ${opponent}`);
      } else if (eff.target === 'ALL_ENEMY_MINIONS') {
        const enemyBoard = opponent === 'AI' ? gs.ai.board : gs.player.board;
        enemyBoard.forEach(m => {
          // Divine Shield / shield mechanics: consume shield before applying health change
          if (m.shield) { m.shield = false; gs.log.push(`${opponent}: tarcza ${m.cardId} została zużyta (${source})`); }
          else { m.currentHealth -= dmg; }
        });
        gs.log.push(`${side}: Deathrattle ${source} -> ${dmg} aoe wrogie stwory`);
      }
      break;
    }
  }
}

export function processDeaths(gs: GameState): GameState {
  // Collect deaths from both sides
  const deaths: { side: Side; minion: MinionInstance; card: MinionCard }[] = [];
  for (const side of ['PLAYER','AI'] as Side[]) {
    const ps = side === 'PLAYER' ? gs.player : gs.ai;
    ps.board.forEach(m => {
      if (m.currentHealth <= 0) deaths.push({ side, minion: m, card: CARDS[m.cardId] as MinionCard });
    });
  }
  if (!deaths.length) return gs;
  for (const d of deaths) {
    const ownerState = d.side === 'PLAYER' ? gs.player : gs.ai;
    ownerState.board = ownerState.board.filter(x => x.entityId !== d.minion.entityId);
  }
  // Trigger deathrattles after all removed (simultaneous resolution)
  for (const d of deaths) {
    if (d.card.deathrattle) {
      d.card.deathrattle.forEach(eff => applyEffectOnSide(gs, d.side, eff, d.card.name));
    }
  }
  return applyWinner(gs);
}
// end engine

// ================= Lethal Evaluation =================
// Returns true if the given side can produce lethal damage on opposing hero this turn (simplified model matching UI logic)
export function computePotentialLethal(gs: GameState, side: Side): boolean {
  const attackerState = side === 'PLAYER' ? gs.player : gs.ai;
  const defenderState = side === 'PLAYER' ? gs.ai : gs.player;
  // Only evaluate if it's that side's turn and mulligan done (for player logic consistency)
  if (side === 'PLAYER' && !gs.mulliganDone) return false;
  if (gs.turn !== side) return false;
  // Collect ready attackers
  const attackers = attackerState.board
    .map(m => {
      const card = CARDS[m.cardId] as MinionCard;
      const canSwing = m.canAttack && (!m.justSummoned || card.rush);
      if (!canSwing) return null;
      return { atk: m.baseAttack, face: !(m.justSummoned && card.rush) } as { atk:number; face:boolean };
    })
    .filter(Boolean) as {atk:number;face:boolean}[];
  if (!attackers.length) return false;
  const heroPowerPotential = (!attackerState.heroPowerUsed && attackerState.mana >= HERO_POWER_COST) ? HERO_POWER_DAMAGE : 0;
  const taunts = defenderState.board.filter(b => (CARDS[b.cardId] as MinionCard).taunt).map(m => ({ hp: m.currentHealth }));
  if (!taunts.length) {
    const faceDmg = attackers.filter(a=>a.face).reduce((s,a)=>s+a.atk,0) + heroPowerPotential;
    return faceDmg >= defenderState.heroHp;
  }
  // Need to clear all taunts first. Use DFS to find minimal total attack required to kill them given discrete attacker attacks.
  const atkValues = attackers.map(a=>a.atk);
  let bestRequired = Number.POSITIVE_INFINITY;
  function dfs(i:number, tauntHp:number[], used:number) {
    if (used >= bestRequired) return;
    if (tauntHp.every(h=>h<=0)) { bestRequired = used; return; }
    if (i >= atkValues.length) return;
    const atk = atkValues[i];
    // Try allocating this attack to each still-alive taunt
    for (let t=0;t<tauntHp.length;t++) {
      if (tauntHp[t] <= 0) continue;
      const nextHp = [...tauntHp];
      nextHp[t] -= atk;
      dfs(i+1, nextHp, used + atk);
    }
    // Optionally skip (not allocating) – but skipping means we cannot use this attack for clearing, so if taunts remain this branch dies.
  }
  dfs(0, taunts.map(t=>t.hp), 0);
  if (bestRequired === Number.POSITIVE_INFINITY) return false; // cannot clear all
  const totalFaceEligible = attackers.filter(a=>a.face).reduce((s,a)=>s+a.atk,0);
  const remainingFacePotential = Math.max(0, totalFaceEligible - bestRequired) + heroPowerPotential;
  return remainingFacePotential >= defenderState.heroHp;
}

// Validate whether an attack from attacker (entityId) to target (hero or minion entityId) is allowed under Taunt rules.
export function canAttackTargetRespectingTaunt(gs: GameState, attackerSide: Side, target: { type: 'HERO' } | { type: 'MINION'; entityId: string }): boolean {
  const opponent: Side = attackerSide === 'PLAYER' ? 'AI' : 'PLAYER';
  const oppBoard = opponent === 'PLAYER' ? gs.player.board : gs.ai.board;
  const tauntsAlive = oppBoard.filter(m => (CARDS[m.cardId] as MinionCard).taunt && m.currentHealth > 0);
  if (!tauntsAlive.length) return true;
  if (target.type === 'HERO') return false;
  const targetMinion = oppBoard.find(m => m.entityId === target.entityId);
  if (!targetMinion) return false;
  return !!(CARDS[targetMinion.cardId] as MinionCard).taunt;
}
