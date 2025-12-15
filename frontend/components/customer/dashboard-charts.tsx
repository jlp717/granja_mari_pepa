'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { TrendingUp, Package, BarChart3, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { secureFetch } from '@/lib/secureFetch'; // 🔐 HttpOnly Cookie Auth

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EstadisticasFacturas {
  year: number;
  total: number;
  pagadas: number;
  pendientes: number;
  totalPagadas: number;
  totalPendientes: number;
}

interface TopProducto {
  codigo: string;
  nombre: string;
  cantidad: number;
  importe: number;
  pedidos: number;
}

interface DashboardChartsProps {
  codigoCliente: string;
}

export function DashboardCharts({ codigoCliente }: DashboardChartsProps) {
  const [estadisticas, setEstadisticas] = useState<EstadisticasFacturas[]>([]);
  const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil para ajustar opciones de gráficos
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!codigoCliente) return;

    // Evitar múltiples llamadas con un flag
    let isCancelled = false;

    const cargarDatos = async () => {
      try {
        // 🔐 SEGURIDAD: Usar secureFetch con HttpOnly cookies
        // Cargar estadísticas
        setLoadingStats(true);
        const { data: statsData, ok: statsOk } = await secureFetch<{ success: boolean; estadisticas: any[] }>(
          `/api/auth/estadisticas/${codigoCliente}`
        );

        if (isCancelled) return;

        if (statsOk && statsData.success && Array.isArray(statsData.estadisticas)) {
          // Mapear los nombres de columnas del backend (MAYÚSCULAS) a camelCase
          const estadisticasMapeadas = statsData.estadisticas.map((stat: any) => ({
            year: stat.YEAR || stat.year,
            total: stat.TOTAL || stat.total || 0,
            pagadas: stat.PAGADAS || stat.pagadas || 0,
            pendientes: stat.PENDIENTES || stat.pendientes || 0,
            totalPagadas: stat.TOTALPAGADAS || stat.totalPagadas || 0,
            totalPendientes: stat.TOTALPENDIENTES || stat.totalPendientes || 0
          }));
          console.log('📊 Estadísticas procesadas:', estadisticasMapeadas);
          setEstadisticas(estadisticasMapeadas);
        } else {
          console.warn('⚠️ No se pudieron cargar las estadísticas');
          setEstadisticas([]);
        }
        setLoadingStats(false);

        // Cargar top productos
        setLoadingProducts(true);
        const { data: productsData, ok: productsOk } = await secureFetch<{ success: boolean; productos: any[] }>(
          `/api/auth/top-productos/${codigoCliente}?limite=10`
        );

        if (isCancelled) return;

        if (productsOk && productsData.success && Array.isArray(productsData.productos)) {
          // Mapear los nombres de columnas del backend (MAYÚSCULAS) a camelCase
          const productosMapeados = productsData.productos.map((prod: any) => ({
            codigo: (prod.CODIGOARTICULO || prod.codigo || '').trim(),
            nombre: (prod.DESCRIPCION || prod.nombre || 'Sin nombre').trim(),
            cantidad: prod.CANTIDADTOTAL || prod.cantidad || 0,
            importe: prod.IMPORTETOTAL || prod.importe || 0,
            pedidos: prod.NUMEROFACTURAS || prod.pedidos || 0
          }));
          console.log('📦 Productos procesados:', productosMapeados);
          setTopProductos(productosMapeados);
        } else {
          console.warn('⚠️ No se pudieron cargar los productos');
          setTopProductos([]);
        }
        setLoadingProducts(false);

      } catch (error) {
        if (isCancelled) return;
        console.error('❌ Error cargando datos de gráficos:', error);
        setError('Error al cargar los datos');
        setEstadisticas([]);
        setTopProductos([]);
        setLoadingStats(false);
        setLoadingProducts(false);
      }
    };

    cargarDatos();

    // Cleanup para evitar memory leaks
    return () => {
      isCancelled = true;
    };
  }, [codigoCliente]);

  // Configuración del gráfico de facturas (Bar Chart) - TOTAL POR AÑO
  const facturasChartData = useMemo(() => ({
    labels: estadisticas.length > 0 ? estadisticas.map(e => e.year.toString()) : [],
    datasets: [
      {
        label: 'Total Facturas',
        data: estadisticas.length > 0 ? estadisticas.map(e => e.total || 0) : [],
        backgroundColor: 'rgba(59, 130, 246, 0.85)', // Azul más sólido
        borderColor: 'rgba(37, 99, 235, 1)', // Borde más oscuro
        borderWidth: isMobile ? 2 : 3,
        borderRadius: isMobile ? 6 : 12,
        barThickness: isMobile ? 28 : 50, // Barras más delgadas en móvil
        maxBarThickness: isMobile ? 35 : 60,
        hoverBackgroundColor: 'rgba(37, 99, 235, 0.95)',
        hoverBorderColor: 'rgba(29, 78, 216, 1)',
        hoverBorderWidth: isMobile ? 2 : 4
      }
      // DATASET DE PAGADAS/PENDIENTES COMENTADO - NO ELIMINAR
      // {
      //   label: 'Facturas Pagadas',
      //   data: estadisticas.map(e => e.pagadas),
      //   backgroundColor: 'rgba(16, 185, 129, 0.8)',
      //   borderColor: 'rgba(16, 185, 129, 1)',
      //   borderWidth: 2,
      //   borderRadius: 8,
      //   barThickness: 40
      // },
      // {
      //   label: 'Facturas Pendientes',
      //   data: estadisticas.map(e => e.pendientes),
      //   backgroundColor: 'rgba(251, 146, 60, 0.8)',
      //   borderColor: 'rgba(251, 146, 60, 1)',
      //   borderWidth: 2,
      //   borderRadius: 8,
      //   barThickness: 40
      // }
    ]
  }), [estadisticas, isMobile]);

  const facturasChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart' as const,
      delay: (context: any) => {
        return context.dataIndex * 150;
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          font: {
            size: isMobile ? 11 : 15,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
          },
          padding: isMobile ? 10 : 20,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#1e293b',
          boxWidth: isMobile ? 8 : 10,
          boxHeight: isMobile ? 8 : 10
        }
      },
      title: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: {
          size: isMobile ? 12 : 16,
          weight: 'bold' as const,
          family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
        },
        bodyFont: {
          size: isMobile ? 11 : 14,
          weight: 'normal' as const,
          family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
        },
        padding: isMobile ? 10 : 16,
        cornerRadius: 12,
        displayColors: true,
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
        caretSize: 8,
        caretPadding: 10,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' facturas';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: isMobile ? 11 : 14,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
          },
          color: '#475569',
          padding: isMobile ? 5 : 10
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
          drawBorder: false,
          lineWidth: 1.5
        },
        ticks: {
          font: {
            size: isMobile ? 10 : 13,
            weight: 'normal' as const,
            family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
          },
          color: '#64748b',
          precision: 0,
          padding: isMobile ? 5 : 10
        }
      }
    }
  };

  // Configuración del gráfico de importes (Line Chart)
  const importesChartData = useMemo(() => ({
    labels: estadisticas.length > 0 ? estadisticas.map(e => e.year.toString()) : [],
    datasets: [
      {
        label: 'Importe Pagado',
        data: estadisticas.length > 0 ? estadisticas.map(e => e.totalPagadas || 0) : [],
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 4,
        fill: true,
        tension: 0.45,
        pointRadius: 7,
        pointHoverRadius: 10,
        pointBackgroundColor: '#fff',
        pointBorderColor: 'rgba(37, 99, 235, 1)',
        pointBorderWidth: 4,
        pointHoverBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3
      },
      {
        label: 'Importe Pendiente',
        data: estadisticas.length > 0 ? estadisticas.map(e => e.totalPendientes || 0) : [],
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 4,
        fill: true,
        tension: 0.45,
        pointRadius: 7,
        pointHoverRadius: 10,
        pointBackgroundColor: '#fff',
        pointBorderColor: 'rgba(220, 38, 38, 1)',
        pointBorderWidth: 4,
        pointHoverBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3
      }
    ]
  }), [estadisticas, isMobile]);

  const importesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: {
      duration: 1800,
      easing: 'easeInOutCubic' as const,
      delay: (context: any) => {
        return context.dataIndex * 200;
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: (isMobile ? 'center' : 'start') as 'center' | 'start',
        labels: {
          font: {
            size: isMobile ? 10 : 15,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
          },
          padding: isMobile ? 8 : 20,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#1e293b',
          boxWidth: isMobile ? 8 : 10,
          boxHeight: isMobile ? 8 : 10
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: {
          size: isMobile ? 12 : 16,
          weight: 'bold' as const,
          family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
        },
        bodyFont: {
          size: isMobile ? 11 : 14,
          weight: 'normal' as const,
          family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
        },
        padding: isMobile ? 10 : 16,
        cornerRadius: 12,
        displayColors: true,
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
        caretSize: 8,
        caretPadding: 10,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: isMobile ? 11 : 14,
            weight: 'bold' as const,
            family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
          },
          color: '#475569',
          padding: isMobile ? 5 : 10
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
          drawBorder: false,
          lineWidth: 1.5
        },
        ticks: {
          font: {
            size: isMobile ? 9 : 13,
            weight: 'normal' as const,
            family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
          },
          color: '#64748b',
          padding: isMobile ? 5 : 10,
          callback: function(value: any) {
            // En móvil formato más corto
            if (isMobile) {
              return (value / 1000).toFixed(0) + 'k€';
            }
            return new Intl.NumberFormat('es-ES', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    }
  };

  // Configuración del gráfico de productos (Doughnut Chart)
  const productosChartData = useMemo(() => ({
    labels: topProductos.length > 0 ? topProductos.map(p => p.nombre && p.nombre.length > 30 ? p.nombre.substring(0, 30) + '...' : p.nombre || 'Sin nombre') : [],
    datasets: [
      {
        label: 'Importe Total',
        data: topProductos.length > 0 ? topProductos.map(p => p.importe || 0) : [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(244, 63, 94, 0.8)',
          'rgba(14, 165, 233, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(14, 165, 233, 1)'
        ],
        borderWidth: 3,
        hoverOffset: 10
      }
    ]
  }), [topProductos, isMobile]);

  const productosChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: {
        // En móvil: leyenda abajo con texto más pequeño
        // En desktop: leyenda a la derecha
        position: (isMobile ? 'bottom' : 'right') as 'bottom' | 'right',
        labels: {
          font: {
            size: isMobile ? 10 : 12,
            weight: 'normal' as const,
            family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
          },
          padding: isMobile ? 8 : 15,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#334155',
          boxWidth: isMobile ? 8 : 12,
          boxHeight: isMobile ? 8 : 12,
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const formatted = new Intl.NumberFormat('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
                // En móvil acortar nombres
                const displayLabel = isMobile && label.length > 15 
                  ? label.substring(0, 15) + '...' 
                  : label;
                return {
                  text: isMobile ? displayLabel : `${label} (${formatted})`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                  fontColor: '#334155'
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: {
          size: 15,
          weight: 'bold' as const,
          family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
        },
        bodyFont: {
          size: 13,
          weight: 'normal' as const,
          family: "'Inter', 'system-ui', '-apple-system', 'sans-serif'"
        },
        padding: 14,
        cornerRadius: 12,
        displayColors: true,
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
        caretSize: 8,
        callbacks: {
          label: function(context: any) {
            const producto = topProductos[context.dataIndex];
            return [
              `Importe: ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(producto.importe)}`,
              `Cantidad: ${producto.cantidad} unidades`,
              `Pedidos: ${producto.pedidos}`
            ];
          }
        }
      }
    }
  };

  if (loadingStats && loadingProducts) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráficos de Facturas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Gráfico de Cantidad de Facturas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-gray-750">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm md:text-base">Facturas por Año</span>
                </div>
                {!loadingStats && estadisticas.length > 0 && (
                  <span className="text-xs md:text-sm font-normal text-gray-500 dark:text-gray-400">
                    Últimos {estadisticas.length} años
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingStats ? (
                <div className="h-48 md:h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : estadisticas.length > 0 ? (
                <div className="h-48 md:h-64">
                  <Bar data={facturasChartData} options={facturasChartOptions} />
                </div>
              ) : (
                <div className="h-48 md:h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gráfico de Importes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-gray-750">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm md:text-base">Evolución de Importes</span>
                </div>
                {!loadingStats && estadisticas.length > 0 && (
                  <span className="text-xs md:text-sm font-normal text-gray-500 dark:text-gray-400">
                    Histórico
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingStats ? (
                <div className="h-48 md:h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : estadisticas.length > 0 ? (
                <div className="h-48 md:h-64">
                  <Line data={importesChartData} options={importesChartOptions} />
                </div>
              ) : (
                <div className="h-48 md:h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico de Top Productos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-gray-750">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base md:text-lg">
              <div className="flex items-center">
                <PieChart className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-600 dark:text-purple-400" />
                <span className="text-sm md:text-base">Top 10 Productos</span>
              </div>
              {!loadingProducts && topProductos.length > 0 && (
                <span className="text-xs md:text-sm font-normal text-gray-500 dark:text-gray-400">
                  Últimos 2 años
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingProducts ? (
              <div className="h-64 md:h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : topProductos.length > 0 ? (
              <div className="h-[320px] md:h-80">
                <Doughnut data={productosChartData} options={productosChartOptions} />
              </div>
            ) : (
              <div className="h-64 md:h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Package className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
                  <p className="text-sm md:text-base">No hay datos de productos disponibles</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
