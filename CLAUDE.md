# Project rules
- Read gui_fable_context_bundle/prompt_for_later_claude_code.md and gui_fable_context_bundle/HLD_CONTEXT_BUNDLE.md (the handoff package) plus GOAL.md before any work.
- Keep everything sanitized: no real names, endpoints, secrets, business logic.
- CHECKPOINTING: maintain PROGRESS.md at the repo root. After completing each
  step in the execution order, update PROGRESS.md with: what was done, what
  file(s) were created/changed, and the exact next step.
- Commit to git after every completed step with a clear message.
- On session start: read PROGRESS.md and continue from the next step. Never redo
  completed steps.
