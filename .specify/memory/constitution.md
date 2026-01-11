<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles: N/A (initial ratification)
- Added sections:
  • Core Principles (5)
  • Non-Functional Requirements
  • Development Workflow & Quality Gates
  • Governance
- Removed sections: None
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (Constitution Check gates + version ref)
  ✅ .specify/templates/spec-template.md (add Non-Functional Requirements section)
  ✅ .specify/templates/tasks-template.md (paths + constitution-driven categories)
- Follow-up TODOs:
  • TODO(RATIFICATION_DATE): Original adoption date unknown; provide exact date for record
-->

# Maze Escape Constitution

## Core Principles

### I. Domain-Driven Modular Architecture (NON-NEGOTIABLE)

- Client code MUST be organized under `js/` by domain: `core/`, `entities/`, `world/`,
  `ui/`, `utils/`, and `multiplayer/`. New features MUST live in the matching domain folder.
- Client MUST use ES modules; server MUST use CommonJS modules.
- UI strings and DOM selectors MUST be centralized in `js/ui/` helpers to avoid duplication.
- Shared logic MUST be factored into importable modules; no copy‑paste across files.
- Assets MUST live under `textures/`, `models/`, and `static/` with descriptive names.

Rationale: Keeps the codebase scalable, discoverable, and consistent with repository rules.

### II. Real‑Time Multiplayer Safety & Integrity

- The server is the authority for room state; clients are untrusted and MUST NOT authoritatively
  change score, health, or hits. Client events are treated as intents.
- All inbound payloads MUST be validated and sanitized via
  `server/src/MessageHandler.js` helpers. Deny by default.
- Rate limiting MUST be enforced using `server/src/RateLimiter.js` with sensible per‑IP and
  per‑room ceilings; violations MUST be logged and disconnected when abusive.
- Unknown message types MUST be dropped; unknown fields MUST be ignored. Malformed frames MUST
  not crash the server.
- Disconnects MUST promptly clear server state (players, room membership, transient effects).

Rationale: Protects fairness, uptime, and ensures exploit resistance.

### III. Performance & Responsiveness Targets

- Client render loop MUST aim for ≥60 FPS on reference hardware; degrade gracefully on weaker
  devices (reduced resolution/effects without gameplay degradation).
- Single‑player input‑to‑visual response SHOULD be <100 ms; instrumentation via a lightweight
  FPS indicator or HUD toggle in `js/ui/hud.js` is REQUIRED for profiling.
- Multiplayer median end‑to‑end position update latency SHOULD be ≤150 ms on LAN and ≤300 ms p95
  on typical WAN. Use interpolation and snapshot techniques to conceal jitter.
- Maze generation plus scene initialization SHOULD complete in ≤2 s in default settings.
- Audio and texture loads SHOULD be streamed or prewarmed to avoid visible stalls.

Rationale: FPS games demand low latency; explicit budgets guide design decisions and trade‑offs.

### IV. Observability, Testing, and CI Gates

- Backend MUST include Jest tests under `server/tests/` covering happy paths, disconnects, and
  rate‑limit outcomes. Run `npm test` before every PR.
- Networking or performance‑sensitive changes MUST also run `npm run test:load` with results
  attached in the PR description.
- Client changes that affect gameplay MUST include manual validation notes (browser used, room
  flow, map size) per repository guidelines.
- Logging MUST be structured and rate‑limited; logs MUST never dump secrets or PII.
- PRs MUST follow commit style, pass lint/tests, and document any constitution deviations with
  justification and a plan to return to compliance.

Rationale: Visibility and discipline keep multiplayer experiences reliable at scale.

### V. Protocol & Asset Versioning

- Multiplayer message schemas and client/server contracts MUST follow semantic versioning:
  MAJOR for breaking changes, MINOR for additive fields/behaviors, PATCH for clarifications.
- Breaking protocol changes REQUIRE a dual‑compat window (server supports vN and vN+1) or a
  clear migration plan documented in `MULTIPLAYER.md`.
- Protocol changes MUST be recorded in `MULTIPLAYER.md` with a visible "Protocol Version" and
  a compatibility matrix.
- Large assets (textures/models) MUST meet size/polygon budgets and be optimized before commit.

Rationale: Predictable evolution minimizes player disruption and simplifies rollouts.

## Non‑Functional Requirements

- Security: Configure allowed origins, CORS, and secrets via `.env` (never committed). All
  multiplayer payload validation MUST route through `server/src/MessageHandler.js`.
- Networking: Default update rate SHOULD be modest (e.g., ≤20 Hz); compress or quantize floats
  where safe; avoid broadcasting unchanged state.
- Browser Support: Target evergreen browsers; Pointer Lock MUST be the default control scheme.
- Accessibility & UX: Provide clear status feedback (health, ammo/score, connection state);
  color choices should maintain basic contrast.
- Privacy: No collection of personal data; generated player names SHOULD be non‑identifying by
  default.
- Build & Run: Frontend served via `python -m http.server 8000` or `npx http-server`; server
  via `npm run dev` during development and `npm start` for production.

## Development Workflow & Quality Gates

- Architecture & Style: Follow domain structure under `js/`; client uses ES modules; server uses
  CommonJS. Four‑space indentation and trailing comma pattern.
- Testing: Add/maintain Jest specs in `server/tests/` with `*.test.js` pattern using
  `describe/test` blocks. Cover happy paths, disconnects, and rate limits. Run `npm test` before
  every PR; run `npm run test:load` when touching networking/performance.
- Reviews: PRs must include summary, test evidence, visuals for UI changes, and call out manual
  client checks. Keep PR scope focused; follow commit message conventions.
- Assets: Store under `textures/`, `models/`, `static/`; document any new budgets/constraints in
  PRs when applicable.

## Governance

- Supremacy: This Constitution supersedes conflicting practices. Deviations MUST be explicitly
  justified in PRs and resolved promptly.
- Amendment Procedure: Open a PR describing the change, rationale, version bump type (MAJOR/
  MINOR/PATCH), migration plan (if applicable), and affected templates/docs. Upon maintainers'
  approval, update this file and propagate references.
- Versioning Policy: Constitution uses semantic versioning. MAJOR for incompatible governance
  changes, MINOR for new principles/sections, PATCH for clarifications.
- Compliance Reviews: Every feature plan MUST include a "Constitution Check" gate referencing
  these principles. Reviewers MUST block PRs that fail the gate or lack justification.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown — provide
exact date upon project approval | **Last Amended**: 2025-09-21
