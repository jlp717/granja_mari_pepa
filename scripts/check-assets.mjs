import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = ['frontend/app', 'frontend/components', 'frontend/lib', 'frontend/styles'];
const PUB = 'frontend/public';
const MEDIA = /\.(webp|avif|jpe?g|png|svg|mp4|webm)$/i;
const REF = /["'\`](\/[\w\-./]+\.(?:webp|avif|jpe?g|png|svg|mp4|webm))["'\`)]/g;

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

const refs = new Map();
for (const dir of SRC.filter(existsSync)) {
  for (const f of walk(dir).filter((f) => /\.(tsx?|jsx?|css|mjs|json)$/.test(f))) {
    for (const m of readFileSync(f, 'utf8').matchAll(REF)) {
      if (!refs.has(m[1])) refs.set(m[1], new Set());
      refs.get(m[1]).add(f);
    }
  }
}

const missing = [...refs.keys()].filter((r) => !existsSync(join(PUB, r)));
const files = walk(PUB).filter((f) => MEDIA.test(f)).map((f) => f.slice(PUB.length));
const orphans = files.filter((f) => !refs.has(f));
const heavy = files.filter((f) => { const kb = statSync(join(PUB, f)).size / 1024; return /\.(mp4|webm)$/i.test(f) ? kb > 3072 : kb > 300; });

console.log('Referencias rotas:', missing.length ? missing : 'ninguna');
console.log('Huerfanos:', orphans.length ? orphans : 'ninguno');
console.log('Demasiado pesados:', heavy.length ? heavy : 'ninguno');
process.exit(missing.length ? 1 : 0);
