const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');
const logger = require('../utils/logger');
const panamarPdfService = require('./panamarPdfService');
const panamarService = require('./panamarService');

/**
 * SERVICIO DE DESCARGAS MASIVAS PANAMAR - v5.0 (TURBO OPTIMIZED)
 * ==================================================================
 * Genera 6 ZIPs separados por rangos de código de cliente,
 * descargándose progresivamente conforme cada tramo termina.
 *
 * v5.0 Optimizaciones:
 *  - 🚀 Pipeline de 2 chunks simultáneos
 *  - 🚀 PDFs en batches de 5 concurrentes
 *  - 🚀 Page size 200 (4× menos roundtrips SQL)
 *  - 🚀 ZIP store mode (0% compresión, PDFs ya comprimidos)
 *  - 🚀 Prefetch siguiente página SQL
 *  - 🚀 Batch COUNT de todos los chunks en 1 query
 *  - 🚀 Persistencia throttled (cada 200 docs)
 *
 * Rangos definidos por Diego:
 *   1) 4300000000 – 4300007000
 *   2) 4300007001 – 4300009000
 *   3) 4300009001 – 4300010000
 *   4) 4300010001 – 4300020000
 *   5) 4300020001 – 4300032500
 *   6) 4300032501 – 4300099999
 */

// ── Constantes ──────────────────────────────────────────────────────
const TMP_DIR = path.join(__dirname, '../../temp/bulk-downloads');
const TASKS_FILE = path.join(TMP_DIR, 'tasks.json');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

const CLIENT_RANGES = [
  { desde: '4300000000', hasta: '4300007000', label: 'Clientes_0000-7000' },
  { desde: '4300007001', hasta: '4300009000', label: 'Clientes_7001-9000' },
  { desde: '4300009001', hasta: '4300010000', label: 'Clientes_9001-10000' },
  { desde: '4300010001', hasta: '4300020000', label: 'Clientes_10001-20000' },
  { desde: '4300020001', hasta: '4300032500', label: 'Clientes_20001-32500' },
  { desde: '4300032501', hasta: '4300099999', label: 'Clientes_32501-99999' },
];

// 🚀 Performance constants
const DOC_PAGE_SIZE = 200;     // 4× less SQL roundtrips (was 50)
const PDF_CONCURRENCY = 5;     // Generate 5 PDFs at a time
const CHUNK_PIPELINE = 2;      // Process 2 chunks simultaneously
const SAVE_EVERY_N_DOCS = 200; // Throttle disk persistence

// ── Persistencia ────────────────────────────────────────────────────
let tasks = new Map();

function saveTasksToDisk() {
  try {
    const data = JSON.stringify(Array.from(tasks.entries()), null, 2);
    fs.writeFileSync(TASKS_FILE, data);
  } catch (err) {
    logger.error('❌ Error saving tasks to disk:', err);
  }
}

function loadTasksFromDisk() {
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const data = fs.readFileSync(TASKS_FILE, 'utf8');
      const entries = JSON.parse(data);
      tasks = new Map(entries);

      let changed = false;
      for (const [id, task] of tasks.entries()) {
        if (task.status === 'processing') {
          task.status = 'error';
          task.error = 'Servidor reiniciado durante el proceso';
          // Mark all pending/processing chunks as error too
          if (task.chunks) {
            for (const chunk of task.chunks) {
              if (chunk.status === 'processing' || chunk.status === 'pending') {
                chunk.status = 'error';
              }
            }
          }
          changed = true;
        }
      }
      if (changed) saveTasksToDisk();
      logger.info(`📦 Loaded ${tasks.size} tasks from disk`);
    }
  } catch (err) {
    logger.error('❌ Error loading tasks from disk:', err);
    tasks = new Map();
  }
}

loadTasksFromDisk();

// ── Crear tarea con tramos ──────────────────────────────────────────
async function createTask(filters, codigoCliente) {
  const taskId = crypto.randomUUID();
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // Calcular total general (rápido, solo count)
  const initialResult = await panamarService.getDocuments({ ...filters, page: 1, pageSize: 1 });
  const totalGeneral = initialResult.total || 0;

  // Crear chunks para cada rango de clientes
  const chunks = CLIENT_RANGES.map((range, index) => {
    const zipFilename = `PANAMAR_${timestamp}_${range.label}.zip`;
    const zipPath = path.join(TMP_DIR, `${taskId}_chunk${index}_${zipFilename}`);
    return {
      index,
      label: range.label,
      desde: range.desde,
      hasta: range.hasta,
      status: 'pending', // pending | processing | completed | skipped | error
      total: 0,
      processed: 0,
      zipPath,
      zipFilename,
    };
  });

  const task = {
    id: taskId,
    status: 'processing',
    totalGeneral,
    totalProcessed: 0,
    chunks,
    startTime: Date.now(),
    error: null,
    codigoCliente,
    filters,
  };

  tasks.set(taskId, task);
  saveTasksToDisk();

  // Iniciar proceso en background
  processTask(taskId).catch(err => {
    logger.error(`❌ Bulk Task Error [${taskId}]:`, err);
    const t = tasks.get(taskId);
    if (t) {
      t.status = 'error';
      t.error = err.message;
      saveTasksToDisk();
    }
  });

  return { taskId, total: totalGeneral, totalChunks: chunks.length };
}

