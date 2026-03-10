const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const crypto = require('crypto');
const logger = require('../utils/logger');
const panamarPdfService = require('./panamarPdfService');

/**
 * SERVICIO DE DESCARGAS MASIVAS PANAMAR
 * =====================================
 * Gestiona tareas asíncronas para generar ZIPs con miles de PDFs.
 */

// Mapa de tareas en memoria
const tasks = new Map();

// Directorio temporal para los ZIPs
const TMP_DIR = path.join(__dirname, '../../temp/bulk-downloads');
if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
}

/**
 * Inicia una nueva tarea de descarga masiva
 */
function createTask(docs, codigoCliente) {
    const taskId = crypto.randomUUID();
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zipFilename = `PANAMAR_${timestamp}_${taskId.slice(0, 8)}.zip`;
    const zipPath = path.join(TMP_DIR, zipFilename);

    const task = {
        id: taskId,
        status: 'processing',
        total: docs.length,
        processed: 0,
        startTime: Date.now(),
        zipPath,
        zipFilename,
        error: null,
        codigoCliente
    };

    tasks.set(taskId, task);

    // Iniciar proceso en background
    processTask(taskId, docs).catch(err => {
        logger.error(`❌ Bulk Task Error [${taskId}]:`, err);
        task.status = 'error';
        task.error = err.message;
    });

    return taskId;
}

/**
 * Proceso en segundo plano para generar el ZIP
 */
async function processTask(taskId, docs) {
    const task = tasks.get(taskId);
    if (!task) return;

    const output = fs.createWriteStream(task.zipPath);
    const archive = archiver('zip', { zlib: { level: 3 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => {
            task.status = 'completed';
            logger.info(`✅ Bulk Task Completed [${taskId}]: ${task.processed} docs`);
            resolve();
        });

        archive.on('error', (err) => {
            task.status = 'error';
            task.error = err.message;
            reject(err);
        });

        archive.pipe(output);

        // Procesar en lotes para no saturar CPU/Memoria ni conexiones BD
        const BATCH_SIZE = 15;

        (async () => {
            for (let i = 0; i < docs.length; i += BATCH_SIZE) {
                // Verificar si la tarea sigue existiendo (no cancelada/limpiada)
                if (!tasks.has(taskId)) {
                    archive.abort();
                    return;
                }

                const batch = docs.slice(i, i + BATCH_SIZE);
                const results = await Promise.allSettled(
                    batch.map(async (doc) => {
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
        return true;
    }
    return false;
}

/**
 * Limpieza automática de tareas viejas (> 1 hora)
 */
setInterval(() => {
    const now = Date.now();
    const ONE_HOUR = 3600000;
    for (const [id, task] of tasks.entries()) {
        if (now - task.startTime > ONE_HOUR) {
            logger.info(`🧹 Autocleaning old bulk task: ${id}`);
            cleanupTask(id);
        }
    }
}, 600000); // Cada 10 min

module.exports = {
    createTask,
    getTaskStatus,
    cleanupTask,
    tasks // Exportamos para que el controller pueda acceder al path del file
};
