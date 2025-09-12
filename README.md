# The Gate

Prototyp gry karcianej "The Gate" (inspirowana Hearthstone) w React + TypeScript + Vite + Tailwind.

## Cel
Szybki MVP z podstawową pętlą gry: dobieranie, zagrywanie stronników / czarów, ataki, prosta AI z animacjami.

## Contributing / Rules

Please see `RULES.md` for small repository rules and contribution guidelines (branching, PRs, commits, tests, and code style).

## Stos technologiczny
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3
- Framer Motion (tylko drobne animacje hover/atak)

## Mechaniki (stan aktualny)
- Tury naprzemienne PLAYER / AI.
- Mana rośnie co turę do 10 (start 1).
- Mulligan startowy: oznacz karty do wymiany (zachowana gwarancja taniej karty <=1 many).
- Zagrywanie stronników (Rush, Taunt, Deathrattle) i czarów (obrażenia bezpośrednie).
- Atakowanie: najpierw wybór atakującego, potem cel (Taunt ogranicza wybór).
- Rush: w turze wejścia może atakować tylko wrogie jednostki.
- Deathrattle: efekty po śmierci (pojedynczy dmg / AOE / face) wykonywane w kolejce rozpatrywania zgonów.
- Hero Power: koszt 2 many, zadaje 1 dmg (raz na turę, blokada po użyciu).
- Dobieranie 1 karty na początek tury (+ "catch-up" jeśli masz ≥2 mniej stronników na planszy).
- Fatigue: po wyczerpaniu talii otrzymujesz rosnące obrażenia przy próbach dobrania.
- Limity: 7 stronników na stronę, 10 kart w ręce (nadmiar spalony bez efektu).
- Animowana tura AI: kolejka akcji (zagrania, czary, ataki, hero power) z opóźnieniami i powtórką animacji ataku.
- Wskazanie celu: strzałka z ręki / stronika; ESC lub PPM anuluje wybieranie.
- Dynamiczna ocena potencjalnego lethala – podświetlenie hero przeciwnika.

## Aktualne uproszczenia / różnice
- Brak złożonych efektów (buffy, leczenie, silence, AOE poza prostymi deathrattle / spell dmg).
- Jedna frakcja / brak klas.
- Brak persistencji / brak dźwięku.
- AI planuje maksymalnie kilka (≈3) zagrań w fazie play – heurystyka uproszczona.
- Brak systemu rarity / ekonomii / trybów gry.
- Brak efektów ciągłych oraz stanów (np. aura, freeze).

## Ostatnie zmiany – log techniczny / gameplay
- Dodano animowaną kolejkę AI (buildAiQueue + executeAiQueue) + overlay postępu.
- Gwarancja taniej karty (<=1 many) po mulliganie.
- Refaktoryzacja startTurnFor() – poprawne sekwencje dobierania i catch-up draw.
- Naprawiono strzałkę celowania dla czarów (stabilne data-* anchory).
- Usunięto zduplikowane fragmenty logiki AI.
- Porządki w stylach Tailwind (usunięte zbędne warstwy / eksperymentalne ramki statów).

## Ostatnie zmiany – UI / UX
- Uproszczone heksy statów (ATK / HP) do jednego wypełnienia + cień (usunięte wielowarstwowe ramki i flary).
- Nowy heks kosztu many (CostHex) spójny z minimalną stylistyką statów.
- Zwiększona szerokość kart ręki + większe fonty nazwy/opisu/keywordów.
- Opis karty bezpośrednio pod nazwą (lepsza hierarchia skanowania).
- Szare / desaturacja / obniżona jasność kart niegrywalnych (feedback dostępności ruchu).
- Płynne przejście hover między kartami ręki (interpolowany indeks zamiast skoków).
- Proximity hover: podążanie za kursorem po całej szerokości strefy, brak "gubienia" focusu.
- Re-tuning uniesienia kart (lift) i cieni podniesionej karty dla czytelności.
- Podświetlenie potencjalnego lethala na hero.
- End Turn – mniejszy przycisk, ale wyraźniejsza typografia (dwulinijkowy KONIEC / TURY) i puls jeśli tura gracza.
- Nowe panele HP / Mana / Deck / Hand: zunifikowany wielokąt (decagon) z animowaną cieczą i mini wskaźnikami talii/ręki.

### Recent local UI/name edits
- AI now uses separate names and separate `src/assets/cards/ai` images (player uses `human`).
- Played-card artwork scaled and positioned for better readability; AI minions slightly nudged down.
- Avatars changed to decagon (10-sided) shape; hero labels and meter labels adjusted and widened to avoid clipping.

## Recent local edits (additional)

- Removed legacy `ribborn.svg` / `ribbon.svg` assets that caused import errors and simplified CardFrame asset usage.
- Increased hand card size for improved readability (hand cards now render larger widths/heights).
- Spell cards (when shown in hand) use `spell_bg.svg` background; minions keep `card-bg.svg`.

## Architektura w skrócie
Warstwa logiki gry pozostaje czysta (bez zależności od DOM) – reakcje UI są tylko efektem danych. Najważniejsze komponenty:

| Warstwa | Plik | Rola |
|---------|------|------|
| Engine | `src/game/engine.ts` | Funkcje czystej logiki, tury, rozpatrywanie śmierci, hero power, mulligan. |
| Dane | `src/game/cards.ts` | Definicje kart bazowych. |
| UI główne | `src/App.tsx` | Spięcie stanu, kolejka AI, targeting, overlaye. |
| Rendering kart | `src/components/CardFrame.tsx` | Pojedyncza karta w ręce (koszt, opis, staty). |
| Miniony | `src/components/Minion.tsx` | Jednostki na planszy, keywordy, heksy statów. |
| Ręka | `src/components/Hand.tsx` | Układ wachlarza + interpolacja hover + mulligan mode. |
| Hero | `src/components/Hero.tsx` | Avatary, animacje obrażeń, liczniki HP/Mana, deck/hand count. |

