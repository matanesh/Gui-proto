# PROGRESS — Ops Command Center

**NEXT STEP: 15c — Run Details screen (flagship)**

Rules: after each completed step, mark it `[x]`, add a note (what was done, files changed), update NEXT STEP above, and `git commit`. Never redo completed steps. When step 17 passes, write `DONE` on the first line of this file.

## Checklist

### Step 0 — Bootstrap
- [x] 0. git init, .gitignore, GOAL.md, PROGRESS.md, fix CLAUDE.md reference, initial commit
  - Note: repo initialized on branch `main`; CLAUDE.md now points to the real handoff files.

### Phase 1 — Documentation
- [x] 1. docs/HLD.md — full HLD with Mermaid diagrams (architecture, command flow, event flow, run lifecycle)
- [x] 2. docs/ADR.md — ADR-001…ADR-010, full Context/Decision/Alternatives/Rationale/Tradeoffs/Consequences/Revisit structure
- [x] 3. docs/API_CONTRACT.md — all 7 endpoints, examples, error/pagination/idempotency models, status code guidance
- [x] 4. docs/EVENT_SCHEMA.md — RunEvent envelope, 11 types, 5 severities, ordering/dedup/replay/reconnect/gap/flood handling, JSON examples
- [x] 5. docs/GUI_SPEC.md — UX principles, IA, 6 screens, component inventory, states, responsive/a11y, mock data rules
- [x] 6. docs/FAILURE_MODES.md — all 12 failure scenarios with UI behavior
- [x] 7. docs/CODE_REVIEW_CHECKLIST.md — 7 review sections as checkable assertions

### Phase 2 — Frontend prototype
- [x] 8. Scaffold Vite + React + TS at root — manual scaffold (package.json, vite.config.ts, tsconfigs, index.html, src/main.tsx), npm install OK, build OK. Note: themed index.css landed here too.
- [x] 9. Tailwind v4 via @tailwindcss/vite + dark mission-control theme tokens; hand-written shadcn-style primitives in src/components/ui (button, card, badge, tabs, table, input, select, switch, label, progress, skeleton, separator, tooltip, dialog, sonner); cn + format utils in src/lib/utils.ts
- [x] 10. Router + app shell — createBrowserRouter with 6 routes, AppShell/Sidebar/TopHeader/PageHeader, page stubs per feature. Note: Zustand uiStore.ts created here (sidebar state needed it) — step 13 covers Query wiring only.
- [x] 11. Typed models — src/models/{run,command,event,health,sse,index}.ts, strict unions + envelopes per docs
- [x] 12. Mock service layer — apiClient (latency+failure sim, ApiError), mockData (6 commands, seeded 42-run history, in-memory run store, idempotency ledger, health fixtures), commandsApi, runsApi (202+runId, filters, snapshot, cancel), healthApi
- [x] 13. TanStack Query hooks — useCommands, useRunsList/useRun/useSubmitCommand/useCancelRun (with invalidation), useHealth (+timeline, refresh interval from uiStore). Provider landed in step 10; uiStore in step 10.
- [x] 14. Mock SSE — eventStreamClient (EventSource-like handle, heartbeats, sequenced lifecycle driver, cooperative cancel, simulated reconnect + Last-Event-ID-style replay, terminal-run condensed replay), useSseConnection (lifecycle/cleanup), useRunEvents (dedup, ordering, gap detection, bounded rendering, diagnostics)
- [x] 15a. Dashboard — hero status strip, 6 metric cards, system status (4 components), recent runs table, live activity feed, CTA; shared components created (StatusBadge, RiskBadge, ConnectionPill, MetricCard, HealthIndicator, Empty/ErrorState, RunsTable)
- [x] 15b. Command Launcher — catalog grouped by category, selectable cards, details panel (risk, est. duration), DynamicCommandForm (text/number/select/boolean, validation, a11y), 202 submit → toast → navigate to Run Details
- [ ] 15c. Screen: Run Details (/runs/:runId) — flagship
- [ ] 15d. Screen: Runs History (/runs)
- [ ] 15e. Screen: Configuration (/config)
- [ ] 15f. Screen: System Health (/health)
- [ ] 16. README.md at root
- [ ] 17. Verify: npm run build + tsc --noEmit clean, dev server smoke test, fix issues, final commit, write DONE
