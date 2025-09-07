import { CARDS } from './cards';
import { clone, applyWinner, playCardForSidePure, startTurnFor, heroPowerAction, HERO_POWER_COST, processDeaths } from './engine';
import type { GameState, MinionInstance, MinionCard, SpellCard } from './types';

// AI logic extracted from App.tsx for separation of concerns.
// Heuristic, single-turn simulation deciding plays then attacks.
export function simulateAiTurnOnce(gs: GameState): GameState {
  let next = clone(gs);
  if (next.winner) return next;

  next.turn = 'AI';
  startTurnFor(next, 'AI');
  next.log.push('--- Tura AI ---');

  const ai = next.ai;
  const player = next.player;

  const evaluateRemovalValue = (m: MinionInstance) => {
    const c = CARDS[m.cardId] as MinionCard;
    return c.attack * 2 + c.health;
  };

  let plays = 0;
  while (plays < 3) {
    const choices = ai.hand
      .map((id, i) => ({ id, i, card: CARDS[id] }))
      .filter(x => x.card.manaCost <= ai.mana);
    if (!choices.length) break;

    const minions = choices.filter(c => c.card.type === 'MINION');
    const spells = choices.filter(c => c.card.type === 'SPELL');

    let bestSpell: { choice: typeof spells[0]; targetMinion?: MinionInstance; targetHero: boolean; score: number } | null = null;
    for (const s of spells) {
      const eff = (s.card as SpellCard).effects[0];
      const dmg = eff.amount ?? 0;
      for (const pm of player.board) {
        if (pm.currentHealth <= dmg) {
          const score = 100 + evaluateRemovalValue(pm);
          if (!bestSpell || score > bestSpell.score) bestSpell = { choice: s, targetMinion: pm, targetHero: false, score };
        }
      }
      const faceScore = dmg * 3;
      if (!bestSpell || faceScore > bestSpell.score) bestSpell = { choice: s, targetMinion: undefined, targetHero: true, score: faceScore };
    }

    const bestMinion = minions.sort((a,b)=> b.card.manaCost - a.card.manaCost)[0];

    let decided: 'SPELL' | 'MINION' | null = null;
    if (bestSpell && bestMinion) {
      const minionScore = bestMinion.card.manaCost * 15;
      decided = bestSpell.score > minionScore ? 'SPELL' : 'MINION';
    } else if (bestSpell) decided = 'SPELL'; else if (bestMinion) decided = 'MINION'; else break;

    if (decided === 'MINION' && bestMinion) {
      next = playCardForSidePure(next, 'AI', bestMinion.i);
    } else if (decided === 'SPELL' && bestSpell) {
      const idx = bestSpell.choice.i;
      const cardId = ai.hand[idx];
      if (ai.hand[idx] !== cardId) { plays++; continue; }
      const spellCard = CARDS[cardId] as SpellCard;
      ai.mana -= spellCard.manaCost;
      ai.hand.splice(idx,1);
      const dmg = (spellCard.effects[0].amount) ?? 0;
      if (bestSpell.targetHero) {
        player.heroHp -= dmg;
        next.log.push(`AI: czar ${spellCard.name} (${dmg} dmg w Twojego bohatera)`);
      } else {
        const tm = bestSpell.targetMinion!;
        tm.currentHealth -= dmg;
        next.log.push(`AI: czar ${spellCard.name} (${dmg} dmg w ${CARDS[tm.cardId].name})`);
        if (tm.currentHealth <= 0) player.board = player.board.filter(m => m.entityId !== tm.entityId);
      }
      next = applyWinner(next);
      if (next.winner) break;
    }
    plays++;
  }

  // Delay hero power decision until after attacks unless potential lethal now
  const considerHeroPower = () => {
    if (next.ai.heroPowerUsed) return;
    if (next.ai.mana < HERO_POWER_COST) return;
    // Use if player board empty OR player hero at or below 3 HP (attempt finishing) OR no playable hand cards
    const hasPlayable = next.ai.hand.some(id => CARDS[id].manaCost <= next.ai.mana);
    if (next.player.board.length === 0 || next.player.heroHp <= HERO_POWER_COST + 1 || !hasPlayable) {
      Object.assign(next, heroPowerAction(next, 'AI'));
    }
  };

  for (const m of [...next.ai.board]) {
    const mCard = CARDS[m.cardId] as MinionCard;
    if (!(m.canAttack && (!m.justSummoned || mCard.rush))) continue;
  const playerTaunts = next.player.board.filter(x => (CARDS[x.cardId] as MinionCard).taunt);
  const attackPool = playerTaunts.length ? playerTaunts : next.player.board;
  const favorable = attackPool.find(pm => pm.currentHealth <= m.baseAttack && (CARDS[pm.cardId] as MinionCard).attack < m.currentHealth);
    if (favorable) {
      favorable.currentHealth -= m.baseAttack;
      m.currentHealth -= (CARDS[favorable.cardId] as MinionCard).attack;
      next.log.push(`AI: trade z ${CARDS[favorable.cardId].name}`);
      if (favorable.currentHealth <= 0) next.player.board = next.player.board.filter(x => x.entityId !== favorable.entityId);
  processDeaths(next);
  if (m.currentHealth > 0) m.canAttack = false;
      continue;
    }
  const anyKill = attackPool.find(pm => pm.currentHealth <= m.baseAttack);
    if (anyKill) {
      anyKill.currentHealth -= m.baseAttack;
      m.currentHealth -= (CARDS[anyKill.cardId] as MinionCard).attack;
      next.log.push(`AI: poświęca się na ${CARDS[anyKill.cardId].name}`);
      if (anyKill.currentHealth <= 0) next.player.board = next.player.board.filter(x => x.entityId !== anyKill.entityId);
  processDeaths(next);
  if (m.currentHealth > 0) m.canAttack = false;
      continue;
    }
  // Taunt rule: cannot go face if player has any taunt minions
  if (playerTaunts.length) { continue; }
  // Rush restriction: freshly summoned rush minion cannot hit hero
  if (m.justSummoned && mCard.rush) { continue; }
    next.player.heroHp -= m.baseAttack;
    next.player.heroHp -= m.baseAttack;
    next.log.push(`AI: atakuje bohatera za ${m.baseAttack}`);
    m.canAttack = false;
  }
  processDeaths(next);

  // After attacks decide on hero power (face pressure / finishing or mana dump)
  considerHeroPower();

  next = applyWinner(next);
  if (next.winner) return next;

  startTurnFor(next, 'PLAYER');
  next.turn = 'PLAYER';
  next.log.push('--- Twoja tura ---');
  return next;
}
