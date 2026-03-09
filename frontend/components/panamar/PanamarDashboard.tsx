'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { secureFetch } from '@/lib/secureFetch';
import { PanamarDocument, PanamarFilters, PanamarDocumentsResponse, PanamarSummary } from '@/lib/types';
import {
  Package, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  FileText, Truck, Calendar, Users, BarChart3, RefreshCw, LogOut, X,
  Download, Eye, Mail, Share2, MessageCircle
} from 'lucide-react';

export function PanamarDashboard() {
  const { user, logout } = useAuthStore();

  // State
  const [documents, setDocuments] = useState<PanamarDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PanamarSummary | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<PanamarFilters>({
    page: 1,
    pageSize: 25,
    ejercicio: new Date().getFullYear()
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Share state
  const [shareDoc, setShareDoc] = useState<PanamarDocument | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null); // key of doc loading

  // ── Fetch documents ──────────────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
      if (filters.tipo) params.set('tipo', filters.tipo);
      if (filters.fechaDesde) params.set('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) params.set('fechaHasta', filters.fechaHasta);
      if (filters.codigoCliente) params.set('codigoCliente', filters.codigoCliente);
      if (filters.busqueda) params.set('busqueda', filters.busqueda);
      if (filters.ejercicio) params.set('ejercicio', String(filters.ejercicio));

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
      const params = filters.ejercicio
        ? `?ejercicio=${filters.ejercicio}`
        : '';
      const res = await secureFetch<PanamarSummary>(`/api/panamar/summary${params}`);
      if (res.ok && res.data.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('PANAMAR summary error:', err);
    }
  }, [filters.ejercicio]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1, busqueda: searchInput || undefined }));
  };

  const handleFilterChange = (key: keyof PanamarFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, page: 1, [key]: value || undefined }));
  };

  const toggleDocument = (key: string) => {
    setExpandedDoc(prev => (prev === key ? null : key));
  };

  const getDocKey = (doc: PanamarDocument) =>
    `${doc.subempresa}-${doc.ejercicio}-${doc.serieAlbaran}-${doc.terminal}-${doc.numeroAlbaran}`;

  const getDocPath = (doc: PanamarDocument) =>
    `/api/panamar/documents/${doc.subempresa}/${doc.ejercicio}/${encodeURIComponent(doc.serieAlbaran)}/${doc.terminal}/${doc.numeroAlbaran}`;

  // ── PDF Download ─────────────────────────────────────────────────
  const handleDownload = async (doc: PanamarDocument) => {
    const key = getDocKey(doc);
    setLoadingPdf(key);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const url = `${backendUrl}${getDocPath(doc)}/pdf`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Error descargando PDF');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Albaran_PANAMAR_${doc.serieAlbaran}-${doc.numeroAlbaran}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download error:', err);
      alert('Error al descargar el PDF');
    } finally {
      setLoadingPdf(null);
    }
  };

  // ── PDF Preview ──────────────────────────────────────────────────
  const handlePreview = async (doc: PanamarDocument) => {
    const key = getDocKey(doc);
    setLoadingPdf(key);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const url = `${backendUrl}${getDocPath(doc)}/preview`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Error previsualizando PDF');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch (err) {
      console.error('Preview error:', err);
      alert('Error al previsualizar el PDF');
    } finally {
      setLoadingPdf(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
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
      `Granja Mari Pepa · Tarifa 85`
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
      } else {
        setEmailResult({ ok: false, msg: res.data.message || 'Error al enviar' });
      }
    } catch (err) {
      setEmailResult({ ok: false, msg: 'Error de conexión al enviar email' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  // ── Current years for filter ─────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Modo PANAMAR</h1>
                <p className="text-sm text-gray-500">Documentos con productos PANAMAR &middot; Tarifa 85</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:inline">{user?.name}</span>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<FileText className="h-5 w-5 text-orange-600" />}
              label="Documentos"
              value={summary.totalDocumentos}
              bg="bg-orange-50"
            />
            <SummaryCard
              icon={<Users className="h-5 w-5 text-blue-600" />}
              label="Clientes"
              value={summary.totalClientes}
              bg="bg-blue-50"
            />
            <SummaryCard
              icon={<BarChart3 className="h-5 w-5 text-green-600" />}
              label="Facturados"
              value={summary.totalFacturados}
              bg="bg-green-50"
            />
            <SummaryCard
              icon={<Truck className="h-5 w-5 text-amber-600" />}
              label="Pendientes"
              value={summary.totalPendientes}
              bg="bg-amber-50"
            />
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por referencia, cliente o pedido..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
            >
              Buscar
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              onClick={() => { setFilters({ page: 1, pageSize: 25, ejercicio: currentYear }); setSearchInput(''); }}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm"
              title="Limpiar filtros"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ejercicio</label>
                <select
                  value={filters.ejercicio || ''}
                  onChange={(e) => handleFilterChange('ejercicio', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Todos</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select
                  value={filters.tipo || ''}
                  onChange={(e) => handleFilterChange('tipo', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Todos</option>
                  <option value="albaran">Albarán</option>
                  <option value="factura">Factura</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                <input
                  type="date"
                  value={filters.fechaDesde || ''}
                  onChange={(e) => handleFilterChange('fechaDesde', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                <input
                  type="date"
                  value={filters.fechaHasta || ''}
                  onChange={(e) => handleFilterChange('fechaHasta', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Código Cliente Destino</label>
                <input
                  type="text"
                  placeholder="Ej: 4300006867"
                  value={filters.codigoCliente || ''}
                  onChange={(e) => handleFilterChange('codigoCliente', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {/* Status bar */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {loading ? 'Cargando...' : `${total} documento${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
            </span>
            {totalPages > 1 && (
              <span>Página {filters.page} de {totalPages}</span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
            </div>
          )}

          {/* Document List */}
          {!loading && documents.length === 0 && !error && (
            <div className="text-center py-12 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron documentos PANAMAR</p>
              <p className="text-xs mt-1">Prueba ajustando los filtros</p>
            </div>
          )}

          {!loading && documents.map((doc) => {
            const key = getDocKey(doc);
            const isExpanded = expandedDoc === key;

            return (
              <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Document Header */}
                <button
                  onClick={() => toggleDocument(key)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${doc.tipoDocumento === 'factura' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {doc.tipoDocumento === 'factura'
                        ? <FileText className="h-4 w-4 text-green-600" />
                        : <Truck className="h-4 w-4 text-blue-600" />
                      }
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">
                          {doc.tipoDocumento === 'factura'
                            ? `Factura ${doc.serieFactura}-${doc.numeroFactura}`
                            : `Albarán ${doc.serieAlbaran}-${doc.numeroAlbaran}`
                          }
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.tipoDocumento === 'factura' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {doc.tipoDocumento === 'factura' ? 'Facturado' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.nombreCliente} &middot; {doc.fecha}
                        {doc.numeroPedido ? ` &middot; Ped. ${doc.numeroPedido}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-semibold text-gray-900">
                        {doc.totalImportePanamar.toFixed(2)} &euro;
                      </div>
                      <div className="text-xs text-gray-400">
                        {doc.totalLineasPanamar} línea{doc.totalLineasPanamar !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded Lines */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Action buttons */}
                    <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePreview(doc); }}
                        disabled={loadingPdf === key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Previsualizar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                        disabled={loadingPdf === key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Descargar PDF
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openShare(doc); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        Compartir
                      </button>
                      {loadingPdf === key && (
                        <RefreshCw className="h-4 w-4 text-orange-400 animate-spin ml-1" />
                      )}
                    </div>

                    {/* Document info */}
                    <div className="px-4 py-2 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                      <div><strong>Cliente:</strong> {doc.codigoCliente}</div>
                      <div><strong>NIF:</strong> {doc.nifCliente}</div>
                      <div><strong>Población:</strong> {doc.poblacionCliente}</div>
                      <div><strong>Hora:</strong> {doc.hora || '-'}</div>
                      {doc.refPedido && <div className="col-span-2"><strong>Ref. Pedido:</strong> {doc.refPedido}</div>}
                      {doc.tipoDocumento === 'factura' && (
                        <div className="col-span-2">
                          <strong>Factura:</strong> {doc.serieFactura}-{doc.numeroFactura}/{doc.ejercicioFactura}
                        </div>
                      )}
                    </div>

                    {/* Lines table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-orange-50 text-xs text-orange-700 font-medium">
                            <th className="px-3 py-2 text-left">Código</th>
                            <th className="px-3 py-2 text-left">Descripción</th>
                            <th className="px-3 py-2 text-left">Lote</th>
                            <th className="px-3 py-2 text-right">Cajas</th>
                            <th className="px-3 py-2 text-right">Uds/Kg</th>
                            <th className="px-3 py-2 text-right">Precio</th>
                            <th className="px-3 py-2 text-right">% Dto</th>
                            <th className="px-3 py-2 text-right">Importe</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {doc.lineas.map((line, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition">
                              <td className="px-3 py-2 font-mono text-xs text-gray-600">{line.codigoArticulo}</td>
                              <td className="px-3 py-2 text-gray-800 max-w-xs truncate" title={line.descripcion}>
                                {line.descripcion}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-500">{line.lote}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{line.cajas > 0 ? line.cajas : '-'}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{line.unidades > 0 ? line.unidades : '-'}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-700">{line.precioUnitario.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right text-gray-500">{line.descuento > 0 ? line.descuento.toFixed(2) + '%' : '-'}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">{line.importe.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-orange-50 font-semibold text-sm">
                            <td colSpan={7} className="px-3 py-2 text-right text-orange-700">Total PANAMAR:</td>
                            <td className="px-3 py-2 text-right text-orange-800">{doc.totalImportePanamar.toFixed(2)} &euro;</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              disabled={filters.page === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min((filters.page || 1) - 2, totalPages - 4));
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                    pageNum === filters.page
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
              disabled={filters.page === totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cerrar sesión</h3>
            <p className="text-sm text-gray-500 mb-6">¿Estás seguro de que quieres salir del modo PANAMAR?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Previsualización del Albarán</h3>
              <button
                onClick={closePreview}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Share options modal */}
      {showShareModal && shareDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Compartir albarán</h3>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {shareDoc.serieAlbaran}-{shareDoc.numeroAlbaran} · {shareDoc.nombreCliente}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => openEmailModal(shareDoc)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition text-left"
              >
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Email</div>
                  <div className="text-xs text-gray-400">Enviar PDF adjunto por correo</div>
                </div>
              </button>
              <button
                onClick={() => handleWhatsApp(shareDoc)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-200 transition text-left"
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-gray-900">WhatsApp</div>
                  <div className="text-xs text-gray-400">Compartir resumen por WhatsApp</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email modal */}
      {showEmailModal && shareDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Enviar por email</h3>
              <button onClick={() => setShowEmailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Albarán {shareDoc.serieAlbaran}-{shareDoc.numeroAlbaran} · {shareDoc.nombreCliente}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email destinatario</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm"
                  disabled={sendingEmail}
                />
              </div>
              {emailResult && (
                <div className={`text-sm px-3 py-2 rounded-lg ${emailResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {emailResult.msg}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !emailInput}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Enviar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function SummaryCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: number; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
      <div className="p-2 bg-white rounded-lg shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value.toLocaleString('es-ES')}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}
