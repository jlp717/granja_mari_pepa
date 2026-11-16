'use client';

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { CustomToast } from '@/components/ui/custom-toast';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import {
  User,
  FileText,
  ShoppingBag,
  Settings,
  LogOut,
  Download,
  Eye,
  Package,
  Calendar,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  TrendingUp,
  TrendingDown,
  Award,
  // Bell,
  MapPin,
  Phone,
  Mail,
  Building,
  Building2,
  ExternalLink,
  Check,
  CheckCircle,
  Clock,
  Truck,
  DollarSign,
  PieChart,
  BarChart3,
  ShoppingCart,
  Heart,
  Star,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Share2,
  MessageCircle,
  Send,
  X,
  Sparkles,
  BookOpen,
  AlertCircle,
  Flame,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  Briefcase,
  Crown,
  Gem,
  Zap,
  Rocket,
  Trophy,
  RefreshCw,
  Repeat,
  Target,
  Activity,
  LayoutGrid,
  CircleDot,
  Gauge,
  UserPlus,
  Users,
  Lock,
  Pencil,
  Info,
  Shield,
  Key,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { useAuthStore, useFavoritesStore, useCartStore } from '@/lib/store';
import LibroIvaModal from './libro-iva-modal';
import { DashboardCharts } from './dashboard-charts';
import { PasswordChangeForm } from './password-change-form';
import { useApiData } from '@/hooks/useApiData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FacturaBackend } from '@/lib/types';
import { formatCurrency, formatCurrencyNoDecimals } from '@/lib/utils';
import { secureFetch, secureDownload } from '@/lib/secureFetch'; // 🔐 HttpOnly Cookie Auth
import apiClient from '@/lib/apiClient'; // 🔐 Cliente API con autenticación automática

const tabIds = [
  { id: 'dashboard', icon: LayoutGrid },
  { id: 'facturas', icon: FileText },
  { id: 'perfil', icon: User },
  { id: 'favoritos', icon: Heart }
];

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

const statusLabels = {
  pending: 'Pendiente',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  paid: 'Pagada',
  cancelled: 'Cancelado'
};

const statusIcons = {
  pending: Clock,
  processing: Settings,
  shipped: Truck,
  delivered: Check,
  paid: Check,
  cancelled: Trash2
};

function parsePortalDate(value?: string) {
  if (!value) return 0;
  const [dia, mes, ano] = value.split('/').map(Number);
  if (!dia || !mes || !ano) return 0;
  return new Date(ano, mes - 1, dia).getTime();
}

// Componente para visualizar PDF desde blob - con soporte móvil
function PdfViewer({ factura, generatePdfBlob }: { factura: FacturaBackend, generatePdfBlob: (f: FacturaBackend) => Promise<string> }) {
  const t = useTranslations('customerArea.dashboard.pdf');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () => {
      // Detectar móvil por ancho de pantalla o user agent
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError('');
        const url = await generatePdfBlob(factura);
        setPdfUrl(url);
      } catch (err: any) {
        setError(err.message || t('error'));
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [factura, generatePdfBlob]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center p-4 md:p-6">
          <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 font-semibold text-sm md:text-base">{error}</p>
        </div>
      </div>
    );
  }

  // En móvil, mostrar mensaje con botón de descarga directa
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
        <div className="text-center space-y-6 max-w-sm">
          {/* Icono */}
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FileText className="w-10 h-10 text-white" />
          </div>

          {/* Título */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('mobileTitle', { serie: factura.serieFactura, numero: factura.numeroFactura })}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('mobileDesc')}
            </p>
          </div>

          {/* Botón de descarga */}
          <a
            href={pdfUrl}
            download={`Factura_${factura.serieFactura}_${factura.numeroFactura}.pdf`}
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
          >
            <Download className="w-5 h-5" />
            {t('download')}
          </a>

          {/* Info adicional */}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {t('saveInfo')}
          </p>
        </div>
      </div>
    );
  }

  // En desktop, mostrar iframe
  return (
    <iframe
      src={pdfUrl}
      className="w-full h-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white"
      title={`Factura ${factura.numeroFactura}`}
    />
  );
}

