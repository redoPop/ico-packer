# ico-packer [![NPM Version](https://img.shields.io/npm/v/ico-packer.svg?style=flat)](https://npmjs.org/package/ico-packer) [![CI Status](https://github.com/redoPop/ico-packer/workflows/CI/badge.svg?branch=main)](https://github.com/redoPop/ico-packer/actions?query=workflow%3ACI+branch%3Amain)
Node lib to create ICO files containing PNG images:
```js
const fs = require('fs');
const pack = require('ico-packer');

const ico = pack([
  fs.readFileSync('16x16.png'),
  fs.readFileSync('32x32.png'),
  fs.readFileSync('48x48.png'),
]);

fs.writeFileSync('favicon.ico', ico);
```

## Why?
ICO remains a popular format for the favicon. Historically ICO contained bitmap images, but support for PNG was introduced in Windows Vista and has been broadly adopted since. Using PNG within ICO leads to much smaller file sizes, but most icon composers still produce ICO files containing bitmap images.

This library exists to create ICO files containing PNG images. It does not convert to BMP or support BMP composition.

## Limitations
This library does not resize or alter PNG image sources (use [sharp](https://www.npmjs.com/package/sharp), [jimp](https://www.npmjs.com/package/jimp), [gm](https://www.npmjs.com/package/gm) or others for that). You must therefore be aware that the ICO format's PNG support imposes some limitations:

* PNG images must be <= 256px
* PNG images must be square
* PNG images must be 32-bit (24bit+alpha)

Apps and operating systems vary in their tolerance for these rules (Windows 10 is persnickety, macOS quite forgiving). To avoid incompatibilities, this lib insists on them.

❤️📦
