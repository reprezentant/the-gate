import type { Card } from './types';
import type { Side } from './types';

export const CARDS: Record<string, Card> = {
  c_minion_young_warrior: { id: 'c_minion_young_warrior', name: 'Młody Wojownik', type: 'MINION', manaCost: 1, attack: 1, health: 2, text: 'W sam raz na start gry.' },
  c_minion_stone_defender: { id: 'c_minion_stone_defender', name: 'Kamienny Obrońca', type: 'MINION', manaCost: 2, attack: 1, health: 4, taunt: true, text: 'Prowokator z małym atakiem.' },
  c_minion_berserker: { id: 'c_minion_berserker', name: 'Berserker', type: 'MINION', manaCost: 2, attack: 3, health: 2, text: 'Wyszkolony napastnik.' },
  c_minion_guardian: { id: 'c_minion_guardian', name: 'Strażnik', type: 'MINION', manaCost: 3, attack: 2, health: 5, taunt: true, text: 'Dobrze wyszkolony prowokator.' },
  c_minion_colossus: { id: 'c_minion_colossus', name: 'Koloss', type: 'MINION', manaCost: 4, attack: 4, health: 4, text: 'Najsilniejszy i twardy.' },
  c_minion_shield_bearer: { id: 'c_minion_shield_bearer', name: 'Tarczownik', type: 'MINION', manaCost: 1, attack: 0, health: 4, taunt: true, shield: true, text: 'Twardy prowokator, słaby atakujący.' },
  c_minion_rushing_wolf: { id: 'c_minion_rushing_wolf', name: 'Szarżujący Wilk', type: 'MINION', manaCost: 1, attack: 2, health: 1, rush: true, text: 'Może atakować miniony zaraz po zagraniu.' },
  c_minion_haunted_wailer: { id: 'c_minion_haunted_wailer', name: 'Upiorny Wyjec', type: 'MINION', manaCost: 2, attack: 2, health: 1, poisonous: true, text: 'Poisonous: zabija jednostkę którą rani.' },
  c_minion_exploding_goblin: { id: 'c_minion_exploding_goblin', name: 'Eksplodujący Goblin', type: 'MINION', manaCost: 3, attack: 3, health: 2, deathrattle: [{ type: 'DAMAGE', amount: 1, target: 'ALL_ENEMY_MINIONS', text: 'Kiedy ginie zadaje 1 dmg wszystkim wrogom.' }], text: 'Kiedy ginie zadaje 1 dmg wszystkim wrogom.' },
  // Example minion without Deathrattle (kept as a simple minion)
  c_minion_shrapnel_scavenger: { id: 'c_minion_shrapnel_scavenger', name: 'Złomowy Zbieracz', type: 'MINION', manaCost: 2, attack: 1, health: 2, text: 'Zwykły zbieracz złomu.' },
  c_spell_fireball: { id: 'c_spell_fireball', name: 'Kula Ognia', type: 'SPELL', manaCost: 2, effects: [{ type: 'DAMAGE', amount: 3, target: 'ANY', text: 'Zadaj 3 dmg dowolnemu celowi.' }], text: 'Zadaj 3 obrażenia dowolnemu celowi.' },
  c_spell_arcane_bolt: { id: 'c_spell_arcane_bolt', name: 'Arkaniczny Piorun', type: 'SPELL', manaCost: 1, effects: [{ type: 'DAMAGE', amount: 2, target: 'ANY', text: '2 dmg dowolny cel.' }], text: 'Zadaj 2 obrażenia dowolnemu celowi.' }
};

// Nazwy alternatywne dla AI (smocza wariacja) oraz opcjonalne nadpisania dla human/player
const AI_NAME_OVERRIDES: Record<string,string> = {
  c_minion_young_warrior: 'Młody Smok',
  c_minion_stone_defender: 'Kamienny Smok',
  c_minion_berserker: 'Smok Berserker',
  c_minion_guardian: 'Strażnik Smoków',
  c_minion_colossus: 'Opasłe Smoczysko',
  c_minion_shield_bearer: 'Gruboskórny',
  c_minion_rushing_wolf: 'Smoczy Wilk',
  c_minion_haunted_wailer: 'Upiorny Smok',
  c_minion_exploding_goblin: 'Eksplodujący Smok',
  c_spell_fireball: 'Ognisty Podmuch',
  c_spell_arcane_bolt: 'Ognisty Grom'
};

// Pusta mapa dla ewentualnych nazw gracza (jeśli chcesz indywidualne nazwy dla playera w przyszłości)
const HUMAN_NAME_OVERRIDES: Record<string,string> = {};

// Zwraca nazwę karty zależną od strony. PLAYER domyślnie używa nazwy z CARDS chyba, że HUMAN_NAME_OVERRIDES ma wpis.
export function getDisplayName(cardId: string, side: Side): string {
  const base = CARDS[cardId]?.name || cardId;
  if (side === 'AI' && AI_NAME_OVERRIDES[cardId]) return AI_NAME_OVERRIDES[cardId];
  if (side === 'PLAYER' && HUMAN_NAME_OVERRIDES[cardId]) return HUMAN_NAME_OVERRIDES[cardId];
  return base;
}

export const BASE_DECK: string[] = [
  'c_minion_young_warrior','c_minion_young_warrior',
  'c_minion_stone_defender','c_minion_stone_defender',
  'c_minion_berserker','c_minion_berserker',
  'c_minion_guardian','c_minion_guardian',
  'c_minion_colossus','c_minion_colossus',
  'c_minion_shield_bearer','c_minion_shield_bearer',
  'c_minion_rushing_wolf','c_minion_rushing_wolf',
  'c_minion_haunted_wailer',
  'c_minion_exploding_goblin',
  'c_spell_fireball','c_spell_fireball',
  'c_spell_arcane_bolt','c_spell_arcane_bolt'
];
