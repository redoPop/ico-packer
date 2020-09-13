const fs = require('fs');
const test = require('tape');
const pack = require('./index');

const ICONDIR_HEADER_SIZE = 6;
const ICONDIR_ENTRY_SIZE = 16;

// Test helper to read files from the fixtures dir
const readFixtures = list => list.map(
  file => fs.readFileSync(`fixtures/${file}`)
);

// Test helper to extract image data from an ICO
const parseICO = buf => (
  [...Array(buf.readUInt16LE(4))].map((_, index) => {
    const offset = ICONDIR_HEADER_SIZE + index * ICONDIR_ENTRY_SIZE;
    const width = buf.readUInt8(offset + 0);
    const dataOffset = buf.readUInt32LE(offset + 12);
    const data = buf.slice(dataOffset, dataOffset + buf.readUInt32LE(offset + 8));
    return { width, data };
  })
);

test('Determines small image dimensions correctly', (t) => {
  const pngs = readFixtures(['16x16.png', '32x32.png']);
  const ico = pack(pngs);
  const deets = parseICO(ico);
  t.equal(deets[0].width, 16);
  t.equal(deets[1].width, 32);
  t.end();
});

test('Indicates 0 as the dimension of 256px images', (t) => {
  const pngs = readFixtures(['256x256.png']);
  const ico = pack(pngs);
  const deets = parseICO(ico);
  t.equal(deets[0].width, 0);
  t.end();
});

test('Contains unaltered PNG image data', (t) => {
  const pngs = readFixtures(['16x16.png', '32x32.png']);
  const ico = pack(pngs);
  const deets = parseICO(ico);
  t.ok(pngs[0].equals(deets[0].data));
  t.ok(pngs[1].equals(deets[1].data));
  t.end();
});

test('Throws an error for PNG sources > 256px', (t) => {
  const pngs = readFixtures(['288x288.png']);
  t.throws(() => pack(pngs), /Images must be smaller than 256px/);
  t.end();
});

test('Throws an error for non-32bpp PNG sources', (t) => {
  const pngs = readFixtures(['32x32-type3.png']);
  t.throws(() => pack(pngs), /Images must be truecolor with alpha/);
  t.end();
});
