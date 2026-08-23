import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const assetsDirectory = resolve(process.cwd(), 'dist/assets');
const javascriptFiles = readdirSync(assetsDirectory).filter((file) => file.endsWith('.js'));
const chunks = javascriptFiles.map((file) => ({
  file,
  gzipBytes: gzipSync(readFileSync(resolve(assetsDirectory, file))).byteLength,
}));
const entryChunk = chunks.find(({ file }) => /^index-[\w-]+\.js$/.test(file));
const routeChunkCount = chunks.filter(({ file }) => file.includes('-page-')).length;
const maximumEntryGzipBytes = 125 * 1024;

if (!entryChunk) {
  throw new Error('The production entry chunk was not found.');
}

if (entryChunk.gzipBytes > maximumEntryGzipBytes) {
  throw new Error(
    `The entry chunk is ${(entryChunk.gzipBytes / 1024).toFixed(1)} KiB gzip; the limit is 125 KiB.`,
  );
}

if (routeChunkCount < 10) {
  throw new Error('Expected route-level lazy loading to generate at least 10 page chunks.');
}

console.log(
  `Bundle check passed: entry ${(entryChunk.gzipBytes / 1024).toFixed(1)} KiB gzip, ${routeChunkCount} lazy page chunks.`,
);
