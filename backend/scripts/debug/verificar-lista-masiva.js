/**
 * VERIFICACIÓN MASIVA DE TOTALES (LISTA DE VENTAS)
 * =================================================
 * Compara los totales calculados por nuestra query (GROUP BY)
 * con los valores esperados del listado (imagen proporcionada).
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Datos extraídos de la imagen (NIF -> Total Esperado 2025)
const CLIENTS_CHECKLIST = [
    { nif: 'B04913327', name: '2020 OCASO, S.L.', expected: 50546.26 },
    { nif: 'B72416191', name: '24 BERMUDEZ Y RUIZ, S.L.', expected: 11481.15 },
    { nif: 'B72516875', name: '3 ALMAS AGUADULCE, S.L.', expected: 49111.49 },
    { nif: '30385962H', name: 'ABAD MACIAS ELIDA MIREYA', expected: 6839.28 },
    { nif: '61051163D', name: 'ACHUPALLAS ORTIZ MARIA MAGDALENA', expected: 6512.42 },
    { nif: 'B04603114', name: 'ACONCAGUA SERVICIOS GASTRONOMICOS', expected: 44141.03 }, // Imagen dificil de leer, aprox
    { nif: '75253724R', name: 'ACOSTA JODAR LORENA MARIA', expected: 5633.74 },
    { nif: 'A28307916', name: 'ALMERIMAR, S.A.', expected: 93617.25 },
    { nif: '27517058L', name: 'AMEZCUA FERNANDEZ ISABEL', expected: 6231.54 },
    // El que el usuario menciona explícitamente como "30853" (quizás código cliente?)
    // Vamos a buscar cliente con código terminando en 30853 también
];

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       VERIFICACIÓN MASIVA DE TOTALES 2025                         ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    // 0. DETECTAR COLUMNA NIF CORRECTA
    console.log('🔍 Detectando columna NIF correcta...');
    let nifColumn = 'NIFCLI'; // Default
    try {
        // Obtenemos un cliente conocido para ver sus columnas
        const sample = await connection.query("SELECT * FROM DSEDAC.CLI WHERE CODIGOCLIENTE LIKE '%32660' FETCH FIRST 1 ROW ONLY");
        if (sample.length > 0) {
            const keys = Object.keys(sample[0]);
            console.log('   Columnas disponibles:', keys.join(', '));

            // Buscar posibles candidatos para NIF
            const candidates = ['NIFCLI', 'CIFCLI', 'NIF', 'CIF', 'DNICLI', 'DNI'];
            const found = keys.find(k => candidates.includes(k.toUpperCase()));
            if (found) {
                nifColumn = found;
                console.log(`   ✅ Columna NIF detectada: ${nifColumn}`);
            } else {
                console.log('   ⚠️ No se detectó columna NIF estándar. Usando fallback NIFCLI.');
            }
        }
    } catch (e) {
        console.log(`   ⚠️ Error detectando columnas: ${e.message}`);
    }

    // 1. Verificar lista predefinida
    console.log('\n🔍 Verificando lista de la imagen:');
    console.log('─────────────────────────────────────────────────────────────────────────');
    console.log('NIF        | NOMBRE (BD)                 | ESPERADO   | CALCULADO  | DIF.');
    console.log('─────────────────────────────────────────────────────────────────────────');

    for (const check of CLIENTS_CHECKLIST) {
        try {
            // Buscar Código Cliente por NIF usando la columna detectada
            let queryCliente = `
                SELECT CODIGOCLIENTE, NOMBRECLIENTE
                FROM DSEDAC.CLI
                WHERE TRIM(${nifColumn}) = '${check.nif}'
            `;

            // Si el nombre de columna falló antes, intentamos fallback manual
            // Pero idealmente nifColumn ya es correcto.

            let clienteRows = [];
            try {
                clienteRows = await connection.query(queryCliente);
            } catch (e) {
                // Si falla, quizás es porque es CIFCLI
                if (nifColumn !== 'CIFCLI') {
                    clienteRows = await connection.query(`SELECT CODIGOCLIENTE, NOMBRECLIENTE FROM DSEDAC.CLI WHERE TRIM(CIFCLI) = '${check.nif}'`);
                }
            }

            let cliente = null;
            if (clienteRows.length > 0) {
                cliente = clienteRows[0];
            } else {
                // Fallback sin letra
                const nifSinLetra = check.nif.replace(/[A-Z]/g, '');
                if (nifSinLetra.length > 5) {
                    try {
                        const clienteRows2 = await connection.query(`
                            SELECT CODIGOCLIENTE, NOMBRECLIENTE
                            FROM DSEDAC.CLI
                            WHERE ${nifColumn} LIKE '%${nifSinLetra}%'
                        `);
                        if (clienteRows2.length > 0 && clienteRows2.length < 5) cliente = clienteRows2[0]; // Solo si es específico
                    } catch (e) { }
                }
            }

            if (!cliente) {
                console.log(`${check.nif.padEnd(10)} | ERROR: NO ENCONTRADO EN BD  | ${check.expected.toFixed(2).padEnd(10)} | -          | -`);
                continue;
            }

            const codigoCliente = cliente.CODIGOCLIENTE.trim();
            const nombre = cliente.NOMBRECLIENTE.trim().substring(0, 27);

            // Calcular Total 2025 usando la lógica FIX (GROUP BY + SUM)
            const queryTotal = `
              WITH FacturasBase AS (
                SELECT
                  TRIM(CAC.SERIEFACTURA) AS SERIE,
                  CAC.NUMEROFACTURA AS NUMERO,

                  SUM(
                    (CAC.IMPORTEBASEIMPONIBLE1 + CAC.IMPORTEBASEIMPONIBLE2 + CAC.IMPORTEBASEIMPONIBLE3 + CAC.IMPORTEBASEIMPONIBLE4 + CAC.IMPORTEBASEIMPONIBLE5) +
                    (
                      (CAC.IMPORTEBASEIMPONIBLE1 * CASE WHEN CAC.PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
                      (CAC.IMPORTEBASEIMPONIBLE2 * CASE WHEN CAC.PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
                      (CAC.IMPORTEBASEIMPONIBLE3 * CASE WHEN CAC.PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
                      (CAC.IMPORTEBASEIMPONIBLE4 * CASE WHEN CAC.PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
                      (CAC.IMPORTEBASEIMPONIBLE5 * CASE WHEN CAC.PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
                    ) +
                    (CAC.IMPORTERECARGO1 + CAC.IMPORTERECARGO2 + CAC.IMPORTERECARGO3 + CAC.IMPORTERECARGO4 + CAC.IMPORTERECARGO5)
                  ) AS TOTAL
                FROM DSEDAC.CAC CAC
                WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '${codigoCliente}'
                  AND CAC.ANOFACTURA = 2025
                  AND CAC.NUMEROFACTURA > 0
                GROUP BY TRIM(CAC.SERIEFACTURA), CAC.NUMEROFACTURA, CAC.EJERCICIOFACTURA
              )
              SELECT SUM(TOTAL) AS GRAN_TOTAL FROM FacturasBase
            `;

            const result = await connection.query(queryTotal);
            const calculado = parseFloat(result[0].GRAN_TOTAL || 0);
            const diff = Math.abs(calculado - check.expected);

            // Usar margen de 1€ porque la imagen puede tener totales ligeramente diferentes por decimales visuales
            const status = diff < 1.0 ? '✅' : '❌';

            console.log(`${check.nif.padEnd(10)} | ${nombre.padEnd(27)} | ${check.expected.toFixed(2).padEnd(10)} | ${calculado.toFixed(2).padEnd(10)} | ${diff > 1.0 ? diff.toFixed(2) : status}`);

        } catch (e) {
            console.log(`${check.nif.padEnd(10)} | ERROR: ${e.message.substring(0, 20)}`);
        }
    }

    // 2. Investigar Cliente "30853"
    console.log('\n🔍 Investigando cliente mencionado "30853"...');
    try {
        const cliente30853 = await connection.query(`
            SELECT CODIGOCLIENTE, NOMBRECLIENTE, TRIM(${nifColumn}) as NIF
            FROM DSEDAC.CLI
            WHERE CODIGOCLIENTE LIKE '%30853'
        `);

        if (cliente30853.length > 0) {
            const cl = cliente30853[0];
            console.log(`   Encontrado: ${cl.NOMBRECLIENTE} (Code: ${cl.CODIGOCLIENTE}) - NIF: ${cl.NIF}`);

            // Calcular
            const codigo = cl.CODIGOCLIENTE.trim();
            const queryMisterio = `
              WITH FacturasBase AS (
                SELECT
                  TRIM(CAC.SERIEFACTURA) AS SERIE,
                  CAC.NUMEROFACTURA AS NUMERO,
                  SUM(
                    (CAC.IMPORTEBASEIMPONIBLE1 + CAC.IMPORTEBASEIMPONIBLE2 + CAC.IMPORTEBASEIMPONIBLE3 + CAC.IMPORTEBASEIMPONIBLE4 + CAC.IMPORTEBASEIMPONIBLE5) +
                    (
                      (CAC.IMPORTEBASEIMPONIBLE1 * CASE WHEN CAC.PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
                      (CAC.IMPORTEBASEIMPONIBLE2 * CASE WHEN CAC.PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
                      (CAC.IMPORTEBASEIMPONIBLE3 * CASE WHEN CAC.PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
                      (CAC.IMPORTEBASEIMPONIBLE4 * CASE WHEN CAC.PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
                      (CAC.IMPORTEBASEIMPONIBLE5 * CASE WHEN CAC.PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN CAC.PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN CAC.PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
                    ) +
                    (CAC.IMPORTERECARGO1 + CAC.IMPORTERECARGO2 + CAC.IMPORTERECARGO3 + CAC.IMPORTERECARGO4 + CAC.IMPORTERECARGO5)
                  ) AS TOTAL
                FROM DSEDAC.CAC CAC
                WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = '${codigo}'
                  AND CAC.ANOFACTURA = 2025
                  AND CAC.NUMEROFACTURA > 0
                GROUP BY TRIM(CAC.SERIEFACTURA), CAC.NUMEROFACTURA, CAC.EJERCICIOFACTURA
              )
              SELECT SUM(TOTAL) AS GRAN_TOTAL FROM FacturasBase
            `;
            const res = await connection.query(queryMisterio);
            const total = parseFloat(res[0].GRAN_TOTAL || 0);
            console.log(`   💰 TOTAL CÁLCULADO 2025: ${total.toFixed(2)}€`);
            console.log(`   (Usuario dice: salen 169k y pico, debería ser 172,154.94€)`);
            if (Math.abs(total - 169000) < 5000) {
                console.log('   ⚠️ Sale ~169k (COMO DICE EL USUARIO QUE SALE MAL)');
                console.log('   Esto confirma que nuestra lógica puede seguir mal o faltar algo.');
            } else if (Math.abs(total - 172154.94) < 5) {
                console.log('   ✅ ¡COINCIDE con lo esperado (172k)!');
            } else {
                console.log(`   ❌ Dato extraño: ${total.toFixed(2)}€`);
            }
        } else {
            console.log('   ⚠️ No encontré cliente terminando en 30853 en DSEDAC.CLI');
        }

    } catch (e) {
        console.error(e);
    }

    await connection.close();
}

main().catch(e => console.error(e));
