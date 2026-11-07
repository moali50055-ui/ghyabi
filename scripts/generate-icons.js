import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

async function generate() {
  const publicDir = path.resolve('public');
  const iconSvg = fs.readFileSync(path.join(publicDir, 'icon.svg'));
  const maskableSvg = fs.readFileSync(path.join(publicDir, 'icon-maskable.svg'));

  console.log('Generating PNG icons from SVG...');

  // 192x192 standard icon
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ pwa-192x192.png');

  // 512x512 standard icon
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ pwa-512x512.png');

  // 512x512 maskable icon
  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ pwa-maskable-512x512.png');

  // 180x180 Apple touch icon
  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  // 32x32 favicon
  await sharp(iconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ favicon.ico');

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
