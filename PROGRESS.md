# PROGRESS — Ops Command Center

**NEXT STEP: 3 — docs/API_CONTRACT.md**

Rules: after each completed step, mark it `[x]`, add a note (what was done, files changed), update NEXT STEP above, and `git commit`. Never redo completed steps. When step 17 passes, write `DONE` on the first line of this file.

## Checklist

### Step 0 — Bootstrap
- [x] 0. git init, .gitignore, GOAL.md, PROGRESS.md, fix CLAUDE.md reference, initial commit
  - Note: repo initialized on branch `main`; CLAUDE.md now points to the real handoff files.

### Phase 1 — Documentation
- [x] 1. docs/HLD.md — full HLD with Mermaid diagrams (architecture, command flow, event flow, run lifecycle)
- [x] 2. docs/ADR.md — ADR-001…ADR-010, full Context/Decision/Alternatives/Rationale/Tradeoffs/Consequences/Revisit structure
- [ ] 3. docs/API_CONTRACT.md
- [ ] 4. docs/EVENT_SCHEMA.md
- [ ] 5. docs/GUI_SPEC.md
- [ ] 6. docs/FAILURE_MODES.md
- [ ] 7. docs/CODE_REVIEW_CHECKLIST.md

### Phase 2 — Frontend prototype
- [ ] 8. Scaffold Vite + React + TS at repo root (manual scaffold, npm install)
- [ ] 9. Tailwind CSS v4 (@tailwindcss/vite) + shadcn/ui components + dark enterprise theme
- [ ] 10. React Router + app shell (sidebar, header, layout) + folder structure
- [ ] 11. Typed models in src/models/
- [ ] 12. Mock service layer in src/services/ (apiClient, commandsApi, runsApi, healthApi, mockData)
- [ ] 13. TanStack Query provider + hooks; Zustand uiStore
- [ ] 14. Mock SSE (eventStreamClient.ts, useRunEvents, useSseConnection)
- [ ] 15a. Screen: Dashboard (/)
- [ ] 15b. Screen: Command Launcher (/commands)
- [ ] 15c. Screen: Run Details (/runs/:runId) — flagship
- [ ] 15d. Screen: Runs History (/runs)
- [ ] 15e. Screen: Configuration (/config)
- [ ] 15f. Screen: System Health (/health)
- [ ] 16. README.md at root
- [ ] 17. Verify: npm run build + tsc --noEmit clean, dev server smoke test, fix issues, final commit, write DONE
