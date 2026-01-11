# Repository Guidelines

## Project Structure & Module Organization
- `index.html` (landing) routes to `js/main.js`, which wires together the game modules.
- Core logic is split across `js/core/`, `entities/`, `world/`, `ui/`, `utils/`, and `multiplayer/`; place new features in the matching domain folder.
- Assets live in `textures/`, `models/`, and `static/`; the multiplayer backend and tests belong in `server/src/` and `server/tests/`.

## Build, Test, and Development Commands
- `python -m http.server 8000` (from repo root) or `npx http-server` serves the front end for local play.
- `npm install` inside `server/` installs backend dependencies.
- `npm start` runs the production WebSocket server; `npm run dev` hot-reloads via nodemon for rapid iteration.
- `npm test` executes the Jest suite; `npm run test:security` and `npm run test:load` target security and load checks with Artillery.

## Coding Style & Naming Conventions
- Use ES modules on the client and CommonJS on the server; prefer `const` and arrow functions when practical.
- Follow the existing four-space indentation and trailing comma pattern; name files for their responsibility (`player.js`, `RateLimiter.js`).
- Keep UI strings and DOM selectors in the dedicated `ui/` helpers to avoid duplication.

## Testing Guidelines
- Add backend Jest specs in `server/tests/` with the `*.test.js` pattern and `describe/test` blocks.
- Cover happy paths, disconnects, and rate-limit outcomes; reuse the mocked WebSocket workflow from `server.test.js`.
- Run `npm test` before every PR and layer on `npm run test:load` when touching networking or performance-sensitive code.
- Note manual client checks (browser, room flow, map size) in the PR when gameplay behavior changes.

## Commit & Pull Request Guidelines
- Write imperative, topic-focused commits (e.g., `Add enemy speed clamp for maze collisions`) to match the current history.
- PRs must include a concise summary, test evidence, related issues, and visuals for UI changes.
- Keep submissions scoped to one feature or fix and call out any follow-up work separately.

## Security & Configuration Tips
- Keep `.env` values (e.g., `PORT`, `ALLOWED_ORIGINS`, rate limits) out of version control and document expectations when changes need them.
- Route multiplayer payload validation through `server/src/MessageHandler.js` helpers to maintain consistent sanitization.
