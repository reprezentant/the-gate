// Auto-generated helper to map card asset filenames to URLs using Vite's import.meta.glob
const images = import.meta.glob('../assets/cards/*.{webp,png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export function getCardImageById(cardId: string): string | undefined {
  const keys = Object.keys(images);
  const match = keys.find(k => k.endsWith(`/${cardId}.webp`) || k.endsWith(`/${cardId}.png`) || k.endsWith(`/${cardId}.jpg`) || k.endsWith(`/${cardId}.jpeg`) || k.endsWith(`/${cardId}.svg`));
  return match ? images[match] : undefined;
}

export default getCardImageById;
