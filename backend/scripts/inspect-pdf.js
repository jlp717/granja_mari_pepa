const fs = require('fs');
const pdf = require('pdf-parse');

async function inspect(file) {
  const data = fs.readFileSync(file);
  const parsed = await pdf(data);
  console.log('Pages:', parsed.numpages);
  console.log('Text length:', parsed.text.length);
  // Show a small sample of the text
  const pages = parsed.text.split('\f');
  pages.forEach((p, i) => {
    console.log(`--- PAGE ${i + 1} ---`);
    console.log(p.trim().slice(0, 400));
    console.log('--- end ---\n');
  });
}

const file = process.argv[2] || 'test-libro-iva-mini-diego.pdf';
inspect(file).catch(e => { console.error(e); process.exit(1); });
