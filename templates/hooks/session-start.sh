#!/usr/bin/env bash
# templates/hooks/session-start.sh
#
# FOUNDATION §6, made real. Drop this at .claude/hooks/session-start.sh and
# register it as a SessionStart hook in .claude/settings.json:
#
#   { "hooks": { "SessionStart": [ { "hooks": [
#       { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh" }
#   ] } ] } }
#
# It does two jobs, in order:
#   1. Confirms you are not about to work from a stale base. Designing on
#      phantom code is the most expensive class of error there is, and reading
#      local files does NOT tell you what the remote looks like.
#   2. Verifies that your regression-registry markers still exist, so a fix
#      that took five tries to land cannot be silently refactored away.
#
# Output is surfaced to the assistant before it touches any files.

set -e
cd "$CLAUDE_PROJECT_DIR" || exit 0

# ─── 1. Stale-base check ───────────────────────────────────────────────────
# Fetch is quiet on success; only network errors print.
git fetch origin --quiet 2>&1 || {
  echo "session-start: git fetch failed, working offline. Your view of origin may be stale."
  exit 0
}

current_branch=$(git rev-parse --abbrev-ref HEAD)
local_sha=$(git rev-parse HEAD)
remote_sha=$(git rev-parse --verify "origin/$current_branch" 2>/dev/null || echo "")

echo "session-start: branch=$current_branch  local=$(git rev-parse --short HEAD)  remote=$(git rev-parse --short origin/main 2>/dev/null || echo unknown)"

if [ -z "$remote_sha" ]; then
  echo "session-start: no remote tracking branch for $current_branch (local-only)."
elif [ "$local_sha" != "$remote_sha" ]; then
  behind=$(git rev-list --count "HEAD..origin/$current_branch" 2>/dev/null || echo "?")
  ahead=$(git rev-list --count "origin/$current_branch..HEAD" 2>/dev/null || echo "?")
  echo "session-start: HEAD differs from origin/$current_branch, behind $behind and ahead $ahead. Run 'git pull' before editing if you intend to ship from this branch."
fi

# Always check the default branch for drift, even from a feature branch, so a
# new branch is not cut from a stale main.
if [ "$current_branch" != "main" ]; then
  main_behind=$(git rev-list --count main..origin/main 2>/dev/null || echo "0")
  if [ "$main_behind" -gt 0 ] 2>/dev/null; then
    echo "session-start: local main is $main_behind commit(s) behind origin/main. If cutting a new branch, run 'git checkout main && git pull' first."
  fi
fi

# ─── 2. Regression registry verification ───────────────────────────────────
# The registry itself is per-repo and does not transfer between sites. This
# pattern does. For every entry in your CLAUDE.md registry table, add one
# check here that greps for the marker and warns loudly when it is gone.
#
# Rules that make these checks worth having:
#   - Grep for a specific, stable string, not a whole construct.
#   - Assert a COUNT where the count is the point (exactly 1, at least 2).
#     "Present or absent" misses the case where a refactor duplicates a rule.
#   - Check the built output, not just source, when the bug was in the output.
#   - Keep the warning pointed at the registry entry that explains the why.

regression_warn() {
  echo "session-start: !! REGRESSION REGISTRY: $1"
  echo "                 See CLAUDE.md -> 'Regression registry' before changing."
}

# --- Worked example. Delete this and write your own. ---
# Entry #1: the canonical container class lives in one stylesheet. It was
# duplicated across four page files once; a "DRY this up" refactor puts it back.
# if [ "$(grep -rlE '^\.shell\s*\{' src/ 2>/dev/null | wc -l | tr -d ' ')" != "1" ]; then
#   regression_warn ".shell is defined in more than one file again (fix #1)."
# fi

exit 0
