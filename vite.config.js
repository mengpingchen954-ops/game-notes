import {defineConfig} from 'vite';
import {cpSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  base: '/game-notes/',
  plugins: [{name: 'copy-note-docs', closeBundle() {cpSync('docs', 'dist/docs', {recursive: true});}}],
  build: {assetsInlineLimit: 0, rollupOptions: {input: {
    notes: fileURLToPath(new URL('./index.html', import.meta.url)),
    noFighting: fileURLToPath(new URL('./play/no-fighting/index.html', import.meta.url)),
    noFightingMatch: fileURLToPath(new URL('./play/no-fighting/match.html', import.meta.url)),
    heavenlyExam: fileURLToPath(new URL('./play/heavenly-exam/index.html', import.meta.url))
  }}}
});
