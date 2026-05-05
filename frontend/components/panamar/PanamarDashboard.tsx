'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { secureFetch, secureDownload } from '@/lib/secureFetch';
import { PanamarDocument, PanamarFilters, PanamarDocumentsResponse, PanamarSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Package, Search, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  FileText, Truck, Calendar, Users, LogOut, X,
  Download, Eye, Mail, MessageCircle, DollarSign, Settings,
  Archive, Check, ChevronDown, Box, RefreshCw
} from 'lucide-react';

const MESES = [
  { value: 1, label: 'Ene', full: 'Enero' },
  { value: 2, label: 'Feb', full: 'Febrero' },
  { value: 3, label: 'Mar', full: 'Marzo' },
  { value: 4, label: 'Abr', full: 'Abril' },
  { value: 5, label: 'May', full: 'Mayo' },
  { value: 6, label: 'Jun', full: 'Junio' },
  { value: 7, label: 'Jul', full: 'Julio' },
  { value: 8, label: 'Ago', full: 'Agosto' },
  { value: 9, label: 'Sep', full: 'Septiembre' },
  { value: 10, label: 'Oct', full: 'Octubre' },
  { value: 11, label: 'Nov', full: 'Noviembre' },
  { value: 12, label: 'Dic', full: 'Diciembre' },
];

interface BulkChunkState {
  index: number;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'skipped' | 'error';
  total: number;
  processed: number;
  zipFilename: string;
  downloaded: boolean; // ya descargado por el navegador
}

interface BulkTaskState {
  id: string;
  status: 'processing' | 'completed' | 'error';
  totalGeneral: number;
  totalProcessed: number;
  startTime: number;
  error: string | null;
  chunks: BulkChunkState[];
}

const CHUNK_COLORS = [
  'from-orange-500 to-amber-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-yellow-500 to-orange-400',
];

