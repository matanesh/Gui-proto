#!/usr/bin/env bash

PROJECT_DIR="/mnt/c/Users/matan/project/my_apps/GUI"
RETRY_SECONDS=$((4 * 60 * 60))

# Claude is installed through NVM, whose selected Node version is not added to
# PATH automatically when this script runs as a background service.
export NVM_DIR="$HOME/.nvm"
CLAUDE_BIN="$(find "$NVM_DIR/versions/node" -path '*/bin/claude' -type l -print 2>/dev/null | sort -V | tail -n 1)"

if [[ -z "$CLAUDE_BIN" || ! -x "$CLAUDE_BIN" ]]; then
  echo "Claude Code was not found under $NVM_DIR/versions/node." >&2
  exit 1
fi

cd "$PROJECT_DIR" || exit 1

# Do not start a second agent while an interactive Claude Code session is
# already working in this WSL instance.
if [[ "${ALLOW_EXISTING_CLAUDE:-0}" != "1" ]] && \
   pgrep -u "$USER" -f '/claude-code/bin/claude(\.exe)?( |$)' >/dev/null; then
  echo "$(date --iso-8601=seconds) — waiting for the active Claude Code session to finish"
  while pgrep -u "$USER" -f '/claude-code/bin/claude(\.exe)?( |$)' >/dev/null; do
    sleep 60
  done
fi

for i in $(seq 1 12); do
  "$CLAUDE_BIN" -c -p "Read PROGRESS.md and CLAUDE.md. Continue the handoff package execution from the next incomplete step. Update PROGRESS.md and commit after each step. If all steps are complete, write DONE at the top of PROGRESS.md and stop." \
    --permission-mode acceptEdits
  grep -q "^DONE" PROGRESS.md && break
  echo "$(date --iso-8601=seconds) — waiting 4 hours before retrying"
  sleep "$RETRY_SECONDS"
done
