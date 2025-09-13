Repository rules for contributors

Purpose
-------
This file documents small, practical rules and conventions for contributors to the-gate repository. The goal is to keep PRs small, reproducible, and easy to review.

Quick checklist
---------------
- Make focused PRs (one feature/bug per PR).
- Add or update a test for any non-trivial engine change.
- Run `npm run build` and `npm run lint` (if available) before pushing.
- Use descriptive commits. Format: `type(scope): short description` (e.g. `fix(hand): prevent hover jitter`).

Branching and PRs
-----------------
- Branches: use `feature/<short-name>` or `fix/<short-name>`.
- Rebase (or squash) before merging to `main` to keep history linear.
- Open a PR and include: what changed, why, and screenshots if UI is affected.
- Link related issues or task IDs when available.

Code style and linting
----------------------
- TypeScript: prefer strict typing. Avoid `any` unless necessary and justify it in a comment.
- Keep UI logic in React components; keep pure game logic in `src/game/*`.
- Naming: camelCase for functions and variables, PascalCase for components.
- Follow existing Tailwind and CSS conventions used in the repo.
- Run linters and fix issues before committing.

Testing
-------
- Add unit tests for engine changes (mulligan, fatigue, deathrattle chain, turns).
- Keep tests deterministic. Use seeded RNG helpers if randomness is involved.

Commits and messages
--------------------
- Use present tense and keep the subject under ~72 chars.
- Include a longer body when the change requires explanation.
- Use conventional types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`.

PR review
---------
- Assign at least one reviewer.
- Request review when the PR is ready; mark WIP with `[WIP]` in the title.
- Respond to review comments promptly and keep changes small.

Security and secrets
--------------------
- Never commit secrets, API keys, or private credentials.
- Use `.env.local` (gitignored) for local secrets and document expected variables in `README.md`.

Licensing and attribution
-------------------------
- If adding external assets (images/sounds), include attribution / license info in `ASSETS.md` or `LICENSE`.
- The repository currently has no formal license file; add `LICENSE` when ready to publish.

CI and publishing
-----------------
- If adding CI, include tests and lint steps.
- For deployable builds, ensure `npm run build` produces a working `dist/` folder.

Contact / Maintainers
---------------------
- Maintainer: `reprezentant` (github handle). Open an issue or ping on PRs for urgent help.

Small, practical guidance
-------------------------
- Keep PRs below 300 changed files and try to keep logical size manageable.
- Prefer small, incremental UI tweaks over one large sweeping visual pass.
- For experiments, create an `experiment/*` branch and keep it separate from `main`.

Thank you for contributing!


Recent local edits
-----------------
- AI now uses separate names and image assets (`src/assets/cards/ai`); player uses `human` assets.
- Played-card artwork scaled and positioned for better readability; AI minions slightly nudged down.
- Avatars changed to decagon (10-sided) shape; hero labels and meter labels adjusted and widened to avoid clipping.
- Divider line between played cards (player vs AI) can be nudged up/down for layout tuning.
- Increased hand card size for improved readability; hand cards now render larger widths/heights.
- Spell cards in hand use `spell_bg.svg` background; minions use `card-bg.svg`.
- Status icons (shield, poison, rush, deathrattle) are stacked in a right column under ATK, with fine-tuned position.
- HUD cluster (avatar, mana, hp, deck, hand) can be moved up/down for spacing; hand can be nudged independently.
- Removed legacy `ribborn.svg` / `ribbon.svg` assets that caused import errors and simplified CardFrame asset usage.
- Safety: `scripts/clean.ps1` and `scripts/clean.sh` require explicit env flags to run destructive actions.

Safety / clean scripts
----------------------
- `scripts/clean.ps1` and `scripts/clean.sh` have been hardened to require explicit environment flags (e.g. `ALLOW_CLEAN=1` and `CLEAN_CONFIRM=1`) before performing destructive actions like removing `node_modules` or killing processes. By default they are no-ops for safety.
- Start the dev server only from the project root (`the-gate/`) to avoid accidentally running cleaners in a parent workspace.

