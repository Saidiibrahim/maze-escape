# Quickstart: Maze Escape (Phase 1)

## Frontend (Game)
1. From repo root, serve with a simple HTTP server:
   - Python: `python -m http.server 8000`
   - Or: `npx http-server`
2. Open `http://localhost:8000/index.html` in a modern desktop browser.
3. Click "Play Now" and lock pointer. Use WASD + Mouse; click to shoot.
4. Press `M` to open Multiplayer panel if you want to connect to a server.

## Backend (WebSocket Server)
1. `cd server && npm install`
2. Optionally create `.env` with overrides (PORT, ALLOWED_ORIGINS, limits).
3. Development: `npm run dev` (nodemon) | Production: `npm start`
4. Default URL: `ws://localhost:8080`

## Multiplayer Flow
- Open multiplayer panel (`M`), enter server URL, Room ID, and Player Name.
- Click Connect → you should see player count change and remote players render.

## Controls
- Move: W/A/S/D
- Look: Mouse (Pointer Lock)
- Shoot: Left Click
- Pause/Unlock: Esc

## Win/Lose
- Win by reaching the green exit cylinder.
- Lose when health reaches 0 (message shown; click to restart).

## Troubleshooting
- Pointer lock denied → click the canvas/body area and try again.
- Room full → choose a different Room ID.
- Connection refused → confirm server is running and CORS origins are allowed.
- Performance dips → reduce browser zoom or close heavy tabs.
