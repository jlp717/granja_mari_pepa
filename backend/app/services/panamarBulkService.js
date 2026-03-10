const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');
const logger = require('../utils/logger');
const panamarPdfService = require('./panamarPdfService');
const panamarService = require('./panamarService');

/**
 * SERVICIO DE DESCARGAS MASIVAS PANAMAR - v4.0 (TRAMOS POR CLIENTE)
 * ==================================================================
 * Genera 6 ZIPs separados por rangos de código de cliente,
 * descargándose progresivamente conforme cada tramo termina.
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

// ── Procesamiento por tramos (secuencial) ───────────────────────────
async function processTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) return;

  logger.info(`🚀 Bulk Task [${taskId}] - ${task.totalGeneral} docs en ${task.chunks.length} tramos`);

  for (const chunk of task.chunks) {
    if (!tasks.has(taskId) || tasks.get(taskId).status === 'error') return;

    chunk.status = 'processing';
    saveTasksToDisk();

    logger.info(`📦 Chunk ${chunk.index} [${chunk.label}]: Iniciando (${chunk.desde} → ${chunk.hasta})`);

    // Contar docs en este rango
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
      saveTasksToDisk();
      continue;
    }

    logger.info(`📦 Chunk ${chunk.index} [${chunk.label}]: ${chunk.total} documentos`);

    // Generar ZIP para este tramo
    await generateChunkZip(taskId, chunk);

    if (chunk.status !== 'error') {
      chunk.status = 'completed';
      task.totalProcessed += chunk.processed;
      logger.info(`✅ Chunk ${chunk.index} [${chunk.label}]: Completado (${chunk.processed} docs)`);
    }
    saveTasksToDisk();
  }

  // Verificar si el task sigue existiendo (pudo ser cancelado)
  const finalTask = tasks.get(taskId);
  if (finalTask && finalTask.status !== 'error') {
    finalTask.status = 'completed';
    saveTasksToDisk();
    logger.info(`✅ Bulk Task [${taskId}]: TODOS los tramos completados`);
  }
}

async function generateChunkZip(taskId, chunk) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(chunk.zipPath);
    const archive = archiver('zip', { zlib: { level: 1 } });

    output.on('close', resolve);
    archive.on('error', (err) => {
      chunk.status = 'error';
      reject(err);
    });

    archive.pipe(output);

    const task = tasks.get(taskId);

    (async () => {
      const DOC_PAGE_SIZE = 50;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        if (!tasks.has(taskId) || tasks.get(taskId).status === 'error') {
          archive.abort();
          return;
        }

        const result = await panamarService.getDocuments({
          ...task.filters,
          codigoClienteDesde: chunk.desde,
          codigoClienteHasta: chunk.hasta,
          page,
          pageSize: DOC_PAGE_SIZE,
          bypassMaxLimit: true,
        });

        const docs = result.documents || [];
        if (docs.length === 0) {
          hasMore = false;
          break;
        }

        for (const doc of docs) {
          if (!tasks.has(taskId)) {
            archive.abort();
            return;
          }

          await new Promise((resolvePdf, rejectPdf) => {
            try {
              const pdfStream = panamarPdfService.generateAlbaranPDFStream(doc);
              const clientName = (doc.nombreCliente || 'Cliente')
                .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '_')
                .substring(0, 20);
              const pdfName = `${doc.codigoCliente}_Albaran_${doc.terminal || ''}-${doc.numeroAlbaran}_${clientName}.pdf`;

              pdfStream.on('end', resolvePdf);
              pdfStream.on('error', (e) => {
                logger.error(`❌ PDF Error [${taskId}] chunk ${chunk.index}:`, e);
                resolvePdf(); // No romper el ZIP entero por 1 PDF fallido
              });

              archive.append(pdfStream, { name: pdfName });
              chunk.processed++;
            } catch (err) {
              logger.error(`❌ PDF Error [${taskId}] chunk ${chunk.index}:`, err);
              resolvePdf(); // Continuar
            }
          });

          // Breathing room para GC
          if (chunk.processed % 25 === 0) {
            await new Promise(r => setTimeout(r, 10));
          }
        }

        // Guardar progreso
        saveTasksToDisk();

        if (docs.length < DOC_PAGE_SIZE || chunk.processed >= chunk.total) {
          hasMore = false;
        } else {
          page++;
        }
      }

      await archive.finalize();
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
  const ONE_HOUR = 3600000;
  let changed = false;
  for (const [id, task] of tasks.entries()) {
    if (now - task.startTime > ONE_HOUR) {
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