Testy (podstawowe) potwierdzają mulligan, hero power i wybrane reguły limitów.

## Pliki kluczowe
- `src/App.tsx` – główna logika UI + interakcje + animowany AI flow
- `src/game/engine.ts` – czysta logika: setup, tury, zagrywanie, hero power, deathrattle, lethal, taunt helper
- `src/game/cards.ts` – definicje kart + talia bazowa
- `src/components/` – Hero, Minion, Hand, BoardRow, CardFrame, LogPanel, StatsPanel

## Konwencje
- Modyfikacja stanu gry: zawsze przez klon (clone -> immutable update)
- Efekty walki i czarów: spawnDamage(selector, value) do wizualizacji liczb
- Identyfikatory DOM: data-minion, data-hero, data-hand-idx do obliczeń pozycji strzałki / animacji

## Uruchomienie
```
npm install
npm run dev   # Vite (auto wybierze wolny port)
```
Build produkcyjny:
```
npm run build
npm run preview
```

## Pomysły next
- Nowe keywordy: Shield, Poison, Lifesteal, Inspire.
- Czar AOE z wyborem kilku celów / obszaru.
- Lepsza heurystyka AI: ocena wymian, priorytety buff/debuff, dynamiczne ważenie hero power.
- Tryb debug: wizualizacja kolejki AI + log stamina.
- Dźwięki, podstawowe efekty cząsteczkowe (uderzenia, czary, śmierć).
- Layout responsywny (mobile portrait) – alternatywna kolumna paneli.
- System logu zdarzeń (timeline) przewijalny.
- Konfiguracja seed RNG dla powtarzalnych testów.

## Publikacja / Deploy (manualny)
Lokalny build statyczny (Vite):
```
npm run build
```
Wynik w `dist/` można wystawić przez dowolny serwer statyczny (np. GitHub Pages – skopiować zawartość do gałęzi `gh-pages`).

Szybki podgląd produkcyjny lokalnie:
```
npm run preview
```

Przykładowe kroki publikacji do nowego repo (tylko folder `the-gate` zamiast całego pulpitu!):
1. (W katalogu `the-gate/`) `git init`.
2. `git add .`
3. `git commit -m "feat: initial public version (mulligan + new UI)"`
4. Utwórz puste repo na GitHub, np. `reprezentant/the-gate`.
5. `git remote add origin git@github.com:reprezentant/the-gate.git`
6. `git push -u origin master` (lub `main`).

Alternatywa: jeśli nadrzędny katalog jest już repo (jak cały Desktop) – użyj `git subtree split --prefix=the-gate -b gate-publish` a następnie push tej gałęzi do nowego remote.

## Jakość / Konwencje kodu
- Immutable updates (clone) w silniku – brak mutacji przekazywanych obiektów.
- Komponenty prezentacyjne oddzielone od logiki gry.
- Widoczne identyfikatory `data-*` tylko gdzie potrzebny targeting / animacje.
- Uproszczone SVG – mniejsza liczba filtrów po optymalizacji statów.

## Roadmap techniczna (krótko)
- [ ] Refine AI scoring (value trade heuristics, lethal simulation).
- [ ] Testy jednostkowe dla fatigue i deathrattle chain.
- [ ] Modularny system efektów (pipeline). 
- [ ] Ekstrakcja layoutu wachlarza do hooka `useHandFanLayout`.
- [ ] Konfiguracja CI (lint + test + preview build).

## Troubleshooting
- Jeśli style znikają: sprawdź, czy tylko `tailwind.config.cjs` istnieje (duplikat .js usuń) i czy ścieżki content obejmują `./index.html` i `./src/**/*.{js,ts,jsx,tsx}`.
- Biały ekran: sprawdź konsolę; typowe przyczyny to błędne hooki poza komponentem / duplikaty definicji.

## Licencja
Prototyp edukacyjny – nazwa robocza "The Gate" – brak formalnej licencji (do uzupełnienia).

# React + TypeScript + Vite

## Simulation runner (CLI)

There is a small simulation runner useful for deterministic AI-vs-AI runs and producing replay JSON files. It is located at `scripts/sim/simulate.ts` and is wired into npm scripts.

Usage examples (PowerShell):

```
npm run sim:run -- 12345                      # run with seed 12345, default snapshots=full
npm run sim:run -- --out replay.json 12345    # write to custom path
npm run sim:run -- --maxTurns 50 12345        # limit to 50 turns
npm run sim:run -- --snapshots compact 12345  # write compact per-half-turn snapshots
```

Flags:
- `--out <path>` or `-o` — output file path (relative to cwd). If omitted, uses `dist/scripts/sim/replay-<seed>.json`.
- `--maxTurns <n>` — maximum number of full turns to simulate (default 100).
- `--snapshots <full|compact|none>` — snapshot capture mode:
  - `full` — deep clone of full GameState after each half-turn (default).
  - `compact` — minimal per-half-turn summary (hero HP, boards, last log lines).
  - `none` — do not capture snapshots.
- `--verbose` — print chosen seed, maxTurns and out path.

The runner is bundled with `esbuild` before execution (npm script `sim:run`). Replays are deterministic when you pass a seed and the engine's RNG is preserved in the output JSON.


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
