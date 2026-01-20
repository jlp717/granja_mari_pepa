/**
 * ANALIZAR DETALLE LÍNEAS DE FACTURA N-12 (CORREGIDO FINAL)
 * =========================================================
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    console.log('🔍 Buscando albaranes de Factura N-12 (2025)...');

    // 1. Obtener los albaranes que componen esta factura en CAC
    // Usamos DIADOCUMENTO, MESDOCUMENTO, ANODOCUMENTO para fechas en CAC
    const queryAlbaranes = `
        SELECT SERIEALBARAN, NUMEROALBARAN, EJERCICIOALBARAN, ANODOCUMENTO AS ANOALBARAN, MESDOCUMENTO AS MESALBARAN, DIADOCUMENTO AS DIAALBARAN
        FROM DSEDAC.CAC
        WHERE TRIM(SERIEFACTURA) = 'N'
          AND NUMEROFACTURA = 12
          AND ANOFACTURA = 2025
    `;
    const albaranes = await connection.query(queryAlbaranes);

    if (albaranes.length === 0) {
        console.log('⚠️ No se encontraron albaranes para la factura N-12.');
        await connection.close();
        return;
    }

    console.log(`✅ Factura compuesta por ${albaranes.length} albaranes/abonos.`);

    // 2. Buscar líneas para cada albarán
    console.log('──────────────────────────────────────────────────────────────────');
    console.log('ALBARAN    | FECHA      | ARTICULO           | CANT | PRECIO | NETO');
    console.log('──────────────────────────────────────────────────────────────────');

    let totalNeto = 0;

    for (const alb of albaranes) {
        const fecha = `${alb.DIAALBARAN}/${alb.MESALBARAN}/${alb.ANOALBARAN}`;
        // En LAC usamos:
        // - DESCRIPCION (no DESCRIPCIONARTICULO)
        // - CANTIDADUNIDADES (no UNIDADES)
        // - PRECIOVENTA (no PRECIO)
        // - IMPORTEVENTA (no IMPORTENETO)
        const qLineas = `
            SELECT CODIGOARTICULO, DESCRIPCION, CANTIDADUNIDADES, PRECIOVENTA, IMPORTEVENTA
            FROM DSEDAC.LAC
            WHERE SERIEALBARAN = '${alb.SERIEALBARAN}'
              AND NUMEROALBARAN = ${alb.NUMEROALBARAN}
              AND EJERCICIOALBARAN = ${alb.EJERCICIOALBARAN}
        `;
        const lineas = await connection.query(qLineas);

        lineas.forEach(r => {
            const desc = r.DESCRIPCION ? r.DESCRIPCION.trim().substring(0, 18) : '---';
            console.log(`${alb.SERIEALBARAN}-${alb.NUMEROALBARAN} | ${fecha.padEnd(10)} | ${desc.padEnd(18)} | ${parseFloat(r.CANTIDADUNIDADES || 0).toFixed(2).padEnd(4)} | ${parseFloat(r.PRECIOVENTA || 0).toFixed(2).padEnd(6)} | ${parseFloat(r.IMPORTEVENTA || 0).toFixed(2)}`);
            totalNeto += parseFloat(r.IMPORTEVENTA || 0);
        });
    }

    console.log('──────────────────────────────────────────────────────────────────');
    console.log(`TOTAL LÍNEAS (NETO): ${totalNeto.toFixed(2)}€`);

    await connection.close();
}

main().catch(e => console.error(e));
