#!/usr/bin/env bash
# Turns the ring video into the frames the scroll film plays.
# Usage:  tools/make-frames.sh path/to/ring-video.mp4 [fps=24] [max=1280] [quality=4]
#   fps above the video's own rate (e.g. 48 for a 24 fps clip) adds generated in-between frames
#   max = longest side in pixels; smaller videos are never enlarged
#   quality = JPEG quality 2 (best, biggest) … 10 (smallest); 6–7 keeps detailed footage light
# Output: assets/ring-frames/frame_0001.jpg ... plus manifest.json (replaces any previous frames)
set -euo pipefail
IN="${1:?Give the path to the video, e.g. tools/make-frames.sh ~/Downloads/ring.mp4}"
FPS="${2:-24}"
MAX="${3:-1280}"
Q="${4:-4}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/ring-frames"

rm -f "$OUT"/frame_*.jpg "$OUT"/manifest.json
mkdir -p "$OUT"
# If FPS is higher than the video's own frame rate, in-between frames are generated (motion interpolation)
# so scrolling feels smoother; otherwise frames are simply sampled.
SRC_FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN" | awk -F/ '{printf "%d", ($2 ? $1/$2 : $1)}')
if [ "$FPS" -gt "$SRC_FPS" ]; then
  RATE="minterpolate=fps=$FPS:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"
else
  RATE="fps=$FPS"
fi
ffmpeg -hide_banner -loglevel error -i "$IN" \
  -vf "$RATE,scale='if(gte(iw,ih),min($MAX,iw),-2)':'if(gte(iw,ih),-2,min($MAX,ih))':flags=lanczos" -q:v "$Q" "$OUT/frame_%04d.jpg"

COUNT=$(ls "$OUT"/frame_*.jpg | wc -l | tr -d ' ')
W=$(sips -g pixelWidth "$OUT/frame_0001.jpg" | awk '/pixelWidth/{print $2}')
H=$(sips -g pixelHeight "$OUT/frame_0001.jpg" | awk '/pixelHeight/{print $2}')
printf '{ "count": %s, "width": %s, "height": %s }\n' "$COUNT" "$W" "$H" > "$OUT/manifest.json"
SIZE=$(du -sh "$OUT" | cut -f1)
echo "Done: $COUNT frames (${W}x${H}), $SIZE total, in assets/ring-frames/"