// ── 🚀 Procesamiento por tramos (pipeline de 2 simultáneos) ────────
async function processTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) return;

  const startMs = Date.now();
  logger.info(`🚀 Bulk Task [${taskId}] - ${task.totalGeneral} docs en ${task.chunks.length} tramos (TURBO: pipeline=${CHUNK_PIPELINE}, pdf_batch=${PDF_CONCURRENCY}, page=${DOC_PAGE_SIZE})`);

  // 🚀 Opt 1: Batch COUNT — count all chunks in parallel first
  await batchCountChunks(task);
  saveTasksToDisk();

  // 🚀 Opt 8: Pipeline de CHUNK_PIPELINE chunks simultáneos
  const pendingChunks = task.chunks.filter(c => c.status !== 'skipped');
  for (let i = 0; i < pendingChunks.length; i += CHUNK_PIPELINE) {
    if (!tasks.has(taskId) || tasks.get(taskId).status === 'error') return;

    const batch = pendingChunks.slice(i, i + CHUNK_PIPELINE);
    // Process CHUNK_PIPELINE chunks in parallel
    await Promise.all(batch.map(async (chunk) => {
      if (!tasks.has(taskId) || tasks.get(taskId).status === 'error') return;

      chunk.status = 'processing';
      saveTasksToDisk();

      logger.info(`📦 Chunk ${chunk.index} [${chunk.label}]: Iniciando (${chunk.total} docs)`);

      await generateChunkZip(taskId, chunk);

      if (chunk.status !== 'error') {
        chunk.status = 'completed';
        task.totalProcessed += chunk.processed;
        logger.info(`✅ Chunk ${chunk.index} [${chunk.label}]: Completado (${chunk.processed} docs)`);
      }
      saveTasksToDisk();
    }));
  }

  // Verificar si el task sigue existiendo (pudo ser cancelado)
  const finalTask = tasks.get(taskId);
  if (finalTask && finalTask.status !== 'error') {
    finalTask.status = 'completed';
    const elapsedSec = ((Date.now() - startMs) / 1000).toFixed(1);
    logger.info(`✅ Bulk Task [${taskId}]: TODOS los tramos completados en ${elapsedSec}s`);
    saveTasksToDisk();
  }
}

// 🚀 Opt 1: Count all chunks in a single batch (parallel queries)
async function batchCountChunks(task) {
  const countPromises = task.chunks.map(async (chunk) => {
    const countResult = await panamarService.getDocuments({
      ...task.filters,
      codigoClienteDesde: chunk.desde,
      codigoClienteHasta: chunk.hasta,
      page: 1,
      pageSize: 1,
    });
    chunk.total = countResult.total || 0;
    if (chunk.total === 0) {
      chunk.status = 'skipped';
      logger.info(`⏭️ Chunk ${chunk.index} [${chunk.label}]: 0 documentos, saltando`);
    } else {
      logger.info(`📦 Chunk ${chunk.index} [${chunk.label}]: ${chunk.total} documentos`);
    }
  });

  // Execute all COUNT queries in parallel (uses pool)
  await Promise.all(countPromises);
}

