#!/bin/sh

set -ue
echo 'set -ue' > bmp.sh
echo 'set -ue' > png.sh
echo 'set -ue' > ogg.sh
find -name '*.bmp' -exec sh -c 'B=$(basename {} .bmp);D=$(dirname {});echo echo FILE: {};echo ls -l {};echo ffmpeg -hide_banner -i {} -c libwebp -compression_level 6 -y $D/$B.webp 2\>/dev/null;echo ls -l $D/$B.webp' \; >> bmp.sh
find -name '*.png' -exec sh -c 'B=$(basename {} .png);D=$(dirname {});echo echo FILE: {};echo ls -l {};echo ffmpeg -hide_banner -i {} -c libwebp -compression_level 6 -y $D/$B.webp 2\>/dev/null;echo ls -l $D/$B.webp' \; >> png.sh
find -name '*.ogg' -exec sh -c 'B=$(basename {} .ogg);D=$(dirname {});echo echo FILE: {};echo ls -l {};echo ffmpeg -hide_banner -i {} -c:a libopus -b:a 64k -y $D/$B.opus 2\>/dev/null;echo ls -l $D/$B.opus' \; >> ogg.sh