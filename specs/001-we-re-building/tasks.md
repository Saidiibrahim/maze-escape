# Tasks: Maze Escape

**Input**: Design documents from `/Users/ibrahimsaidi/Desktop/Builds/openai-agents-builds/codex-cli-builds/maze-escape/specs/001-we-re-building/`
**Prerequisites**: `plan.md` (required), and if present: `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no shared edits/dependencies)
- Include exact file paths

## Phase 3.1: Setup
- [X] T001 Verify local dev setup and serve client
  - Paths: `index.html`, `js/main.js`
  - Commands:
    - `python -m http.server 8000`
    - Open `http://localhost:8000/index.html` and verify pointer lock works
- [X] T002 Backend deps and dev scripts ready
  - Path: `server/package.json`
  - Commands:
    - `cd server && npm install`
    - `npm run dev` (hot reload) | `npm start` (prod)
    - `npm test` (Jest)
- [X] T003 [P] Add load testing scaffold
  - Create `server/tests/load-test.yml` covering join/leave, position broadcast at 10 Hz
  - Wire to `npm run test:load`
- [X] T004 [P] Provide `.env.example` and config notes
  - Paths: `server/README.md`, `server/.env.example`
  - Document `PORT`, `ALLOWED_ORIGINS`, rate limits, room limits

## Phase 3.2: Tests First (TDD) — MUST FAIL BEFORE 3.3
Contract tests from `contracts/messages.md`
- [X] T005 [P] Contract tests for messages
  - File: `server/tests/contracts/messages.contract.test.js`
  - Asserts: `join_room`, `leave_room`, `player_position`, `player_shot`, `ping` match schemas; errors for invalid inputs; size limit.

Integration tests from quickstart scenarios
- [X] T006 [P] Integration: two players see each other
  - File: `server/tests/integration/players-appear.test.js`
  - Asserts: `player_joined` seen by existing player on second join
- [X] T007 [P] Integration: multi-room isolation
  - File: `server/tests/integration/multiroom.test.js`
  - Asserts: broadcasts do not cross rooms (position/shot)
- [X] T008 [P] Integration: room full path
  - File: `server/tests/integration/room-full.test.js`
  - Asserts: N+1 join rejected when `maxPlayersPerRoom` reached
- [X] T009 [P] Integration: rate limiting outcomes
  - File: `server/tests/integration/rate-limit.test.js`
  - Asserts: error on exceeding window; temp ban after repeated violations
- [X] T010 [P] Negative: oversize payload rejected (>1KB)
  - File: `server/tests/integration/max-payload.test.js`
  - Asserts: server closes with code 1009, sends error where applicable

## Phase 3.3: Models → Services → Endpoints (Implementation)
Models from `data-model.md`
- [X] T011 [P] Player model conformance tests
  - File: `server/tests/unit/player.test.js`
  - Assert public shape `{ playerId, playerName, position, rotation }`
- [X] T012 [P] Room model conformance tests
  - File: `server/tests/unit/room.test.js`
  - Assert capacity logic, `getState()`, `broadcast()` success count
- [X] T013 [P] Add `Match` model stub
  - File: `server/src/Match.js`
  - Fields: `roomId, status, startTime?, endTime?, results?`
- [X] T014 [P] Seeded RNG utility for maze determinism
  - File: `js/utils/seed.js`
  - Export stable hash(string) → seed; PRNG with `seed` (e.g., mulberry32)
- [X] T015 Maze generation uses seeded RNG by `roomId`
  - Files: `js/world/maze.js`, call sites in `js/main.js`
  - Derive seed from `roomId`; all clients build identical mazes
- [X] T016 [P] Score/Progress manager (client)
  - File: `js/core/score.js`
  - API: `increment(playerId)`, `getScore(playerId)`, `reset()`

Endpoint implementations (one per message type; same file ⇒ sequential)
- [ ] T017 Ensure `join_room` validations and responses match contract
  - Files: `server/src/MessageHandler.js`, `server/src/Room.js`
  - Details: sanitize/validate inputs; `assign_id`, then `game_state`, then `player_joined`
