// Core type definitions
export type Side = 'PLAYER' | 'AI';
export type CardType = 'MINION' | 'SPELL';

export interface Effect {
  type: 'DAMAGE' | 'HEAL' | 'DESTROY_IF_HEALTH_AT_MOST' | 'AURA_ATTACK_BUFF';
  amount?: number;
  threshold?: number;
  target: string;
  timing?: 'ON_PLAY' | 'AURA';
  text?: string;
}

export interface BaseCard {
  id: string;
  name: string;
  type: CardType;
  manaCost: number;
  text?: string;
}

export interface MinionCard extends BaseCard {
  type: 'MINION';
  attack: number;
  health: number;
  effects?: Effect[];
  taunt?: boolean; // Prowokacja – musi zostać zaatakowany zanim bohater / inne bez Taunt
  shield?: boolean; // Divine Shield – blocks first source of damage
  poisonous?: boolean; // Poisonous – kills any minion damaged by this minion (if damage > 0) unless shielded
  deathrattle?: Effect[]; // Efekty wykonywane po śmierci
  rush?: boolean; // Rush – może atakować w turze zagrania, ale tylko wrogich stronników
}

export interface SpellCard extends BaseCard {
  type: 'SPELL';
  effects: Effect[];
}

export type Card = MinionCard | SpellCard;

export interface MinionInstance {
  entityId: string;
  cardId: string;
  owner: Side;
  baseAttack: number;
  currentHealth: number;
  canAttack: boolean;
  justSummoned?: boolean;
  shield?: boolean;
}

export interface PlayerState {
  heroHp: number;
  mana: number;
  maxMana: number;
  deck: string[];
  hand: string[];
  board: MinionInstance[];
  heroPowerUsed: boolean;
  fatigueCounter: number; // increments each time we attempt to draw from empty deck
}

export interface GameState {
  player: PlayerState;
  ai: PlayerState;
  turn: Side;
  winner?: Side | 'DRAW';
  log: string[];
  // Whether the initial mulligan phase has been completed
  mulliganDone?: boolean;
}
