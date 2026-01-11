# Phase 0 Research: Maze Escape

Date: 2025-09-21
Branch: 001-we-re-building
Spec: /Users/ibrahimsaidi/Desktop/Builds/openai-agents-builds/codex-cli-builds/maze-escape/specs/001-we-re-building/spec.md

## Decisions and Resolutions (resolve NEEDS CLARIFICATION)

- FR-002 (Room discovery): Private rooms by code or direct link only. No public discovery/browse in MVP.
  - Rationale: Simpler UX and reduced abuse surface.
  - Alternatives: Server browser; deferred due to moderation complexity.

- FR-003 (Lobby start): Host-started matches. Optional per-player Ready indicator is non-blocking in MVP.
  - Rationale: Predictable start, minimal UI.
  - Alternatives: Strict ready-check; deferred to Phase 2+.

- FR-004 (Maze): 10x10 grid, CELL_SIZE=100, deterministic seed per room from `roomId`.
  - Decision: Seed = stable hash of `roomId` (client-side) so all clients derive identical mazes without server change.
  - Alternatives: Server-authoritative seed broadcast; acceptable but not required for MVP.

- FR-005 (Controls): Desktop pointer-lock FPS. WASD to move, mouse to look, click to shoot. Default sensitivity tuned for Three.js PointerLockControls; expose a single sensitivity slider later.

- FR-006 (Targets & scoring): Score +1 per target hit. Enemy hits play feedback but do not change score in MVP.
  - Alternatives: Combo multipliers, enemy score; can be layered later.

- FR-007 (Win/Lose): Win = reach exit cylinder within `EXIT_RADIUS`. Lose = health reaches 0 → show lose message; restart available.

- FR-008 (Capacity): Max 10 players per room (default from server config). Excess joiners receive "Room is full".

- FR-009 (Reconnect): MVP treats reconnect as a new session (no preservation). Future: 30s grace window keyed by `playerId` token.
  - Rationale: Current server lacks session tokens; avoids complexity now.

- FR-010 (HUD): Crosshair (CSS), Score, Health bar, basic connection status. No ammo system in MVP.

- FR-011 (Audio): Background loop, footsteps, heavy footsteps, shoot. Provide a single master volume toggle in UI for MVP.

- FR-012 (Anti-grief/anti-cheat): Server authority, schema validation in `MessageHandler`, per-IP and per-player rate limiting, drop unknown types/fields, size limit 1KB per message.

- FR-015 (Accessibility): Clear on-screen instructions for pointer lock; maintain basic color contrast; keep HUD text readable; motion sensitivity limited by sensitivity slider (later).

## Non-Functional Targets (from Constitution)

- Client: Aim for ≥60 FPS; degrade gracefully via renderer pixel ratio adjustments.
- Networking: Position update cadence target ≤20 Hz; p95 E2E ≤300 ms WAN.
- Startup: Maze generation + scene init in ≤2 s.
- Security: Origins configured via `.env`; sanitize all inbound payloads; never log secrets.

## Best Practices and Patterns

- Three.js: Prefer texture reuse and instanced meshes for scale; keep materials count low. Use `SRGBColorSpace` and avoid unnecessary `needsUpdate` churn.
- WebSockets: Quantize/omit unchanged fields; keep payloads small; drop invalid frames early.
- Game loop: Avoid GC pressure; reuse vectors; use `clock.getDelta()` for movement.

## Alternatives Considered

- Server-seeded maze vs. client-derived seed: Chose client-derived from `roomId` for zero server changes; can migrate to server broadcast later without breaking rooms (derive same seed).
- Strict ready-check vs. host-start: Chose host-start to minimize lobby complexity; ready-check can be added without breaking flows.

## Open Risks

- Reconnect semantics are minimal in MVP; players rejoin as new sessions.
- Maze determinism relies on a stable hash function; must standardize implementation across clients.

---
All NEEDS CLARIFICATION markers resolved for MVP scope above.


