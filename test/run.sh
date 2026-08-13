#!/usr/bin/env bash
# Instala o k6 localmente (se necessário) e roda o(s) teste(s) de concorrência.
#
# Uso:
#   test/run.sh                          # roda o teste principal (100 operadores, 1 vaga)
#   test/run.sh all                      # roda as 4 variações, em sequência
#   test/run.sh k6/accept-proposal-race-ordered.test.js   # roda um teste específico
#
# Env vars aceitas (repassadas pro k6): BASE_URL, JOB_ID

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/.bin"
K6_VERSION="${K6_VERSION:-0.54.0}"

install_k6() {
  echo "k6 não encontrado — instalando localmente em $BIN_DIR (não precisa de sudo)..."
  mkdir -p "$BIN_DIR"

  local os arch platform archive_ext
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$arch" in
    x86_64) arch="amd64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) echo "Arquitetura não suportada: $arch" >&2; exit 1 ;;
  esac

  case "$os" in
    Linux) platform="linux"; archive_ext="tar.gz" ;;
    Darwin) platform="macos"; archive_ext="zip" ;;
    *) echo "SO não suportado: $os (instale o k6 manualmente: https://k6.io/docs/get-started/installation/)" >&2; exit 1 ;;
  esac

  local filename="k6-v${K6_VERSION}-${platform}-${arch}.${archive_ext}"
  local url="https://github.com/grafana/k6/releases/download/v${K6_VERSION}/${filename}"
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN

  echo "Baixando $url..."
  curl -fsSL "$url" -o "$tmp/$filename"

  if [ "$archive_ext" = "tar.gz" ]; then
    tar -xzf "$tmp/$filename" -C "$tmp"
  else
    unzip -q "$tmp/$filename" -d "$tmp"
  fi

  find "$tmp" -type f -name k6 -exec cp {} "$BIN_DIR/k6" \;
  chmod +x "$BIN_DIR/k6"
}

if command -v k6 >/dev/null 2>&1; then
  K6_BIN="$(command -v k6)"
elif [ -x "$BIN_DIR/k6" ]; then
  K6_BIN="$BIN_DIR/k6"
else
  install_k6
  K6_BIN="$BIN_DIR/k6"
fi

echo "Usando $("$K6_BIN" version)"
echo

ARG="${1:-}"

if [ "$ARG" = "all" ]; then
  for test_file in "$SCRIPT_DIR"/k6/*.test.js; do
    echo "=== $(basename "$test_file") ==="
    "$K6_BIN" run "$test_file"
    echo
  done
elif [ -n "$ARG" ]; then
  "$K6_BIN" run "$SCRIPT_DIR/$ARG"
else
  "$K6_BIN" run "$SCRIPT_DIR/k6/accept-proposal-race.test.js"
fi
