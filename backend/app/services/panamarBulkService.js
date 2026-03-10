const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');
const logger = require('../utils/logger');
const panamarPdfService = require('./panamarPdfService');
const panamarService = require('./panamarService');

/**
 * SERVICIO DE DESCARGAS MASIVAS PANAMAR (PERSISTENTE)
 * ==================================================
 * Gestiona tareas asíncronas para generar ZIPs.
 * Ahora persiste el estado en disco para sobrevivir a reinicios.
 */

// Directorio temporal
const TMP_DIR = path.join(__dirname, '../../temp/bulk-downloads');
const TASKS_FILE = path.join(TMP_DIR, 'tasks.json');

if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Mapa de tareas en memoria, sincronizado con disco
let tasks = new Map();

/**
 * Persistencia: Cargar y Guardar en disco
 */
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

            // Limpiar tareas que se quedaron "processing" tras un crash/reinicio
            let changed = false;
            for (const [id, task] of tasks.entries()) {
                if (task.status === 'processing') {
                    task.status = 'error';
                    task.error = 'Servidor reiniciado durante el proceso';
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

// Cargar al iniciar el módulo
loadTasksFromDisk();

/**
 * Inicia una nueva tarea de descarga masiva basándose en filtros
 */
async function createTask(filters, codigoCliente) {
    const taskId = crypto.randomUUID();
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zipFilename = `PANAMAR_${timestamp}_${taskId.slice(0, 8)}.zip`;
    const zipPath = path.join(TMP_DIR, zipFilename);

    // Primero calculamos el total rápido
    const initialResult = await panamarService.getDocuments({ ...filters, page: 1, pageSize: 1 });
    const total = initialResult.total || 0;

    const task = {
        id: taskId,
        status: 'processing',
        total,
        processed: 0,
        startTime: Date.now(),
        zipPath,
        zipFilename,
        error: null,
        codigoCliente,
        filters
    };

    tasks.set(taskId, task);
    saveTasksToDisk();

    // Iniciar proceso en background
    processTask(taskId).catch(err => {
        logger.error(`❌ Bulk Task Error [${taskId}]:`, err);
        task.status = 'error';
        task.error = err.message;
        saveTasksToDisk();
    });

    return { taskId, total };
}

/**
 * Proceso en segundo plano: Pagina documentos, genera PDFs y comprime
 */
async function processTask(taskId) {
    const task = tasks.get(taskId);
    if (!task) return;

    const output = fs.createWriteStream(task.zipPath);
    const archive = archiver('zip', { zlib: { level: 3 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            task.status = 'completed';
            saveTasksToDisk();
            logger.info(`✅ Bulk Task Completed [${taskId}]: ${task.processed} docs`);
            resolve();
        });

        archive.on('error', (err) => {
            task.status = 'error';
            task.error = err.message;
            saveTasksToDisk();
            reject(err);
        });

        archive.pipe(output);

        (async () => {
            const DOC_PAGE_SIZE = 50;
            const PDF_BATCH_SIZE = 8;

            let page = 1;
            let hasMore = true;

            while (hasMore) {
                if (!tasks.has(taskId) || tasks.get(taskId).status === 'error') {
                    archive.abort();
                    return;
                }

                const result = await panamarService.getDocuments({
                    ...task.filters,
                    page,
                    pageSize: DOC_PAGE_SIZE,
                    bypassMaxLimit: true
                });

                const docs = result.documents || [];
                if (docs.length === 0) {
                    hasMore = false;
                    break;
                }

                for (let i = 0; i < docs.length; i += PDF_BATCH_SIZE) {
                    if (!tasks.has(taskId)) {
                        archive.abort();
                        return;
                    }

                    const subBatch = docs.slice(i, i + PDF_BATCH_SIZE);
                    const results = await Promise.allSettled(
                        subBatch.map(async (doc) => {
                            const pdfBuffer = await panamarPdfService.generateAlbaranPDF(doc);
                            const clientName = (doc.nombreCliente || 'Cliente')
                                .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '_')
                                .substring(0, 20);
                            const pdfName = `Albaran_P-${doc.terminal || ''}-${doc.numeroAlbaran}_${clientName}.pdf`;
                            return { pdfBuffer, pdfName };
                        })
                    );

                    for (const r of results) {
                        if (r.status === 'fulfilled') {
                            archive.append(r.value.pdfBuffer, { name: r.value.pdfName });
                            task.processed++;
                        }
                    }

                    // Guardar progreso periódicamente
                    if (task.processed % (DOC_PAGE_SIZE * 2) === 0) {
                        saveTasksToDisk();
                    }
                }

                if (docs.length < DOC_PAGE_SIZE || task.processed >= task.total) {
                    hasMore = false;
                } else {
                    page++;
                }
            }

            archive.finalize();
        })().catch(err => {
            archive.abort();
            reject(err);
        });
    });
}

/**
 * Obtener estado de una tarea
 */
function getTaskStatus(taskId) {
    const task = tasks.get(taskId);
    if (!task) return null;

    return {
        id: task.id,
        status: task.status,
        total: task.total,
        processed: task.processed,
        startTime: task.startTime,
        error: task.error
    };
}

/**
 * Eliminar una tarea y su archivo físico
 */
function cleanupTask(taskId) {
    const task = tasks.get(taskId);
    if (task) {
        if (fs.existsSync(task.zipPath)) {
            try { fs.unlinkSync(task.zipPath); } catch (e) { }
        }
        tasks.delete(taskId);
        saveTasksToDisk();
        return true;
    }
    return false;
}

/**
 * Limpieza automática mejorada
 */
setInterval(() => {
    const now = Date.now();
    const ONE_HOUR = 3600000;
    let changed = false;
    for (const [id, task] of tasks.entries()) {
        if (now - task.startTime > ONE_HOUR) {
            logger.info(`🧹 Autocleaning old bulk task: ${id}`);
            if (fs.existsSync(task.zipPath)) {
                try { fs.unlinkSync(task.zipPath); } catch (e) { }
            }
            tasks.delete(id);
            changed = true;
        }
    }
    if (changed) saveTasksToDisk();
}, 600000);

module.exports = {
    createTask,
    getTaskStatus,
    cleanupTask,
    tasks
};
