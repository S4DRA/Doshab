const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { inflateSync } = require('node:zlib');

function rgba(png) {
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.equal(png[24], 8); assert.equal(png[25], 6, 'icons need RGBA, not an opaque RGB plate');
  assert.equal(png[28], 0);
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const scan = inflateSync(Buffer.concat(chunks)), stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => {
    const p = a + b - c, x = Math.abs(p - a), y = Math.abs(p - b), z = Math.abs(p - c);
    return x <= y && x <= z ? a : y <= z ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = scan[y * (stride + 1)];
    assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, a = x >= 4 ? pixels[i - 4] : 0, b = y ? pixels[i - stride] : 0;
      const c = x >= 4 && y ? pixels[i - stride - 4] : 0;
      pixels[i] = (scan[y * (stride + 1) + 1 + x] + [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter]) & 255;
    }
  }
  return { width, height, pixels };
}

function transparentMark(png) {
  const { width, height, pixels } = rgba(png);
  for (const pixel of [0, width - 1, width * (height - 1), width * height - 1]) assert.equal(pixels[pixel * 4 + 3], 0);
  let empty = 0, visible = 0, smooth = 0;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) empty++;
    else { visible++; if (pixels[i] < 255) smooth++; }
  }
  assert.ok(empty > width * height * 0.45, 'background and spaces between arcs must be transparent');
  assert.ok(visible > width * height * 0.08, 'the mark must remain visible');
  assert.ok(smooth > 0, 'edges should retain anti-aliasing');
  return { width, height };
}

test('Windows icon has transparent native frames for taskbar, desktop and high DPI', () => {
  const icon = fs.readFileSync(path.join(__dirname, '../assets/val.ico'));
  assert.equal(icon.readUInt16LE(0), 0);
  assert.equal(icon.readUInt16LE(2), 1);
  const sizes = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256];
  assert.equal(icon.readUInt16LE(4), sizes.length);
  let end;
  for (let i = 0; i < sizes.length; i++) {
    const entry = 6 + i * 16, size = icon.readUInt32LE(entry + 8), offset = icon.readUInt32LE(entry + 12);
    assert.equal(icon[entry] || 256, sizes[i]); assert.equal(icon[entry + 1] || 256, sizes[i]);
    const png = transparentMark(icon.subarray(offset, offset + size));
    assert.equal(png.width, sizes[i]); assert.equal(png.height, sizes[i]);
    end = offset + size;
  }
  assert.equal(end, icon.length);
});

test('installer logo master is 1024px with genuine alpha transparency', () => {
  const png = transparentMark(fs.readFileSync(path.join(__dirname, '../assets/val-master.png')));
  assert.equal(png.width, 1024); assert.equal(png.height, 1024);
});
