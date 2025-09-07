import type { Card } from './types';

export const CARDS: Record<string, Card> = {
  c_minion_young_warrior: { id: 'c_minion_young_warrior', name: 'Młody Wojownik', type: 'MINION', manaCost: 1, attack: 1, health: 2, text: 'Prosty wojownik.' },
  c_minion_stone_defender: { id: 'c_minion_stone_defender', name: 'Kamienny Obrońca', type: 'MINION', manaCost: 2, attack: 1, health: 4, taunt: true, text: 'Prowokacja.' },
  c_minion_berserker: { id: 'c_minion_berserker', name: 'Berserker', type: 'MINION', manaCost: 2, attack: 3, health: 2, text: 'Agresywny napastnik.' },
  c_minion_guardian: { id: 'c_minion_guardian', name: 'Strażnik', type: 'MINION', manaCost: 3, attack: 2, health: 5, taunt: true, text: 'Prowokacja.' },
  c_minion_colossus: { id: 'c_minion_colossus', name: 'Koloss', type: 'MINION', manaCost: 4, attack: 4, health: 4, text: 'Większa presja.' },
  c_minion_shield_bearer: { id: 'c_minion_shield_bearer', name: 'Tarczownik', type: 'MINION', manaCost: 1, attack: 0, health: 4, taunt: true, text: 'Prowokacja.' },
  c_minion_rushing_wolf: { id: 'c_minion_rushing_wolf', name: 'Szarżujący Wilk', type: 'MINION', manaCost: 1, attack: 2, health: 1, rush: true, text: 'Rush: może atakować w turze zagrania (tylko stwory).' },
  c_minion_haunted_wailer: { id: 'c_minion_haunted_wailer', name: 'Upiorny Wyjec', type: 'MINION', manaCost: 2, attack: 2, health: 1, deathrattle: [{ type: 'DAMAGE', amount: 1, target: 'ENEMY_HERO', text: 'Deathrattle: 1 dmg w wrogiego bohatera.' }], text: 'Deathrattle: 1 dmg w bohatera.' },
  c_minion_exploding_goblin: { id: 'c_minion_exploding_goblin', name: 'Eksplodujący Goblin', type: 'MINION', manaCost: 3, attack: 3, health: 2, deathrattle: [{ type: 'DAMAGE', amount: 2, target: 'ALL_ENEMY_MINIONS', text: 'Deathrattle: 2 dmg wszystkim wrogim stronn.' }], text: 'Deathrattle: 2 dmg wszystkim wrogim.' },
  c_spell_fireball: { id: 'c_spell_fireball', name: 'Kula Ognia', type: 'SPELL', manaCost: 2, effects: [{ type: 'DAMAGE', amount: 3, target: 'ANY', text: 'Zadaj 3 dmg dowolnemu celowi.' }], text: 'Zadaj 3 obrażenia dowolnemu celowi.' },
  c_spell_arcane_bolt: { id: 'c_spell_arcane_bolt', name: 'Arkaniczny Piorun', type: 'SPELL', manaCost: 1, effects: [{ type: 'DAMAGE', amount: 2, target: 'ANY', text: '2 dmg dowolny cel.' }], text: 'Zadaj 2 obrażenia.' }
};

export const BASE_DECK: string[] = [
  'c_minion_young_warrior','c_minion_young_warrior',
  'c_minion_stone_defender','c_minion_stone_defender',
  'c_minion_berserker','c_minion_berserker',
  'c_minion_guardian','c_minion_guardian',
  'c_minion_colossus','c_minion_colossus',
  'c_minion_shield_bearer','c_minion_shield_bearer',
  'c_spell_fireball','c_spell_fireball',
  'c_spell_arcane_bolt','c_spell_arcane_bolt'
];