const BulkProgressOverlay = ({ task, onCancel, chunkDownloadStatus }: {
  task: BulkTaskState,
  onCancel: () => void,
  chunkDownloadStatus: Record<number, 'downloading' | 'retrying' | 'downloaded' | 'failed'>
}) => {
  const completedChunks = task.chunks.filter(c => c.status === 'completed' || c.status === 'skipped').length;
  const activeChunks = task.chunks.filter(c => c.status !== 'skipped');
  const totalProcessed = task.chunks.reduce((sum, c) => sum + c.processed, 0);
  const totalDocs = task.totalGeneral;
  const pct = totalDocs > 0 ? Math.round((totalProcessed / totalDocs) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 right-6 z-[60] w-full max-w-md"
    >
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-orange-100 p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
                <Archive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Descarga por tramos</h4>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">
                  {completedChunks}/{activeChunks.length} tramos · {totalProcessed} docs
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-8 w-8 text-gray-400 hover:text-orange-500 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Barra de progreso general */}
          <div className="mb-4">
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50 p-0.5">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-1.5">
              <span className="text-orange-600 font-bold flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 animate-spin" />
                {pct}%
              </span>
              <span className="text-gray-500 font-medium">{totalProcessed} de {totalDocs} documentos</span>
            </div>
          </div>

          {/* Tramos individuales */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {task.chunks.map((chunk, i) => {
              if (chunk.status === 'skipped') return null;
              const chunkPct = chunk.total > 0 ? Math.round((chunk.processed / chunk.total) * 100) : 0;
              const isActive = chunk.status === 'processing';
              const isDone = chunk.status === 'completed';

              return (
                <div key={i} className={`p-2.5 rounded-xl border transition-all ${isDone ? 'bg-emerald-50 border-emerald-200' : isActive ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isDone ? 'text-emerald-700' : isActive ? 'text-orange-700' : 'text-gray-400'}`}>
                      {isDone ? <Check className="w-3 h-3 inline mr-1" /> : null}
                      {chunk.label.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-mono ${chunkDownloadStatus[chunk.index] === 'failed' ? 'text-red-600 font-bold' :
                      chunkDownloadStatus[chunk.index] === 'retrying' ? 'text-amber-600 font-bold animate-pulse' :
                        chunkDownloadStatus[chunk.index] === 'downloading' ? 'text-blue-600 animate-pulse' :
                          'text-gray-500'
                      }`}>
                      {chunkDownloadStatus[chunk.index] === 'downloaded' ? '✅ Descargado' :
                        chunkDownloadStatus[chunk.index] === 'downloading' ? '⬇️ Descargando...' :
                          chunkDownloadStatus[chunk.index] === 'retrying' ? '🔄 Reintentando...' :
                            chunkDownloadStatus[chunk.index] === 'failed' ? '❌ Error' :
                              isDone ? '⏳ En cola...' :
                                isActive ? `${chunk.processed}/${chunk.total}` :
                                  chunk.total > 0 ? `${chunk.total} docs` : 'Pendiente'}
                    </span>
                  </div>
                  {(isActive || isDone) && chunk.total > 0 && (
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${isDone ? 'from-emerald-400 to-emerald-500' : CHUNK_COLORS[i % CHUNK_COLORS.length]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${isDone ? 100 : chunkPct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
            <Box className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-[10px] leading-relaxed text-orange-700 font-medium">
              Cada tramo se descarga automáticamente al completarse. Puedes seguir navegando.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export function PanamarDashboard() {
  const { user, logout } = useAuthStore();

  // State
  const [documents, setDocuments] = useState<PanamarDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PanamarSummary | null>(null);
  const [clientsList, setClientsList] = useState<{ codigoCliente: string; nombreCliente: string; nombreFiscal?: string }[]>([]);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const clientSearchRef = useRef<HTMLInputElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Close client dropdown on outside click
  useEffect(() => {
    if (!clientDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [clientDropdownOpen]);

  // Filters - Ejercicio fijado a 2026, meses por defecto hasta el actual
  const [filters, setFilters] = useState<PanamarFilters>(() => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const defaultMeses = Array.from({ length: currentMonth }, (_, i) => i + 1);
    return {
      page: 1,
      pageSize: 25,
      ejercicio: 2026,
      meses: defaultMeses
    };
  });
  const [searchInput, setSearchInput] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false); // legacy, kept for compat
  const bulkAbortRef = useRef<AbortController | null>(null); // legacy

  // Share state
  const [shareDoc, setShareDoc] = useState<PanamarDocument | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PanamarDocument | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  // ── Fetch documents ──────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
      if (filters.fechaDesde) params.set('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) params.set('fechaHasta', filters.fechaHasta);
      if (filters.codigoCliente) params.set('codigoCliente', filters.codigoCliente);
      if (filters.busqueda) params.set('busqueda', filters.busqueda);
      if (filters.ejercicio) params.set('ejercicio', String(filters.ejercicio));
      if (filters.meses && filters.meses.length > 0) params.set('meses', filters.meses.join(','));

      const res = await secureFetch<PanamarDocumentsResponse>(
        `/api/panamar/documents?${params.toString()}`
      );

      if (res.ok && res.data.success) {
        setDocuments(res.data.documents);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        setError('Error al cargar documentos');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('PANAMAR fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ── Fetch summary ────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams({ ejercicio: '2026' });
      if (filters.meses && filters.meses.length > 0) params.set('meses', filters.meses.join(','));
      if (filters.codigoCliente) params.set('codigoCliente', filters.codigoCliente);
      if (filters.busqueda) params.set('busqueda', filters.busqueda);
      const res = await secureFetch<PanamarSummary>(`/api/panamar/summary?${params.toString()}`);
      if (res.ok && res.data.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('PANAMAR summary error:', err);
    }
  }, [filters.meses, filters.codigoCliente, filters.busqueda]);

  // ── Fetch clients list (for dropdown) ────────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      const res = await secureFetch<{ success: boolean; clients: { codigoCliente: string; nombreCliente: string; nombreFiscal?: string }[] }>('/api/panamar/clients');
      if (res.ok && res.data.success) {
        setClientsList(res.data.clients);
      }
    } catch (err) {
      console.error('PANAMAR clients error:', err);
    }
  }, []);

  // ── Reload handler ───────────────────────────────────────────────
  const handleReload = useCallback(async () => {
    setIsReloading(true);
    try {
      await Promise.all([fetchDocuments(), fetchSummary(), fetchClients()]);
      toast.success('Datos actualizados correctamente');
    } catch (err) {
      console.error('PANAMAR reload error:', err);
      toast.error('Error al actualizar los datos');
    } finally {
      setIsReloading(false);
    }
  }, [fetchDocuments, fetchSummary, fetchClients]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ── Handlers ─────────────────────────────────────────────────────
  // Debounce para búsqueda automática mientras se escribe
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, page: 1, busqueda: searchInput || undefined }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (key: keyof PanamarFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, page: 1, [key]: value || undefined }));
  };

  const toggleMonth = (month: number) => {
    setFilters(prev => {
      const current = prev.meses || [];
      const updated = current.includes(month)
        ? current.filter(m => m !== month)
        : [...current, month].sort((a, b) => a - b);
      return { ...prev, page: 1, meses: updated.length > 0 ? updated : undefined };
    });
  };

  const clearMonths = () => {
    setFilters(prev => ({ ...prev, page: 1, meses: undefined }));
  };

  const getDocKey = (doc: PanamarDocument) =>
    `${doc.codigoCliente}-${doc.ejercicioFactura}-${doc.serieFactura}-${doc.numeroFactura}`;

  const getDocRef = (doc: PanamarDocument) =>
    `${doc.serieFactura}-${doc.numeroFactura}`;

  const getDocPath = (doc: PanamarDocument) =>
    `/api/panamar/documents/${doc.subempresa}/${doc.ejercicio}/${encodeURIComponent(doc.serieAlbaran)}/${doc.terminal}/${doc.numeroAlbaran}`;

  // Nuevo endpoint que usa la identidad de factura directamente (no del albarán)
  const getInvoicePath = (doc: PanamarDocument) =>
    `/api/panamar/invoices/${encodeURIComponent(doc.serieFactura)}/${doc.numeroFactura}/${doc.ejercicioFactura}`;

  // ── PDF Download (via secureFetch – relative URL through Next.js rewrite) ──
  const handleDownload = async (doc: PanamarDocument) => {
    const key = getDocKey(doc);
    setLoadingPdf(key);
    const toastId = toast.loading(
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Descargando factura {getDocRef(doc)}...</span>
      </div>
    );
    try {
      const res = await secureFetch<Blob>(`${getInvoicePath(doc)}/pdf`);
      if (!res.ok) throw new Error('Error descargando PDF');
      const blob = res.data;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Factura_PANAMAR_${getDocRef(doc)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Factura descargada correctamente', { id: toastId });
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Error al descargar el PDF', { id: toastId });
    } finally {
      setLoadingPdf(null);
    }
  };

  // ── PDF Preview (via secureFetch – relative URL through Next.js rewrite) ──
  const handlePreview = async (doc: PanamarDocument) => {
    const key = getDocKey(doc);
    setLoadingPdf(key);
    setPreviewDoc(doc);
    try {
      const res = await secureFetch<Blob>(`${getInvoicePath(doc)}/preview`);
      if (!res.ok) throw new Error('Error previsualizando PDF');
      const blob = res.data;
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Error al previsualizar el PDF');
      setPreviewDoc(null);
    } finally {
      setLoadingPdf(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  // ── Share modal ──────────────────────────────────────────────────
  const openShare = (doc: PanamarDocument) => {
    setShareDoc(doc);
    setShowShareModal(true);
  };

  // ── WhatsApp share ───────────────────────────────────────────────
  const handleWhatsApp = (doc: PanamarDocument) => {
    const docRef = getDocRef(doc);
    const text = encodeURIComponent(
      `📦 Factura PANAMAR ${docRef}\n` +
      `Cliente: ${doc.nombreCliente} (${doc.codigoCliente})\n` +
      `Fecha: ${doc.fecha}\n` +
      `Consumo (cajas): ${(doc.totalCajasPanamar || 0).toFixed(3)}\n` +
      `Importe PANAMAR: ${doc.totalImportePanamar.toFixed(2)} €\n` +
      `Líneas: ${doc.totalLineasPanamar}\n\n` +
      `Granja Mari Pepa`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareModal(false);
  };

  // ── Email share ──────────────────────────────────────────────────
  const openEmailModal = (doc: PanamarDocument) => {
    setShareDoc(doc);
    setShowShareModal(false);
    setEmailInput('');
    setEmailResult(null);
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!shareDoc || !emailInput) return;
    setSendingEmail(true);
    setEmailResult(null);
    try {
      const res = await secureFetch<{ success: boolean; message: string }>(
        `${getInvoicePath(shareDoc)}/email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinatario: emailInput })
        }
      );
      if (res.ok && res.data.success) {
        setEmailResult({ ok: true, msg: res.data.message || 'Email enviado correctamente' });
        toast.success('Email enviado correctamente');
      } else {
        setEmailResult({ ok: false, msg: res.data.message || 'Error al enviar' });
        toast.error('Error al enviar email');
      }
    } catch (err) {
      setEmailResult({ ok: false, msg: 'Error de conexión al enviar email' });
      toast.error('Error de conexión al enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  // ── Bulk download por tramos (6 ZIPs por rango de cliente) ────────
  const [bulkTask, setBulkTask] = useState<BulkTaskState | null>(null);
  const [taskResult, setTaskResult] = useState<{
    status: 'completed' | 'error',
    error?: string,
    taskId?: string,
    chunks?: BulkChunkState[],
  } | null>(null);
  const [isBulkInitializing, setIsBulkInitializing] = useState(false);
  const isPollingRef = useRef(false);
  const bulkTaskRef = useRef<BulkTaskState | null>(null);
  // Track which chunks we've already triggered download for
  const downloadedChunksRef = useRef<Set<number>>(new Set());
  // Queue for staggered downloads (browsers block rapid multiple multiple downloads)
  const downloadQueueRef = useRef<Array<{ taskId: string; index: number; filename: string }>>([]);
  const isProcessingQueueRef = useRef(false);
  // Track real download status per chunk (downloading, retrying, downloaded, failed)
  const [chunkDownloadStatus, setChunkDownloadStatus] = useState<Record<number, 'downloading' | 'retrying' | 'downloaded' | 'failed'>>({});
  // ✅ FIX: Use ref mirror of chunkDownloadStatus to avoid stale closures in setInterval/callbacks
  const chunkDlStatusRef = useRef<Record<number, 'downloading' | 'retrying' | 'downloaded' | 'failed'>>({});

  useEffect(() => {
    bulkTaskRef.current = bulkTask;
  }, [bulkTask]);

  // Restore task from localStorage on mount
  useEffect(() => {
    const savedTaskId = localStorage.getItem('panamar_bulk_task_id');
    if (savedTaskId) {
      downloadedChunksRef.current = new Set();
      checkBulkStatus(savedTaskId);
    }
  }, []);

  // 🚀 Polling: adaptive interval (2s normal, 1s when almost done)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (bulkTask && bulkTask.status === 'processing') {
      const completedCount = bulkTask.chunks.filter(c => c.status === 'completed' || c.status === 'skipped').length;
      const pollInterval = completedCount >= 4 ? 1000 : 2000; // Faster when almost done
      interval = setInterval(() => {
        if (!isPollingRef.current && bulkTaskRef.current?.status === 'processing') {
          checkBulkStatus(bulkTaskRef.current.id);
        }
      }, pollInterval);
    }
    return () => clearInterval(interval);
  }, [bulkTask?.status, bulkTask?.id, bulkTask?.chunks?.filter(c => c.status === 'completed' || c.status === 'skipped').length]);

  /** 🔒 Descarga robusta con fetch+Blob, reintentos automaticos, timeout, y verificación de integridad */
  const doSingleDownloadWithRetry = async (taskId: string, chunkIndex: number, filename: string): Promise<boolean> => {
    const MAX_RETRIES = 5;
    const endpoint = `/api/panamar/bulk-download/retrieve/${taskId}/${chunkIndex}`;
    const shortName = filename.replace('PANAMAR_', '').replace('.zip', '');

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const status = attempt > 1 ? 'retrying' : 'downloading';
        chunkDlStatusRef.current[chunkIndex] = status;
        setChunkDownloadStatus(prev => ({ ...prev, [chunkIndex]: status }));

        if (attempt > 1) {
          toast.info(`🔄 Reintento ${attempt}/${MAX_RETRIES}: ${shortName}`, { duration: 3000 });
          // Exponential backoff: 3s, 6s, 12s, 24s
          const backoffMs = 3000 * Math.pow(2, attempt - 2);
          console.log(`⏳ Backoff ${backoffMs / 1000}s antes de reintento ${attempt}...`);
          await new Promise(r => setTimeout(r, backoffMs));
        }

        console.log(`📥 [Intento ${attempt}/${MAX_RETRIES}] Descargando chunk ${chunkIndex}: ${endpoint} → ${filename}`);
        const success = await secureDownload(endpoint, filename);

        if (success) {
          chunkDlStatusRef.current[chunkIndex] = 'downloaded';
          setChunkDownloadStatus(prev => ({ ...prev, [chunkIndex]: 'downloaded' }));
          toast.success(`✅ Descargado: ${shortName}`, { duration: 4000 });
          return true;
        }

        console.warn(`⚠️ Intento ${attempt}/${MAX_RETRIES} fallido para chunk ${chunkIndex} (secureDownload devolvió false)`);
      } catch (err) {
        console.error(`❌ Intento ${attempt}/${MAX_RETRIES} error para chunk ${chunkIndex}:`, err);
      }
    }

    // ✅ FIX: Todos los reintentos fallaron → marcar como failed.
    // NO borrar de downloadedChunksRef — esto previene el bucle infinito de auto-retry.
    // Solo el botón manual de retry puede volver a intentar.
    chunkDlStatusRef.current[chunkIndex] = 'failed';
    setChunkDownloadStatus(prev => ({ ...prev, [chunkIndex]: 'failed' }));
    toast.error(`❌ Error descargando ${shortName} tras ${MAX_RETRIES} intentos. Use el botón para reintentar.`, { duration: 10000 });
    return false;
  };

  /** Procesa la cola de descargas secuencialmente (1 a la vez — paralelo causa timeouts en Cloudflare) */
  const processDownloadQueue = async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    // ⚠️ MUST be sequential: parallel downloads split Cloudflare Tunnel bandwidth
    // causing BOTH to exceed the ~100s timeout and disconnect.
    // Sequential ensures full bandwidth goes to 1 file at a time.
    while (downloadQueueRef.current.length > 0) {
      const next = downloadQueueRef.current.shift()!;
      await doSingleDownloadWithRetry(next.taskId, next.index, next.filename);
      // 1s pause between downloads for connection cleanup
      if (downloadQueueRef.current.length > 0) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    isProcessingQueueRef.current = false;
  };

  /** Encola una descarga de chunk (con reintentos automaticos) */
  const triggerChunkDownload = (taskId: string, chunkIndex: number, filename: string) => {
    downloadQueueRef.current.push({ taskId, index: chunkIndex, filename });
    processDownloadQueue();
  };

  const checkBulkStatus = async (taskId: string) => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const { data, ok } = await secureFetch<any>(`/api/panamar/bulk-download/status/${taskId}`);

      if (ok && data && data.success) {
        // Map chunks from server
        const serverChunks: BulkChunkState[] = (data.chunks || []).map((c: any) => ({
          index: c.index,
          label: c.label,
          status: c.status,
          total: c.total,
          processed: c.processed,
          zipFilename: c.zipFilename,
          downloaded: downloadedChunksRef.current.has(c.index),
        }));

        // Auto-download newly completed chunks (skip empty/skipped ones)
        for (const chunk of serverChunks) {
          if (chunk.status === 'completed' && chunk.total > 0 && !downloadedChunksRef.current.has(chunk.index)) {
            // ✅ FIX: Use ref (not React state) to check status — avoids stale closure
            const currentDlStatus = chunkDlStatusRef.current[chunk.index];
            // Never auto-retry failed chunks — only manual retry button
            if (!currentDlStatus || currentDlStatus === undefined) {
              downloadedChunksRef.current.add(chunk.index);
              triggerChunkDownload(taskId, chunk.index, chunk.zipFilename);
            }
          }
          // Mark skipped chunks so they don't block completion
          if (chunk.status === 'skipped' && !downloadedChunksRef.current.has(chunk.index)) {
            downloadedChunksRef.current.add(chunk.index);
          }
        }

        if (data.status === 'completed') {
          localStorage.removeItem('panamar_bulk_task_id');
          setBulkTask(null);
          // Keep chunks + taskId for retry buttons
          const downloadableChunks = serverChunks.filter(c => c.status === 'completed' && c.total > 0);
          setTaskResult({ status: 'completed', taskId, chunks: downloadableChunks });
          toast.success(`${downloadableChunks.length} tramos descargados correctamente.`, { duration: 8000 });

        } else if (data.status === 'error') {
          localStorage.removeItem('panamar_bulk_task_id');
          setBulkTask(null);
          setTaskResult({ status: 'error', error: data.error || 'Error desconocido' });
          toast.error(`Error en descarga masiva: ${data.error || 'Error desconocido'}`);
          downloadedChunksRef.current = new Set();

        } else {
          // Still processing
          setBulkTask({
            id: data.id,
            status: data.status,
            totalGeneral: data.totalGeneral,
            totalProcessed: data.totalProcessed,
            startTime: data.startTime,
            error: data.error,
            chunks: serverChunks,
          });
        }
      } else if (ok && data && !data.success) {
        localStorage.removeItem('panamar_bulk_task_id');
        setBulkTask(null);
        setTaskResult({ status: 'error', error: data.message || 'La tarea ya no existe.' });
        downloadedChunksRef.current = new Set();
      }
    } catch (err) {
      console.error('Error polling bulk status:', err);
    } finally {
      isPollingRef.current = false;
    }
  };

  const handleBulkDownloadInit = async () => {
    if (isBulkInitializing || bulkTask?.status === 'processing') return;
    setIsBulkInitializing(true);
    setTaskResult(null);
    downloadedChunksRef.current = new Set();
    setChunkDownloadStatus({});

    try {
      const { data, ok } = await secureFetch<any>('/api/panamar/bulk-download/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });

      if (ok && data.success && data.taskId) {
        localStorage.setItem('panamar_bulk_task_id', data.taskId);
        setBulkTask({
          id: data.taskId,
          status: 'processing',
          totalGeneral: data.total || 0,
          totalProcessed: 0,
          startTime: Date.now(),
          error: null,
          chunks: [],
        });
        toast.success(`Generando ${data.totalChunks} tramos con ${data.total || 0} documentos...`);
      } else {
        toast.error(data?.message || 'Error al iniciar la descarga.');
      }
    } catch (err) {
      console.error('Bulk init error:', err);
      toast.error('Error de conexión al iniciar la descarga.');
    } finally {
      setIsBulkInitializing(false);
    }
  };

  const cancelBulkTask = () => {
    localStorage.removeItem('panamar_bulk_task_id');
    setBulkTask(null);
    downloadedChunksRef.current = new Set();
    setChunkDownloadStatus({});
  };

  // ── Pagination helpers ───────────────────────────────────────────
  const startIndex = ((filters.page || 1) - 1) * (filters.pageSize || 25);
  const endIndex = startIndex + (filters.pageSize || 25);

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Bulk Download Progress Overlay */}
      {bulkTask && bulkTask.status === 'processing' && bulkTask.chunks.length > 0 && (
        <BulkProgressOverlay
          task={bulkTask}
          onCancel={cancelBulkTask}
          chunkDownloadStatus={chunkDownloadStatus}
        />
      )}

      {/* Sticky Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Modo PANAMAR</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Portal de gestión documental</p>
              </div>
            </div>

            {/* Desktop search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por albarán, factura, cliente o pedido..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSearchInput(e.currentTarget.value)}
                  className="pl-10 bg-gray-50/50 focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline font-medium">PANAMAR (Modo Especial)</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReload}
                disabled={isReloading}
                className="text-muted-foreground hover:text-orange-500 hover:bg-orange-50"
                title="Actualizar datos"
              >
                <RefreshCw className={`h-5 w-5 ${isReloading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutConfirm(true)}
                className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="bg-card rounded-2xl p-4 shadow-lg border border-border flex items-center gap-3"
            >
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{(summary.totalFacturas ?? summary.totalDocumentos ?? 0).toLocaleString('es-ES')}</div>
                <div className="text-xs text-muted-foreground font-medium">Facturas</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card rounded-2xl p-4 shadow-lg border border-border flex items-center gap-3"
            >
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{summary.totalClientes.toLocaleString('es-ES')}</div>
                <div className="text-xs text-muted-foreground font-medium">Clientes</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-4 shadow-lg border border-border flex items-center gap-3"
            >
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground whitespace-nowrap">{summary.totalImporte.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                <div className="text-xs text-muted-foreground font-medium">Importe Total</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-2xl p-4 shadow-lg border border-border flex items-center gap-3"
            >
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Box className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{summary.totalCajas.toLocaleString('es-ES')}</div>
                <div className="text-xs text-muted-foreground font-medium">Total Cajas</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-4 shadow-lg border border-border flex items-center gap-3"
            >
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
                <Box className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{summary.totalCajasCC.toLocaleString('es-ES')}</div>
                <div className="text-xs text-muted-foreground font-medium">Cajas CC</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card rounded-2xl p-4 shadow-lg border border-border flex items-center gap-3"
            >
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                <Box className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{summary.totalCajasSC.toLocaleString('es-ES')}</div>
                <div className="text-xs text-muted-foreground font-medium">Cajas SC</div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
              <Package className="w-6 h-6 inline-block mr-2 text-orange-500" />
              Gestión de Facturas PANAMAR
            </h2>
            <p className="text-muted-foreground text-sm">
              {total.toLocaleString('es-ES')} {total === 1 ? 'registro' : 'registros'} · Ejercicio 2026
              {filters.meses && filters.meses.length > 0 && filters.meses.length < 12 && (
                <span className="ml-1">
                  · {filters.meses.map(m => MESES[m - 1]?.label).join(', ')}
                </span>
              )}
              {filters.codigoCliente && (
                <span className="ml-1">· {clientsList.find(c => c.codigoCliente === filters.codigoCliente)?.nombreCliente || filters.codigoCliente}</span>
              )}
            </p>
          </div>
          {/* Bulk download button */}
          {documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {bulkTask?.status === 'processing' ? (
                <Button
                  onClick={cancelBulkTask}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-12 px-6 font-bold"
                >
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Cancelar descarga
                  </div>
                </Button>
              ) : (
                <Button
                  onClick={handleBulkDownloadInit}
                  disabled={loading || isBulkInitializing}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-12 px-6 font-bold"
                >
                  <div className="flex items-center gap-2">
                    {isBulkInitializing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Archive className="w-5 h-5" />
                    )}
                    {isBulkInitializing ? 'Iniciando...' : `Descargar por tramos (${total.toLocaleString('es-ES')})`}
                  </div>
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Filter Panel - Premium Design */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 space-y-5 shadow-lg">
          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Ejercicio (fijado a 2026) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-orange-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Ejercicio
              </label>
              <div className="w-full h-12 px-4 border-2 border-orange-200 rounded-xl bg-orange-50 flex items-center text-orange-700 font-bold text-lg">
                2026
              </div>
            </div>

            {/* Cliente (searchable dropdown) */}
            <div className="space-y-2 relative" ref={clientDropdownRef}>
              <label className="text-sm font-bold text-orange-600 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Cliente
              </label>
              <button
                onClick={() => { setClientDropdownOpen(!clientDropdownOpen); setClientSearch(''); setTimeout(() => clientSearchRef.current?.focus(), 50); }}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl bg-white flex items-center justify-between text-gray-900 font-medium cursor-pointer hover:border-orange-300 transition-colors"
              >
                <span className={filters.codigoCliente ? 'text-gray-900' : 'text-gray-400'}>
                  {filters.codigoCliente
                    ? (clientsList.find(c => c.codigoCliente === filters.codigoCliente)?.nombreCliente || filters.codigoCliente)
                    : 'Todos los clientes'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {clientDropdownOpen && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border-2 border-orange-200 rounded-xl shadow-2xl max-h-72 flex flex-col">
                  {/* Search input */}
                  <div className="p-2 border-b border-orange-100 sticky top-0 bg-white rounded-t-xl">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        ref={clientSearchRef}
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  {/* Options list */}
                  <div className="overflow-y-auto flex-1">
                    <button
                      onClick={() => { handleFilterChange('codigoCliente', undefined); setClientDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-orange-50 transition-colors border-b border-gray-100 ${!filters.codigoCliente ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                        }`}
                    >
                      Todos los clientes
                    </button>
                    {clientsList
                      .filter(client => {
                        if (!clientSearch.trim()) return true;
                        const q = clientSearch.toLowerCase().trim();
                        return (
                          client.nombreCliente.toLowerCase().includes(q) ||
                          (client.nombreFiscal && client.nombreFiscal.toLowerCase().includes(q)) ||
                          client.codigoCliente.toLowerCase().includes(q)
                        );
                      })
                      .map(client => (
                        <button
                          key={client.codigoCliente}
                          onClick={() => { handleFilterChange('codigoCliente', client.codigoCliente); setClientDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors border-b border-gray-50 group ${filters.codigoCliente === client.codigoCliente ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-700 font-medium'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="truncate">{client.nombreCliente}</div>
                            <div className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono ml-2 group-hover:bg-orange-100 transition-colors">{client.codigoCliente}</div>
                          </div>
                          {client.nombreFiscal && client.nombreFiscal !== client.nombreCliente && (
                            <div className="text-[11px] text-gray-400 italic truncate mt-0.5 opacity-80">
                              {client.nombreFiscal}
                            </div>
                          )}
                        </button>
                      ))}
                    {clientsList.filter(client => {
                      if (!clientSearch.trim()) return true;
                      const q = clientSearch.toLowerCase().trim();
                      return client.nombreCliente.toLowerCase().includes(q) || (client.nombreFiscal && client.nombreFiscal.toLowerCase().includes(q)) || client.codigoCliente.toLowerCase().includes(q);
                    }).length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">Sin resultados</div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unified Search Bar (Now between filters and months) */}
          <div className="relative group">
            <label className="text-sm font-bold text-orange-600 flex items-center mb-2">
              <Search className="w-4 h-4 mr-2" />
              Buscador Dinámico (Albarán, Factura, Pedido...)
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400 group-focus-within:text-orange-600 transition-colors" />
              <Input
                placeholder="Introduzca el número de albarán o factura..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 pr-32 h-14 border-2 border-gray-100 bg-gray-50/50 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 text-base text-gray-900 placeholder:text-gray-400 rounded-xl font-medium transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(''); }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Month Multi-Select */}
          <div className="border-t-2 border-orange-100 pt-5 mt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-orange-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Filtrar por meses
                {filters.meses && filters.meses.length > 0 && (
                  <span className="ml-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {filters.meses.length}
                  </span>
                )}
              </label>
              {filters.meses && filters.meses.length > 0 && (
                <button
                  onClick={clearMonths}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 underline decoration-2 underline-offset-2 transition-colors"
                >
                  Limpiar selección
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {MESES.map((mes) => {
                const isSelected = filters.meses?.includes(mes.value) ?? false;
                return (
                  <button
                    key={mes.value}
                    onClick={() => toggleMonth(mes.value)}
                    className={`
                      relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2
                      ${isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 scale-105'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
                      }
                    `}
                    title={mes.full}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />}
                    {mes.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl text-sm font-medium shadow-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-muted-foreground font-medium">Cargando registros...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && documents.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-2xl border-2 border-gray-100 shadow-lg"
          >
            <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Sin resultados para los filtros seleccionados</p>
            <p className="text-sm text-muted-foreground mt-1">Prueba seleccionando otros meses o ajustando los filtros de búsqueda</p>
          </motion.div>
        )}

        {/* Mobile Cards View */}
        {!loading && documents.length > 0 && (
          <div className="block lg:hidden space-y-4">
            {documents.map((doc, index) => {
              const key = getDocKey(doc);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-lg space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 bg-gradient-to-br from-orange-500 to-orange-600">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-orange-600">
                          {getDocRef(doc)}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Factura{doc.numeroPedido ? ` · Ped. ${doc.numeroPedido}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-emerald-600">
                        {doc.totalImportePanamar.toFixed(2)} €
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {doc.totalLineasPanamar} línea{doc.totalLineasPanamar !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="flex items-center justify-between text-sm bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 truncate max-w-[150px]">
                        {doc.nombreCliente}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-gray-700">{doc.fecha}</span>
                    </div>
                  </div>

                  {/* Action buttons 2x2 */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePreview(doc)}
                      disabled={loadingPdf === key}
                      className="bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver PDF
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={loadingPdf === key}
                      className="bg-violet-100 text-violet-600 hover:bg-violet-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openShare(doc)}
                      className="bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openEmailModal(doc)}
                      className="bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md h-10"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && documents.length > 0 && (
          <div className="hidden lg:block bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-100">
                    <TableHead className="font-bold text-orange-700 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Factura
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-orange-700">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Cliente
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-orange-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Fecha
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-orange-700 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Package className="w-4 h-4" />
                        Líneas
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-orange-700 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Settings className="w-4 h-4" />
                        Acciones
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => {
                    const key = getDocKey(doc);
                    return (
                      <tr
                        key={key}
                        className="relative hover:bg-orange-50 transition-colors duration-150 border-b border-gray-100 group"
                      >
                        {/* Factura */}
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 bg-gradient-to-br from-orange-500 to-orange-600">
                              <Truck className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-base text-orange-600">
                                {getDocRef(doc)}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">
                                Factura{doc.numeroPedido ? ` · Ped. ${doc.numeroPedido}` : ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Cliente */}
                        <TableCell>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">
                              {doc.nombreCliente}
                            </div>
                            <div className="text-xs text-gray-400">{doc.codigoCliente}</div>
                          </div>
                        </TableCell>

                        {/* Fecha */}
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-700 text-sm">{doc.fecha}</span>
                          </div>
                        </TableCell>

                        {/* Líneas */}
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-semibold">
                            {doc.totalLineasPanamar}
                          </Badge>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handlePreview(doc)}
                              disabled={loadingPdf === key}
                              className="bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                              title="Previsualizar PDF"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              disabled={loadingPdf === key}
                              className="bg-violet-100 text-violet-600 hover:bg-violet-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openShare(doc)}
                              className="bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                              title="Compartir por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openEmailModal(doc)}
                              className="bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                              title="Enviar por email"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Cumulative Totals Banner (Orange) */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 rounded-3xl p-6 shadow-2xl border-4 border-white/20 text-white relative overflow-hidden group"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-black/10 rounded-full blur-xl" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <Package className="w-9 h-9 text-white drop-shadow-md" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-wider mb-1">Total Acumulado</h3>
                  <p className="text-orange-100 text-sm font-bold uppercase tracking-widest opacity-90 italic">
                    {total.toLocaleString('es-ES')} Facturas Detectadas
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 md:gap-8">
                <div className="text-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="text-3xl md:text-4xl font-black drop-shadow-sm">
                    {summary.totalCajas.toLocaleString('es-ES')}
                  </div>
                  <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-orange-100/80">Cajas Totales</div>
                </div>

                <div className="text-center px-6 py-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg scale-105">
                  <div className="text-3xl md:text-4xl font-black drop-shadow-md">
                    {summary.totalImporte.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </div>
                  <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-white">Importe Acumulado</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 px-4 py-4 bg-secondary rounded-2xl border border-border flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            {/* Info */}
            <div className="text-sm text-muted-foreground font-medium">
              Mostrando <span className="font-bold text-primary">{startIndex + 1}</span> - <span className="font-bold text-primary">{Math.min(endIndex, total)}</span> de <span className="font-bold text-foreground">{total.toLocaleString('es-ES')}</span> registros
            </div>

            {/* Page controls */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
                disabled={filters.page === 1}
                className={`p-2 rounded-lg font-semibold transition-all duration-200 ${filters.page === 1
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-card text-primary hover:bg-primary hover:text-primary-foreground shadow-md hover:shadow-lg'
                  }`}
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                disabled={filters.page === 1}
                className={`p-2 rounded-lg font-semibold transition-all duration-200 ${filters.page === 1
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-card text-primary hover:bg-primary hover:text-primary-foreground shadow-md hover:shadow-lg'
                  }`}
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = filters.page || 1;
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  if (pageNum > totalPages) return null;
                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 ${pageNum === page
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-card text-foreground hover:bg-secondary hover:text-primary shadow-md'
                        }`}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
                disabled={filters.page === totalPages}
                className={`p-2 rounded-lg font-semibold transition-all duration-200 ${filters.page === totalPages
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-card text-primary hover:bg-primary hover:text-primary-foreground shadow-md hover:shadow-lg'
                  }`}
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters(prev => ({ ...prev, page: totalPages }))}
                disabled={filters.page === totalPages}
                className={`p-2 rounded-lg font-semibold transition-all duration-200 ${filters.page === totalPages
                  ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                  : 'bg-card text-primary hover:bg-primary hover:text-primary-foreground shadow-md hover:shadow-lg'
                  }`}
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                Por página:
              </label>
              <select
                value={filters.pageSize || 25}
                onChange={(e) => setFilters(prev => ({ ...prev, page: 1, pageSize: Number(e.target.value) }))}
                className="px-3 py-2 rounded-lg border-2 border-border bg-card text-foreground font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer hover:border-primary/50"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </motion.div>
        )}
      </main>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Logout Confirm Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="bg-card rounded-3xl shadow-2xl p-8 max-w-md w-full border border-border pointer-events-auto text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Cerrar sesión</h3>
                <p className="text-sm text-muted-foreground mb-6">¿Estás seguro de que quieres salir del modo PANAMAR?</p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 rounded-2xl h-12"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="flex-1 rounded-2xl h-12"
                  >
                    Sí, cerrar sesión
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {(previewUrl || (previewDoc && loadingPdf)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] sm:h-[90vh] overflow-hidden flex flex-col border border-border"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 sm:p-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold truncate">
                      Factura {previewDoc ? getDocRef(previewDoc) : ''}
                    </h2>
                    <p className="text-white/70 text-xs hidden sm:block">Previsualización PDF · {previewDoc?.nombreCliente}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  {previewDoc && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => previewDoc && handleDownload(previewDoc)}
                      className="text-white hover:bg-white/20 h-9 sm:h-10 px-3 sm:px-4"
                    >
                      <Download className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Descargar</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closePreview}
                    className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* PDF Content */}
              <div className="flex-1 bg-secondary p-2 sm:p-4 relative overflow-auto">
                {loadingPdf ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-muted-foreground text-sm sm:text-base">Generando PDF...</p>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full rounded-lg border-0"
                    title="PDF Preview"
                  />
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Options Modal */}
      <AnimatePresence>
        {showShareModal && shareDoc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="bg-card rounded-3xl shadow-2xl p-8 max-w-md w-full border border-border pointer-events-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">Compartir factura</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowShareModal(false)} className="rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Document info card */}
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-orange-700">{getDocRef(shareDoc)}</div>
                      <div className="text-xs text-orange-600/70">{shareDoc.nombreCliente} · {shareDoc.fecha}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openEmailModal(shareDoc)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">Email</div>
                      <div className="text-xs text-muted-foreground">Enviar PDF adjunto por correo</div>
                    </div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleWhatsApp(shareDoc)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">WhatsApp</div>
                      <div className="text-xs text-muted-foreground">Compartir resumen por WhatsApp</div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && shareDoc && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !sendingEmail && setShowEmailModal(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full border border-border pointer-events-auto overflow-hidden">
                {/* Header gradient */}
                <div className="p-6" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' }}>
                  <div className="flex items-center gap-3 text-white">
                    <Mail className="w-6 h-6" />
                    <div>
                      <h3 className="text-lg font-bold">Enviar por email</h3>
                      <p className="text-white/70 text-xs">Se adjuntará el PDF de la factura</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Document badge */}
                  <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2 border border-orange-100">
                    <Truck className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-700">
                      {getDocRef(shareDoc)}
                    </span>
                    <span className="text-xs text-orange-500">· {shareDoc.nombreCliente}</span>
                  </div>

                  {/* Email input */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600">Email destinatario</label>
                    <Input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                      placeholder="ejemplo@correo.com"
                      className="h-12 border-2 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                      disabled={sendingEmail}
                    />
                  </div>

                  {emailResult && (
                    <div className={`text-sm px-4 py-3 rounded-xl font-medium ${emailResult.ok
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                      {emailResult.msg}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setShowEmailModal(false)}
                      disabled={sendingEmail}
                      className="flex-1 rounded-xl h-12"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      disabled={sendingEmail || !emailInput}
                      className="flex-1 rounded-xl h-12 text-white"
                      style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' }}
                    >
                      {sendingEmail ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Enviando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Enviar
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════ BULK PROGRESS / RESULT OVERLAY ═══════════════ */}
      <AnimatePresence>
        {bulkTask && bulkTask.status === 'processing' && bulkTask.chunks.length > 0 && (
          <BulkProgressOverlay
            task={bulkTask}
            onCancel={cancelBulkTask}
            chunkDownloadStatus={chunkDownloadStatus}
          />
        )}

        {taskResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-[70] w-full max-w-md"
          >
            <div className={`p-6 rounded-3xl shadow-2xl border-2 ${taskResult.status === 'completed'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-100'
              }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${taskResult.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                  {taskResult.status === 'completed' ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <X className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${taskResult.status === 'completed' ? 'text-emerald-900' : 'text-red-900'}`}>
                    {taskResult.status === 'completed' ? 'Tramos completados' : 'Error en Descarga'}
                  </h4>
                  <p className={`text-xs mt-0.5 ${taskResult.status === 'completed' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {taskResult.status === 'completed'
                      ? 'Si alguno falla, pulse su boton para reintentar.'
                      : `${taskResult.error || 'Intente de nuevo.'}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setTaskResult(null); downloadedChunksRef.current = new Set(); setChunkDownloadStatus({}); chunkDlStatusRef.current = {}; }}
                  className="h-8 w-8 text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Retry buttons per chunk */}
              {taskResult.status === 'completed' && taskResult.chunks && taskResult.taskId && (
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {taskResult.chunks.map((chunk) => {
                    const dlStatus = chunkDownloadStatus[chunk.index];
                    const isDownloading = dlStatus === 'downloading' || dlStatus === 'retrying';
                    const isDownloaded = dlStatus === 'downloaded';
                    const isFailed = dlStatus === 'failed';
                    return (
                      <button
                        key={chunk.index}
                        disabled={isDownloading}
                        onClick={() => {
                          if (taskResult.taskId && !isDownloading) {
                            // ✅ FIX: Clear tracking so download can be re-triggered
                            downloadedChunksRef.current.delete(chunk.index);
                            delete chunkDlStatusRef.current[chunk.index];
                            setChunkDownloadStatus(prev => {
                              const next = { ...prev };
                              delete next[chunk.index];
                              return next;
                            });
                            triggerChunkDownload(taskResult.taskId, chunk.index, chunk.zipFilename);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all group ${isDownloaded ? 'bg-emerald-50 border-emerald-300' :
                          isFailed ? 'bg-red-50 border-red-200 hover:border-red-400' :
                            isDownloading ? 'bg-blue-50 border-blue-200 opacity-70 cursor-wait' :
                              'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {isDownloading ? (
                            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : isDownloaded ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isFailed ? (
                            <Download className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700" />
                          )}
                          <span className="text-xs font-semibold text-gray-700">{chunk.label.replace(/_/g, ' ')}</span>
                        </div>
                        <span className={`text-[10px] font-mono ${isDownloaded ? 'text-emerald-600 font-bold' :
                          isFailed ? 'text-red-500 font-bold' :
                            isDownloading ? 'text-blue-500 animate-pulse' :
                              'text-gray-400'
                          }`}>
                          {isDownloaded ? '✅ Descargado' :
                            dlStatus === 'downloading' ? '⬇️ Descargando...' :
                              dlStatus === 'retrying' ? '🔄 Reintentando...' :
                                isFailed ? '❌ Reintentar' :
                                  `${chunk.total} docs`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

