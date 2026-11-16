/**
 * CARGA DE REVISTAS EN IBM i
 * ==========================
 * Registra todos los PDF de `frontend/public/catalogs` en JAVIER.ADMIN_MAGAZINES,
 * guarda una copia binaria en PDF_DATA y deja todas las ediciones activas.
 *
 * Uso: node scripts/seed-magazines.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const odbc = require('odbc');

const CATALOGS = path.join(__dirname, '..', '..', 'frontend', 'public', 'catalogs');

const MAGAZINES = [
  {
    id: 'mag-2026-01',
    file: 'enero-2026-granja-mari-pepa.pdf',
    title: 'Revista Mari Pepa',
    edition: 'Enero 2026',
    date: '2026-01-01',
    description:
      'Apertura de campaña: congelado, refrigerado y temperatura ambiente para la hostelería de Murcia y Almería.',
  },
  {
    id: 'mag-2026-02',
    file: 'topgel-febrero-2026.pdf',
    title: 'Revista Topgel',
    edition: 'Febrero 2026',
    date: '2026-02-01',
    description:
      'Selección de producto, novedades de campaña y propuestas para carta de invierno.',
  },
  {
    id: 'mag-2026-03',
    file: 'gmp-marzo-2026.pdf',
    title: 'Revista Mari Pepa',
    edition: 'Marzo 2026',
    date: '2026-03-01',
    description:
      'Catálogo de referencia para HORECA: congelado, refrigerado y temperatura ambiente.',
  },
  {
    id: 'mag-2026-04',
    file: 'abril-2026-topgel.pdf',
    title: 'Revista Topgel',
    edition: 'Abril 2026',
    date: '2026-04-01',
    description:
      'Propuestas de primavera, novedades de producto y surtido para carta de temporada.',
  },
  {
    id: 'mag-2026-05',
    file: 'mayo-2026-topgel.pdf',
    title: 'Revista Topgel',
    edition: 'Mayo 2026',
    date: '2026-05-01',
    description:
      'Selección para cartas de primavera-verano y productos de alta rotación.',
  },
  {
    id: 'mag-2026-06',
    file: 'junio-2026-granja-mari-pepa.pdf',
    title: 'Revista Mari Pepa',
    edition: 'Junio 2026',
    date: '2026-06-01',
    description:
      'Catálogo de verano con referencias para hostelería, restauración y colectividades.',
  },
  {
    id: 'mag-2026-07',
    file: 'julio-agosto-2026-granja-mari-pepa.pdf',
    title: 'Revista Mari Pepa',
    edition: 'Julio-Agosto 2026',
    date: '2026-07-01',
    description:
      'Edición conjunta de julio y agosto: producto de temporada y propuestas para carta.',
  },
  {
    id: 'mag-2026-09',
    file: 'septiembre-2026-topgel.pdf',
    title: 'Revista Topgel',
    edition: 'Septiembre 2026',
    date: '2026-09-01',
    description:
      'Vuelta a la rutina con novedades de producto y surtido para la nueva temporada.',
  },
  {
    id: 'mag-2026-10',
    file: 'octubre-noviembre-2026-topgel.pdf',
    title: 'Revista Topgel',
    edition: 'Octubre-Noviembre 2026',
    date: '2026-10-01',
    description:
      'Edición de otoño: propuestas de carta, novedades y referencias de temporada.',
  },
  {
    id: 'mag-2026-12',
    file: 'navidad-2026-topgel.pdf',
    title: 'Revista Topgel',
    edition: 'Navidad 2026',
    date: '2026-12-01',
    description:
      'Especial de Navidad: productos, elaboraciones y propuestas para las fiestas.',
  },
];

async function main() {
  const connection = await odbc.connect(
    process.env.ODBC_CONNECTION_STRING,
  );
  try {
    await connection.query("DELETE FROM JAVIER.ADMIN_MAGAZINES");
    for (const magazine of MAGAZINES) {
      const full = path.join(CATALOGS, magazine.file);
      const pdf = fs.readFileSync(full);
      const cover = `/catalogs/covers/${magazine.file.replace(/\.pdf$/i, '.jpg')}`;
      await connection.query(
        `INSERT INTO JAVIER.ADMIN_MAGAZINES
          (ID, TITLE, EDITION, PUB_DATE, DESCRIPTION, PDF_URL, PDF_NAME, COVER_URL,
           STATUS, PDF_DATA, ACTIVE, CREATED_BY, UPDATED_BY)
         VALUES (?,?,?,?,?,?,?,?, 'published', ?, 1, 'Sistema', 'Sistema')`,
        [
          magazine.id,
          magazine.title,
          magazine.edition,
          magazine.date,
          magazine.description,
          `/catalogs/${magazine.file}`,
          magazine.file,
          cover,
          pdf,
        ],
      );
      console.log('OK', magazine.edition, Math.round(pdf.length / 1024 / 1024) + 'MB');
    }
    const count = await connection.query(
      "SELECT COUNT(*) AS N FROM JAVIER.ADMIN_MAGAZINES WHERE ACTIVE = 1",
    );
    console.log('TOTAL', count[0].N);
  } finally {
    await connection.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('ERROR', error.message || error);
    process.exit(1);
  });
