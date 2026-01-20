/**
 * VERIFICAR TOTALES DE CLIENTES
 * ==============================
 * Compara los totales de facturación con los valores esperados
 * 
 * Clientes de prueba:
 * - 32660 (2020 OCASO, SL): 2025 → ~50,546.26€
 * - 40324 (AMEZCUA FERNANDEZ ISABEL): 2025 → ~6,231.54€
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Clientes a verificar
const clientesToVerificar = [
    { codigoFinal: '32660', nombre: '2020 OCASO, SL', totalEsperado2025: 50546.26 },
    { codigoFinal: '40324', nombre: 'AMEZCUA FERNANDEZ ISABEL', totalEsperado2025: 6231.54 }
];

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║         VERIFICACIÓN DE TOTALES DE CLIENTES                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const connectionString = process.env.ODBC_CONNECTION_STRING;
    if (!connectionString) {
        console.error('❌ No hay ODBC_CONNECTION_STRING en el .env');
        return;
    }

    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('✅ Conexión a BD establecida\n');

        for (const cliente of clientesToVerificar) {
            console.log(`\n${'═'.repeat(60)}`);
            console.log(`🔍 Buscando cliente que termina en: ${cliente.codigoFinal}`);
            console.log(`   Nombre esperado: ${cliente.nombre}`);
            console.log(`   Total esperado 2025: ${cliente.totalEsperado2025.toFixed(2)}€`);
            console.log('═'.repeat(60));

            // 1. Buscar el código completo del cliente
            const buscarCliente = `
                SELECT TRIM(CODIGOCLIENTE) AS CODIGO, TRIM(NOMBRECLIENTE) AS NOMBRE
                FROM DSEDAC.CLI 
                WHERE TRIM(CODIGOCLIENTE) LIKE '%${cliente.codigoFinal}'
            `;
            const clientes = await connection.query(buscarCliente);

            if (clientes.length === 0) {
                console.log('❌ Cliente no encontrado');
                continue;
            }

            const codigoCompleto = clientes[0].CODIGO;
            console.log(`\n📋 Cliente encontrado: ${codigoCompleto} - ${clientes[0].NOMBRE}`);

            // 2. Calcular total de 2025 usando la misma lógica que el backend (authController.js)
            const queryTotal2025 = `
                SELECT 
                    COUNT(DISTINCT SERIEFACTURA || '-' || CHAR(NUMEROFACTURA)) AS NUM_FACTURAS,
                    SUM(
                        (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) +
                        (
                            (IMPORTEBASEIMPONIBLE1 * CASE WHEN PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
                            (IMPORTEBASEIMPONIBLE2 * CASE WHEN PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
                            (IMPORTEBASEIMPONIBLE3 * CASE WHEN PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
                            (IMPORTEBASEIMPONIBLE4 * CASE WHEN PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
                            (IMPORTEBASEIMPONIBLE5 * CASE WHEN PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
                        ) +
                        (IMPORTERECARGO1 + IMPORTERECARGO2 + IMPORTERECARGO3 + IMPORTERECARGO4 + IMPORTERECARGO5)
                    ) AS TOTAL_CALCULADO
                FROM DSEDAC.CAC
                WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCompleto}'
                  AND ANOFACTURA = 2025
                  AND NUMEROFACTURA > 0
            `;

            const resultado2025 = await connection.query(queryTotal2025);
            const totalCalculado = parseFloat(resultado2025[0].TOTAL_CALCULADO) || 0;
            const numFacturas = parseInt(resultado2025[0].NUM_FACTURAS) || 0;

            console.log(`\n📊 RESULTADOS 2025 (Query Backend):`);
            console.log(`   Número de facturas: ${numFacturas}`);
            console.log(`   Total calculado: ${totalCalculado.toFixed(2)}€`);
            console.log(`   Total esperado:  ${cliente.totalEsperado2025.toFixed(2)}€`);

            const diferencia = Math.abs(totalCalculado - cliente.totalEsperado2025);
            if (diferencia < 1) {
                console.log(`   ✅ COINCIDE (diferencia: ${diferencia.toFixed(2)}€)`);
            } else {
                console.log(`   ❌ DIFERENCIA: ${diferencia.toFixed(2)}€`);

                // Probar con TOTALFACTURA directamente
                const queryTotalDirecto = `
                    SELECT 
                        COUNT(DISTINCT SERIEFACTURA || '-' || CHAR(NUMEROFACTURA)) AS NUM_FACTURAS,
                        SUM(TOTALFACTURA) AS TOTAL_DIRECTO
                    FROM DSEDAC.CAC
                    WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCompleto}'
                      AND ANOFACTURA = 2025
                      AND NUMEROFACTURA > 0
                `;
                try {
                    const resultadoDirecto = await connection.query(queryTotalDirecto);
                    const totalDirecto = parseFloat(resultadoDirecto[0].TOTAL_DIRECTO) || 0;
                    console.log(`\n📊 USANDO TOTALFACTURA DIRECTO:`);
                    console.log(`   Total: ${totalDirecto.toFixed(2)}€`);
                    const difDirecto = Math.abs(totalDirecto - cliente.totalEsperado2025);
                    if (difDirecto < 1) {
                        console.log(`   ✅ ESTE COINCIDE! (diferencia: ${difDirecto.toFixed(2)}€)`);
                    }
                } catch (e) {
                    console.log(`   ⚠️ Columna TOTALFACTURA no existe: ${e.message.substring(0, 50)}`);
                }
            }

            // 3. Verificar años disponibles para este cliente
            const queryAnos = `
                SELECT DISTINCT ANOFACTURA, COUNT(*) AS NUM_FACTURAS
                FROM DSEDAC.CAC
                WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCompleto}'
                  AND NUMEROFACTURA > 0
                GROUP BY ANOFACTURA
                ORDER BY ANOFACTURA DESC
            `;
            const anos = await connection.query(queryAnos);
            console.log(`\n📅 Años con facturas para este cliente:`);
            anos.forEach(a => {
                console.log(`   - ${a.ANOFACTURA}: ${a.NUM_FACTURAS} registros`);
            });

            // 4. Total 2026 si existe
            const queryTotal2026 = `
                SELECT 
                    COUNT(DISTINCT SERIEFACTURA || '-' || CHAR(NUMEROFACTURA)) AS NUM_FACTURAS,
                    SUM(
                        (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) +
                        (
                            (IMPORTEBASEIMPONIBLE1 * CASE WHEN PORCENTAJEIVA1 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA1 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA1 IN (4, 3) THEN 0.04 ELSE 0 END) +
                            (IMPORTEBASEIMPONIBLE2 * CASE WHEN PORCENTAJEIVA2 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA2 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA2 IN (4, 3) THEN 0.04 ELSE 0 END) +
                            (IMPORTEBASEIMPONIBLE3 * CASE WHEN PORCENTAJEIVA3 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA3 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA3 IN (4, 3) THEN 0.04 ELSE 0 END) +
                            (IMPORTEBASEIMPONIBLE4 * CASE WHEN PORCENTAJEIVA4 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA4 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA4 IN (4, 3) THEN 0.04 ELSE 0 END) +
                            (IMPORTEBASEIMPONIBLE5 * CASE WHEN PORCENTAJEIVA5 IN (7, 10, 1) THEN 0.10 WHEN PORCENTAJEIVA5 IN (16, 21, 2) THEN 0.21 WHEN PORCENTAJEIVA5 IN (4, 3) THEN 0.04 ELSE 0 END)
                        ) +
                        (IMPORTERECARGO1 + IMPORTERECARGO2 + IMPORTERECARGO3 + IMPORTERECARGO4 + IMPORTERECARGO5)
                    ) AS TOTAL_CALCULADO
                FROM DSEDAC.CAC
                WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCompleto}'
                  AND ANOFACTURA = 2026
                  AND NUMEROFACTURA > 0
            `;
            const resultado2026 = await connection.query(queryTotal2026);
            if (parseInt(resultado2026[0].NUM_FACTURAS) > 0) {
                console.log(`\n📊 RESULTADOS 2026:`);
                console.log(`   Número de facturas: ${resultado2026[0].NUM_FACTURAS}`);
                console.log(`   Total: ${(parseFloat(resultado2026[0].TOTAL_CALCULADO) || 0).toFixed(2)}€`);
            }
        }

        await connection.close();
        console.log('\n\n✅ Verificación completada');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.odbcErrors) {
            error.odbcErrors.forEach(e => console.error(`   ODBC: ${e.state} - ${e.code}`));
        }
    }
}

main();
