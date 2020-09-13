const fs = require('fs');

const ICONDIR_HEADER_SIZE = 6;
const ICONDIR_ENTRY_SIZE = 16;
const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// Read the contents of a PNG IHDR chunk
// http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
// https://en.wikipedia.org/wiki/Portable_Network_Graphics#Critical_chunks
const ihdr = buf => ([
  buf.readUInt32BE(16), // width
  buf.readUInt32BE(20), // height
  buf.readUInt8(24), // bit depth
  buf.readUInt8(25), // color type
]);

// Reducer function to sum lengths of an iterable
const sumLengths = (cum, cur) => cum + cur.length;

// Given an array of image Buffers, generates an ICONDIR header
// https://en.wikipedia.org/wiki/ICO_(file_format)#Outline
function iconDirHeader(list) {
  const buf = Buffer.alloc(ICONDIR_HEADER_SIZE);
  buf.writeUInt16LE(0, 0); // reserved, should be 0
  buf.writeUInt16LE(2, 2); // image type; 1 for icon
  buf.writeUInt16LE(list.length, 4);
  return buf;
}

// Map function to generate ICONDIRENTRY entries from image Buffers
function iconDirEntry(cur, index, array) {
  if (!Buffer.isBuffer(cur))
    throw new Error('Images must be Buffers');

  // All PNG images start with the same 8 bytes
  if (!cur.slice(0, 8).equals(PNG_HEADER))
    throw new Error('Images must be in PNG format');

  // Read image details from the PNG's IHDR chunk
  const [width, height, bitDepth, colorType] = ihdr(cur);
  if (width !== height) throw new Error('Images must be square');

  // ICO limitation: sizes > 256px can't be conveyed in a single byte!
  if (width > 256) throw new Error('Images must be smaller than 256px');

  // Dimensions of 256px are indicated by the value 0
  const length = width === 256 ? 0 : width;

  // "The image must be in 32bpp ARGB format" i.e. PNG color type 6
  // https://devblogs.microsoft.com/oldnewthing/20101022-00/?p=12473
  // http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
  if (colorType !== 6) throw new Error('Images must be truecolor with alpha');

  // Offset (byte location) of image data within the ICO file
  const offset = (
    ICONDIR_HEADER_SIZE +
    ICONDIR_ENTRY_SIZE * array.length +
    array.slice(0, index).reduce(sumLengths, 0)
  );

  // ICONDIRENTRY details from Wikipedia:
  // https://en.wikipedia.org/wiki/ICO_(file_format)#Outline
  const buf = Buffer.alloc(ICONDIR_ENTRY_SIZE);
  buf.writeUInt8(length, 0);
  buf.writeUInt8(length, 1);
  buf.writeUInt8(0, 2); // color palette
  buf.writeUInt8(0, 3); // reserved, should be 0
  buf.writeUInt16LE(0, 4); // color planes; 0 or 1
  buf.writeUInt16LE(0, 6); // bits per pixel
  buf.writeUInt32LE(cur.length, 8); // byte size of image
  buf.writeUInt32LE(offset, 12); // offset of image data in .ico
  return buf;
}

// Given an array of image Buffers, generates a complete ICONDIR
const iconDir = list => ([
  iconDirHeader(list),
  ...list.map(iconDirEntry)
]);

/**
Given an array of PNG images, returns an ICO that contains them.
@param {Buffer[]} list - Array of PNG image buffers
@returns {Buffer} ICO
*/
const icon = list => Buffer.concat([
  ...iconDir(list),
  ...list
]);

module.exports = icon;
