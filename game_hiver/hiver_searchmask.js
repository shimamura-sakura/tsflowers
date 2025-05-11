'use strict';
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const png = new PNG({ width: 1280, height: 720 });
const { buffer, byteLength, byteOffset } = png.data;
const pngData = new Uint32Array(buffer, byteOffset, byteLength / 4);
const mskData = fs.readFileSync(path.join(__dirname, 'system/search01mask.msk'));
const palette = [0];
for (let i = 0; i < 16; i++) palette.push(0xFE000000 +
  Math.round(Math.random() * 3) * 0x600000 +
  Math.round(Math.random() * 3) * 0x6000 +
  Math.round(Math.random() * 3) * 0x60
);
mskData.forEach((v, i) => pngData[i] = palette[v]);
fs.writeFileSync('search01mask.png', PNG.sync.write(png));