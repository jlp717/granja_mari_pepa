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
  Archive, Check, ChevronDown
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

export function PanamarDashboard() {
  const { user, logout } = useAuthStore();

  // State
  const [documents, setDocuments] = useState<PanamarDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PanamarSummary | null>(null);
  const [clientsList, setClientsList] = useState<{ codigoCliente: string; nombreCliente: string }[]>([]);
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
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const bulkAbortRef = useRef<AbortController | null>(null);

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
      const res = await secureFetch<PanamarSummary>(`/api/panamar/summary?${params.toString()}`);
      if (res.ok && res.data.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('PANAMAR summary error:', err);
    }
  }, [filters.meses, filters.codigoCliente]);

  // ── Fetch clients list (for dropdown) ────────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      const res = await secureFetch<{ success: boolean; clients: { codigoCliente: string; nombreCliente: string }[] }>('/api/panamar/clients');
      if (res.ok && res.data.success) {
        setClientsList(res.data.clients);
      }
    } catch (err) {
      console.error('PANAMAR clients error:', err);
    }
  }, []);

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
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1, busqueda: searchInput || undefined }));
  };

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
    `${doc.subempresa}-${doc.ejercicio}-${doc.serieAlbaran}-${doc.terminal}-${doc.numeroAlbaran}`;

  const getDocPath = (doc: PanamarDocument) =>
    `/api/panamar/documents/${doc.subempresa}/${doc.ejercicio}/${encodeURIComponent(doc.serieAlbaran)}/${doc.terminal}/${doc.numeroAlbaran}`;

  // ── PDF Download (via secureFetch – relative URL through Next.js rewrite) ──
  const handleDownload = async (doc: PanamarDocument) => {
    const key = getDocKey(doc);
    setLoadingPdf(key);
    const toastId = toast.loading(
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Descargando albarán {doc.serieAlbaran}-{doc.numeroAlbaran}...</span>
      </div>
    );
    try {
      const res = await secureFetch<Blob>(`${getDocPath(doc)}/pdf`);
      if (!res.ok) throw new Error('Error descargando PDF');
      const blob = res.data;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Albaran_PANAMAR_${doc.serieAlbaran}-${doc.numeroAlbaran}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Albarán descargado correctamente', { id: toastId });
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
      const res = await secureFetch<Blob>(`${getDocPath(doc)}/preview`);
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
    const docRef = `${doc.serieAlbaran}-${doc.numeroAlbaran}`;
    const text = encodeURIComponent(
      `📦 Albarán PANAMAR ${docRef}\n` +
      `Cliente: ${doc.nombreCliente} (${doc.codigoCliente})\n` +
      `Fecha: ${doc.fecha}\n` +
      `Total PANAMAR: ${doc.totalImportePanamar.toFixed(2)} €\n` +
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
        `${getDocPath(shareDoc)}/email`,
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

  // ── Bulk download (ZIP with all filtered PDFs) ───────────────────
  const handleBulkDownload = async () => {
    // Create abort controller so user can cancel
    const abortController = new AbortController();
    bulkAbortRef.current = abortController;
    setBulkDownloading(true);

    const toastId = toast.loading(
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
        <span>Generando ZIP con {total} albaranes... (puede tardar)</span>
      </div>
    );
    try {
      const params = new URLSearchParams();
      if (filters.fechaDesde) params.set('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) params.set('fechaHasta', filters.fechaHasta);
      if (filters.codigoCliente) params.set('codigoCliente', filters.codigoCliente);
      if (filters.busqueda) params.set('busqueda', filters.busqueda);
      if (filters.meses && filters.meses.length > 0) params.set('meses', filters.meses.join(','));

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `PANAMAR_Albaranes_${today}.zip`;
      const ok = await secureDownload(
        `/api/panamar/bulk-download?${params.toString()}`,
        filename,
        abortController.signal
      );
      if (!ok) throw new Error('Error descargando ZIP');
      toast.success('Descarga completada correctamente', { id: toastId });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        toast.info('Descarga cancelada', { id: toastId });
      } else {
        console.error('Bulk download error:', err);
        toast.error('Error al generar la descarga masiva', { id: toastId });
      }
    } finally {
      setBulkDownloading(false);
      bulkAbortRef.current = null;
    }
  };

  const handleCancelBulkDownload = () => {
    if (bulkAbortRef.current) {
      bulkAbortRef.current.abort();
    }
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
                  placeholder="Buscar por referencia, cliente o pedido..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-gray-50/50 focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline font-medium">PANAMAR (Modo Especial)</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div className="text-2xl font-bold text-foreground">{summary.totalDocumentos.toLocaleString('es-ES')}</div>
                <div className="text-xs text-muted-foreground font-medium">Albaranes</div>
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
                <div className="text-2xl font-bold text-foreground">{summary.totalImporte.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                <div className="text-xs text-muted-foreground font-medium">Importe Total</div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
              <Package className="w-6 h-6 inline-block mr-2 text-orange-500" />
              Gestión Documental PANAMAR
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
              {bulkDownloading ? (
                <Button
                  onClick={handleCancelBulkDownload}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-12 px-6 font-bold"
                >
                  <div className="flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Cancelar descarga
                  </div>
                </Button>
              ) : (
                <Button
                  onClick={handleBulkDownload}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl h-12 px-6 font-bold"
                >
                  <div className="flex items-center gap-2">
                    <Archive className="w-5 h-5" />
                    Descargar todos ({total.toLocaleString('es-ES')})
                  </div>
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Filter Panel - Premium Design */}
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 space-y-5 shadow-lg">
          {/* Search (mobile) */}
          <div className="md:hidden relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-500" />
            <Input
              placeholder="Buscar por referencia, cliente o pedido..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-12 h-14 border-2 border-gray-200 bg-gray-50 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 text-base text-gray-900 placeholder:text-gray-400 rounded-xl font-medium"
            />
          </div>

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
                      className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-orange-50 transition-colors border-b border-gray-100 ${
                        !filters.codigoCliente ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                      }`}
                    >
                      Todos los clientes
                    </button>
                    {clientsList
                      .filter(client => {
                        if (!clientSearch.trim()) return true;
                        const q = clientSearch.toLowerCase().trim();
                        return client.nombreCliente.toLowerCase().includes(q) || client.codigoCliente.toLowerCase().includes(q);
                      })
                      .map(client => (
                        <button
                          key={client.codigoCliente}
                          onClick={() => { handleFilterChange('codigoCliente', client.codigoCliente); setClientDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors border-b border-gray-50 ${
                            filters.codigoCliente === client.codigoCliente ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-700 font-medium'
                          }`}
                        >
                          <div className="truncate">{client.nombreCliente}</div>
                          <div className="text-xs text-gray-400">{client.codigoCliente}</div>
                        </button>
                      ))}
                    {clientsList.filter(client => {
                      if (!clientSearch.trim()) return true;
                      const q = clientSearch.toLowerCase().trim();
                      return client.nombreCliente.toLowerCase().includes(q) || client.codigoCliente.toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">Sin resultados</div>
                    )}
                  </div>
                </div>
              )}
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
                          {doc.serieAlbaran}-{doc.numeroAlbaran}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Albarán{doc.numeroPedido ? ` · Ped. ${doc.numeroPedido}` : ''}
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
                        Documento
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
                    <TableHead className="font-bold text-orange-700 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <DollarSign className="w-4 h-4" />
                        Total
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
                        {/* Documento */}
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 bg-gradient-to-br from-orange-500 to-orange-600">
                              <Truck className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-base text-orange-600">
                                {doc.serieAlbaran}-{doc.numeroAlbaran}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">
                                Albarán{doc.numeroPedido ? ` · Ped. ${doc.numeroPedido}` : ''}
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

                        {/* Total */}
                        <TableCell className="text-right">
                          <div className="font-bold text-lg text-emerald-600">
                            {doc.totalImportePanamar.toFixed(2)} €
                          </div>
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
                className={`p-2 rounded-lg font-semibold transition-all duration-200 ${
                  filters.page === 1
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
                className={`p-2 rounded-lg font-semibold transition-all duration-200 ${
                  filters.page === 1
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
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 ${
                        pageNum === page
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
                className={`p-2 rounded-lg font-semibold transition-all duration-200 ${
                  filters.page === totalPages
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
                className={`p-2 rounded-lg font-semibold transition-all duration-200 ${
                  filters.page === totalPages
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
                      Albarán {previewDoc?.serieAlbaran}-{previewDoc?.numeroAlbaran}
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
                  <h3 className="text-xl font-bold text-foreground">Compartir albarán</h3>
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
                      <div className="font-bold text-orange-700">{shareDoc.serieAlbaran}-{shareDoc.numeroAlbaran}</div>
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
                      <p className="text-white/70 text-xs">Se adjuntará el PDF del albarán</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Document badge */}
                  <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2 border border-orange-100">
                    <Truck className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-700">
                      {shareDoc.serieAlbaran}-{shareDoc.numeroAlbaran}
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
                    <div className={`text-sm px-4 py-3 rounded-xl font-medium ${
                      emailResult.ok
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
    </div>
  );
}

