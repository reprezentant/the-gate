// Lightweight policy helpers used by simulation scripts.
// Kept minimal and strongly typed to satisfy lint rules. Replace with richer logic if needed.

export type SimState = Record<string, unknown>;
export type Action = Record<string, unknown>;

export type Policy = (state: SimState) => Action;

export const noopPolicy: Policy = (_state: SimState) => { void _state; return { ok: true }; };

export default noopPolicy;
