#!/usr/bin/env bash
# Security sweep for the project, in one command.
#
# Why it exists: a code review found seven problems, and human reading does not run again on its own. The
# tools live in the project instead of staying as a suggestion in the README: each one covers a different
# class, and the script turns "remember to run it" into a command with an exit code.
#
#   pnpm audit      dependency with a known vulnerability
#   gitleaks        secret in the code, in the configuration and in the git history
#   semgrep         insecure code pattern in TypeScript, by community rule
#   osv-scanner     dependency against the OSV database, by lockfile
#
# A missing tool is a failure, not a warning: a silent warning is how a project ships without any sweep at
# all. The message prints the exact install command.
set -euo pipefail

cd "$(dirname "$0")/.."

FAILED=0

require_tool() {
  local binary="$1" install_command="$2"
  if ! command -v "$binary" >/dev/null 2>&1; then
    echo "FAIL  $binary is not installed. Install with: $install_command"
    FAILED=1
  fi
}

run_check() {
  local name="$1"
  shift
  if "$@" >/tmp/security-"$name".log 2>&1; then
    echo "ok     $name"
  else
    echo "FAIL  $name (output in /tmp/security-$name.log)"
    tail -20 /tmp/security-"$name".log | sed 's/^/       /'
    FAILED=1
  fi
}

require_tool gitleaks "brew install gitleaks"
require_tool semgrep "brew install semgrep"
require_tool osv-scanner "brew install osv-scanner"
if [ "$FAILED" -ne 0 ]; then
  echo
  echo "incomplete sweep: install what is missing before publishing"
  exit 1
fi

# Published dependencies with a known vulnerability. The threshold is low on purpose: the project has few
# dependencies, so even a low severity finding is worth a look.
run_check "audit" pnpm audit --audit-level=low

# Secret anywhere in the repository, history included: a key published in an old commit stays published
# after it is removed from the file.
run_check "gitleaks" gitleaks git --no-banner --redact --exit-code 1

# Insecure code pattern in TypeScript. The two rule sets cover common language mistakes and a security
# review; `--error` makes any finding fail the command.
run_check "semgrep" semgrep --quiet --error --config p/typescript --config p/security-audit --exclude node_modules --exclude .next .

# Dependency against the OSV database, by lockfile, which is what the install actually uses.
run_check "osv" osv-scanner --lockfile pnpm-lock.yaml

echo
if [ "$FAILED" -ne 0 ]; then
  echo "sweep failed"
  exit 1
fi
echo "sweep clean: four fronts, no finding"
