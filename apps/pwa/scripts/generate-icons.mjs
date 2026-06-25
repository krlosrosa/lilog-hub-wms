import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '../public/icons');

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createSolidPng(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    const offset = 1 + x * 3;
    row[offset] = r;
    row[offset + 1] = g;
    row[offset + 2] = b;
  }

  const raw = Buffer.alloc(row.length * height);
  for (let y = 0; y < height; y++) {
    row.copy(raw, y * row.length);
  }

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function createSquarePng(size, r, g, b) {
  return createSolidPng(size, size, r, g, b);
}

fs.mkdirSync(iconsDir, { recursive: true });

const splashDir = path.resolve(__dirname, '../public/splash');
fs.mkdirSync(splashDir, { recursive: true });

const BRAND_BLUE = [0, 81, 213];
const SPLASH_BG = [248, 249, 255];

const png192 = createSquarePng(192, ...BRAND_BLUE);
const png512 = createSquarePng(512, ...BRAND_BLUE);

fs.writeFileSync(path.join(iconsDir, 'pwa-192.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'pwa-512.png'), png512);

const splashes = [
  { name: 'iphone-14-pro.png', width: 1179, height: 2556 },
  { name: 'iphone-15-pro.png', width: 1179, height: 2556 },
  { name: 'iphone-se.png', width: 750, height: 1334 },
  { name: 'ipad-pro-12.png', width: 2048, height: 2732 },
];

for (const { name, width, height } of splashes) {
  fs.writeFileSync(
    path.join(splashDir, name),
    createSolidPng(width, height, ...SPLASH_BG)
  );
}

console.log('PWA icons and splash screens generated.');
