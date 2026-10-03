#!/usr/bin/env bash
# Génère des médias de démo : vidéos muettes + pistes audio (synthèse vocale) + sous-titres
set -euo pipefail

OUT="$(cd "$(dirname "$0")/.." && pwd)/media"
DURATION=20
mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

text() {
  case "$1" in
    fr) echo "Bienvenue dans le module $3 de la formation $2. Ceci est la piste audio en français." ;;
    en) echo "Welcome to module $3 of course $2. This is the English audio track." ;;
    es) echo "Bienvenido al módulo $3 del curso $2. Esta es la pista de audio en español." ;;
  esac
}

for c in 1 2 3 4; do
  for m in 1 2 3; do
    id="c${c}m${m}"
    echo "→ $id"

    # Vidéo muette (mire avec chronomètre intégré, utile pour vérifier la synchro audio)
    ffmpeg -y -loglevel error -f lavfi -i "testsrc2=size=640x360:rate=25:duration=${DURATION}" \
      -an -c:v libx264 -crf 32 -pix_fmt yuv420p -movflags +faststart "$OUT/${id}.mp4"

    for lang in fr en es; do
      t="$(text "$lang" "$c" "$m")"

      # Piste audio : synthèse vocale complétée par du silence jusqu'à la durée de la vidéo
      espeak-ng -v "$lang" -w "$TMP/voice.wav" "$t"
      ffmpeg -y -loglevel error -i "$TMP/voice.wav" -af apad -t "$DURATION" \
        -c:a aac -b:a 64k "$OUT/${id}.${lang}.m4a"

      # Sous-titres WebVTT
      cat > "$OUT/${id}.${lang}.vtt" << EOF
WEBVTT

00:00:00.500 --> 00:00:07.000
$t
EOF
    done
  done
done

echo "Médias générés dans $OUT"