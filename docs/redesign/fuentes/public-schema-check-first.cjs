const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const p=path.join(root,'frontend/components/seo/JsonLdSchemas.tsx');
const text=fs.readFileSync(p,'utf8');
const value=text.match(/const schemas\\s*=\\s*(\\[[\\s\\S]*?\\]);/);
assert.ok(value,'schema literal must be found');
const schemas=new Function('source','return ('+value[1]+');')('https://www.mari-pepa.com');
const forbidden=new Set(['price','priceRange','offers','aggregateRating','rating','review','sameAs','hasOfferCatalog']);
function inspect(value) {
 if(!value||typeof value!=='object')return;
 for(const[key,child]of Object.entries(value)) {
  assert.ok(!forbidden.has(key),'unverified property '+key);
  assert.ok(!(key==='@type'&&child==='SearchAction'),'unavailable search action');
  inspect(child);
 }
}
schemas.forEach(inspect);
assert.ok(!/24[\\s–-]*48|ISO\\s*9001/.test(JSON.stringify(schemas)));
assert.deepEqual(schemas.map(item=>item['@type']),['Organization','WebSite']);
const report={status:'PASS',schemaTypes:schemas.map(item=>item['@type']),method:'Evaluated the actual static schema array, then inspected property keys and values. Comments are excluded.'};
fs.writeFileSync(path.join(__dirname,'public-schema-check.json'),JSON.stringify(report,null,2)+'\\n');
console.log('PASS: actual Organization/WebSite schemas contain no unverified SLA, price, certification, review, social account or unavailable search action.');
