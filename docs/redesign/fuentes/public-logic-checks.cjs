const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const frontend=path.join(root,'frontend');
const source=fs.readFileSync(path.join(frontend,'lib/kage-catalogue-copy.ts'),'utf8');
const match=source.match(/export function selectCatalogueFamilies[^\{]*\{([\s\S]*?)\n\}/);
assert.ok(match,'actual selection function body must be found');
const select=new Function('copy','category','brand',match[1]);
const copy=JSON.parse(fs.readFileSync(path.join(frontend,'components/kage/catalogue/content/es.json'),'utf8'));
const before=JSON.stringify(copy);
let total=0;
function test(category,brand,ids,invalid) {
 const result=select(copy,category,brand);
 assert.deepEqual(result.families.map(family=>family.id),ids);
 assert.equal(result.invalid,invalid);
 if(ids.length===1)assert.equal(result.selected.id,ids[0]);
 assert.equal(JSON.stringify(copy),before,'selection must not mutate copy');
 total++;
}
const all=['mar','carne','precocinados','reposteria'];
test(undefined,undefined,all,false);
test(undefined,'grupo-topgel',all,false);
for(const id of all) {test(id,undefined,[id],false);test(id,'grupo-topgel',[id],false);}
for(const bad of ['constructor','__proto__','toString','lacteos','',[],['mar'],{},null])test(bad,'grupo-topgel',[],true);
for(const brand of ['nestle','panamar','constructor',[],null])test('mar',brand,[],true);
const report={status:'PASS',checks:total,scope:'Actual pure selection body read from source; no network, database, framework, TypeScript compilation or browser claim.'};
fs.writeFileSync(path.join(__dirname,'public-logic-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASS: public family selection '+total+'/'+total+' cases; source copy unchanged; no requests.');
