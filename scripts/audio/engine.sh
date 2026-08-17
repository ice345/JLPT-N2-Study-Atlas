#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/../.." && pwd)"
compose_file="${project_root}/infra/aivis/docker-compose.yml"
action="${1:-status}"
mode="${2:-cpu}"

export AIVIS_DATA_DIR="${AIVIS_DATA_DIR:-${HOME}/.local/share/AivisSpeech-Engine}"
export AIVIS_PORT="${AIVIS_PORT:-10101}"

compose() {
  docker compose --project-directory "${project_root}/infra/aivis" -f "${compose_file}" "$@"
}

engine_url="http://127.0.0.1:${AIVIS_PORT}"

case "${action}" in
  up)
    if [[ "${mode}" != "cpu" && "${mode}" != "nvidia" ]]; then
      echo "mode must be cpu or nvidia" >&2
      exit 64
    fi
    mkdir -p "${AIVIS_DATA_DIR}/Models"
    compose --profile "${mode}" up -d "aivis-${mode}"
    echo "AivisSpeech ${mode} profile is starting at ${engine_url}."
    echo "First boot downloads the default model and BERT cache; run npm run audio:engine:wait."
    ;;
  down)
    compose --profile cpu --profile nvidia down
    ;;
  status)
    compose --profile cpu --profile nvidia ps
    if version="$(curl -fsS --max-time 3 "${engine_url}/version" 2>/dev/null)"; then
      echo "Engine API ready: ${version}"
    else
      echo "Engine API is not ready at ${engine_url}."
    fi
    ;;
  logs)
    compose --profile cpu --profile nvidia logs --tail=150 -f
    ;;
  wait)
    echo "Waiting for AivisSpeech at ${engine_url} ..."
    for _attempt in $(seq 1 300); do
      if version="$(curl -fsS --max-time 2 "${engine_url}/version" 2>/dev/null)"; then
        echo "Engine API ready: ${version}"
        exit 0
      fi
      sleep 2
    done
    echo "Timed out waiting for AivisSpeech. Inspect npm run audio:engine:logs." >&2
    exit 1
    ;;
  *)
    echo "usage: $0 {up [cpu|nvidia]|down|status|logs|wait}" >&2
    exit 64
    ;;
esac
