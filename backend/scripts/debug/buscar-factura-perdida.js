/**
 * BUSCAR FACTURA PERDIDA (~3079€)
 * ===============================
 * Busca cualquier factura o albarán en 2025 para el cliente 30853
 * que tenga un importe cercano a la diferencia encontrada.
 */

const odbc = require('odbc');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       BUSCANDO LOS 3.079,10€ PERDIDOS                             ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    const connectionString = process.env.ODBC_CONNECTION_STRING;
    let connection = await odbc.connect(connectionString);

    const codigoCliente = '4300030853';
    const diff = 3079.10;
    const margen = 5.0; // +/- 5€

    console.log(`🔍 Buscando importes entre ${(diff - margen)} y ${(diff + margen)}...`);

    // 1. Buscar en TODOS los campos de importe de CAC
    const query = `
        SELECT *
        FROM DSEDAC.CAC
        WHERE TRIM(CODIGOCLIENTEFACTURA) = '${codigoCliente}'
          AND ANOFACTURA = 2025
    `;
    const rows = await connection.query(query);

    rows.forEach(r => {
        // Calcular total de esta fila (albarán)
        const base = r.IMPORTEBASEIMPONIBLE1 + r.IMPORTEBASEIMPONIBLE2 + r.IMPORTEBASEIMPONIBLE3 + r.IMPORTEBASEIMPONIBLE4 + r.IMPORTEBASEIMPONIBLE5;
        const iva =
            (r.IMPORTEBASEIMPONIBLE1 * (r.PORCENTAJEIVA1 / 100)) + // Simplificado, cuidado con nulls
            (r.IMPORTEBASEIMPONIBLE2 * (r.PORCENTAJEIVA2 / 100)) +
            (r.IMPORTEBASEIMPONIBLE3 * (r.PORCENTAJEIVA3 / 100)) +
            (r.IMPORTEBASEIMPONIBLE4 * (r.PORCENTAJEIVA4 / 100)) +
            (r.IMPORTEBASEIMPONIBLE5 * (r.PORCENTAJEIVA5 / 100));
        // Nota: El calculo exacto de IVA es complejo con los CASE, pero para buscar aprox vale
        const recargo = r.IMPORTERECARGO1 + r.IMPORTERECARGO2 + r.IMPORTERECARGO3 + r.IMPORTERECARGO4 + r.IMPORTERECARGO5;
        const total = base + iva + recargo;

        if (Math.abs(total - diff) < margen) {
            console.log(`🎯 ENCONTRADO CANDIDATO (ALBARÁN):`);
            console.log(`   Factura: ${r.SERIEFACTURA}-${r.NUMEROFACTURA}`);
            console.log(`   Albarán: ${r.NUMEROALBARAN}`);
            console.log(`   Total: ${total.toFixed(2)}€`);
        }

        // También buscar si el TOTALFACTURA coincide (a veces se guarda el total de la factura entera)
        if (Math.abs(r.TOTALFACTURA - diff) < margen) {
            console.log(`🎯 ENCONTRADO CANDIDATO (TOTALFACTURA):`);
            console.log(`   Factura: ${r.SERIEFACTURA}-${r.NUMEROFACTURA}`);
            console.log(`   TotalFactura BD: ${r.TOTALFACTURA}`);
        }
    });

    console.log('\n🔍 Resumen Agrupado por Serie:');
    const series = {};
    rows.forEach(r => {
        const s = r.SERIEFACTURA.trim();
        if (!series[s]) series[s] = 0;

        // Recalcular total fila bien
        const bases = r.IMPORTEBASEIMPONIBLE1 + r.IMPORTEBASEIMPONIBLE2 + r.IMPORTEBASEIMPONIBLE3 + r.IMPORTEBASEIMPONIBLE4 + r.IMPORTEBASEIMPONIBLE5;
        // ... (asumimos logica correcta arriba)
        const recargo = r.IMPORTERECARGO1 + r.IMPORTERECARGO2 + r.IMPORTERECARGO3 + r.IMPORTERECARGO4 + r.IMPORTERECARGO5;

        // Helper calc IVA
        const calcIva = (base, pct) => {
            if ([7, 10, 1].includes(pct)) return base * 0.10;
            if ([16, 21, 2].includes(pct)) return base * 0.21;
            if ([4, 3].includes(pct)) return base * 0.04;
            return 0;
        };
        const iva = calcIva(r.IMPORTEBASEIMPONIBLE1, r.PORCENTAJEIVA1) +
            calcIva(r.IMPORTEBASEIMPONIBLE2, r.PORCENTAJEIVA2) +
            calcIva(r.IMPORTEBASEIMPONIBLE3, r.PORCENTAJEIVA3) +
            calcIva(r.IMPORTEBASEIMPONIBLE4, r.PORCENTAJEIVA4) +
            calcIva(r.IMPORTEBASEIMPONIBLE5, r.PORCENTAJEIVA5);

        series[s] += (bases + iva + recargo);
    });

    for (const [serie, total] of Object.entries(series)) {
        console.log(`   Serie ${serie}: ${total.toFixed(2)}€`);
    }

    await connection.close();
}

main().catch(e => console.error(e));
