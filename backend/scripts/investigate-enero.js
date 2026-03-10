/**
 * Final targeted queries to find 3623
 */
const db = require('../app/config/odbcConfig');

async function run() {
  await db.initialize();

  // Test many combos systematically
  const combos = [
    { name: '700-705, 4300%, CLASE, IMPORTE', fam: "('700','701','702','703','704','705')", cli: "LIKE '4300%'", clase: true, imp: true },
    { name: '700-705, 4300%, sin CLASE, IMPORTE', fam: "('700','701','702','703','704','705')", cli: "LIKE '4300%'", clase: false, imp: true },
    { name: '700-705, 4300%, CLASE, sin IMPORTE', fam: "('700','701','702','703','704','705')", cli: "LIKE '4300%'", clase: true, imp: false },
    { name: '700-705, 4300%, sin filtros', fam: "('700','701','702','703','704','705')", cli: "LIKE '4300%'", clase: false, imp: false },
    { name: '700-705+900, 4300%, CLASE, IMPORTE', fam: "('700','701','702','703','704','705','900')", cli: "LIKE '4300%'", clase: true, imp: true },
    { name: '700-705+900, 4300%, sin filtros', fam: "('700','701','702','703','704','705','900')", cli: "LIKE '4300%'", clase: false, imp: false },
    { name: '700-705, ALL clients, CLASE, IMPORTE', fam: "('700','701','702','703','704','705')", cli: null, clase: true, imp: true },
    { name: '700-705, ALL clients, sin filtros', fam: "('700','701','702','703','704','705')", cli: null, clase: false, imp: false },
    { name: '700-705+900, ALL clients, CLASE, IMPORTE', fam: "('700','701','702','703','704','705','900')", cli: null, clase: true, imp: true },
    { name: '700-705+900, ALL clients, sin filtros', fam: "('700','701','702','703','704','705','900')", cli: null, clase: false, imp: false },
    { name: '7%, 4300%, CLASE, IMPORTE', fam: "LIKE_7", cli: "LIKE '4300%'", clase: true, imp: true },
    { name: '7%, 4300%, sin filtros', fam: "LIKE_7", cli: "LIKE '4300%'", clase: false, imp: false },
    { name: '7%+900, 4300%, CLASE, IMPORTE', fam: "LIKE_7_OR_900", cli: "LIKE '4300%'", clase: true, imp: true },
    { name: '7%+900, 4300%, sin filtros', fam: "LIKE_7_OR_900", cli: "LIKE '4300%'", clase: false, imp: false },
  ];

  for (const c of combos) {
    let famFilter;
    if (c.fam === 'LIKE_7') {
      famFilter = "TRIM(ART.CODIGOFAMILIA) LIKE '7%'";
    } else if (c.fam === 'LIKE_7_OR_900') {
      famFilter = "(TRIM(ART.CODIGOFAMILIA) LIKE '7%' OR TRIM(ART.CODIGOFAMILIA) = '900')";
    } else {
      famFilter = `TRIM(ART.CODIGOFAMILIA) IN ${c.fam}`;
    }

    let where = `CAC.EJERCICIOALBARAN = 2026 AND CAC.MESDOCUMENTO = 1 AND ${famFilter}`;
    if (c.cli) where += ` AND TRIM(CAC.CODIGOCLIENTEFACTURA) ${c.cli}`;
    if (c.clase) where += ` AND TRIM(LAC.CLASELINEA) IN ('AB','RG','VT')`;
    if (c.imp) where += ` AND LAC.IMPORTEVENTA <> 0`;

    const sql = `
      SELECT COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC
        ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
      INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
      WHERE ${where}
    `;

    try {
      const r = await db.query(sql);
      const cajas = r[0]?.CAJAS || 0;
      const mark = cajas === 3623 ? ' <<< MATCH!!!' : '';
      console.log(`${String(cajas).padStart(6)} | ${c.name}${mark}`);
    } catch (e) {
      console.log(`  ERR  | ${c.name}: ${e.message.substring(0, 50)}`);
    }
  }

  console.log('\n>>> BUSCANDO: 3623 <<<');

  await db.close();
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
