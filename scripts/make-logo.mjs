// Готовит логотип расширения из jazba.png:
// 1) делает прозрачным белый фон (заливка от краёв, внутренний белый цилиндр не трогаем),
// 2) обрезает прозрачные поля,
// 3) масштабирует до 256×256 PNG → media/logo.png
import { Jimp } from "jimp";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SRC = resolve("jazba.png");
const OUT = resolve("media/logo.png");
const WHITE = 236; // порог «почти белого» с учётом артефактов JPEG

const img = await Jimp.read(SRC);
const { data, width: w, height: h } = img.bitmap;

const idx = (x, y) => (y * w + x) * 4;
const isNearWhite = (i) => data[i] >= WHITE && data[i + 1] >= WHITE && data[i + 2] >= WHITE;

const visited = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) {
  stack.push([x, 0], [x, h - 1]);
}
for (let y = 0; y < h; y++) {
  stack.push([0, y], [w - 1, y]);
}

while (stack.length) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= w || y >= h) continue;
  const p = y * w + x;
  if (visited[p]) continue;
  visited[p] = 1;
  const i = idx(x, y);
  if (!isNearWhite(i)) continue;
  data[i + 3] = 0; // прозрачный
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// границы непрозрачного содержимого
let minX = w;
let minY = h;
let maxX = 0;
let maxY = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    if (data[idx(x, y) + 3] !== 0) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const pad = 8;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(w - 1, maxX + pad);
maxY = Math.min(h - 1, maxY + pad);

img.crop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });

const side = Math.max(img.bitmap.width, img.bitmap.height);
const square = new Jimp({ width: side, height: side, color: 0x00000000 });
square.composite(
  img,
  Math.floor((side - img.bitmap.width) / 2),
  Math.floor((side - img.bitmap.height) / 2),
);
square.resize({ w: 256, h: 256 });

mkdirSync(dirname(OUT), { recursive: true });
await square.write(OUT);
console.log(`logo → ${OUT} (${square.bitmap.width}×${square.bitmap.height})`);
