/**
 * CARGA INICIAL DEL PANEL DE ADMINISTRACIÓN
 * =========================================
 * Crea el usuario administrador y traslada el contenido vigente de la web
 * (ofertas y revistas) a las tablas del esquema JAVIER.
 *
 * Uso: node scripts/init-admin-content.js
 * Requisitos: ODBC configurado (DSN=GMP;UID=JAVIER;PWD=JAVIER).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const adminService = require('../app/services/adminService');

const JOBS = [
  {
    slug: 'mozo-almacen-lorca',
    title: 'Mozo de almacén',
    department: 'Logística',
    location: 'Lorca (Murcia)',
    type: 'Jornada completa',
    schedule: 'Turnos de mañana y tarde',
    description:
      'Preparación de pedidos, carga y descarga de mercancía, control de stock y mantenimiento del orden en cámara frigorífica.',
    responsibilities: [
      'Preparar pedidos según albarán',
      'Carga y descarga de mercancía',
      'Control de stock y caducidades',
      'Mantenimiento del orden en cámara',
      'Uso de carretilla elevadora',
    ],
    requirements: [
      'Experiencia en almacén (valorable)',
      'Carnet de carretilla (valorable)',
      'Disponibilidad para turnos',
      'Residencia en Lorca o alrededores',
    ],
    offers: [
      'Turnos planificados con antelación',
      'Formación en seguridad alimentaria y PRL',
      'Equipos de protección individual',
    ],
    icon: 'warehouse',
    accent: '#5C6238',
    status: 'published',
  },
  {
    slug: 'repartidor-lorca',
    title: 'Repartidor/a',
    department: 'Logística',
    location: 'Lorca (Murcia)',
    type: 'Jornada completa',
    schedule: 'Turno de mañana',
    description:
      'Entrega de pedidos a clientes HORECA en la zona de Murcia. Conducción de furgoneta refrigerada, control de albaranes y trato directo con el cliente.',
    responsibilities: [
      'Entrega de pedidos en ruta asignada',
      'Conducción de furgoneta refrigerada',
      'Control de albaranes y firma de entrega',
      'Trato directo con clientes HORECA',
      'Mantenimiento básico del vehículo',
    ],
    requirements: [
      'Carnet B (obligatorio)',
      'Experiencia en reparto (valorable)',
      'Disponibilidad para turnos de mañana',
      'Residencia en Lorca o alrededores',
    ],
    offers: [
      'Ruta fija en la zona asignada',
      'Vehículo de empresa y combustible',
      'Formación en producto y atención al cliente',
    ],
    icon: 'truck',
    accent: '#9CB4C2',
    status: 'published',
  },
  {
    slug: 'repartidor-viator',
    title: 'Repartidor/a',
    department: 'Logística',
    location: 'Viator (Almería)',
    type: 'Jornada completa',
    schedule: 'Turno de mañana',
    description:
      'Entrega de pedidos a clientes HORECA en la zona de Almería. Conducción de furgoneta refrigerada y control de albaranes.',
    responsibilities: [
      'Entrega de pedidos en ruta asignada',
      'Conducción de furgoneta refrigerada',
      'Control de albaranes y firma de entrega',
      'Trato directo con clientes HORECA',
    ],
    requirements: [
      'Carnet B (obligatorio)',
      'Residencia en Almería o alrededores',
      'Disponibilidad para turnos de mañana',
    ],
    offers: [
      'Delegación en Viator',
      'Ruta fija en la zona asignada',
      'Formación en producto y atención al cliente',
    ],
    icon: 'truck',
    accent: '#9CB4C2',
    status: 'published',
  },
  {
    slug: 'comercial-horeca',
    title: 'Comercial HORECA',
    department: 'Ventas',
    location: 'Murcia / Almería',
    type: 'Jornada completa',
    schedule: 'Jornada comercial, según zona',
    description:
      'Visita a clientes de hostelería y restauración, asesoramiento de producto, gestión de pedidos y fidelización. Cartera de clientes asignada.',
    responsibilities: [
      'Visita a clientes HORECA',
      'Asesoramiento de producto y novedades',
      'Gestión de pedidos y seguimiento',
      'Fidelización de cartera',
      'Reporting de ventas',
    ],
    requirements: [
      'Experiencia en venta B2B (valorable)',
      'Carnet B',
      'Habilidades de comunicación y negociación',
      'Residencia en Murcia o Almería',
    ],
    offers: [
      'Cartera de clientes asignada',
      'Formación continua en producto',
      'Vehículo y herramientas de trabajo',
    ],
    icon: 'sales',
    accent: '#C24A1F',
    status: 'published',
  },
  {
    slug: 'admin-pedidos',
    title: 'Administrativo/a de pedidos',
    department: 'Administración',
    location: 'Lorca (Murcia)',
    type: 'Jornada completa',
    schedule: 'Jornada de oficina',
    description:
      'Gestión de pedidos, facturación, atención telefónica, coordinación con almacén y reparto. Uso de ERP y hojas de cálculo.',
    responsibilities: [
      'Gestión de pedidos y facturación',
      'Atención telefónica a clientes',
      'Coordinación con almacén y reparto',
      'Uso de ERP y Excel',
      'Archivo y documentación',
    ],
    requirements: [
      'Experiencia en administración',
      'Manejo de Excel y ERP',
      'Atención al detalle',
      'Disponibilidad inmediata',
    ],
    offers: [
      'Jornada de oficina en Lorca',
      'Formación en ERP y procesos internos',
      'Equipo pequeño y trato directo',
    ],
    icon: 'admin',
    accent: '#5C6238',
    status: 'published',
  },
  {
    slug: 'tecnico-calidad',
    title: 'Técnico/a de calidad',
    department: 'Calidad',
    location: 'Lorca (Murcia)',
    type: 'Jornada completa',
    schedule: 'Jornada de oficina y planta',
    description:
      'Control de calidad de producto, trazabilidad, gestión de no conformidades, auditorías internas y documentación ISO 9001.',
    responsibilities: [
      'Control de calidad de producto',
      'Gestión de trazabilidad',
      'No conformidades y CAPA',
      'Auditorías internas ISO 9001',
      'Documentación y registros',
    ],
    requirements: [
      'Formación en calidad alimentaria',
      'Conocimiento ISO 9001',
      'Experiencia en sector alimentario (valorable)',
      'Capacidad de análisis',
    ],
    offers: [
      'Formación continua en calidad y seguridad alimentaria',
      'Trabajo junto a producción y almacén',
      'Participación en auditorías y mejora continua',
    ],
    icon: 'quality',
    accent: '#9CB4C2',
    status: 'draft',
  },
];

const MAGAZINES = [
  {
    title: 'Revista Topgel',
    edition: 'Febrero 2026',
    date: '2026-02-01',
    description:
      'Selección de producto, novedades de campaña y propuestas para carta de invierno.',
    pdfUrl: '/catalogs/topgel-febrero-2026.pdf',
    pdfName: 'topgel-febrero-2026.pdf',
    status: 'published',
  },
  {
    title: 'Revista GMP',
    edition: 'Marzo 2026',
    date: '2026-03-01',
    description:
      'Catálogo de referencia para HORECA: congelado, refrigerado y temperatura ambiente.',
    pdfUrl: '/catalogs/gmp-marzo-2026.pdf',
    pdfName: 'gmp-marzo-2026.pdf',
    status: 'published',
  },
];

async function main() {
  const created = await adminService.ensureSeed(process.env.ADMIN_SEED_PASSWORD || 'MariPepa2026');
  console.log(created.created ? 'Usuario administrador creado' : 'Usuario administrador ya existe');

  const jobs = await adminService.listJobs();
  if (jobs.length === 0) {
    for (const job of JOBS) {
      const saved = await adminService.createJob(job, 'Sistema');
      console.log('Oferta creada:', saved ? saved.slug : job.slug);
    }
  } else {
    console.log(`Ofertas existentes: ${jobs.length}. No se duplica contenido.`);
  }

  const magazines = await adminService.listMagazines();
  if (magazines.length === 0) {
    for (const magazine of MAGAZINES) {
      const saved = await adminService.createMagazine(magazine, 'Sistema');
      console.log('Revista creada:', saved ? saved.title : magazine.title);
    }
  } else {
    console.log(`Revistas existentes: ${magazines.length}. No se duplica contenido.`);
  }

  const settings = await adminService.getSettings();
  console.log('Ajustes actuales:', JSON.stringify(settings));
  console.log('Carga inicial completada.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('ERROR', error.message || error);
    process.exit(1);
  });
