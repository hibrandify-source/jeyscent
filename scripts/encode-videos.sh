#!/usr/bin/env bash
# scripts/encode-videos.sh
# Re-encode the 9 class videos (4K/1080p HEVC .mov, moov at tail) to browser-
# friendly H.264 MP4: 1080p, CRF 23, yuv420p, faststart, AAC 128k.
# Outputs to ~/Downloads/jeyscent-mp4/ — upload those via the admin panel's
# "Upload to R2" button.
set -u

FF_DIR="${LOCALAPPDATA}/Programs/ffmpeg/ffmpeg-master-latest-win64-gpl/bin"
FFMPEG="$FF_DIR/ffmpeg.exe"
IN_DIR="/c/Users/Josh/Downloads"
OUT_DIR="/c/Users/Josh/Downloads/jeyscent-mp4"
mkdir -p "$OUT_DIR"

FILES=(
  "Welcome Note.mov"
  "Introduction to Diffusers & Fragrance.mov"
  "WHAT YOU SHOULD EXPECT.mov"
  "Message from the instructor.mov"
  "COSTING & PRICING LIKE A PRO.mov"
  "SALES, AFTERCARE & LONGTERM GROWTH S.mov"
  "MATERIAL & INGREDIENTS DEEP DIVE.mov"
  "BRANDING & PACKAGING .mov"
  "Practical.mov"
)

for f in "${FILES[@]}"; do
  out="$OUT_DIR/${f%.mov}.mp4"
  if [ -f "$out" ]; then
    echo "[skip] $f -> exists"
    continue
  fi
  in_size=$(stat -c %s "$IN_DIR/$f")
  echo "=== $(date +%H:%M) START $f ($((in_size / 1048576)) MB)"
  "$FFMPEG" -y -v error \
    -i "$IN_DIR/$f" \
    -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
    -movflags +faststart \
    -c:a aac -b:a 128k \
    -vf "scale=1920:-2" \
    "$out"
  rc=$?
  if [ $rc -ne 0 ]; then
    echo "=== $(date +%H:%M) FAIL $f (rc=$rc)"
    rm -f "$out"
    exit 1
  fi
  out_size=$(stat -c %s "$out")
  echo "=== $(date +%H:%M) DONE $f -> $((out_size / 1048576)) MB ($((100 * out_size / in_size))%)"
done
echo "ALL DONE"