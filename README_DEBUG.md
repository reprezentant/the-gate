Debug notes 2025-09-06
Issue: Tailwind utilities not applied / white screen.
Actions:
1. Found duplicate Tailwind configs (tailwind.config.cjs + tailwind.config.js). Removed JS version to avoid ambiguity.
2. Restarted Vite dev server (port 5173).
Next checks (manual in browser devtools):
- Ensure network request for /src/index.css (or injected <style>) contains generated utility classes (.flex, .bg-slate-900 etc.).
- Verify elements like body have bg-slate-900 applied.
- Open console for runtime React errors. If blank screen + no styles, potential stale service worker (unlikely) or build caching.
Suggested if still broken:
- Delete node_modules/.vite and restart.
- Run: npx tailwindcss -i ./src/index.css -o ./src/__tw_probe.css --content ./index.html ./src/**/*.{js,ts,jsx,tsx}
- Inspect __tw_probe.css for utility classes (.flex etc.).
