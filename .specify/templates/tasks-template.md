# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```text
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **This repo**: client under `js/` (ES modules), server under `server/` (CommonJS)
- **Client**: `js/core/`, `js/entities/`, `js/world/`, `js/ui/`, `js/utils/`, `js/multiplayer/`
- **Server**: `server/src/` and tests in `server/tests/`
- **Assets**: `textures/`, `models/`, `static/`
- Adjust paths based on plan.md details when feature-specific structure deviates

## Phase 3.1: Setup

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation

- [ ] T004 [P] Server: connection/disconnect flow in `server/tests/server.test.js`
- [ ] T005 [P] Server: room join/leave and broadcast behavior in `server/tests/room.test.js`
- [ ] T006 [P] Server: rate-limit outcomes in `server/tests/server.test.js`
- [ ] T007 [P] Server: message validation (MessageHandler) in `server/tests/server.test.js`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T008 [P] Server: implement missing validations in `server/src/MessageHandler.js`
- [ ] T009 [P] Server: enforce limits in `server/src/RateLimiter.js`
- [ ] T010 [P] Server: enhance `server/src/Room.js` for stable membership lifecycle
- [ ] T011 Server: structured logging and error handling in `server/src/server.js`
- [ ] T012 Client: integrate multiplayer events in `js/multiplayer/manager.js`
- [ ] T013 Client: HUD connection/status indicators in `js/ui/multiplayerUI.js`
- [ ] T014 Client: performance profiling toggle in `js/ui/hud.js`

## Phase 3.4: Integration

- [ ] T015 Server: CORS and allowed origins from `.env` in `server/src/server.js`
- [ ] T016 Server: load testing script (`npm run test:load`) covers join/leave and broadcast
- [ ] T017 Client: minimap shows remote players; markers update in `js/ui/minimap.js`
- [ ] T018 Client: ensure assets budgets documented and respected in PR

## Phase 3.5: Polish

- [ ] T019 [P] Server: unit tests for edge cases in `server/tests/server.test.js`
- [ ] T020 Client: ensure 60 fps target met in typical scene; document findings
- [ ] T021 [P] Update `MULTIPLAYER.md` protocol notes and compatibility matrix
- [ ] T022 Remove duplication; factor shared code under `js/utils/`
- [ ] T023 Manual client checks (browser, room flow, map size) noted in PR

## Dependencies

- Tests (T004-T007) before implementation (T008-T014)
- T008 blocks T009, T015
- T016 blocks T018
- Implementation before polish (T019-T023)

## Parallel Example

```text
# Launch T004-T007 together:
Task: "Server connection/disconnect flow in server/tests/server.test.js"
Task: "Room join/leave + broadcast in server/tests/room.test.js"
Task: "Rate-limit outcomes in server/tests/server.test.js"
Task: "Message validation in server/tests/server.test.js"

```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules

Applied during main() execution

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task

2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks

3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist

GATE: Checked by main() before returning

- [ ] All server message types covered by tests
- [ ] Rate limiting scenarios included
- [ ] Tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
