const fs = require('fs');

function countPages(file) {
  const data = fs.readFileSync(file, { encoding: 'latin1' });
  const matches = data.match(/\/Type\s*\/Page/g);
  return matches ? matches.length : 0;
}

const file = process.argv[2] || 'test-libro-iva-mini-diego.pdf';
console.log('Pages (approx):', countPages(file));
