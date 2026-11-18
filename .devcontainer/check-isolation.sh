#!/usr/bin/env bash
# Warns about host credentials code in this container could use.
# Never blocks startup.
set -uo pipefail

warn=0
say() { printf '\033[33m[isolation] %s\033[0m\n' "$1" >&2; warn=1; }

if [ -n "${SSH_AUTH_SOCK:-}" ] && [ -S "${SSH_AUTH_SOCK}" ]; then
  say "Host SSH agent is reachable via SSH_AUTH_SOCK."
fi
if compgen -G "/tmp/vscode-ssh-auth-*.sock" >/dev/null; then
  say "A forwarded SSH agent socket exists in /tmp (hidden from env, still usable)."
fi
if [ -n "$(git config --get credential.helper 2>/dev/null)" ]; then
  say "A git credential helper is active: git can use your host credentials."
fi
if grep -qs "git-credential-helper" "$HOME/.gitconfig"; then
  say "VS Code wrote its host credential helper into ~/.gitconfig (disabled via env, still callable)."
fi

if [ "$warn" -eq 1 ]; then
  echo "[isolation] Close these with the VS Code user settings in README.md (Security model > Dev container)." >&2
else
  echo "[isolation] No host credentials reachable from this container."
fi
exit 0
