import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const source = fileURLToPath(new URL('.', import.meta.url));
const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const pictures = join(source, 'screenshots');

if (readdirSync(pictures).length !== 4) {
  throw new Error('Solmar Bay requires exactly four browser screenshots.');
}

mkdirSync(destination, { recursive: true });
for (const folder of ['game', 'screenshots']) {
  cpSync(join(source, folder), join(destination, folder), { recursive: true });
}
const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(destination, 'dossier.json'), dossier);
