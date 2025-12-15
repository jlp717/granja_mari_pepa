const fs = require('fs');

const file = process.argv[2] || 'test-libro-iva-mini-diego.pdf';
const needle = process.argv[3] || 'RESUMEN POR SERIE';
const data = fs.readFileSync(file, { encoding: 'latin1' });
let idx = data.indexOf(needle);
let count = 0;
while (idx >= 0) {
  console.log(`Found '${needle}' at offset: ${idx}`);
  count++;
  idx = data.indexOf(needle, idx + 1);
}
console.log('Total found:', count);
