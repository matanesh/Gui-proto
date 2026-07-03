#!/bin/bash
cd /mnt/c/Users/matan/project/my_apps/GUI

for i in $(seq 1 12); do
  claude -c -p "Read PROGRESS.md and CLAUDE.md. Continue the handoff package execution from the next incomplete step. Update PROGRESS.md and commit after each step. If all steps are complete, write DONE at the top of PROGRESS.md and stop." \
    --permission-mode acceptEdits
  grep -q "^DONE" PROGRESS.md && break
  sleep 7200   # 2 hours
done