- [ ] T018 Ensure `leave_room` flow
  - File: `server/src/MessageHandler.js`
  - Details: broadcast `player_left`, cleanup empty room per config idle timeout
- [ ] T019 Ensure `player_position` validation/anti-cheat
  - File: `server/src/MessageHandler.js`
  - Details: finite numbers only, anti-cheat speed check, broadcast with timestamp
- [ ] T020 Ensure `player_shot` validation
  - File: `server/src/MessageHandler.js`
  - Details: finite vectors, include timestamp in broadcast
- [ ] T021 Ensure `ping` heartbeat semantics
  - File: `server/src/MessageHandler.js`
  - Details: `heartbeat()` and `pong`

Client integration
- [ ] T022 HUD connection/status and errors
  - File: `js/ui/multiplayerUI.js`
  - Show connected/disconnected/server URL/roomId; error toasts
- [ ] T023 [P] Remote shot visual feedback
  - Files: `js/multiplayer/manager.js`, optionally `js/entities/`
  - Add simple tracer or muzzle flash for `onPlayerShot`
- [ ] T024 [P] Minimap updates with remote players
  - File: `js/ui/minimap.js`
  - Add/remove/update markers from multiplayer callbacks

## Phase 3.4: Integration & Ops
- [ ] T025 Server origins and connection policy
  - Files: `server/src/GameServer.js`, `server/src/config.js`
  - Verify `ALLOWED_ORIGINS` enforced; add tests covering allowed/blocked origins
- [ ] T026 Load test scenario ready
  - File: `server/tests/load-test.yml`
  - Ramps: connect, join, position 10 Hz, 1–10 players/room; assert p95 broadcast latency budget

## Phase 3.5: Polish
- [ ] T027 [P] Unit tests for MessageHandler edge cases
  - Files: `server/tests/unit/message-handler.test.js`
  - Unknown types dropped; extra fields ignored; JSON parse errors
- [ ] T028 Client performance validation (≈60 FPS typical scene)
  - Files: `js/ui/hud.js` (profiling toggle), PR notes with findings
- [ ] T029 [P] Update protocol notes
  - File: `MULTIPLAYER.md`
  - Record version 1.0.0 message set and any additive changes
- [ ] T030 Manual client checks recorded in PR
  - Items: browser, room flow, map size, multiplayer markers, VFX

## Dependencies
- Setup (T001–T004) before Tests (T005–T010)
- Tests (T005–T010) must fail before Implementation (T011–T024)
- Models (T011–T016) before Endpoints (T017–T021)
- Endpoints (T017–T021) before Client integration (T022–T024)
- Integration/Ops (T025–T026) before Polish (T027–T030)
- File-level constraints:
  - T017–T021 touch `server/src/MessageHandler.js` ⇒ run sequential (no [P])
  - T014 precedes T015 (seed util before maze determinism)

## Parallel Execution Guidance
Tasks in different files can run concurrently. Example batches:

```text
# Batch A (contracts & integration):
run: create server/tests/contracts/messages.contract.test.js
run: create server/tests/integration/players-appear.test.js
run: create server/tests/integration/multiroom.test.js
run: create server/tests/integration/room-full.test.js
run: create server/tests/integration/rate-limit.test.js
run: create server/tests/integration/max-payload.test.js

# Batch B (client models):
run: add js/utils/seed.js
run: add js/core/score.js

# Sequential (shared file):
run: update server/src/MessageHandler.js for join_room → leave_room → player_position → player_shot → ping
```

## Useful Commands
- Start backend (dev): `cd server && npm run dev`
- Run backend tests: `cd server && npm test`
- Run load test: `cd server && npm run test:load`
- Serve frontend: `python -m http.server 8000` then open `http://localhost:8000/index.html`

---
Context: generated from available design artifacts and repository structure. All paths are absolute or repo-root relative.
