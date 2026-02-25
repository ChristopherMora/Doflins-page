#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no está instalado o no está en PATH."
  exit 1
fi

if ! docker version >/dev/null 2>&1; then
  echo "Docker no está disponible en esta terminal. Activa Docker Desktop + integración WSL y vuelve a ejecutar."
  exit 1
fi

if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  echo "Se creó .env.local desde .env.example"
fi

set -a
source .env.local
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL no está definida en .env.local"
  exit 1
fi

echo "Levantando MySQL..."
docker compose up -d mysql

echo "Esperando puerto 3306..."
for i in {1..60}; do
  if nc -z 127.0.0.1 3306 >/dev/null 2>&1; then
    echo "MySQL disponible"
    break
  fi

  if [[ "$i" -eq 60 ]]; then
    echo "MySQL no respondió a tiempo"
    exit 1
  fi

  sleep 1
done

echo "Ejecutando migraciones..."
npm run db:migrate

echo "Ejecutando seed..."
npm run db:seed

echo "Setup local completo"
echo "Prueba un código en: http://localhost:3000/reveal?code=DF000001"
