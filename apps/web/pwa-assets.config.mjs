import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const transparentBackground = { background: '#00000000', fit: 'contain' };
const appBackground = { background: '#f8f6f0', fit: 'contain' };
const maskableBackground = { background: '#0b6b61', fit: 'contain' };

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
    resolveSvgName: () => 'favicon.svg',
  },
  images: ['public/favicon.svg'],
  manifestIconsEntry: false,
  preset: {
    ...minimal2023Preset,
    apple: {
      ...minimal2023Preset.apple,
      padding: 0,
      resizeOptions: appBackground,
    },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0,
      resizeOptions: maskableBackground,
    },
    png: {
      compressionLevel: 9,
      quality: 85,
    },
    transparent: {
      ...minimal2023Preset.transparent,
      padding: 0,
      resizeOptions: transparentBackground,
    },
  },
});
