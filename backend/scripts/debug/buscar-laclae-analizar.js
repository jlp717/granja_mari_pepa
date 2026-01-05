/**
 * BUSCAR TABLA LACLAE EN TODOS LOS SCHEMAS
 * =========================================
 * Y comparar línea por línea con el texto de referencia
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

// Valores de referencia exactos del texto:
// Serie A 10%: 23.429,03€
// Serie A 4%: 5.662,76€
// Serie F 10%: 165,01€
const REF = {
    a10: 23429.03,
    a4: 5662.76,
    f10: 165.01,
    total: 29256.80
};

async function buscarLaclae() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  BUSCAR TABLA LACLAE Y ANALIZAR DIFERENCIAS                     ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. BUSCAR TABLAS CON NOMBRE SIMILAR A LACLAE
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. BUSCAR TABLAS CON NOMBRE SIMILAR A LACLAE O LIV');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryTablas = `
        SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TEXT
        FROM QSYS2.SYSTABLES
        WHERE (UPPER(TABLE_NAME) LIKE '%LACLA%'
           OR UPPER(TABLE_NAME) LIKE '%LIV%'
           OR UPPER(TABLE_NAME) LIKE '%347%'
           OR UPPER(TABLE_NAME) LIKE '%LIBRO%')
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `;

            const tablas = await pool.query(queryTablas);
            console.log(`Tablas encontradas: ${tablas.length}`);
            tablas.forEach(t => {
                console.log(`  ${t.TABLE_SCHEMA}.${t.TABLE_NAME}: ${t.TABLE_TEXT || ''}`);
            });
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. ANALIZAR CAC USANDO EL TEXTO DE REFERENCIA
        // ═══════════════════════════════════════════════════════════════
        // El sistema de referencia muestra:
        // - Líneas individuales por tipo de IVA dentro de cada factura
        // - Algunos campos tienen IVA vacío (línea 2025-A-000-000672 tiene "10,00" pero sin base)

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. ANALIZAR CAC CON CONDICIONES EXACTAS');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Calcular totales por tipo de IVA usando columnas individuales
        const queryIVA = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        C.PORCENTAJEIVA1 as PORC,
        SUM(C.IMPORTEBASEIMPONIBLE1) as BASE,
        SUM(C.IMPORTEIVA1) as IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F', 'N')
        AND C.PORCENTAJEIVA1 > 0
      GROUP BY TRIM(C.SERIEFACTURA), C.PORCENTAJEIVA1
      
      UNION ALL
      
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        C.PORCENTAJEIVA3 as PORC,
        SUM(C.IMPORTEBASEIMPONIBLE3) as BASE,
        SUM(C.IMPORTEIVA3) as IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F', 'N')
        AND C.PORCENTAJEIVA3 > 0
      GROUP BY TRIM(C.SERIEFACTURA), C.PORCENTAJEIVA3
      
      UNION ALL
      
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        C.PORCENTAJEIVA5 as PORC,
        SUM(C.IMPORTEBASEIMPONIBLE5) as BASE,
        SUM(C.IMPORTEIVA5) as IVA
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F', 'N')
        AND C.PORCENTAJEIVA5 > 0
      GROUP BY TRIM(C.SERIEFACTURA), C.PORCENTAJEIVA5
    `;

        try {
            const ivas = await pool.query(queryIVA);

            // Agrupar resultados
            let a10 = 0, a4 = 0, f10 = 0;

            ivas.forEach(i => {
                const base = parseFloat(i.BASE) || 0;
                const porc = parseFloat(i.PORC) || 0;

                if (i.SERIE === 'A' && porc >= 9.5 && porc <= 10.5) {
                    a10 += base;
                } else if (i.SERIE === 'A' && porc >= 3.5 && porc <= 4.5) {
                    a4 += base;
                } else if (i.SERIE === 'F' && porc >= 9.5 && porc <= 10.5) {
                    f10 += base;
                }
            });

            console.log('Nuestros totales (CAC con todas las columnas):');
            console.log(`  Serie A 10%: ${a10.toFixed(2)}€ (Ref: ${REF.a10.toFixed(2)}€, Diff: ${(a10 - REF.a10).toFixed(2)}€)`);
            console.log(`  Serie A 4%:  ${a4.toFixed(2)}€ (Ref: ${REF.a4.toFixed(2)}€, Diff: ${(a4 - REF.a4).toFixed(2)}€)`);
            console.log(`  Serie F 10%: ${f10.toFixed(2)}€ (Ref: ${REF.f10.toFixed(2)}€, Diff: ${(f10 - REF.f10).toFixed(2)}€)`);
            console.log(`  TOTAL:       ${(a10 + a4 + f10).toFixed(2)}€ (Ref: ${REF.total.toFixed(2)}€)`);
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 3. COMPARAR FACTURA POR FACTURA CON EL TEXTO
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. VERIFICAR PRIMERAS FACTURAS VS REFERENCIA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Referencia primera factura: 2024-A-000-009112 → 258,01 + 22,61 + 19,29 = 299,91
        // Nuestra: A-9112 → 299,91 (coincide)

        const queryPrimeras = `
      SELECT
        TRIM(C.SERIEFACTURA) || '-' || C.NUMEROFACTURA as FACTURA,
        C.EJERCICIOFACTURA as EJERC,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        C.IMPORTEBASEIMPONIBLE1 as B1,
        C.PORCENTAJEIVA1 as P1,
        C.IMPORTEBASEIMPONIBLE3 as B3,
        C.PORCENTAJEIVA3 as P3,
        C.IMPORTEBASEIMPONIBLE5 as B5,
        C.PORCENTAJEIVA5 as P5
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.MESFACTURA = 1
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F', 'N')
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      ORDER BY C.DIAFACTURA, C.NUMEROFACTURA
      FETCH FIRST 15 ROWS ONLY
    `;

        try {
            const primeras = await pool.query(queryPrimeras);
            console.log('Comparación de primeras facturas:');
            console.log('Factura    | Ejerc | Fecha     | B1(10%)   | B3(4%)    | B5(10%)   | TOTAL');
            console.log('-----------|-------|-----------|-----------|-----------|-----------|--------');

            primeras.forEach(f => {
                const b1 = parseFloat(f.B1) || 0;
                const b3 = parseFloat(f.B3) || 0;
                const b5 = parseFloat(f.B5) || 0;
                const total = b1 + b3 + b5;
                console.log(
                    `${f.FACTURA.padEnd(10)} | ${f.EJERC} | ${f.FECHA.padEnd(9)} | ` +
                    `${b1.toFixed(2).padStart(9)} | ${b3.toFixed(2).padStart(9)} | ${b5.toFixed(2).padStart(9)} | ` +
                    `${total.toFixed(2).padStart(8)}`
                );
            });

            console.log('\nReferencia del texto:');
            console.log('2024-A-009112: 258,01(10%) + 22,61(4%) + 19,29(10%) = 299,91€');
            console.log('2024-A-009160: 273,43(10%) = 273,43€');
            console.log('2024-A-009161: 41,40(4%) = 41,40€');
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // 4. VER SI HAY LÍNEAS CON BASE 0 QUE NOSOTROS INCLUIMOS
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. LÍNEAS CON BASE 0 EN EL TEXTO DE REFERENCIA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // En el texto hay líneas como "10,00" solo, sin base visible
        // Esto significa que el sistema de referencia EXCLUYE líneas con base=0

        console.log('El texto muestra líneas con IVA pero sin base visible:');
        console.log('  - 2025-A-000-000672: "10,00 15,70" (base=0, IVA=0, línea con 10%)');
        console.log('  - 2025-A-000-000976: "4,00" (solo porcentaje, sin base)');
        console.log('');
        console.log('Esto confirma que las líneas con BASE=0 NO se suman al total.');
        console.log('Nosotros ya las excluimos con HAVING BASE <> 0.');

        // ═══════════════════════════════════════════════════════════════
        // 5. BUSCAR LA DIFERENCIA EXACTA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. PROBAR CON EJERCICIOFACTURA EN VEZ DE ANOFACTURA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Las 3 primeras facturas del texto tienen EJERCICIO 2024
        // pero fecha 2025, y SÍ aparecen en el libro de 2025

        // El texto menciona "libro 347" - esto sugiere una tabla o vista específica

        console.log('Observación del texto de referencia:');
        console.log('  - Las facturas 2024-A-009112, 009160, 009161 tienen fecha enero 2025');
        console.log('  - Y SÍ aparecen en el libro de 2025');
        console.log('  - Por lo tanto, se filtra por FECHA, no por EJERCICIO');
        console.log('  - Pero nosotros ya usamos ANOFACTURA que es la fecha'); '

        console.log('\n✓ Análisis completado\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        if (pool) {
            await pool.close();
            console.log('✓ Pool cerrado\n');
        }
    }
}

buscarLaclae().catch(console.error);