export function CustomerDashboard() {
  // ===== TRANSLATIONS =====
  const t = useTranslations('customerArea.dashboard');
  const locale = useLocale();

  // Translated tabs - now using translation hook
  const tabs = useMemo(() => tabIds.map(tab => ({
    ...tab,
    name: t(`tabs.${tab.id}`)
  })), [t]);

  // Translated status labels
  const getStatusLabel = useCallback((status: string) => {
    return t(`status.${status}` as any) || status;
  }, [t]);

  // El área de clientes abre en el resumen del panel
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [clientsList, setClientsList] = useState<{ codigoCliente: string; nombreCliente: string; nombreFiscal?: string }[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string | undefined>(undefined);
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


  // Ref para el contenido principal (scroll en móvil)
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Filtros avanzados para rango de fechas
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Estados para paginación de facturas - Reducir items para mejor performance
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Estados para compartir factura
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMethod, setShareMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [shareFactura, setShareFactura] = useState<FacturaBackend | null>(null);
  const [shareInput, setShareInput] = useState('');
  const [loadingShare, setLoadingShare] = useState(false);

  // Estado para libro de IVA
  const [showLibroIvaModal, setShowLibroIvaModal] = useState(false);

  // Estados para modal de vista previa de factura - NUEVO
  const [showFacturaPreview, setShowFacturaPreview] = useState(false);
  const [facturaPreview, setFacturaPreview] = useState<FacturaBackend | null>(null);

  // Estado para notificaciones - Sistema completo
  // const [showNotifications, setShowNotifications] = useState(false);
  // const [notifications, setNotifications] = useState<Array<{
  //   id: string;
  //   type: 'info' | 'success' | 'warning' | 'alert';
  //   title: string;
  //   message: string;
  //   time: Date;
  //   read: boolean;
  //   icon?: string;
  //   action?: { label: string; tab?: string };
  // }>>([]);

  // NOTA: El useEffect para generar notificaciones se encuentra después del useMemo de clientProfile

  // const unreadNotifications = notifications.filter(n => !n.read).length;

  // const markNotificationAsRead = (id: string) => {
  //   setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  // };

  // const markAllAsRead = () => {
  //   setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  // };

  // Caché de PDFs en memoria - NUEVO para performance
  const [pdfCache, setPdfCache] = useState<Record<string, string>>({}); // facturaId -> blob URL
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Estado para modal de WhatsApp mejorado
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [selectedFacturaForShare, setSelectedFacturaForShare] = useState<FacturaBackend | null>(null);

  // Estados para datos de contacto del usuario
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhoneEditable, setUserPhoneEditable] = useState(true);
  const [userEmailEditable, setUserEmailEditable] = useState(true);
  const [loadingContactData, setLoadingContactData] = useState(false);

  // Estado para factura pendiente de envío por email (cuando no hay email configurado)
  const [pendingEmailFactura, setPendingEmailFactura] = useState<FacturaBackend | null>(null);

  // Estado para modal de confirmación de envío por email
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [emailFacturaToSend, setEmailFacturaToSend] = useState<FacturaBackend | null>(null);
  const [emailDestination, setEmailDestination] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  // Estado para modal de confirmación de borrado de contacto
  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false);
  const [pendingContactSave, setPendingContactSave] = useState<{ email?: string | null; telefono?: string | null } | null>(null);

  // Estado para perfil completo del cliente
  const [perfilCliente, setPerfilCliente] = useState<any>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  // Estados para alertas de seguridad pendientes (persistir tras recarga)
  const [securityWarnings, setSecurityWarnings] = useState<{
    hasLegacyPassword: boolean;
    needsContactSetup: boolean;
  }>({ hasLegacyPassword: false, needsContactSetup: false });

  // Estado para modal de cambio de contraseña
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  const { user, logout } = useAuthStore();
  const { favorites, removeFavorite, getFavoritesCount } = useFavoritesStore();
  const { addItem } = useCartStore();

  // Usar el hook optimizado para cargar facturas y pedidos
  // FIX 2026-04-07: Eliminar searchTerm de facturasEndpoint para evitar re-fetch al escribir.
  // El filtrado por búsqueda se hace 100% client-side en filteredFacturas.
  const facturasEndpoint = useMemo(() => {
    const params = new URLSearchParams();
    // Eliminado: if (searchTerm) params.set('busqueda', searchTerm);
    if (selectedCliente) params.set('codigoCliente', selectedCliente);
    return `/api/auth/facturas/${user?.id}?${params.toString()}`;
  }, [user?.id, selectedCliente]);

  const {
    data: facturasRaw,
    loading: loadingFacturas,
    fetchData: cargarFacturas
  } = useApiData<FacturaBackend>({
    endpoint: facturasEndpoint,
    dataKey: 'facturas',
    errorMessage: 'Error al cargar facturas',
    showErrorToast: true,
    retryAttempts: 3,
    retryDelay: 1000
  });

  // FIX: El backend ya devuelve las facturas agrupadas correctamente.
  // No necesitamos re-agrupar en el cliente, solo asegurar que los datos estén limpios.
  const facturas = useMemo(() => {
    if (!facturasRaw) return [];

    // Corregir casos especiales de totales si es necesario (legacy logic)
    const processedFacturas = facturasRaw.map(f => {
      const fCopy = { ...f };
      if (String(f.subempresa).endsWith('9900')) {
        if (f.totalFactura > 1900 && f.totalFactura < 2000) {
          fCopy.totalFactura = 1900.00;
        }
      }
      return fCopy;
    });

    return processedFacturas;
  }, [facturasRaw]);

  const {
    data: pedidos,
    fetchData: cargarPedidos
  } = useApiData<any>({
    endpoint: `/api/pedidos/${user?.id}`,
    dataKey: 'pedidos',
    errorMessage: 'Error al cargar pedidos',
    showErrorToast: false, // No mostrar toast para pedidos (puede que no haya)
    retryAttempts: 2,
    retryDelay: 1000
  });

  // Cargar perfil completo del cliente
  const cargarPerfilCompleto = async () => {
    if (!user?.id) return;

    setLoadingPerfil(true);
    try {
      // 🔐 SEGURIDAD: Usar secureFetch con HttpOnly cookies
      const { data, ok } = await secureFetch<{ success: boolean; perfil: any }>('/api/auth/perfil');

      if (ok && data.success && data.perfil) {
        // Manejar datos que pueden venir null/undefined
        const perfil = {
          ...data.perfil,
          contacto: {
            email: data.perfil.contacto?.email || '',
            telefono: data.perfil.contacto?.telefono || ''
          }
        };
        setPerfilCliente(perfil);

        // Cargar datos de contacto en los estados (siempre editables)
        if (perfil.contacto.email) {
          setUserEmail(perfil.contacto.email);
        }

        if (perfil.contacto.telefono) {
          setUserPhone(perfil.contacto.telefono);
        }

        // 🔒 Check security status - alerts for legacy password or missing contact
        const hasLegacyPassword = perfil.seguridad?.isLegacyPassword === true ||
          perfil.seguridad?.isLegacyPassword === 1 ||
          perfil.seguridad?.isLegacyPassword === '1';

        const hasValidEmail = perfil.contacto.email &&
          perfil.contacto.email.includes('@') &&
          !perfil.contacto.email.includes('@granja.local');

        const hasValidPhone = perfil.contacto.telefono &&
          perfil.contacto.telefono.replace(/\D/g, '').length >= 9;

        const needsContactSetup = !hasValidEmail || !hasValidPhone;

        setSecurityWarnings({
          hasLegacyPassword,
          needsContactSetup
        });

        // Si hay problemas de seguridad, mostrar advertencia
        if (hasLegacyPassword || needsContactSetup) {
          console.log('⚠️ Security warnings detected:', { hasLegacyPassword, needsContactSetup });
        }
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoadingPerfil(false);
    }
  };

  // Función para cambiar de tab y hacer scroll apropiado
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);

    // Detectar si es móvil/tablet (< 1280px que es xl breakpoint)
    const isMobileOrTablet = window.innerWidth < 1280;

    if (isMobileOrTablet && mainContentRef.current) {
      // En móvil/tablet, scroll al contenido principal con offset para el header
      setTimeout(() => {
        const yOffset = -80; // Offset para el header fijo
        const element = mainContentRef.current;
        if (element) {
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({
            top: y,
            behavior: 'smooth'
          });
        }
      }, 100); // Pequeño delay para que se renderice el nuevo contenido
    } else {
      // En desktop, scroll al tope
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  // Controlar visibilidad del header al hacer scroll - MEJORADO
  // Header scroll logic removed - keeping header always visible

  // Cargar facturas, pedidos, perfil y productos cuando se monta el componente
  // FIX 2026-04-07: Eliminar searchTerm de dependencias para evitar recarga al buscar
  // El filtrado es 100% client-side vía useMemo en filteredFacturas
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarFacturas();
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedCliente, cargarFacturas]);

  useEffect(() => {
    if (user?.id) {
      cargarFacturas();
      cargarPedidos();
      cargarPerfilCompleto();
    }
  }, [user?.id, cargarFacturas, cargarPedidos]);

  // Limpiar caché de PDFs al desmontar componente
  useEffect(() => {
    return () => {
      // Liberar todos los blob URLs al desmontar
      Object.values(pdfCache).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    toast.success('Sesión cerrada correctamente');
    setShowLogoutModal(false);
  }, [logout]);

  const handleLogoutClick = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  // Cargar datos de contacto del usuario (email y teléfono)
  const fetchClients = useCallback(async () => {
    try {
      const res = await secureFetch<{ success: boolean; clients: any[] }>('/api/panamar/clients');
      if (res.ok && res.data.success) {
        setClientsList(res.data.clients);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  }, []);

  useEffect(() => {
    if (user?.id) fetchClients();
  }, [user?.id, fetchClients]);

  const cargarDatosContacto = async () => {
    if (!user?.id) return;

    setLoadingContactData(true);
    try {
      // 🔐 SEGURIDAD: Usar secureFetch con HttpOnly cookies
      const { data, ok } = await secureFetch<{ success: boolean; email?: string; telefono?: string }>(
        `/api/clientes/${user.id}/contacto`
      );

      if (ok && data.success) {
        // Si existe email en la BD, lo cargamos (siempre editable)
        if (data.email) {
          setUserEmail(data.email);
        }

        // Si existe teléfono en la BD, lo cargamos (siempre editable)
        if (data.telefono) {
          setUserPhone(data.telefono);
        }
      }
    } catch (error) {
      console.error('Error cargando datos de contacto:', error);
    } finally {
      setLoadingContactData(false);
    }
  };

  // Cargar datos de contacto cuando se monta el componente
  // FIX 2026-04-07: Eliminar searchTerm de dependencias
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatosContacto();
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedCliente]);

  useEffect(() => {
    if (user?.id) {
      cargarDatosContacto();
    }
  }, [user?.id]);

  // ==========================================================================
  // 🚀 SISTEMA DE INTELIGENCIA DEL CLIENTE - EXPERIENCIA ULTRA PERSONALIZADA
  // Análisis profundo de patrones, predicciones, insights únicos por cliente
  // ==========================================================================
  const clientProfile = useMemo(() => {
    const now = new Date();
    const hora = now.getHours();
    const diaSemana = now.getDay();
    const mesActual = now.getMonth() + 1;
    const añoActual = now.getFullYear();
    const diaDelMes = now.getDate();

    // Saludo contextual inteligente
    let greeting = 'Buenos días';
    let greetingContext = '';
    if (hora >= 14 && hora < 20) {
      greeting = 'Buenas tardes';
    } else if (hora >= 20 || hora < 6) {
      greeting = 'Buenas noches';
    }

    // Contexto del día
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;

    // ========== CLIENTE NUEVO ==========
    if (!facturas || facturas.length === 0) {
      return {
        // Identidad
        greeting,
        greetingContext: 'Bienvenido a tu portal exclusivo',
        isNewClient: true,
        clientId: user?.id || 'new',

        // Tier y visuales
        tier: 'starter' as const,
        tierLabel: 'Nuevo Cliente',
        tierIcon: 'sparkles',
        tierGradient: 'from-slate-600 via-slate-700 to-slate-800',
        accentColor: '#64748B',
        secondaryColor: '#94A3B8',

        // Métricas básicas
        stats: {
          totalFacturado: 0,
          avgMensual: 0,
          facturasMes: 0,
          importeMes: 0,
          totalFacturas: 0,
        },

        // Timeline vacío
        timeline: {
          primeraFactura: null as string | null,
          ultimaFactura: null as string | null,
          diasComoCliente: 0,
          diasDesdeUltimaCompra: null as number | null,
        },

        // Patrones vacíos
        patterns: {
          mesActivo: false,
          rachaActiva: 0,
          mejorMes: null as { mes: string; importe: number } | null,
          peorMes: null as { mes: string; importe: number } | null,
          diasFrecuentes: [] as string[],
          horaFrecuente: null as string | null,
          frecuenciaCompra: null as number | null,
          estacionalidad: null as 'alta' | 'media' | 'baja' | null,
        },

        // Tendencias
        trends: {
          tendencia: 'neutral' as 'up' | 'down' | 'neutral',
          porcentajeCambio: 0,
          tendenciaTexto: 'Sin datos suficientes',
          velocidadCrecimiento: 'estable' as 'acelerado' | 'estable' | 'desacelerado',
        },

        // Predicciones
        predictions: {
          proximaCompraEstimada: null as string | null,
          importeProximoMes: null as number | null,
          riesgoInactividad: 'bajo' as 'bajo' | 'medio' | 'alto',
          potencialCrecimiento: 'alto' as 'bajo' | 'medio' | 'alto',
        },

        // Insights personalizados
        insights: [] as Array<{
          type: 'achievement' | 'opportunity' | 'trend' | 'milestone' | 'alert';
          icon: string;
          title: string;
          description: string;
          color: string;
          priority: number;
        }>,

        // Quick actions
        quickActions: [
          { id: 'catalog', label: 'Explorar catálogo', icon: 'shopping-bag', primary: true },
          { id: 'contact', label: 'Contactar', icon: 'message-circle', primary: false },
        ],

        // Hitos/Milestones
        milestones: {
          achieved: [] as Array<{ id: string; label: string; date: string }>,
          next: { id: 'first-order', label: 'Primera factura', progress: 0 },
        },

        // Métricas destacadas para mostrar
        highlightedMetrics: [
          { label: 'Estado', value: 'Nuevo', icon: 'user-plus', color: 'blue' },
        ],
      };
    }

    // ========== ANÁLISIS PROFUNDO DEL CLIENTE ==========

    // Filtrar facturas que tengan fecha válida
    const facturasValidas = facturas.filter(f => f && f.fecha && typeof f.fecha === 'string');

    // Ordenar facturas por fecha
    const facturasOrdenadas = [...facturasValidas].sort((a, b) => {
      const dateA = a.fecha.split('/').reverse().join('-');
      const dateB = b.fecha.split('/').reverse().join('-');
      return dateA.localeCompare(dateB);
    });

    const facturasRecientes = [...facturasValidas].sort((a, b) => {
      const dateA = a.fecha.split('/').reverse().join('-');
      const dateB = b.fecha.split('/').reverse().join('-');
      return dateB.localeCompare(dateA);
    });

    // Métricas básicas
    const totalFacturado = facturasValidas.reduce((sum, f) => sum + (f.totalFactura || 0), 0);
    const totalFacturas = facturasValidas.length;
    const avgPorFactura = totalFacturado / totalFacturas;

    // Timeline del cliente
    const primeraFactura = facturasOrdenadas[0]?.fecha || null;
    const ultimaFactura = facturasRecientes[0]?.fecha || null;

    let diasComoCliente = 0;
    let diasDesdeUltimaCompra: number | null = null;

    if (primeraFactura) {
      const parts = primeraFactura.split('/');
      if (parts.length >= 3) {
        const fechaPrimera = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        diasComoCliente = Math.ceil((now.getTime() - fechaPrimera.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    if (ultimaFactura) {
      const parts = ultimaFactura.split('/');
      if (parts.length >= 3) {
        const fechaUltima = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        diasDesdeUltimaCompra = Math.ceil((now.getTime() - fechaUltima.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Análisis por mes
    const facturasPorMes: { [key: string]: number } = {};
    const importesPorMes: { [key: string]: number } = {};
    const facturasPorDiaSemana: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const facturasPorHora: { [key: number]: number } = {};

    facturasValidas.forEach(f => {
      if (f.fecha) {
        const parts = f.fecha.split('/');
        if (parts.length >= 3) {
          const mes = parts[1];
          const año = parts[2];
          const key = `${año}-${mes}`;
          facturasPorMes[key] = (facturasPorMes[key] || 0) + 1;
          importesPorMes[key] = (importesPorMes[key] || 0) + (f.totalFactura || 0);

          // Día de la semana
          const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(parts[0]));
          facturasPorDiaSemana[fecha.getDay()]++;
        }
      }
    });

    // Encontrar mejor y peor mes
    const mesesOrdenados = Object.entries(importesPorMes).sort((a, b) => b[1] - a[1]);
    const mejorMes = mesesOrdenados[0] ? { mes: mesesOrdenados[0][0], importe: mesesOrdenados[0][1] } : null;
    const peorMes = mesesOrdenados.length > 1 ? { mes: mesesOrdenados[mesesOrdenados.length - 1][0], importe: mesesOrdenados[mesesOrdenados.length - 1][1] } : null;

    // Días más frecuentes de compra
    const diasFrecuentes = Object.entries(facturasPorDiaSemana)
      .sort((a, b) => b[1] - a[1])
      .filter(d => d[1] > 0)
      .slice(0, 3)
      .map(d => diasSemana[parseInt(d[0])]);

    // Mes actual
    const keyMesActual = `${añoActual}-${String(mesActual).padStart(2, '0')}`;
    const facturasMes = facturasPorMes[keyMesActual] || 0;
    const importeMes = importesPorMes[keyMesActual] || 0;
    const mesActivo = facturasMes > 0;

    // Media mensual
    const mesesConActividad = Object.keys(importesPorMes).length || 1;
    const avgMensual = totalFacturado / mesesConActividad;

    // Tendencia vs mes anterior
    const keyMesAnterior = mesActual === 1
      ? `${añoActual - 1}-12`
      : `${añoActual}-${String(mesActual - 1).padStart(2, '0')}`;
    const importeMesAnterior = importesPorMes[keyMesAnterior] || 0;

    let tendencia: 'up' | 'down' | 'neutral' = 'neutral';
    let porcentajeCambio = 0;

    if (importeMesAnterior > 0) {
      porcentajeCambio = ((importeMes - importeMesAnterior) / importeMesAnterior) * 100;
      if (porcentajeCambio > 5) tendencia = 'up';
      else if (porcentajeCambio < -5) tendencia = 'down';
    } else if (importeMes > 0) {
      tendencia = 'up';
      porcentajeCambio = 100;
    }

    // Calcular velocidad de crecimiento (comparando trimestres)
    let velocidadCrecimiento: 'acelerado' | 'estable' | 'desacelerado' = 'estable';
    const mesesArray = Object.entries(importesPorMes).sort((a, b) => a[0].localeCompare(b[0]));
    if (mesesArray.length >= 6) {
      const ultimos3 = mesesArray.slice(-3).reduce((sum, m) => sum + m[1], 0);
      const anteriores3 = mesesArray.slice(-6, -3).reduce((sum, m) => sum + m[1], 0);
      if (anteriores3 > 0) {
        const cambioTrimestral = ((ultimos3 - anteriores3) / anteriores3) * 100;
        if (cambioTrimestral > 20) velocidadCrecimiento = 'acelerado';
        else if (cambioTrimestral < -20) velocidadCrecimiento = 'desacelerado';
      }
    }

    // Racha de meses consecutivos con actividad
    let rachaActiva = 0;
    for (let i = 0; i < 24; i++) {
      const checkMes = mesActual - i <= 0 ? mesActual - i + 12 : mesActual - i;
      const checkAño = mesActual - i <= 0 ? añoActual - 1 : añoActual;
      const key = `${checkAño}-${String(checkMes).padStart(2, '0')}`;
      if (facturasPorMes[key] && facturasPorMes[key] > 0) {
        rachaActiva++;
      } else {
        break;
      }
    }

    // Frecuencia de compra (días promedio entre compras)
    let frecuenciaCompra: number | null = null;
    if (totalFacturas > 1 && diasComoCliente > 0) {
      frecuenciaCompra = Math.round(diasComoCliente / totalFacturas);
    }

    // Estacionalidad
    let estacionalidad: 'alta' | 'media' | 'baja' | null = null;
    if (mesesConActividad >= 4) {
      const importes = Object.values(importesPorMes);
      const maxImporte = Math.max(...importes);
      const minImporte = Math.min(...importes);
      const variacion = maxImporte > 0 ? ((maxImporte - minImporte) / maxImporte) * 100 : 0;
      if (variacion > 50) estacionalidad = 'alta';
      else if (variacion > 25) estacionalidad = 'media';
      else estacionalidad = 'baja';
    }

    // ========== DETERMINAR TIER ==========
    let tier: 'starter' | 'business' | 'enterprise' | 'strategic' = 'starter';
    let tierLabel = 'Cliente';
    let tierIcon = 'user';
    let tierGradient = 'from-slate-600 via-slate-700 to-slate-800';
    let accentColor = '#64748B';
    let secondaryColor = '#94A3B8';

    // Sistema de puntuación para tier
    let tierScore = 0;
    tierScore += Math.min(totalFacturado / 10000, 5) * 20; // Hasta 100 pts por facturación
    tierScore += Math.min(mesesConActividad, 12) * 5; // Hasta 60 pts por antigüedad
    tierScore += Math.min(rachaActiva, 6) * 5; // Hasta 30 pts por racha
    tierScore += velocidadCrecimiento === 'acelerado' ? 20 : velocidadCrecimiento === 'estable' ? 10 : 0;

    if (tierScore >= 150 || totalFacturado > 50000) {
      tier = 'strategic';
      tierLabel = 'Partner Estratégico';
      tierIcon = 'crown';
      tierGradient = 'from-amber-500 via-orange-500 to-rose-600';
      accentColor = '#F59E0B';
      secondaryColor = '#FBBF24';
    } else if (tierScore >= 80 || totalFacturado > 15000) {
      tier = 'enterprise';
      tierLabel = 'Cliente Preferente';
      tierIcon = 'gem';
      tierGradient = 'from-violet-600 via-purple-600 to-fuchsia-600';
      accentColor = '#8B5CF6';
      secondaryColor = '#A78BFA';
    } else if (tierScore >= 30 || totalFacturado > 3000) {
      tier = 'business';
      tierLabel = 'Cliente Activo';
      tierIcon = 'zap';
      tierGradient = 'from-blue-600 via-indigo-600 to-violet-600';
      accentColor = '#3B82F6';
      secondaryColor = '#60A5FA';
    }

    // ========== PREDICCIONES ==========
    let proximaCompraEstimada: string | null = null;
    if (frecuenciaCompra && diasDesdeUltimaCompra !== null) {
      const diasParaProxima = Math.max(0, frecuenciaCompra - diasDesdeUltimaCompra);
      const fechaProxima = new Date(now.getTime() + diasParaProxima * 24 * 60 * 60 * 1000);
      proximaCompraEstimada = fechaProxima.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    // Predecir importe próximo mes basado en tendencia
    let importeProximoMes: number | null = null;
    if (avgMensual > 0) {
      const factor = tendencia === 'up' ? 1.1 : tendencia === 'down' ? 0.9 : 1;
      importeProximoMes = avgMensual * factor;
    }

    // Riesgo de inactividad
    let riesgoInactividad: 'bajo' | 'medio' | 'alto' = 'bajo';
    if (diasDesdeUltimaCompra !== null) {
      if (frecuenciaCompra) {
        if (diasDesdeUltimaCompra > frecuenciaCompra * 2) riesgoInactividad = 'alto';
        else if (diasDesdeUltimaCompra > frecuenciaCompra * 1.5) riesgoInactividad = 'medio';
      } else {
        if (diasDesdeUltimaCompra > 60) riesgoInactividad = 'alto';
        else if (diasDesdeUltimaCompra > 30) riesgoInactividad = 'medio';
      }
    }

    // Potencial de crecimiento
    let potencialCrecimiento: 'bajo' | 'medio' | 'alto' = 'medio';
    if (velocidadCrecimiento === 'acelerado' && tendencia === 'up') potencialCrecimiento = 'alto';
    else if (velocidadCrecimiento === 'desacelerado' || tendencia === 'down') potencialCrecimiento = 'bajo';

    // ========== INSIGHTS PERSONALIZADOS ==========
    const insights: Array<{
      type: 'achievement' | 'opportunity' | 'trend' | 'milestone' | 'alert';
      icon: string;
      title: string;
      description: string;
      color: string;
      priority: number;
    }> = [];

    // Insight de racha
    if (rachaActiva >= 6) {
      insights.push({
        type: 'achievement',
        icon: 'flame',
        title: `${rachaActiva} meses consecutivos`,
        description: 'Tu constancia es excepcional. Eres un cliente modelo.',
        color: 'orange',
        priority: 1,
      });
    } else if (rachaActiva >= 3) {
      insights.push({
        type: 'trend',
        icon: 'trending-up',
        title: 'Actividad constante',
        description: `${rachaActiva} meses seguidos con pedidos.`,
        color: 'emerald',
        priority: 2,
      });
    }

    // Insight de crecimiento
    if (tendencia === 'up' && porcentajeCambio > 20) {
      insights.push({
        type: 'trend',
        icon: 'rocket',
        title: `Crecimiento +${porcentajeCambio.toFixed(0)}%`,
        description: 'Tu actividad este mes supera significativamente el anterior.',
        color: 'emerald',
        priority: 1,
      });
    }

    // Insight de milestone
    if (totalFacturas === 10 || totalFacturas === 25 || totalFacturas === 50 || totalFacturas === 100) {
      insights.push({
        type: 'milestone',
        icon: 'award',
        title: `¡${totalFacturas} facturas!`,
        description: 'Has alcanzado un hito importante en tu historial.',
        color: 'amber',
        priority: 1,
      });
    }

    // Insight de facturación total
    if (totalFacturado >= 10000 && totalFacturado < 10500) {
      insights.push({
        type: 'milestone',
        icon: 'trophy',
        title: '¡10.000€ facturados!',
        description: 'Gracias por confiar en nosotros.',
        color: 'amber',
        priority: 1,
      });
    } else if (totalFacturado >= 50000 && totalFacturado < 50500) {
      insights.push({
        type: 'milestone',
        icon: 'crown',
        title: '¡50.000€ facturados!',
        description: 'Eres uno de nuestros clientes más valiosos.',
        color: 'amber',
        priority: 1,
      });
    }

    // Alerta de inactividad
    if (riesgoInactividad === 'alto') {
      insights.push({
        type: 'alert',
        icon: 'clock',
        title: 'Te echamos de menos',
        description: `Han pasado ${diasDesdeUltimaCompra} días. ¿Necesitas algo?`,
        color: 'amber',
        priority: 0,
      });
    }

    // Oportunidad basada en patrón
    if (diasFrecuentes.length > 0 && diasSemana[diaSemana] === diasFrecuentes[0]) {
      insights.push({
        type: 'opportunity',
        icon: 'calendar',
        title: `Hoy es ${diasFrecuentes[0]}`,
        description: 'Tu día favorito para hacer pedidos.',
        color: 'blue',
        priority: 2,
      });
    }

    // Ordenar insights por prioridad
    insights.sort((a, b) => a.priority - b.priority);

    // ========== QUICK ACTIONS CONTEXTUALES ==========
    const quickActions: Array<{ id: string; label: string; icon: string; primary: boolean }> = [];

    if (diasDesdeUltimaCompra && diasDesdeUltimaCompra < 30 && facturasMes > 0) {
      quickActions.push({ id: 'repeat', label: 'Repetir último pedido', icon: 'refresh-cw', primary: true });
    } else {
      quickActions.push({ id: 'catalog', label: 'Ver catálogo', icon: 'shopping-bag', primary: true });
    }

    quickActions.push({ id: 'invoices', label: 'Mis facturas', icon: 'file-text', primary: false });

    if (tier === 'strategic' || tier === 'enterprise') {
      quickActions.push({ id: 'contact-priority', label: 'Línea directa', icon: 'phone', primary: false });
    }

    // ========== MILESTONES ==========
    const achieved: Array<{ id: string; label: string; date: string }> = [];

    if (totalFacturas >= 1) achieved.push({ id: 'first-order', label: 'Primera factura', date: primeraFactura || '' });
    if (totalFacturado >= 1000) achieved.push({ id: '1k', label: '1.000€ facturados', date: '' });
    if (totalFacturado >= 5000) achieved.push({ id: '5k', label: '5.000€ facturados', date: '' });
    if (totalFacturado >= 10000) achieved.push({ id: '10k', label: '10.000€ facturados', date: '' });
    if (rachaActiva >= 3) achieved.push({ id: 'streak-3', label: '3 meses seguidos', date: '' });
    if (rachaActiva >= 6) achieved.push({ id: 'streak-6', label: '6 meses seguidos', date: '' });

    let nextMilestone = { id: 'first-order', label: 'Primera factura', progress: 0 };
    if (totalFacturas >= 1 && totalFacturado < 1000) {
      nextMilestone = { id: '1k', label: '1.000€ facturados', progress: (totalFacturado / 1000) * 100 };
    } else if (totalFacturado >= 1000 && totalFacturado < 5000) {
      nextMilestone = { id: '5k', label: '5.000€ facturados', progress: (totalFacturado / 5000) * 100 };
    } else if (totalFacturado >= 5000 && totalFacturado < 10000) {
      nextMilestone = { id: '10k', label: '10.000€ facturados', progress: (totalFacturado / 10000) * 100 };
    } else if (totalFacturado >= 10000 && totalFacturado < 50000) {
      nextMilestone = { id: '50k', label: '50.000€ facturados', progress: (totalFacturado / 50000) * 100 };
    } else if (totalFacturado >= 50000) {
      nextMilestone = { id: 'legend', label: 'Cliente Leyenda', progress: 100 };
    }

    // ========== HIGHLIGHTED METRICS ==========
    const highlightedMetrics: Array<{ label: string; value: string; icon: string; color: string; trend?: 'up' | 'down' }> = [];

    // Métrica principal según contexto
    if (mesActivo && importeMes > avgMensual * 1.2) {
      highlightedMetrics.push({
        label: 'Este mes',
        value: formatCurrency(importeMes),
        icon: 'trending-up',
        color: 'emerald',
        trend: 'up',
      });
    } else if (rachaActiva >= 2) {
      highlightedMetrics.push({
        label: 'Racha activa',
        value: `${rachaActiva} meses`,
        icon: 'flame',
        color: 'orange',
      });
    }

    if (frecuenciaCompra) {
      highlightedMetrics.push({
        label: 'Frecuencia',
        value: `cada ${frecuenciaCompra} días`,
        icon: 'repeat',
        color: 'blue',
      });
    }

    if (mejorMes) {
      const [año, mes] = mejorMes.mes.split('-');
      const nombreMes = new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'short' });
      highlightedMetrics.push({
        label: 'Mejor mes',
        value: `${nombreMes} '${año.slice(2)}`,
        icon: 'star',
        color: 'amber',
      });
    }

    // Greeting context personalizado
    if (diasDesdeUltimaCompra !== null && diasDesdeUltimaCompra < 7) {
      greetingContext = 'Gracias por tu reciente pedido';
    } else if (tier === 'strategic') {
      greetingContext = 'Tu partner estratégico de confianza';
    } else if (tier === 'enterprise') {
      greetingContext = 'Acceso preferente a tu portal';
    } else if (esFinDeSemana) {
      greetingContext = 'Buen fin de semana';
    } else {
      greetingContext = 'Tu portal de gestión';
    }

    return {
      // Identidad
      greeting,
      greetingContext,
      isNewClient: false,
      clientId: user?.id || '',

      // Tier y visuales
      tier,
      tierLabel,
      tierIcon,
      tierGradient,
      accentColor,
      secondaryColor,

      // Métricas
      stats: {
        totalFacturado,
        avgMensual,
        facturasMes,
        importeMes,
        totalFacturas,
        avgPorFactura,
      },

      // Timeline
      timeline: {
        primeraFactura,
        ultimaFactura,
        diasComoCliente,
        diasDesdeUltimaCompra,
      },

      // Patrones
      patterns: {
        mesActivo,
        rachaActiva,
        mejorMes,
        peorMes,
        diasFrecuentes,
        horaFrecuente: null,
        frecuenciaCompra,
        estacionalidad,
        mesesConActividad,
      },

      // Tendencias
      trends: {
        tendencia,
        porcentajeCambio,
        tendenciaTexto: tendencia === 'up'
          ? `+${porcentajeCambio.toFixed(0)}% vs mes anterior`
          : tendencia === 'down'
            ? `${porcentajeCambio.toFixed(0)}% vs mes anterior`
            : 'Estable',
        velocidadCrecimiento,
      },

      // Predicciones
      predictions: {
        proximaCompraEstimada,
        importeProximoMes,
        riesgoInactividad,
        potencialCrecimiento,
      },

      // Insights
      insights: insights.slice(0, 3), // Máximo 3 insights visibles

      // Quick actions
      quickActions,

      // Milestones
      milestones: {
        achieved,
        next: nextMilestone,
      },

      // Métricas destacadas
      highlightedMetrics: highlightedMetrics.slice(0, 3),
    };
  }, [facturas, user?.id]);

  // Para compatibilidad temporal, crear clientInsights desde clientProfile
  const clientInsights = useMemo(() => ({
    greeting: clientProfile.greeting,
    isNewClient: clientProfile.isNewClient,
    tier: clientProfile.tier,
    tierLabel: clientProfile.tierLabel,
    tierIcon: clientProfile.tierIcon,
    tierGradient: clientProfile.tierGradient,
    accentColor: clientProfile.accentColor,
    totalFacturado: clientProfile.stats.totalFacturado,
    avgMensual: clientProfile.stats.avgMensual,
    facturasMes: clientProfile.stats.facturasMes,
    importeMes: clientProfile.stats.importeMes,
    mesActivo: clientProfile.patterns.mesActivo,
    diasDesdeUltimaCompra: clientProfile.timeline.diasDesdeUltimaCompra,
    rachaActiva: clientProfile.patterns.rachaActiva,
    tendencia: clientProfile.trends.tendencia,
    porcentajeCambio: clientProfile.trends.porcentajeCambio,
    ultimaActividad: clientProfile.timeline.ultimaFactura,
    metricaDestacada: clientProfile.highlightedMetrics[0] ? {
      label: clientProfile.highlightedMetrics[0].label,
      value: clientProfile.highlightedMetrics[0].value,
      trend: (clientProfile.highlightedMetrics[0] as { trend?: 'up' | 'down' }).trend,
    } : null,
  }), [clientProfile]);
  // ==========================================================================

  // Generar notificaciones dinámicas basadas en datos reales
  // IMPORTANTE: Este useEffect debe estar DESPUÉS del useMemo de clientProfile
  // useEffect(() => {
  //   if (!facturas || facturas.length === 0) return;

  //   const newNotifications: Array<{
  //     id: string;
  //     type: 'info' | 'success' | 'warning' | 'alert';
  //     title: string;
  //     message: string;
  //     time: Date;
  //     read: boolean;
  //     icon?: string;
  //     action?: { label: string; tab?: string };
  //   }> = [];

  //   const now = new Date();
  //   const currentMonth = now.getMonth();
  //   const currentYear = now.getFullYear();

  //   // Notificación: Facturas nuevas este mes
  //   const facturasEsteMes = facturas.filter(f => f.mes === (currentMonth + 1) && f.ano === currentYear);
  //   if (facturasEsteMes.length > 0) {
  //     newNotifications.push({
  //       id: 'facturas-mes',
  //       type: 'info',
  //       title: 'Facturas del mes',
  //       message: `Tienes ${facturasEsteMes.length} ${facturasEsteMes.length === 1 ? 'factura' : 'facturas'} en ${now.toLocaleDateString('es-ES', { month: 'long' })}`,
  //       time: new Date(),
  //       read: false,
  //       icon: 'file',
  //       action: { label: 'Ver facturas', tab: 'facturas' }
  //     });
  //   }

  //   // Notificación: Cliente desde hace mucho tiempo
  //   if (clientProfile.timeline.diasComoCliente > 365) {
  //     const años = Math.floor(clientProfile.timeline.diasComoCliente / 365);
  //     newNotifications.push({
  //       id: 'aniversario',
  //       type: 'success',
  //       title: 'Cliente fiel',
  //       message: `Llevas ${años} ${años === 1 ? 'año' : 'años'} confiando en nosotros`,
  //       time: new Date(Date.now() - 86400000),
  //       read: false,
  //       icon: 'award'
  //     });
  //   }

  //   // Notificación: Sin actividad reciente
  //   if (!clientProfile.patterns.mesActivo && facturas.length > 0) {
  //     newNotifications.push({
  //       id: 'sin-actividad',
  //       type: 'warning',
  //       title: 'Te echamos de menos',
  //       message: `Han pasado ${clientProfile.timeline.diasDesdeUltimaCompra || 'varios'} días desde tu última compra`,
  //       time: new Date(Date.now() - 172800000),
  //       read: false,
  //       icon: 'clock'
  //     });
  //   }

  //   // Notificación: Nuevo nivel de cliente
  //   if (clientProfile.tier === 'strategic' || clientProfile.tier === 'enterprise') {
  //     newNotifications.push({
  //       id: 'nivel-premium',
  //       type: 'success',
  //       title: 'Nivel Premium',
  //       message: `Eres cliente ${clientProfile.tierLabel}. Gracias por tu confianza.`,
  //       time: new Date(Date.now() - 259200000),
  //       read: true,
  //       icon: 'crown'
  //     });
  //   }

  //   // Notificación: Récord de facturación
  //   if (clientProfile.stats.totalFacturado > 100000) {
  //     newNotifications.push({
  //       id: 'record',
  //       type: 'success',
  //       title: 'Hito alcanzado',
  //       message: `Has superado los 100.000€ en facturación total`,
  //       time: new Date(Date.now() - 604800000),
  //       read: true,
  //       icon: 'trophy'
  //     });
  //   }

  //   setNotifications(newNotifications);
  // }, [facturas, clientProfile]);

  // Abrir modal de compartir factura
  const handleShareInvoice = (factura: FacturaBackend, method: 'whatsapp' | 'email') => {
    setShareFactura(factura);
    setShareMethod(method);

    // Si ya tenemos datos guardados, pre-rellenar
    if (method === 'whatsapp' && userPhone) {
      setShareInput(userPhone);
    } else if (method === 'email' && userEmail) {
      setShareInput(userEmail);
    } else {
      setShareInput('');
    }

    setShowShareModal(true);
  };

  // Compartir factura con sistema de enlaces temporales
  const handleShareSubmit = async () => {
    if (!shareFactura || !shareInput.trim()) {
      toast.error('Por favor, introduce un ' + (shareMethod === 'whatsapp' ? 'teléfono' : 'email') + ' válido');
      return;
    }

    setLoadingShare(true);

    try {
      // 🔐 SEGURIDAD: Usar secureFetch con HttpOnly cookies
      const { data, ok } = await secureFetch<{ success: boolean; error?: string; data: { url: string; mensajeWhatsApp: string } }>(
        '/api/compartir/generar-enlace',
        {
          method: 'POST',
          body: JSON.stringify({
            subempresa: shareFactura.subempresa,
            ejercicio: shareFactura.ejercicio,
            serie: shareFactura.serie,
            terminal: shareFactura.terminal,
            numero_albaran: shareFactura.numero_albaran,
            serieFactura: shareFactura.serieFactura,
            numeroFactura: shareFactura.numeroFactura
          })
        }
      );

      if (!ok || !data.success) {
        throw new Error(data.error || 'Error al generar enlace');
      }

      const { url, mensajeWhatsApp } = data.data;

      if (shareMethod === 'whatsapp') {
        // Validar formato de teléfono
        const phoneClean = shareInput.replace(/\D/g, '');
        if (phoneClean.length < 9) {
          toast.error('Número de teléfono inválido');
          return;
        }

        // Abrir WhatsApp con el mensaje generado por el backend (incluye enlace al PDF)
        const whatsappUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(mensajeWhatsApp)}`;
        window.open(whatsappUrl, '_blank');

        toast.success(
          <div className="flex flex-col">
            <div className="font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              WhatsApp abierto
            </div>
            <div className="text-sm text-gray-600">
              Mensaje enviado con enlace de descarga (válido 24h)
            </div>
          </div>,
          { duration: 5000 }
        );

      } else if (shareMethod === 'email') {
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(shareInput)) {
          toast.error('Email inválido');
          return;
        }

        // Abrir Gmail con enlace al PDF
        const asunto = `Factura ${shareFactura.serieFactura}-${shareFactura.numeroFactura} - Granja Maripepa`;
        const cuerpo = `🧺 Granja Maripepa\n\nHola,\n\nTe compartimos la factura de tu pedido:\n\n📄 Factura: ${shareFactura.serieFactura}-${shareFactura.numeroFactura}\n📅 Fecha: ${shareFactura.fecha}\n💰 Total: ${formatCurrency(shareFactura.totalFactura)}\n\n📥 Descargar PDF:\n${url}\n\nEste enlace es válido por 24 horas.\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\n¡Gracias por tu confianza! 🐔🥚\n\nGranja Maripepa\nwww.mari-pepa.com`;

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(shareInput)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');

        toast.success(
          <div className="flex flex-col">
            <div className="font-bold flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Gmail abierto
            </div>
            <div className="text-sm text-gray-600">
              Enlace de descarga incluido (válido 24h)
            </div>
          </div>,
          { duration: 5000 }
        );
      }

      setShowShareModal(false);

    } catch (error) {
      console.error('Error compartiendo factura:', error);
      toast.error('Error al compartir la factura. Por favor, inténtalo de nuevo.');
    } finally {
      setLoadingShare(false);
    }
  };

  // Función para guardar datos de contacto
  const guardarDatosContacto = async (datos: { email?: string | null; telefono?: string | null }) => {
    try {
      // 🔐 SEGURIDAD: Usar secureFetch con HttpOnly cookies
      // Use codigoCliente instead of numeric ID
      // Use codigoCliente from user.id (defined in AuthStore)
      const codigoCliente = user?.id || user?.codigoCliente || user?.customerCode;
      if (!codigoCliente) {
        toast.error('No se encontró el código de cliente');
        return;
      }

      const { data, ok } = await secureFetch<{ success: boolean; error?: string }>(
        `/api/clientes/${codigoCliente}/contacto`,
        {
          method: 'PUT',
          body: JSON.stringify(datos)
        }
      );

      if (ok && data.success) {
        toast.success('Datos de contacto guardados correctamente');

        // Si hay una factura pendiente de envío por email y se guardó un email
        if (pendingEmailFactura && datos.email) {
          // Mostrar modal de confirmación
          setEmailFacturaToSend(pendingEmailFactura);
          setEmailDestination(datos.email);
          setShowEmailConfirmModal(true);
        }

        // Cerrar modal de confirmación de borrado si estaba abierto
        setShowDeleteContactModal(false);
        setPendingContactSave(null);

        // 🔄 Recargar datos de contacto para reflejar los cambios en la UI
        await cargarDatosContacto();

      } else {
        toast.error(data.error || 'Error al guardar los datos');
      }
    } catch (error) {
      console.error('Error guardando datos de contacto:', error);
      toast.error('Error al conectar con el servidor');
    }
  };

  // Función para enviar factura por email con confirmación
  const enviarFacturaPorEmail = async (factura: FacturaBackend, destinatario: string) => {
    setSendingEmail(true);
    const toastId = toast.loading('Enviando factura por email...');

    try {
      // 🔐 SEGURIDAD: Usar secureFetch con HttpOnly cookies
      const { data, ok } = await secureFetch<{ success: boolean; error?: string }>(
        '/api/clientes/enviar-factura-email',
        {
          method: 'POST',
          body: JSON.stringify({
            factura: {
              // Enviar datos de FACTURA, no de albarán (backend actualizado)
              serie: factura.serieFactura,
              numero: factura.numeroFactura,
              ejercicio: factura.ejercicio,
              // Mantener resto por compatibilidad si es necesario, pero serie/numero mandan
              subempresa: factura.subempresa,
            },
            destinatario: destinatario,
            clienteNombre: user?.name || 'Cliente'
          })
        }
      );

      if (!ok) {
        throw new Error(data.error || 'Error al enviar email');
      }

      toast.success(`Factura enviada a ${destinatario}`, { id: toastId });
      setShowEmailConfirmModal(false);

      // Si había una factura pendiente, limpiarla y volver a facturas
      if (pendingEmailFactura) {
        setPendingEmailFactura(null);
        setActiveTab('facturas');
      }

    } catch (error: any) {
      toast.error(error.message || 'Error al enviar email', { id: toastId });
    } finally {
      setSendingEmail(false);
    }
  };

  // Función para enviar la factura por WhatsApp con el PDF adjunto.
  const enviarFacturaPorWhatsapp = async (
    factura: FacturaBackend,
    telefono: string,
  ): Promise<boolean> => {
    const digits = String(telefono || '').replace(/\D/g, '');
    if (digits.length < 9) {
      toast.error('Número de teléfono inválido');
      return false;
    }

    setSendingWhatsApp(true);
    const toastId = toast.loading('Enviando factura por WhatsApp...');
    try {
      const { data, ok } = await secureFetch<{
        success?: boolean;
        message?: string;
        fallbackUrl?: string;
        toMasked?: string;
      }>('/api/clientes/enviar-factura-whatsapp', {
        method: 'POST',
        body: JSON.stringify({
          factura: {
            serie: factura.serieFactura,
            numero: factura.numeroFactura,
            ejercicio: factura.ejercicio,
          },
          telefono,
        }),
      });

      if (ok && data.success) {
        toast.success(
          `Factura enviada por WhatsApp${data.toMasked ? ` a ${data.toMasked}` : ''}`,
          { id: toastId },
        );
        return true;
      }

      toast.error(
        data.message ||
          'WhatsApp no está vinculado. No se ha podido enviar el PDF.',
        { id: toastId, duration: 8000 },
      );
      if (data.fallbackUrl) {
        window.open(data.fallbackUrl, '_blank', 'noopener,noreferrer');
      }
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar por WhatsApp', {
        id: toastId,
      });
      return false;
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // Función para generar PDF y guardarlo en caché (sin descargar)
  // OPTIMIZADO: Solo guarda 2 PDFs máximo para evitar problemas de memoria
  const generatePdfBlob = useCallback(async (factura: FacturaBackend): Promise<string> => {
    // Crear clave única para la factura (corregido: usar campos que existen)
    const cacheKey = `${factura.serieFactura}-${factura.numeroFactura}-${factura.ejercicio}`;

    // Si ya está en caché, devolverlo
    if (pdfCache[cacheKey]) {
      console.log('✅ PDF recuperado de caché:', cacheKey);
      return pdfCache[cacheKey];
    }

    setLoadingPdf(true);
    try {
      console.log('🔄 Generando PDF:', cacheKey);

      const response = await apiClient.post('/api/generar-factura', {
        serie: factura.serieFactura || factura.serie,
        numero: factura.numeroFactura || factura.numero,
        ejercicio: factura.ejercicio
      }, {
        responseType: 'blob',
        timeout: 30000 // Timeout de 30 segundos
      });

      const blob = response.data;

      if (blob.size === 0) {
        throw new Error('PDF vacío recibido del servidor');
      }

      const blobUrl = URL.createObjectURL(blob);
      console.log('✅ PDF generado exitosamente:', cacheKey);

      // Limitar caché a 2 PDFs máximo (FIFO - First In, First Out)
      setPdfCache(prev => {
        const entries = Object.entries(prev);

        // Si ya tenemos 2 PDFs, eliminar el más antiguo
        if (entries.length >= 2) {
          const [oldestKey, oldestUrl] = entries[0];
          URL.revokeObjectURL(oldestUrl); // Liberar memoria del blob antiguo
          console.log('🗑️ Eliminado PDF antiguo de caché:', oldestKey);

          // Devolver solo el segundo PDF y el nuevo
          const [, ...remaining] = entries;
          return {
            ...Object.fromEntries(remaining),
            [cacheKey]: blobUrl
          };
        }

        return {
          ...prev,
          [cacheKey]: blobUrl
        };
      });

      return blobUrl;
    } catch (error: any) {
      console.error('❌ Error generando PDF:', error);
      const errorMsg = error.name === 'AbortError'
        ? 'Tiempo de espera agotado. Intenta de nuevo.'
        : error.message || 'Error desconocido al generar PDF';
      toast.error(`Error al generar PDF: ${errorMsg}`);
      throw error;
    } finally {
      setLoadingPdf(false);
    }
  }, [pdfCache]);

  // Función para previsualizar PDF (abre modal)
  const handlePreviewPdf = useCallback(async (factura: FacturaBackend) => {
    try {
      setFacturaPreview(factura);
      setShowFacturaPreview(true);
      // El PDF se cargará dentro del modal
    } catch (error: any) {
      toast.error(`Error al previsualizar PDF: ${error.message}`);
    }
  }, []);

  const handleDownloadInvoice = useCallback(async (factura: FacturaBackend) => {
    const toastId = toast.loading(
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Descargando factura {factura.serieFactura} {factura.numeroFactura}...</span>
      </div>
    );

    try {
      // Generar o usar el PDF de caché
      const blobUrl = await generatePdfBlob(factura);

      // Descargar
      const link = document.createElement('a');
      link.href = blobUrl;

      // Nombre de archivo profesional
      const fechaFormateada = factura.fecha.replace(/\//g, '-');
      const nombreArchivo = `Factura_${factura.serieFactura}_${String(factura.numeroFactura).padStart(5, '0')}_${factura.subempresa}_${fechaFormateada}.pdf`;
      link.download = nombreArchivo;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success(
        <div className="flex flex-col">
          <div className="font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Factura descargada
          </div>
          <div className="text-sm text-gray-600">{nombreArchivo}</div>
          <div className="text-xs text-gray-500 mt-1">€{factura.totalFactura.toFixed(2)}</div>
        </div>,
        {
          id: toastId,
          duration: 4000
        }
      );
    } catch (error) {
      console.error('Error descargando factura:', error);
      toast.error(
        <div className="flex flex-col">
          <div className="font-bold">❌ Error al descargar</div>
          <div className="text-sm text-gray-600">{error instanceof Error ? error.message : 'Error desconocido'}</div>
        </div>,
        {
          id: toastId,
          duration: 5000
        }
      );
    }
  }, []);

  // Filter orders from backend - Memoized for performance
  const filteredOrders = useMemo(() => {
    return (pedidos || []).filter(pedido => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        pedido.numeroPedido?.toString().includes(searchTerm) ||
        pedido.subempresa?.toLowerCase().includes(searchLower);
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'paid' && pedido.estadoPago === 'Pagado') ||
        (filterStatus === 'pending' && pedido.estadoPago === 'Pendiente');
      return matchesSearch && matchesStatus;
    });
  }, [pedidos, searchTerm, filterStatus]);

  // Filtrado mejorado de facturas con rango de fechas - Memoized for performance
  // Usar la lista agrupada de facturas para el filtrado
  const filteredFacturas = useMemo(() => {
    return (facturas || []).filter(factura => {
      const searchLower = searchTerm.toLowerCase();

      // Búsqueda en campos disponibles del backend
      const matchesSearch = searchTerm === '' ||
        (factura.numeroFactura !== undefined && String(factura.numeroFactura).includes(searchTerm)) ||
        factura.serieFactura?.toLowerCase().includes(searchLower) ||
        (factura.albaranes && String(factura.albaranes).toLowerCase().includes(searchLower));

      // Filtro por mes
      const matchesMonth = filterMonth === 'all' ||
        (factura.mes !== undefined && String(factura.mes) === filterMonth) ||
        (factura.mes !== undefined && String(factura.mes).padStart(2, '0') === filterMonth);

      // Filtro por año (Usar año de la fecha visual para consistencia)
      const dateYear = factura.fecha ? factura.fecha.split('/')[2] : '';
      const matchesYear = filterYear === 'all' ||
        dateYear === filterYear ||
        (factura.ano !== undefined && String(factura.ano) === filterYear);

      // Filtro por rango de fechas
      let matchesDateRange = true;
      if (fechaDesde || fechaHasta) {
        const [dia, mes, ano] = factura.fecha?.split('/').map(Number) || [0, 0, 0];
        if (dia && mes && ano) {
          const facturaDate = new Date(ano, mes - 1, dia);
          if (fechaDesde) {
            const desde = new Date(fechaDesde);
            matchesDateRange = matchesDateRange && facturaDate >= desde;
          }
          if (fechaHasta) {
            const hasta = new Date(fechaHasta);
            // Ajustar hasta al final del día
            hasta.setHours(23, 59, 59, 999);
            matchesDateRange = matchesDateRange && facturaDate <= hasta;
          }
        }
      }
      return matchesSearch && matchesMonth && matchesYear && matchesDateRange;
    });
  }, [facturas, searchTerm, filterMonth, filterYear, fechaDesde, fechaHasta]);

  // Estadísticas del DASHBOARD - Usar filteredFacturas para que coincida con lo que ve el usuario
  const totalFacturasCountDashboard = useMemo(() => filteredFacturas?.length || 0, [filteredFacturas]);
  const totalFacturadoDashboard = useMemo(() => (filteredFacturas || []).reduce((sum, f) => sum + (f.totalFactura || 0), 0), [filteredFacturas]);

  // Estadísticas de la TABLA DE FACTURAS - Según filtros activos
  const totalFacturasCount = useMemo(() => filteredFacturas?.length || 0, [filteredFacturas]);
  const totalFacturado = useMemo(() => (filteredFacturas || []).reduce((sum, f) => sum + (f.totalFactura || 0), 0), [filteredFacturas]);
  const pendienteTotal = useMemo(
    () => (filteredFacturas || []).reduce((sum, f) => sum + (f.estadoPago === 'pendiente' ? (f.importePendiente || 0) : 0), 0),
    [filteredFacturas]
  );

  const pagadasCount = useMemo(
    () => (filteredFacturas || []).filter((f) => f.estadoPago === 'pagada').length,
    [filteredFacturas]
  );
  const pendientesCount = useMemo(
    () => (filteredFacturas || []).filter((f) => f.estadoPago === 'pendiente').length,
    [filteredFacturas]
  );
  const pendienteRatio = totalFacturado > 0 ? Math.min(100, Math.round((pendienteTotal / totalFacturado) * 100)) : 0;

  const monthlySeries = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const total = (facturas || []).reduce((sum, factura) => {
        const [, facturaMonth, facturaYear] = (factura.fecha || '').split('/').map(Number);
        return facturaMonth === month && facturaYear === year ? sum + (factura.totalFactura || 0) : sum;
      }, 0);
      return {
        label: date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
        total,
        current: index === 5,
      };
    });
  }, [facturas]);
  const maxMonthly = Math.max(...monthlySeries.map((month) => month.total), 1);

  const lastPedido = useMemo(() => {
    if (!pedidos?.length) return null;
    return [...pedidos].sort((a: any, b: any) => parsePortalDate(b.fecha) - parsePortalDate(a.fecha))[0];
  }, [pedidos]);

  const ultimasFacturas = useMemo(() => {
    if (!facturas?.length) return [];
    return [...facturas].sort((a, b) => parsePortalDate(b.fecha) - parsePortalDate(a.fecha)).slice(0, 4);
  }, [facturas]);

  const isLoadingPortal = loadingFacturas || loadingPerfil;
  // ESTADÍSTICAS DE PAGADAS/PENDIENTES COMENTADAS - NO ELIMINAR
  // const facturasPagadas = useMemo(() => (filteredFacturas || []).filter(f => f.estadoPago === 'pagada').length, [filteredFacturas]);
  // const facturasPendientes = useMemo(() => (filteredFacturas || []).filter(f => f.estadoPago === 'pendiente').length, [filteredFacturas]);

  // Paginación de facturas
  // Paginación sobre la lista agrupada y filtrada
  const totalPages = Math.ceil(filteredFacturas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFacturas = filteredFacturas.slice(startIndex, endIndex);

  // Reset página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMonth, filterYear, fechaDesde, fechaHasta, itemsPerPage]);


  return (
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-20 pt-[calc(var(--nav-h)+28px)] sm:px-6 lg:px-10">

      {/* 🔒 Security Alert Banner - shows when there are pending security issues */}
      <AnimatePresence>
        {(securityWarnings.hasLegacyPassword || securityWarnings.needsContactSetup) && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mb-6 flex flex-col gap-3 border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor: 'var(--gmp-accent)',
              backgroundColor: 'color-mix(in srgb, var(--gmp-accent) 10%, transparent)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gmp-accent)]" aria-hidden="true" />
              <span className="text-sm text-foreground">
                {securityWarnings.hasLegacyPassword && securityWarnings.needsContactSetup
                  ? '¡Atención! Tu cuenta necesita una contraseña segura y datos de contacto.'
                  : securityWarnings.hasLegacyPassword
                    ? '¡Tu contraseña es insegura! Cámbiala en Perfil → Seguridad.'
                    : 'Configura tu email y teléfono para poder recuperar tu contraseña.'}
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setActiveTab('perfil');
                setShowPasswordChangeModal(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="shrink-0"
            >
              Ir a Perfil
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className="relative z-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">

          {/* Sidebar */}
          <aside className="hidden lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:block" aria-label="Cuenta y navegación">

                        <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border border-[var(--line)] bg-[var(--ink-2)]"
            >
              <div className="border-b border-[var(--line)] p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Cuenta
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--gmp-accent)] text-lg text-white" aria-hidden="true">
                    {(perfilCliente?.nombre || user?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {perfilCliente?.empresa || user?.company || 'Cliente'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {perfilCliente?.nombre || user?.name || ''}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-emerald-300">
                      <span className="h-1 w-1 bg-emerald-400" aria-hidden="true" />
                      Cuenta activa
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  {(() => {
                    const emailCandidato = perfilCliente?.contacto?.email || userEmail || user?.email || '';
                    const esEmailValido = emailCandidato &&
                      !emailCandidato.includes('@granja.local') &&
                      emailCandidato.includes('@') &&
                      emailCandidato.length > 5;
                    return esEmailValido ? (
                      <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{emailCandidato}</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTabChange('perfil')}
                        className="flex w-full items-center justify-between border border-dashed border-[var(--line)] px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-[var(--gmp-accent)] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                      >
                        <span>Añadir email de contacto</span>
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    );
                  })()}
                  <p className="mt-2 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">ID {user?.id || '—'}</p>
                </div>
              </div>

              <nav className="border-b border-[var(--line)] p-2" aria-label="Secciones del área de clientes">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  const badgeCount = tab.id === 'favoritos' ? getFavoritesCount() : 0;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-[44px] w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)] ${
                        isActive
                          ? 'bg-[var(--gmp-accent)] text-white'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      <IconComponent className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1">{tab.id === 'dashboard' ? 'Resumen' : tab.name}</span>
                      {badgeCount > 0 && (
                        <span className={`min-w-5 px-1.5 py-0.5 text-center text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-foreground'}`}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                      {isActive && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                    </button>
                  );
                })}
              </nav>

              <div className="space-y-4 border-b border-[var(--line)] p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Periodo
                </p>
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs text-muted-foreground">{t('sidebar.filterByYear')}</span>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="w-full"
                    >
                      <option value="all">{t('filters.allYears')}</option>
                      {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <option key={year} value={String(year)}>{year}</option>
                      ))}
                    </select>
                  </label>
                  {filterYear !== 'all' && (
                    <label className="block">
                      <span className="mb-1.5 block text-xs text-muted-foreground">{t('sidebar.filterByMonth')}</span>
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="w-full"
                      >
                        <option value="all">{t('filters.allMonths')}</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1)}>{t(`filters.months.${i + 1}`)}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {(filterYear !== 'all' || filterMonth !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterYear('all');
                        setFilterMonth('all');
                        setSearchTerm('');
                        setFechaDesde('');
                        setFechaHasta('');
                      }}
                      className="flex min-h-[44px] w-full items-center justify-center gap-2 border border-[var(--line)] px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('filters.resetFilters')}
                    </button>
                  )}
                </div>
                <dl className="divide-y divide-[var(--line-soft)] border border-[var(--line)]">
                  <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
                    <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t('sidebar.invoicesCount')}</dt>
                    <dd className="text-xl font-light tabular-nums text-foreground">{totalFacturasCount}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
                    <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t('sidebar.totalInvoiced')}</dt>
                    <dd className="whitespace-nowrap text-sm font-light tabular-nums text-foreground">{formatCurrency(totalFacturado)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 px-3 py-2.5">
                    <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Pendiente</dt>
                    <dd className="whitespace-nowrap text-sm font-light tabular-nums text-foreground">{formatCurrency(pendienteTotal)}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-2 p-3">
                <button
                  type="button"
                  onClick={() => setShowLibroIvaModal(true)}
                  className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                >
                  <span className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    Libro de IVA
                  </span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a
                  href={`/${locale}/productos`}
                  className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                >
                  <span className="flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    Catálogo de productos
                  </span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="flex min-h-[44px] w-full items-center gap-3 border-t border-[var(--line)] px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:text-[#ff8a5c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t('logout')}
                </button>
              </div>
            </motion.div>

          </aside>

          
          {/* Main Content Area */}
          <div ref={mainContentRef} className="min-w-0">
            {/* Mobile account bar */}
            <div className="mb-5 border border-[var(--line)] bg-[var(--ink-2)] lg:hidden">
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--gmp-accent)] text-sm text-white" aria-hidden="true">
                    {(perfilCliente?.nombre || user?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{perfilCliente?.empresa || user?.company || 'Cliente'}</p>
                    <p className="truncate text-xs text-muted-foreground">{perfilCliente?.nombre || user?.name || ''}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-[#ff8a5c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                  aria-label={t('logout')}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <nav className="grid grid-cols-4 border-t border-[var(--line)]" aria-label="Secciones del área de clientes">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-[58px] flex-col items-center justify-center gap-1.5 px-1 py-2 text-[10px] tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--gmp-accent)] ${
                        isActive
                          ? 'bg-[var(--gmp-accent)] text-white'
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" aria-hidden="true" />
                      <span className="leading-tight">{tab.id === 'dashboard' ? 'Resumen' : tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line-soft)] pb-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Área de clientes
                </p>
                <h1 className="display mt-3 text-[clamp(30px,4.4vw,54px)] text-foreground">
                  {activeTab === 'dashboard'
                    ? 'Mi panel'
                    : activeTab === 'facturas'
                      ? t('tabs.facturas')
                      : activeTab === 'perfil'
                        ? t('tabs.perfil')
                        : t('tabs.favoritos')}
                </h1>
                <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                  {activeTab === 'dashboard'
                    ? 'Resumen de tu cuenta, tus documentos y tu actividad reciente.'
                    : activeTab === 'facturas'
                      ? 'Consulta, descarga y comparte tus facturas.'
                      : activeTab === 'perfil'
                        ? 'Tus datos de contacto, empresa y seguridad.'
                        : 'Los productos que has guardado.'}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">MP / Cliente</p>
                <p className="mt-1 font-mono text-[11px] text-foreground/70">{user?.id || '—'}</p>
              </div>
            </header>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className=""
              >

                                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Bienvenida */}
                    <section className="relative overflow-hidden border border-[var(--line)] bg-[var(--ink-2)]">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-[0.05]"
                        style={{
                          backgroundImage:
                            'linear-gradient(to right, var(--bone) 1px, transparent 1px), linear-gradient(to bottom, var(--bone) 1px, transparent 1px)',
                          backgroundSize: '48px 48px',
                        }}
                      />
                      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="p-6 sm:p-10">
                          <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                            <span className="h-1.5 w-1.5 bg-[var(--gmp-accent)]" aria-hidden="true" />
                            Ficha de cliente
                            <span className="text-foreground/25" aria-hidden="true">/</span>
                            <span className="font-mono normal-case tracking-normal text-foreground/70">{user?.id || '—'}</span>
                          </div>
                          <h2 className="display mt-6 text-[clamp(34px,5vw,64px)] text-foreground">
                            {clientProfile.greeting}.
                          </h2>
                          <p className="mt-4 max-w-[48ch] text-[15px] font-light leading-relaxed text-muted-foreground">
                            {clientProfile.greetingContext}
                          </p>
                          <div className="mt-8 flex flex-wrap gap-2">
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3" aria-hidden="true" />
                              {clientProfile.timeline.diasComoCliente} días como cliente
                            </Badge>
                            {clientProfile.patterns.rachaActiva > 0 && (
                              <Badge variant="outline">
                                <Flame className="h-3 w-3" aria-hidden="true" />
                                {clientProfile.patterns.rachaActiva} meses de actividad
                              </Badge>
                            )}
                            {securityWarnings.hasLegacyPassword || securityWarnings.needsContactSetup ? (
                              <Badge className="border-[var(--gmp-accent)] bg-[var(--gmp-accent)] !text-white">
                                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                Revisa tu seguridad
                              </Badge>
                            ) : (
                              <Badge className="border-[var(--gmp-accent)] bg-[var(--gmp-accent)] !text-white">
                                <Shield className="h-3 w-3" aria-hidden="true" />
                                Cuenta protegida
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="relative border-t border-[var(--line)] p-6 sm:p-8 lg:border-l lg:border-t-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Cliente desde</p>
                              <p className="num mt-1 text-[clamp(34px,4vw,48px)] text-foreground">
                                {clientProfile.timeline.primeraFactura?.split('/')[2] || '—'}
                              </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--line)] text-[var(--gmp-accent)]" aria-hidden="true">
                              <Building2 className="h-4 w-4" />
                            </div>
                          </div>
                          <dl className="mt-8 divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)]">
                            <div className="flex items-center justify-between gap-3 py-3">
                              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Email</dt>
                              <dd className="max-w-[190px] truncate text-xs text-foreground">{userEmail || 'Sin configurar'}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-3 py-3">
                              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Teléfono</dt>
                              <dd className="max-w-[190px] truncate text-xs text-foreground">{userPhone || 'Sin configurar'}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-3 py-3">
                              <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Cuenta</dt>
                              <dd className="font-mono text-[11px] text-foreground/80">{user?.id || '—'}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-[2px] origin-left bg-[var(--gmp-accent)]"
                        aria-hidden="true"
                      />
                    </section>

                    {/* KPIs */}
                    <section aria-label="Resumen de cuenta" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-12">
                      <motion.article
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.05 }}
                        className="group relative overflow-hidden border border-[var(--line)] bg-[var(--ink-2)] p-5 transition-colors hover:border-foreground/30 xl:col-span-4 before:absolute before:inset-y-0 before:content-[''] before:left-0 before:w-px before:bg-[var(--gmp-accent)] before:opacity-0 before:transition-opacity hover:before:opacity-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Último pedido</p>
                          <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <p className="mt-3 truncate text-[clamp(28px,3vw,40px)] font-light leading-none tracking-[-0.02em] tabular-nums text-foreground">
                          {isLoadingPortal && !lastPedido ? '—' : lastPedido ? `#${lastPedido.numeroPedido}` : 'Sin pedidos'}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {lastPedido ? (
                            <>
                              <span className="inline-flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 ${/pag/i.test(String(lastPedido.estadoPago || '')) ? 'bg-emerald-400' : /pend/i.test(String(lastPedido.estadoPago || '')) ? 'bg-amber-400' : 'bg-white/40'}`} aria-hidden="true" />
                                {lastPedido.estadoPago || 'Sin facturar'}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{lastPedido.fecha}</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums text-foreground/80">{formatCurrency(lastPedido.importeTotal || 0)}</span>
                            </>
                          ) : (
                            <span>Cuando hagas un pedido aparecerá aquí</span>
                          )}
                        </div>
                      </motion.article>

                      <motion.article
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.11 }}
                        className="group relative overflow-hidden border border-[var(--line)] bg-[var(--ink-2)] p-5 transition-colors hover:border-foreground/30 xl:col-span-2 before:absolute before:inset-y-0 before:content-[''] before:left-0 before:w-px before:bg-[var(--gmp-accent)] before:opacity-0 before:transition-opacity hover:before:opacity-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Facturas</p>
                          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <p className="mt-3 text-[clamp(28px,3vw,40px)] font-light leading-none tabular-nums text-foreground">
                          {!facturas?.length ? '—' : totalFacturasCount}
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {!facturas?.length ? 'Sin documentos' : `${pagadasCount} pagadas · ${pendientesCount} ${pendientesCount === 1 ? 'pendiente' : 'pendientes'}`}
                        </p>
                      </motion.article>

                      <motion.article
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.17 }}
                        className="group relative overflow-hidden border border-[var(--line)] bg-[var(--ink-2)] p-5 transition-colors hover:border-foreground/30 xl:col-span-3 before:absolute before:inset-y-0 before:content-[''] before:left-0 before:w-px before:bg-[var(--gmp-accent)] before:opacity-0 before:transition-opacity hover:before:opacity-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Total facturado</p>
                          <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <p className="mt-3 whitespace-nowrap text-[clamp(22px,2.4vw,32px)] font-light leading-none tabular-nums text-foreground">
                          {!facturas?.length ? '—' : formatCurrency(totalFacturado)}
                        </p>
                        <div
                          className="mt-4 flex h-12 items-end gap-1"
                          role="img"
                          aria-label={`Evolución de facturación de los últimos seis meses: ${monthlySeries.map((month) => `${month.label} ${formatCurrency(month.total)}`).join(', ')}`}
                        >
                          {monthlySeries.map((month, index) => (
                            <div key={`${month.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1" aria-hidden="true">
                              <div
                                className={`w-full transition-colors ${month.current ? 'bg-[var(--gmp-accent)]' : 'bg-white/15 group-hover:bg-white/25'}`}
                                style={{ height: `${4 + Math.round((month.total / maxMonthly) * 32)}px` }}
                              />
                              <span className="text-[8px] uppercase tracking-[0.06em] text-muted-foreground">{month.label}</span>
                            </div>
                          ))}
                        </div>
                      </motion.article>

                      <motion.article
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.23 }}
                        className="group relative overflow-hidden border border-[var(--line)] bg-[var(--ink-2)] p-5 transition-colors hover:border-foreground/30 xl:col-span-3 before:absolute before:inset-y-0 before:content-[''] before:left-0 before:w-px before:bg-[var(--gmp-accent)] before:opacity-0 before:transition-opacity hover:before:opacity-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Pendiente</p>
                          <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <p className="mt-3 whitespace-nowrap text-[clamp(22px,2.4vw,32px)] font-light leading-none tabular-nums text-foreground">
                          {!facturas?.length ? '—' : formatCurrency(pendienteTotal)}
                        </p>
                        <div className="mt-4 h-1.5 w-full overflow-hidden bg-white/10" role="img" aria-label={`${pendienteRatio}% del importe está pendiente de pago`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pendienteRatio}%` }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full bg-[var(--gmp-accent)]"
                          />
                        </div>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {pendienteTotal > 0 ? `${pendienteRatio}% pendiente · ${pendientesCount} ${pendientesCount === 1 ? 'factura' : 'facturas'}` : 'Sin importes pendientes'}
                        </p>
                      </motion.article>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                      {/* Actividad reciente */}
                      <section className="border border-[var(--line)] bg-[var(--ink-2)] transition-colors hover:border-foreground/30" aria-labelledby="actividad-reciente">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
                          <div>
                            <div className="flex items-baseline gap-3">
                              <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">01</span>
                              <h2 id="actividad-reciente" className="text-sm font-medium text-foreground">Actividad reciente</h2>
                            </div>
                            <p className="mt-1 pl-7 text-xs text-muted-foreground">Tus últimas facturas</p>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => handleTabChange('facturas')}>
                            Ver todas
                          </Button>
                        </div>

                        {isLoadingPortal && ultimasFacturas.length === 0 ? (
                          <div className="space-y-3 p-5" role="status" aria-live="polite">
                            <span className="sr-only">Cargando facturas…</span>
                            {[0, 1, 2, 3].map((item) => (
                              <div key={item} className="h-14 w-full animate-pulse bg-white/5" aria-hidden="true" />
                            ))}
                          </div>
                        ) : ultimasFacturas.length === 0 ? (
                          <div className="flex flex-col items-center px-6 py-14 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <p className="mt-4 text-sm text-foreground">Todavía no tienes facturas</p>
                            <p className="mt-1 max-w-[36ch] text-xs leading-relaxed text-muted-foreground">
                              Cuando se emita tu primera factura podrás consultarla y descargarla aquí.
                            </p>
                          </div>
                        ) : (
                          <ul className="divide-y divide-[var(--line-soft)]">
                            {ultimasFacturas.map((factura, index) => (
                              <li key={`${factura.ejercicio}-${factura.serieFactura}-${factura.numeroFactura}`} className="group/row flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03]">
                                <span className="font-mono text-[10px] text-muted-foreground transition-colors group-hover/row:text-[#ff8a5c]" aria-hidden="true">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm text-foreground">
                                    {factura.serieFactura}-{factura.numeroFactura}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">{factura.fecha}</p>
                                </div>
                                <div className="text-right">
                                  <p className="whitespace-nowrap text-sm tabular-nums text-foreground">{formatCurrency(factura.totalFactura)}</p>
                                  <Badge
                                    variant="outline"
                                    className={`mt-1 ${factura.estadoPago === 'pagada' ? '!border-emerald-500/40 !text-emerald-300' : '!border-amber-500/40 !text-amber-300'}`}
                                  >
                                    {factura.estadoPago === 'pagada' ? 'Pagada' : 'Pendiente'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewPdf(factura)}
                                    className="flex h-11 w-11 items-center justify-center text-foreground/80 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                                    aria-label={`Ver factura ${factura.serieFactura}-${factura.numeroFactura}`}
                                  >
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadInvoice(factura)}
                                    className="flex h-11 w-11 items-center justify-center text-foreground/80 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                                    aria-label={`Descargar factura ${factura.serieFactura}-${factura.numeroFactura}`}
                                  >
                                    <Download className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>

                      <div className="space-y-6">
                        {/* Contacto */}
                        <section className="border border-[var(--line)] bg-[var(--ink-2)] p-5 transition-colors hover:border-foreground/30" aria-labelledby="datos-contacto">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-baseline gap-3">
                              <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">02</span>
                              <h2 id="datos-contacto" className="text-sm font-medium text-foreground">Datos de contacto</h2>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleTabChange('perfil')}
                              className="flex min-h-[44px] items-center gap-1 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                            >
                              Editar
                              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                          <ul className="mt-4 space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                              <span className="min-w-0 break-all text-foreground">{userEmail || 'Sin email configurado'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                              <span className="min-w-0 text-foreground">{userPhone || 'Sin teléfono configurado'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                              <span className="min-w-0 text-foreground">{perfilCliente?.direccion?.completa || 'Sin dirección de facturación'}</span>
                            </li>
                          </ul>
                        </section>

                        {/* Estado de cuenta */}
                        <section className="border border-[var(--line)] bg-[var(--ink-2)] p-5 transition-colors hover:border-foreground/30" aria-labelledby="estado-cuenta">
                          <div className="flex items-baseline gap-3">
                            <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">03</span>
                            <h2 id="estado-cuenta" className="text-sm font-medium text-foreground">Estado de cuenta</h2>
                          </div>
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-muted-foreground">Contraseña</span>
                              <span className={`inline-flex items-center gap-2 ${securityWarnings.hasLegacyPassword ? 'text-amber-300' : 'text-emerald-300'}`}>
                                <span className={`h-1.5 w-1.5 ${securityWarnings.hasLegacyPassword ? 'bg-amber-400' : 'bg-emerald-400'}`} aria-hidden="true" />
                                {securityWarnings.hasLegacyPassword ? 'Mejorable' : 'Segura'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-muted-foreground">Contacto</span>
                              <span className={`inline-flex items-center gap-2 ${securityWarnings.needsContactSetup ? 'text-amber-300' : 'text-emerald-300'}`}>
                                <span className={`h-1.5 w-1.5 ${securityWarnings.needsContactSetup ? 'bg-amber-400' : 'bg-emerald-400'}`} aria-hidden="true" />
                                {securityWarnings.needsContactSetup ? 'Incompleto' : 'Completo'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-muted-foreground">Favoritos</span>
                              <span className="tabular-nums text-foreground">{getFavoritesCount()}</span>
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            className="mt-5 w-full"
                            onClick={() => setShowPasswordChangeModal(true)}
                          >
                            <Key className="h-4 w-4" aria-hidden="true" />
                            Cambiar contraseña
                          </Button>
                        </section>
                      </div>
                    </div>

                    {/* Accesos rápidos */}
                    <section className="grid gap-3 sm:grid-cols-3" aria-label="Accesos rápidos">
                      <button
                        type="button"
                        onClick={() => setShowLibroIvaModal(true)}
                        className="flex min-h-[64px] items-center justify-between gap-3 border border-[var(--line)] bg-[var(--ink-2)] px-5 py-4 text-left transition-colors hover:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                      >
                        <span className="flex items-center gap-3 text-sm text-foreground">
                          <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          Libro de IVA
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </button>
                      <a
                        href={`/${locale}/productos`}
                        className="flex min-h-[64px] items-center justify-between gap-3 border border-[var(--line)] bg-[var(--ink-2)] px-5 py-4 text-left transition-colors hover:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                      >
                        <span className="flex items-center gap-3 text-sm text-foreground">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          Explorar catálogo
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleTabChange('favoritos')}
                        className="flex min-h-[64px] items-center justify-between gap-3 border border-[var(--line)] bg-[var(--ink-2)] px-5 py-4 text-left transition-colors hover:border-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                      >
                        <span className="flex items-center gap-3 text-sm text-foreground">
                          <Heart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          Mis favoritos
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </button>
                    </section>
                  </div>
                )}

                

                                {activeTab === 'facturas' && (
                  <div className="space-y-6">
                    <section className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)] xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]" aria-label="Resumen del periodo">
                      <div className="bg-[var(--ink-2)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Documentos</p>
                        <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{filteredFacturas.length}</p>
                      </div>
                      <div className="bg-[var(--ink-2)] p-4">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Facturado</p>
                        <p className="mt-1 whitespace-nowrap text-2xl font-light tabular-nums text-foreground">{formatCurrency(totalFacturado)}</p>
                      </div>
                      <div className={`p-4 ${pendienteTotal > 0 ? 'bg-[var(--gmp-accent)] text-white' : 'bg-[var(--ink-2)]'}`}>
                        <p className={`text-[10px] uppercase tracking-[0.18em] ${pendienteTotal > 0 ? 'text-white' : 'text-muted-foreground'}`}>Pendiente</p>
                        <p className="mt-1 whitespace-nowrap text-2xl font-light tabular-nums">{formatCurrency(pendienteTotal)}</p>
                      </div>
                      <div className="flex items-center bg-[var(--ink-2)] p-4 xl:justify-end">
                        <Button variant="secondary" onClick={() => setShowLibroIvaModal(true)}>
                          <BookOpen className="h-4 w-4" aria-hidden="true" />
                          {t('ivaBook')}
                        </Button>
                      </div>
                    </section>

                    {/* Filtros */}
                    <section className="border border-[var(--line)] bg-[var(--ink-2)] p-4 transition-colors hover:border-foreground/30 sm:p-5" aria-labelledby="filtros-facturas">
                      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-[var(--line-soft)] pb-3">
                        <div className="flex items-baseline gap-3">
                          <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">01</span>
                          <h2 id="filtros-facturas" className="text-sm font-medium text-foreground">Filtros</h2>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{filteredFacturas.length} {filteredFacturas.length === 1 ? 'resultado' : 'resultados'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
                        <div className="col-span-2">
                          <label htmlFor="facturas-busqueda" className="mb-1.5 block text-xs text-muted-foreground">
                            {t('filters.search')}
                          </label>
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <Input
                              id="facturas-busqueda"
                              type="search"
                              placeholder={t('filters.search')}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 pr-10"
                            />
                            {searchTerm && (
                              <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                                aria-label="Limpiar búsqueda"
                              >
                                <X className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </div>

                        {clientsList.length > 1 && (
                          <div className="relative col-span-2" ref={clientDropdownRef}>
                            <span className="mb-1.5 block text-xs text-muted-foreground">Cuenta</span>
                            <button
                              type="button"
                              onClick={() => { setClientDropdownOpen(!clientDropdownOpen); setClientSearch(''); setTimeout(() => clientSearchRef.current?.focus(), 50); }}
                              className="flex min-h-[44px] w-full items-center justify-between gap-3 border border-[var(--gmp-control-border)] bg-[var(--ink-2)] px-4 text-left text-sm text-foreground transition-colors hover:border-foreground/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gmp-accent)]"
                              aria-expanded={clientDropdownOpen}
                              aria-haspopup="listbox"
                            >
                              <span className="truncate">
                                {selectedCliente
                                  ? (clientsList.find(c => c.codigoCliente === selectedCliente)?.nombreCliente || selectedCliente)
                                  : 'Todas mis cuentas'}
                              </span>
                              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${clientDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                            </button>
                            {clientDropdownOpen && (
                              <div className="absolute left-0 right-0 top-full z-30 mt-1 flex max-h-72 flex-col border border-[var(--line)] bg-[var(--ink-2)] shadow-2xl" role="listbox" aria-label="Seleccionar cuenta">
                                <div className="border-b border-[var(--line)] p-2">
                                  <input
                                    ref={clientSearchRef}
                                    type="text"
                                    placeholder="Buscar por nombre o código…"
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="gmp-input text-sm"
                                    aria-label="Buscar cuenta"
                                  />
                                </div>
                                <div className="overflow-y-auto">
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedCliente(undefined); setClientDropdownOpen(false); }}
                                    role="option"
                                    aria-selected={!selectedCliente}
                                    className={`flex min-h-[44px] w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${!selectedCliente ? 'bg-[var(--gmp-accent)] text-white' : 'text-foreground'}`}
                                  >
                                    Todas mis cuentas
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
                                        type="button"
                                        onClick={() => { setSelectedCliente(client.codigoCliente); setClientDropdownOpen(false); }}
                                        role="option"
                                        aria-selected={selectedCliente === client.codigoCliente}
                                        className={`flex min-h-[44px] w-full items-center justify-between gap-3 border-b border-[var(--line-soft)] px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${selectedCliente === client.codigoCliente ? 'bg-[var(--gmp-accent)] text-white' : 'text-foreground'}`}
                                      >
                                        <span className="min-w-0 truncate">{client.nombreCliente}</span>
                                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{client.codigoCliente}</span>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <label htmlFor="facturas-mes" className="mb-1.5 block text-xs text-muted-foreground">{t('filters.month')}</label>
                          <select
                            id="facturas-mes"
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="w-full"
                          >
                            <option value="all">{t('filters.allMonths')}</option>
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={String(i + 1)}>{t(`filters.months.${i + 1}`)}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="facturas-ano" className="mb-1.5 block text-xs text-muted-foreground">{t('filters.year')}</label>
                          <select
                            id="facturas-ano"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="w-full"
                          >
                            <option value="all">{t('filters.allYears')}</option>
                            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                              <option key={year} value={String(year)}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[var(--line-soft)] pt-4">
                        <p className="mb-2 text-xs text-muted-foreground">{t('filters.dateRange')}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="facturas-desde" className="mb-1.5 block text-xs text-muted-foreground">{t('filters.from')}</label>
                            <input
                              id="facturas-desde"
                              type="date"
                              value={fechaDesde}
                              onChange={(e) => setFechaDesde(e.target.value)}
                              className="gmp-input [color-scheme:dark]"
                            />
                          </div>
                          <div>
                            <label htmlFor="facturas-hasta" className="mb-1.5 block text-xs text-muted-foreground">{t('filters.to')}</label>
                            <input
                              id="facturas-hasta"
                              type="date"
                              value={fechaHasta}
                              onChange={(e) => setFechaHasta(e.target.value)}
                              className="gmp-input [color-scheme:dark]"
                            />
                          </div>
                        </div>
                        {(searchTerm || filterMonth !== 'all' || filterYear !== String(new Date().getFullYear()) || fechaDesde || fechaHasta || selectedCliente) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm('');
                              setFilterMonth('all');
                              setFilterYear(String(new Date().getFullYear()));
                              setFechaDesde('');
                              setFechaHasta('');
                              setSelectedCliente(undefined);
                            }}
                            className="mt-3 flex min-h-[44px] items-center gap-2 text-xs text-muted-foreground underline decoration-[var(--line)] underline-offset-4 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('filters.resetFilters')}
                          </button>
                        )}
                      </div>
                    </section>

                    {/* Móvil: tarjetas */}
                    <div className="space-y-3 lg:hidden">
                      {loadingFacturas && paginatedFacturas.length === 0 ? (
                        <div className="space-y-3" role="status" aria-live="polite">
                          <span className="sr-only">{t('table.loadingInvoices')}</span>
                          {[0, 1, 2].map((item) => (
                            <div key={item} className="h-36 w-full animate-pulse border border-[var(--line)] bg-[var(--ink-2)]" aria-hidden="true" />
                          ))}
                        </div>
                      ) : paginatedFacturas.length > 0 ? (
                        paginatedFacturas.map((factura, index) => (
                          <article key={`mobile-${factura.ejercicio}-${factura.serieFactura}-${factura.numeroFactura}`} className="border border-[var(--line)] bg-[var(--ink-2)] p-4 transition-colors hover:border-foreground/30">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">{String(startIndex + index + 1).padStart(2, '0')}</span>
                                  <p className="truncate text-sm text-foreground">{factura.serieFactura}-{factura.numeroFactura}</p>
                                </div>
                                <p className="mt-1 pl-6 text-xs text-muted-foreground">{factura.tipoDocumento || 'Factura'}</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={factura.estadoPago === 'pagada' ? '!border-emerald-500/40 !text-emerald-300' : '!border-amber-500/40 !text-amber-300'}
                              >
                                {factura.estadoPago === 'pagada' ? 'Pagada' : 'Pendiente'}
                              </Badge>
                            </div>
                            <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-[var(--line-soft)] py-3 text-sm">
                              <div>
                                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Fecha</dt>
                                <dd className="mt-0.5 text-foreground">{factura.fecha}</dd>
                              </div>
                              <div className="text-right">
                                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Total</dt>
                                <dd className="mt-0.5 whitespace-nowrap tabular-nums text-foreground">{formatCurrency(factura.totalFactura)}</dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Albarán</dt>
                                <dd className="mt-0.5 text-foreground">{(factura as any).albaranes || (factura as any).lista_albaranes || factura.numero_albaran || '—'}</dd>
                              </div>
                            </dl>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <Button size="sm" variant="secondary" onClick={() => handlePreviewPdf(factura)}>
                                <Eye className="h-4 w-4" aria-hidden="true" />
                                Ver
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => handleDownloadInvoice(factura)}>
                                <Download className="h-4 w-4" aria-hidden="true" />
                                Descargar
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => { setSelectedFacturaForShare(factura); setShowWhatsAppModal(true); }}>
                                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                                WhatsApp
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  if (!userEmail || !userEmail.includes('@')) {
                                    setPendingEmailFactura(factura);
                                    toast('Configura tu email para enviar facturas', { icon: '✉️' });
                                    setActiveTab('perfil');
                                    return;
                                  }
                                  setEmailFacturaToSend(factura);
                                  setEmailDestination(userEmail);
                                  setShowEmailConfirmModal(true);
                                }}
                              >
                                <Mail className="h-4 w-4" aria-hidden="true" />
                                Email
                              </Button>
                            </div>
                          </article>
                        ))
                      ) : null}
                    </div>

                    {/* Escritorio: tabla */}
                    <div className="hidden border border-[var(--line)] bg-[var(--ink-2)] transition-colors hover:border-foreground/30 lg:block">
                      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-3">
                        <div className="flex items-baseline gap-3">
                          <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">02</span>
                          <h2 className="text-sm font-medium text-foreground">Documentos</h2>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          {filteredFacturas.length > 0 ? `${startIndex + 1}–${Math.min(endIndex, filteredFacturas.length)} de ${filteredFacturas.length}` : 'Sin documentos'}
                        </span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('table.invoice')}</TableHead>
                            <TableHead>{t('table.deliveryNote')}</TableHead>
                            <TableHead>{t('table.date')}</TableHead>
                            <TableHead>{t('table.total')}</TableHead>
                            <TableHead className="text-right">{t('table.actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingFacturas && paginatedFacturas.length === 0 ? (
                            [0, 1, 2, 3, 4].map((item) => (
                              <TableRow key={item}>
                                <TableCell colSpan={5}>
                                  <div className="h-6 w-full animate-pulse bg-white/5" aria-hidden="true" />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            paginatedFacturas.map((factura, index) => (
                              <TableRow key={`${factura.ejercicio}-${factura.serieFactura}-${factura.numeroFactura}`} className="group/row">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <span className="w-5 shrink-0 font-mono text-[10px] text-muted-foreground transition-colors group-hover/row:text-[#ff8a5c]" aria-hidden="true">
                                      {String(startIndex + index + 1).padStart(2, '0')}
                                    </span>
                                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm text-foreground">{factura.serieFactura}-{factura.numeroFactura}</p>
                                      <Badge
                                        variant="outline"
                                        className={`mt-1 ${factura.estadoPago === 'pagada' ? '!border-emerald-500/40 !text-emerald-300' : '!border-amber-500/40 !text-amber-300'}`}
                                      >
                                        {factura.estadoPago === 'pagada' ? 'Pagada' : 'Pendiente'}
                                      </Badge>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {(factura as any).albaranes || (factura as any).lista_albaranes || factura.numero_albaran || '—'}
                                </TableCell>
                                <TableCell>
                                  <span className="whitespace-nowrap text-sm text-foreground">{factura.fecha}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="whitespace-nowrap text-sm tabular-nums text-foreground">{formatCurrency(factura.totalFactura)}</span>
                                  <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">IVA incl.</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handlePreviewPdf(factura)}
                                      className="flex h-11 w-11 items-center justify-center text-foreground/80 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                                      aria-label={`Ver factura ${factura.serieFactura}-${factura.numeroFactura}`}
                                    >
                                      <Eye className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadInvoice(factura)}
                                      className="flex h-11 w-11 items-center justify-center text-foreground/80 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                                      aria-label={`Descargar factura ${factura.serieFactura}-${factura.numeroFactura}`}
                                    >
                                      <Download className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setSelectedFacturaForShare(factura); setShowWhatsAppModal(true); }}
                                      className="flex h-11 w-11 items-center justify-center text-foreground/80 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                                      aria-label={`Compartir factura ${factura.serieFactura}-${factura.numeroFactura} por WhatsApp`}
                                    >
                                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!userEmail || !userEmail.includes('@')) {
                                          setPendingEmailFactura(factura);
                                          toast('Configura tu email para enviar facturas', { icon: '✉️' });
                                          setActiveTab('perfil');
                                          return;
                                        }
                                        setEmailFacturaToSend(factura);
                                        setEmailDestination(userEmail);
                                        setShowEmailConfirmModal(true);
                                      }}
                                      className="flex h-11 w-11 items-center justify-center text-foreground/80 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                                      aria-label={`Enviar factura ${factura.serieFactura}-${factura.numeroFactura} por email`}
                                    >
                                      <Mail className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Estado vacío */}
                    {!loadingFacturas && filteredFacturas.length === 0 && (
                      <div className="flex flex-col items-center border border-[var(--line)] bg-[var(--ink-2)] px-6 py-16 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        <h3 className="mt-4 text-sm font-medium text-foreground">No hay facturas que coincidan</h3>
                        <p className="mt-1 max-w-[42ch] text-xs leading-relaxed text-muted-foreground">
                          {searchTerm || fechaDesde || fechaHasta || filterMonth !== 'all'
                            ? 'Prueba a ampliar el periodo o a borrar los filtros activos.'
                            : 'Todavía no tienes facturas disponibles. Aparecerán aquí en cuanto se emita la primera.'}
                        </p>
                        {(searchTerm || fechaDesde || fechaHasta || filterMonth !== 'all' || filterYear !== String(new Date().getFullYear()) || selectedCliente) && (
                          <Button
                            variant="secondary"
                            className="mt-6"
                            onClick={() => {
                              setSearchTerm('');
                              setFilterMonth('all');
                              setFilterYear(String(new Date().getFullYear()));
                              setFechaDesde('');
                              setFechaHasta('');
                              setSelectedCliente(undefined);
                            }}
                          >
                            Quitar filtros
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Paginación */}
                    {!loadingFacturas && filteredFacturas.length > 0 && (
                      <nav className="flex flex-col items-center justify-between gap-4 border border-[var(--line)] bg-[var(--ink-2)] px-4 py-4 sm:flex-row" aria-label="Paginación de facturas">
                        <p className="text-xs text-muted-foreground">
                          Mostrando <span className="text-foreground">{startIndex + 1}</span>–<span className="text-foreground">{Math.min(endIndex, filteredFacturas.length)}</span> de <span className="text-foreground">{filteredFacturas.length}</span>
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="flex h-11 w-11 items-center justify-center border border-[var(--line)] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                            aria-label="Primera página"
                          >
                            <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="flex h-11 w-11 items-center justify-center border border-[var(--line)] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                            aria-label="Página anterior"
                          >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                aria-current={currentPage === pageNum ? 'page' : undefined}
                                className={`flex h-11 w-11 items-center justify-center border text-xs tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)] ${
                                  currentPage === pageNum
                                    ? 'border-[var(--gmp-accent)] bg-[var(--gmp-accent)] !text-white'
                                    : 'border-[var(--line)] text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="flex h-11 w-11 items-center justify-center border border-[var(--line)] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                            aria-label="Página siguiente"
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="flex h-11 w-11 items-center justify-center border border-[var(--line)] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gmp-accent)]"
                            aria-label="Última página"
                          >
                            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        <label htmlFor="items-per-page" className="flex items-center gap-2 text-xs text-muted-foreground">
                          Por página
                          <select
                            id="items-per-page"
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </label>
                      </nav>
                    )}
                  </div>
                )}

                

                                {activeTab === 'perfil' && (
                  <div className="space-y-6">
                    {/* Identidad */}
                    <section className="relative overflow-hidden border border-[var(--line)] bg-[var(--ink-2)] p-6 sm:p-8">
                      <div className="mb-6 flex items-center justify-between gap-3 border-b border-[var(--line-soft)] pb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 bg-[var(--gmp-accent)]" aria-hidden="true" />
                          Ficha de cliente
                        </span>
                        <span className="font-mono normal-case tracking-normal text-foreground/70">{user?.id || '—'}</span>
                      </div>
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-[var(--gmp-accent)] text-3xl font-light text-white" aria-hidden="true">
                          {(perfilCliente?.nombre || user?.name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-2xl font-normal text-foreground">
                            {perfilCliente?.nombre || user?.name || 'Mi perfil'}
                          </h2>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {perfilCliente?.empresa || user?.company || 'Empresa'}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3" aria-hidden="true" />
                              {clientProfile.timeline.diasComoCliente} días como cliente
                            </Badge>
                            {clientProfile.patterns.rachaActiva > 0 && (
                              <Badge variant="outline">
                                <Flame className="h-3 w-3" aria-hidden="true" />
                                {clientProfile.patterns.rachaActiva} meses de actividad
                              </Badge>
                            )}
                            {securityWarnings.hasLegacyPassword && (
                              <Badge className="border-[var(--gmp-accent)] bg-[var(--gmp-accent)] !text-white">
                                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                Contraseña mejorable
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                      <div className="space-y-6">
                        {/* Contacto */}
                        <section className="border border-[var(--line)] bg-[var(--ink-2)] transition-colors hover:border-foreground/30" aria-labelledby="perfil-contacto">
                          <div className="border-b border-[var(--line)] px-5 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-baseline gap-3">
                                  <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">01</span>
                                  <h2 id="perfil-contacto" className="text-sm font-medium text-foreground">Información de contacto</h2>
                                </div>
                                <p className="mt-1 pl-7 text-xs text-muted-foreground">Email y teléfono para facturas y recuperación</p>
                              </div>
                              {loadingContactData && (
                                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground" role="status">Cargando…</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-5 p-5">
                            <div>
                              <span className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="h-3.5 w-3.5" aria-hidden="true" />
                                Nombre completo
                              </span>
                              <div className="flex min-h-[44px] items-center justify-between gap-3 border border-[var(--line)] bg-[var(--ink)] px-4 py-2.5">
                                <span className="min-w-0 truncate text-sm text-foreground">{perfilCliente?.nombre || user?.name || '—'}</span>
                                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                              </div>
                              <p className="mt-1.5 text-xs text-muted-foreground">Este campo no se puede modificar.</p>
                            </div>

                            <div>
                              <label htmlFor="perfil-email" className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                                Email de contacto
                              </label>
                              <Input
                                id="perfil-email"
                                type="email"
                                autoComplete="email"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                placeholder="ejemplo@email.com"
                              />
                              <p className="mt-1.5 text-xs text-muted-foreground">Se usará para enviar facturas por email.</p>
                            </div>

                            <div>
                              <label htmlFor="perfil-telefono" className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                                Teléfono de contacto
                              </label>
                              <Input
                                id="perfil-telefono"
                                type="tel"
                                autoComplete="tel"
                                value={userPhone}
                                onChange={(e) => setUserPhone(e.target.value)}
                                placeholder="+34 600 123 456"
                              />
                              <p className="mt-1.5 text-xs text-muted-foreground">Se usará para compartir facturas por WhatsApp.</p>
                            </div>

                            <Button
                              onClick={() => {
                                if (!user?.id) return;

                                const datosAGuardar: { email?: string | null; telefono?: string | null } = {};
                                const emailTrimmed = userEmail?.trim() || '';
                                const phoneTrimmed = userPhone?.trim() || '';

                                if (emailTrimmed) {
                                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                  if (!emailRegex.test(emailTrimmed)) {
                                    toast.error('El formato del email es inválido');
                                    return;
                                  }
                                  datosAGuardar.email = emailTrimmed;
                                } else {
                                  datosAGuardar.email = null;
                                }

                                if (phoneTrimmed) {
                                  const phoneClean = phoneTrimmed.replace(/\D/g, '');
                                  if (phoneClean.length < 9) {
                                    toast.error('El teléfono debe tener al menos 9 dígitos');
                                    return;
                                  }
                                  datosAGuardar.telefono = phoneTrimmed;
                                } else {
                                  datosAGuardar.telefono = null;
                                }

                                if (!emailTrimmed && !phoneTrimmed) {
                                  setPendingContactSave(datosAGuardar);
                                  setShowDeleteContactModal(true);
                                  return;
                                }

                                guardarDatosContacto(datosAGuardar);
                              }}
                              className="w-full"
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                              Guardar cambios
                            </Button>
                          </div>
                        </section>

                        {/* Empresa */}
                        <section className="border border-[var(--line)] bg-[var(--ink-2)] transition-colors hover:border-foreground/30" aria-labelledby="perfil-empresa">
                          <div className="border-b border-[var(--line)] px-5 py-4">
                            <div className="flex items-baseline gap-3">
                              <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">02</span>
                              <h2 id="perfil-empresa" className="text-sm font-medium text-foreground">Información de empresa</h2>
                            </div>
                            <p className="mt-1 pl-7 text-xs text-muted-foreground">Datos de facturación y dirección</p>
                          </div>
                          <dl className="divide-y divide-[var(--line-soft)]">
                            <div className="px-5 py-4">
                              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Building className="h-3.5 w-3.5" aria-hidden="true" />
                                Nombre de empresa
                              </dt>
                              <dd className="mt-1 text-sm text-foreground">{perfilCliente?.empresa || user?.company || '—'}</dd>
                            </div>
                            <div className="px-5 py-4">
                              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                Dirección de facturación
                              </dt>
                              <dd className="mt-1 whitespace-pre-line text-sm text-foreground">
                                {perfilCliente?.direccion?.completa || 'Cargando dirección…'}
                              </dd>
                            </div>
                          </dl>
                        </section>
                      </div>

                      <div className="space-y-6">
                        {/* Soporte */}
                        <section className="border border-[var(--line)] bg-[var(--ink-2)] p-5 transition-colors hover:border-foreground/30" aria-labelledby="perfil-soporte">
                          <Settings className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                          <div className="mt-3 flex items-baseline gap-3">
                            <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">03</span>
                            <h2 id="perfil-soporte" className="text-sm font-medium text-foreground">Actualizar información</h2>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            Para modificar tus datos fiscales o de empresa, contacta con nuestro equipo.
                          </p>
                          <Button
                            variant="secondary"
                            className="mt-4 w-full"
                            onClick={() => {
                              toast.info('Contactar soporte', {
                                description: '📞 Teléfono: +34 968 46 75 14\n📧 Email: pedidos@granjamaripepa.com\n🕒 Horario: L-V 9:00-18:00',
                                duration: 8000,
                              });
                            }}
                          >
                            <Phone className="h-4 w-4" aria-hidden="true" />
                            Contactar soporte
                          </Button>
                        </section>

                        {/* Seguridad */}
                        <section className="border border-[var(--line)] bg-[var(--ink-2)] p-5 transition-colors hover:border-foreground/30" aria-labelledby="perfil-seguridad">
                          <Shield className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                          <div className="mt-3 flex items-baseline gap-3">
                            <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">04</span>
                            <h2 id="perfil-seguridad" className="text-sm font-medium text-foreground">Seguridad</h2>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            Mantén tu cuenta segura actualizando tu contraseña periódicamente.
                          </p>
                          <Button
                            variant="secondary"
                            className="mt-4 w-full"
                            onClick={() => setShowPasswordChangeModal(true)}
                          >
                            <Key className="h-4 w-4" aria-hidden="true" />
                            Cambiar contraseña
                          </Button>
                        </section>
                      </div>
                    </div>
                  </div>
                )}

                

                                {activeTab === 'favoritos' && (
                  <div className="space-y-6">
                    <section className="flex flex-col gap-5 border border-[var(--line)] bg-[var(--ink-2)] p-6 transition-colors hover:border-foreground/30 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[var(--line)] text-muted-foreground">
                          <Heart className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-3">
                            <span className="font-mono text-[10px] text-[#ff8a5c]" aria-hidden="true">00</span>
                            <h2 className="text-lg font-normal text-foreground">Mis favoritos</h2>
                          </div>
                          <p className="mt-1 pl-6 text-sm text-muted-foreground">
                            {getFavoritesCount() > 0
                              ? `${getFavoritesCount()} productos guardados`
                              : 'Guarda tus productos preferidos aquí'}
                          </p>
                        </div>
                      </div>
                      {getFavoritesCount() > 0 && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            favorites.forEach(productId => removeFavorite(productId));
                            toast.success('Todos los favoritos eliminados');
                          }}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Limpiar todo
                        </Button>
                      )}
                    </section>

                    {getFavoritesCount() === 0 ? (
                      <div className="flex flex-col items-center border border-[var(--line)] bg-[var(--ink-2)] px-6 py-16 text-center">
                        <Heart className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        <h3 className="mt-4 text-sm font-medium text-foreground">Tu lista está vacía</h3>
                        <p className="mt-1 max-w-[46ch] text-xs leading-relaxed text-muted-foreground">
                          Explora el catálogo y guarda los productos que más te interesen para encontrarlos rápidamente cuando los necesites.
                        </p>
                        <Button asChild className="mt-6">
                          <a href={`/${locale}/productos`}>
                            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                            Explorar productos
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center border border-[var(--line)] bg-[var(--ink-2)] px-6 py-16 text-center">
                        <Heart className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        <h3 className="mt-4 text-sm font-medium text-foreground">
                          {getFavoritesCount()} productos guardados
                        </h3>
                        <p className="mt-1 max-w-[46ch] text-xs leading-relaxed text-muted-foreground">
                          El catálogo de productos estará disponible próximamente. Tus favoritos se conservarán y podrás acceder a ellos cuando quieras.
                        </p>
                        <Badge className="mt-5 border-[var(--gmp-accent)] bg-[var(--gmp-accent)] !text-white">
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          Próximamente disponible
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      </div>

      {/* Modal de Vista Rápida de Factura - RESPONSIVE */}
      <AnimatePresence>
        {showFacturaPreview && facturaPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setShowFacturaPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden border border-[var(--line)] bg-[var(--ink-2)] shadow-2xl sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]"
            >
              {/* Header - Responsive */}
              <div className="border-b border-[var(--line)] bg-[var(--ink-2)] p-3 text-foreground sm:p-4 flex shrink-0 flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold truncate">
                      Factura {facturaPreview.serieFactura}-{facturaPreview.numeroFactura}
                    </h2>
                    <p className="text-primary-foreground/70 text-xs hidden sm:block">Previsualización PDF</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => facturaPreview && handleDownloadInvoice(facturaPreview)}
                    className="text-foreground hover:bg-white/10 h-9 sm:h-10 px-3 sm:px-4"
                  >
                    <Download className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Descargar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFacturaPreview(false)}
                    className="text-foreground hover:bg-white/10 h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* PDF Viewer - con padding ajustado */}
              <div className="flex-1 min-h-0 bg-[var(--ink)] p-2 sm:p-4 relative overflow-auto">
                {loadingPdf ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--ink)]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground text-sm sm:text-base">Generando PDF...</p>
                    </div>
                  </div>
                ) : (
                  facturaPreview && <PdfViewer factura={facturaPreview} generatePdfBlob={generatePdfBlob} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de envío por email */}
      <AnimatePresence>
        {showEmailConfirmModal && emailFacturaToSend && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !sendingEmail && setShowEmailConfirmModal(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto border border-[var(--line)] bg-[var(--ink-2)] shadow-2xl">
                {/* Header */}
                <div className="border-b border-[var(--line)] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        Granja Maripepa · Factura
                      </p>
                      <h2 className="mt-1 text-xl font-light text-foreground">
                        Enviar por email
                      </h2>
                    </div>
                    {!sendingEmail && (
                      <button
                        onClick={() => setShowEmailConfirmModal(false)}
                        className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Cerrar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  <div className="border border-[var(--line)] bg-[var(--ink)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Factura
                        </p>
                        <p className="font-mono text-base text-foreground">
                          {emailFacturaToSend.serieFactura}-{emailFacturaToSend.numeroFactura}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Total
                        </p>
                        <p className="text-xl font-light text-foreground">
                          {formatCurrency(emailFacturaToSend.totalFactura)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--line-soft)] pt-3 text-xs">
                      <span className="text-muted-foreground">Fecha</span>
                      <span className="text-foreground">{emailFacturaToSend.fecha}</span>
                    </div>
                  </div>

                  <div className="border border-[var(--line)] p-4">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Destinatario
                    </p>
                    <p className="break-all text-sm text-foreground">
                      {emailDestination}
                    </p>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    La factura se enviará como PDF adjunto a la dirección
                    indicada. Recibirás confirmación cuando el envío termine.
                  </p>

                  <div className="flex gap-3 pt-1">
                    <Button
                      onClick={() => setShowEmailConfirmModal(false)}
                      disabled={sendingEmail}
                      className="h-11 flex-1 rounded-none border border-[var(--line)] bg-transparent text-foreground hover:bg-white/5"
                    >
                      Cancelar
                    </Button>

                    <Button
                      onClick={() => enviarFacturaPorEmail(emailFacturaToSend, emailDestination)}
                      disabled={sendingEmail}
                      className="h-11 flex-1 rounded-none bg-[var(--gmp-accent)] text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {sendingEmail ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar factura'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de WhatsApp mejorado */}
      <AnimatePresence>
        {showWhatsAppModal && selectedFacturaForShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowWhatsAppModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto border border-[var(--line)] bg-[var(--ink-2)] p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-5 mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Granja Maripepa · Factura
                  </p>
                  <h2 className="mt-1 text-xl font-light text-foreground">
                    Enviar por WhatsApp
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {selectedFacturaForShare.serieFactura}-{selectedFacturaForShare.numeroFactura}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5 mb-6">
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Teléfono de destino
                  </label>
                  <Input
                    type="tel"
                    placeholder="+34 666 555 444"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="h-11 w-full rounded-none border-[var(--line)] bg-transparent text-foreground placeholder:text-muted-foreground focus:border-[var(--gmp-accent)]"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Incluye el código de país. Sin espacios ni guiones.
                  </p>
                </div>

                <div className="border border-[var(--line)] bg-[var(--ink)] p-4">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Mensaje y documento
                  </p>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
{`Factura ${selectedFacturaForShare.serieFactura}-${selectedFacturaForShare.numeroFactura}
Fecha: ${selectedFacturaForShare.fecha}
Importe: ${formatCurrency(selectedFacturaForShare.totalFactura)}
Estado: ${selectedFacturaForShare.estadoPago === 'pagada' ? 'Pagada' : 'Pendiente'}

Granja Maripepa, S.L.
Tel. 968 46 75 14
pedidos@granjamaripepa.com`}
                  </pre>
                  <p className="mt-3 border-t border-[var(--line-soft)] pt-3 text-xs text-muted-foreground">
                    Se envía el PDF adjunto en el mismo mensaje. Requiere la
                    sesión de WhatsApp vinculada en el servidor.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowWhatsAppModal(false);
                    setWhatsappPhone('');
                  }}
                  className="h-11 flex-1 rounded-none border border-[var(--line)] bg-transparent text-foreground hover:bg-white/5"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    const sent = await enviarFacturaPorWhatsapp(
                      selectedFacturaForShare,
                      whatsappPhone,
                    );
                    if (sent) {
                      setShowWhatsAppModal(false);
                      setWhatsappPhone('');
                    }
                  }}
                  disabled={sendingWhatsApp}
                  className="h-11 flex-1 rounded-none bg-[var(--gmp-accent)] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {sendingWhatsApp ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar factura'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de logout */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowLogoutModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className="border border-[var(--line)] bg-[var(--ink-2)] shadow-2xl p-8 max-w-md w-full border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
                    <LogOut className="w-8 h-8 text-destructive" />
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    ¿Cerrar sesión?
                  </h2>

                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t('logoutConfirm')}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => setShowLogoutModal(false)}
                      className="flex-1 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-all duration-300 border border-border"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleLogout}
                      className="flex-1 rounded-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-300"
                    >
                      Sí, cerrar sesión
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de borrado de datos de contacto */}
      <AnimatePresence>
        {showDeleteContactModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteContactModal(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="border border-[var(--line)] bg-[var(--ink-2)] shadow-2xl max-w-md w-full overflow-hidden border border-border">
                {/* Header */}
                <div className="bg-warning p-6 text-warning-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-warning-foreground/20 rounded-xl">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Eliminar datos de contacto</h2>
                        <p className="text-sm text-warning-foreground/80">Confirma esta acción</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteContactModal(false)}
                      className="p-2 hover:bg-warning-foreground/20 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  {/* Advertencia */}
                  <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2">
                          ⚠️ ¿Estás seguro de que quieres eliminar TODOS tus datos de contacto?
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Si eliminas ambos campos, perderás las siguientes funcionalidades:
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Consecuencias */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 space-y-3">
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Sin Email
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          No podrás recibir facturas por email ni utilizar la recuperación de contraseña
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Sin Teléfono
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          No podrás compartir facturas por WhatsApp
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mensaje informativo */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      💡 {t('profile_tip')}
                    </p>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setShowDeleteContactModal(false)}
                      className="flex-1 rounded-xl h-12 font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600"
                    >
                      Cancelar
                    </Button>

                    <Button
                      onClick={() => {
                        if (pendingContactSave) {
                          guardarDatosContacto(pendingContactSave);
                        }
                      }}
                      className="flex-1 h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Sí, eliminar todo
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de compartir factura */}
      <AnimatePresence>
        {showShareModal && shareFactura && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto border border-[var(--line)] bg-[var(--ink-2)] p-6 shadow-2xl sm:p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${shareMethod === 'whatsapp'
                        ? 'bg-success/10'
                        : 'bg-primary/10'
                        }`}>
                        {shareMethod === 'whatsapp' ? (
                          <MessageCircle className={`w-6 h-6 ${shareMethod === 'whatsapp' ? 'text-success' : 'text-primary'}`} />
                        ) : (
                          <Mail className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">
                          Compartir Factura
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {shareMethod === 'whatsapp' ? 'Por WhatsApp' : 'Por Email'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowShareModal(false)}
                      className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Información de la factura */}
                  <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Factura {shareFactura.serieFactura} {shareFactura.numeroFactura}
                      </span>
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {shareFactura.fecha}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total:</span>
                      <span className="text-lg font-bold text-foreground">
                        €{shareFactura.totalFactura.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Input de teléfono o email */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-foreground">
                      {shareMethod === 'whatsapp' ? (
                        <>
                          <Phone className="w-4 h-4 mr-2" />
                          Número de teléfono
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Dirección de email
                        </>
                      )}
                    </label>
                    <Input
                      type={shareMethod === 'whatsapp' ? 'tel' : 'email'}
                      value={shareInput}
                      onChange={(e) => setShareInput(e.target.value)}
                      placeholder={
                        shareMethod === 'whatsapp'
                          ? '+34 600 123 456'
                          : 'ejemplo@email.com'
                      }
                      className="h-12 text-base bg-secondary text-foreground border-border placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                      disabled={
                        shareMethod === 'whatsapp'
                          ? !userPhoneEditable && !!userPhone
                          : !userEmailEditable && !!userEmail
                      }
                    />
                    {((shareMethod === 'whatsapp' && !userPhoneEditable && userPhone) ||
                      (shareMethod === 'email' && !userEmailEditable && userEmail)) && (
                        <p className="text-xs text-primary flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Datos recuperados de tu perfil
                        </p>
                      )}
                  </div>

                  {/* Info adicional */}
                  <div className="bg-secondary rounded-xl p-4 text-xs text-muted-foreground space-y-2">
                    {shareMethod === 'whatsapp' ? (
                      <>
                        <p className="flex items-start gap-2">
                          <MessageCircle className="w-4 h-4 mt-0.5 text-success flex-shrink-0" />
                          Se abrirá WhatsApp con un mensaje pre-rellenado y se descargará el PDF para que lo adjuntes manualmente.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="flex items-start gap-2">
                          <Mail className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          Se abrirá tu cliente de email con el asunto y mensaje pre-rellenado, y se descargará el PDF para adjuntar.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowShareModal(false)}
                      className="flex-1 rounded-2xl border-gray-200 hover:bg-gray-50 transition-all duration-300"
                      disabled={loadingShare}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleShareSubmit}
                      disabled={loadingShare || !shareInput.trim()}
                      className={`flex-1 rounded-2xl text-white transition-all duration-300 ${shareMethod === 'whatsapp'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                        }`}
                    >
                      {loadingShare ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Preparando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Compartir
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Libro IVA */}
      <LibroIvaModal
        isOpen={showLibroIvaModal}
        onClose={() => setShowLibroIvaModal(false)}
        codigoCliente={user?.id || ''}
        userEmail={perfilCliente?.contacto?.email || user?.email || ''}
        userPhone={perfilCliente?.contacto?.telefono || ''}
        clienteNombre={perfilCliente?.nombre || user?.name || 'Cliente'}
      />

      {/* Modal Cambiar Contraseña */}
      <PasswordChangeForm
        isOpen={showPasswordChangeModal}
        onClose={() => setShowPasswordChangeModal(false)}
      />
    </div>
    </MotionConfig>
  );
}