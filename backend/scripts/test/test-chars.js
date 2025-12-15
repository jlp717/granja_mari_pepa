// Script para analizar los caracteres problemáticos
const text = 'LA CAÿýADA';

console.log('Texto original:', text);
console.log('Longitud:', text.length);
console.log('Bytes hex:', Buffer.from(text).toString('hex'));
console.log('\nAnálisis caracter por caracter:');

for (let i = 0; i < text.length; i++) {
  const char = text[i];
  const code = text.charCodeAt(i);
  console.log(`  [${i}] '${char}' = charCode ${code} (0x${code.toString(16).padStart(4, '0')})`);
}

// Probar el reemplazo
console.log('\n--- Probando reemplazos ---');

// Patron original
let result1 = text.replace(/ÿý/g, 'N');
console.log('Reemplazo ÿý -> N:', result1);

// Ver si son caracteres separados
let result2 = text.replace(/ÿ/g, '').replace(/ý/g, 'N');
console.log('Reemplazo ÿ->nada, ý->N:', result2);

// Reemplazo por código
let result3 = text.replace(/[\u00ff\u00fd]/g, 'N');
console.log('Reemplazo unicode \\u00ff\\u00fd -> N:', result3);

// Solo el primero
let result4 = text.replace(/\u00ff/g, '');
console.log('Eliminar solo \\u00ff:', result4);

let result5 = text.replace(/\u00fd/g, 'N');
console.log('Reemplazo solo \\u00fd -> N:', result5);

// Combinado correcto
let result6 = text.replace(/\u00ff/g, '').replace(/\u00fd/g, 'N');
console.log('Combinado (eliminar ÿ, ý->N):', result6);

// Otra opción: ÿý juntos como secuencia que representa Ñ
let result7 = text.replace(/\u00ff\u00fd/g, 'N');
console.log('Secuencia ÿý junta -> N:', result7);
