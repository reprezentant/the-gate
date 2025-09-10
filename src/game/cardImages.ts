// Load AI-specific and human/player-specific images explicitly.
// We expect assets to live in:
//  - src/assets/cards/ai/{cardId}.webp|png|jpg|jpeg|svg
//  - src/assets/cards/human/{cardId}.webp|png|jpg|jpeg|svg
// This makes the lookup deterministic and avoids accidentally picking files from other folders.
const aiImages = import.meta.glob('../assets/cards/ai/**/*.{webp,png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const humanImages = import.meta.glob('../assets/cards/human/**/*.{webp,png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

// Small helper to find by cardId in a map of paths
function findIn(images: Record<string,string>, cardId: string): string | undefined {
  const keys = Object.keys(images);
  for (const k of keys) {
    if (k.endsWith(`/${cardId}.webp`) || k.endsWith(`/${cardId}.png`) || k.endsWith(`/${cardId}.jpg`) || k.endsWith(`/${cardId}.jpeg`) || k.endsWith(`/${cardId}.svg`)) {
      return images[k];
    }
  }
  return undefined;
}

// side can be 'PLAYER' or 'AI' (string). Prefer side-specific folder, then fall back to the other folder.
export function getCardImage(cardId: string, side?: string): string | undefined {
  if (side === 'AI') {
    const ai = findIn(aiImages, cardId);
    if (ai) return ai;
    // fallback to human folder if AI art missing
    const hum = findIn(humanImages, cardId);
    if (hum) return hum;
    return undefined;
  }

  // default / PLAYER: prefer human folder first
  const human = findIn(humanImages, cardId);
  if (human) return human;
  // fallback to AI folder if human art missing
  const ai = findIn(aiImages, cardId);
  return ai;
}

// Backwards-compatible alias (keeps older call sites working)
export function getCardImageById(cardId: string): string | undefined {
  return getCardImage(cardId, 'PLAYER');
}

export default getCardImageById;