// ── 🚀 Generación de ZIP optimizada ─────────────────────────────────
async function generateChunkZip(taskId, chunk) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(chunk.zipPath);
    // 🚀 Opt 7: store mode — PDFs already compressed, skip re-compression
    const archive = archiver('zip', { store: true });

    output.on('close', resolve);
    archive.on('error', (err) => {
      chunk.status = 'error';
      reject(err);
    });

    archive.pipe(output);

    const task = tasks.get(taskId);

    (async () => {
      let page = 1;
      let hasMore = true;
      let prefetchPromise = null;

      while (hasMore) {
        if (!tasks.has(taskId) || tasks.get(taskId).status === 'error') {
          archive.abort();
          return;
        }

        // Use prefetched result or fetch current page
        let result;
        if (prefetchPromise) {
          result = await prefetchPromise;
          prefetchPromise = null;
        } else {
          result = await panamarService.getDocuments({
            ...task.filters,
            codigoClienteDesde: chunk.desde,
            codigoClienteHasta: chunk.hasta,
            page,
            pageSize: DOC_PAGE_SIZE,
            bypassMaxLimit: true,
          });
        }

        const docs = result.documents || [];
        if (docs.length === 0) {
          hasMore = false;
          break;
        }

        // 🚀 Opt 3: Prefetch next page while generating PDFs
        const mightHaveMore = docs.length >= DOC_PAGE_SIZE && chunk.processed + docs.length < chunk.total;
        if (mightHaveMore) {
          prefetchPromise = panamarService.getDocuments({
            ...task.filters,
            codigoClienteDesde: chunk.desde,
            codigoClienteHasta: chunk.hasta,
            page: page + 1,
            pageSize: DOC_PAGE_SIZE,
            bypassMaxLimit: true,
          });
        }

        // 🚀 Opt 5: Generate PDFs in batches of PDF_CONCURRENCY
        for (let i = 0; i < docs.length; i += PDF_CONCURRENCY) {
          if (!tasks.has(taskId)) {
            archive.abort();
            return;
          }

          const batch = docs.slice(i, i + PDF_CONCURRENCY);
          await Promise.all(batch.map(doc => new Promise((resolvePdf) => {
            try {
              const pdfStream = panamarPdfService.generateAlbaranPDFStream(doc);
              const clientName = (doc.nombreCliente || 'Cliente')
                .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '_')
                .substring(0, 20);
              const pdfName = `${doc.codigoCliente}_Albaran_${doc.terminal || ''}-${doc.numeroAlbaran}_${clientName}.pdf`;

              pdfStream.on('end', () => {
                chunk.processed++;
                resolvePdf();
              });
              pdfStream.on('error', (e) => {
                logger.error(`❌ PDF Error [${taskId}] chunk ${chunk.index}:`, e);
                chunk.processed++;
                resolvePdf(); // No romper el ZIP entero por 1 PDF fallido
              });

              archive.append(pdfStream, { name: pdfName });
            } catch (err) {
              logger.error(`❌ PDF Error [${taskId}] chunk ${chunk.index}:`, err);
              chunk.processed++;
              resolvePdf(); // Continuar
            }
          })));

          // 🚀 Opt 9: Throttled persistence (every SAVE_EVERY_N_DOCS)
          if (chunk.processed % SAVE_EVERY_N_DOCS < PDF_CONCURRENCY) {
            saveTasksToDisk();
          }
        }

        // End of page
        if (docs.length < DOC_PAGE_SIZE || chunk.processed >= chunk.total) {
          hasMore = false;
        } else {
          page++;
        }
      }

      await archive.finalize();

      // ✅ Verificar integridad: el ZIP debe tener tamaño > 0
      await new Promise(r => setTimeout(r, 100)); // Esperar a que el write stream cierre
      if (fs.existsSync(chunk.zipPath)) {
        const zipSize = fs.statSync(chunk.zipPath).size;
        if (zipSize === 0) {
          throw new Error(`ZIP vacío generado para chunk ${chunk.index} [${chunk.label}]`);
        }
        logger.info(`📦 Chunk ${chunk.index} [${chunk.label}]: ZIP generado (${(zipSize / 1024 / 1024).toFixed(1)}MB)`);
      }
    })().catch(err => {
      archive.abort();
      chunk.status = 'error';
      reject(err);
    });
  });
}

// ── Estado de tarea ─────────────────────────────────────────────────
function getTaskStatus(taskId) {
  const task = tasks.get(taskId);
  if (!task) return null;

  return {
    id: task.id,
    status: task.status,
    totalGeneral: task.totalGeneral,
    totalProcessed: task.totalProcessed,
    startTime: task.startTime,
    error: task.error,
    chunks: task.chunks.map(c => ({
      index: c.index,
      label: c.label,
      status: c.status,
      total: c.total,
      processed: c.processed,
      zipFilename: c.zipFilename,
    })),
  };
}

// ── Descargar ZIP de un chunk ───────────────────────────────────────
function getChunkZipInfo(taskId, chunkIndex) {
  const task = tasks.get(taskId);
  if (!task) return null;

  const chunk = task.chunks[chunkIndex];
  if (!chunk || (chunk.status !== 'completed')) return null;

  if (!fs.existsSync(chunk.zipPath)) return null;

  return {
    zipPath: chunk.zipPath,
    zipFilename: chunk.zipFilename,
    size: fs.statSync(chunk.zipPath).size,
  };
}

// ── Limpiar tarea ───────────────────────────────────────────────────
function cleanupTask(taskId) {
  const task = tasks.get(taskId);
  if (task) {
    for (const chunk of (task.chunks || [])) {
      if (chunk.zipPath && fs.existsSync(chunk.zipPath)) {
        try { fs.unlinkSync(chunk.zipPath); } catch (e) { /* */ }
      }
    }
    tasks.delete(taskId);
    saveTasksToDisk();
    return true;
  }
  return false;
}

// ── Auto-limpieza cada 10 min ───────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  const THREE_HOURS = 10800000; // 3 horas para dar margen a descargas lentas
  let changed = false;
  for (const [id, task] of tasks.entries()) {
    if (now - task.startTime > THREE_HOURS) {
      logger.info(`🧹 Autocleaning old bulk task: ${id}`);
      for (const chunk of (task.chunks || [])) {
        if (chunk.zipPath && fs.existsSync(chunk.zipPath)) {
          try { fs.unlinkSync(chunk.zipPath); } catch (e) { /* */ }
        }
      }
      tasks.delete(id);
      changed = true;
    }
  }
  if (changed) saveTasksToDisk();
}, 600000);

module.exports = {
  CLIENT_RANGES,
  createTask,
  getTaskStatus,
  getChunkZipInfo,
  cleanupTask,
  tasks,
};
