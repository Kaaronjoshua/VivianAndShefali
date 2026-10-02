#!/usr/bin/env bash
# Turns the ring video into the frames the scroll film plays.
# Usage:  tools/make-frames.sh path/to/ring-video.mp4 [fps=24] [max=1280]
#   max = longest side in pixels; smaller videos are never enlarged
# Output: assets/ring-frames/frame_0001.jpg ... plus manifest.json (replaces any previous frames)
set -euo pipefail
IN="${1:?Give the path to the video, e.g. tools/make-frames.sh ~/Downloads/ring.mp4}"
FPS="${2:-24}"
MAX="${3:-1280}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/ring-frames"

rm -f "$OUT"/frame_*.jpg "$OUT"/manifest.json
mkdir -p "$OUT"
ffmpeg -hide_banner -loglevel error -i "$IN" \
  -vf "fps=$FPS,scale='if(gte(iw,ih),min($MAX,iw),-2)':'if(gte(iw,ih),-2,min($MAX,ih))':flags=lanczos" -q:v 4 "$OUT/frame_%04d.jpg"

COUNT=$(ls "$OUT"/frame_*.jpg | wc -l | tr -d ' ')
W=$(sips -g pixelWidth "$OUT/frame_0001.jpg" | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$OUT/frame_0001.jpg" | awk '/pixelHeight/{print $2}')
printf '{ "count": %s, "width": %s, "height": %s }\n' "$COUNT" "$W" "$H" > "$OUT/manifest.json"
SIZE=$(du -sh "$OUT" | cut -f1)
echo "Done: $COUNT frames (${W}x${H}), $SIZE total, in assets/ring-frames/"
