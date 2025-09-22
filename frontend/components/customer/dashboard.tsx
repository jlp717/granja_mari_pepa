'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomToast } from '@/components/ui/custom-toast';
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
  TrendingUp,
  Award,
  Bell,
  MapPin,
  Phone,
  Mail,
  Building,
  ExternalLink,
  Check,
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
  Trash2
} from 'lucide-react';
import { useAuthStore, useFavoritesStore, useCartStore } from '@/lib/store';
import { sampleOrders, sampleInvoices, products } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'pedidos', name: 'Pedidos', icon: ShoppingBag },
  { id: 'facturas', name: 'Facturas', icon: FileText },
  { id: 'perfil', name: 'Perfil', icon: User },
  { id: 'favoritos', name: 'Favoritos', icon: Heart }
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

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout } = useAuthStore();
  const { favorites, removeFavorite, getFavoritesCount } = useFavoritesStore();
  const { addItem } = useCartStore();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
    setShowLogoutModal(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    const invoice = sampleInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      toast.error('Factura no encontrada');
      return;
    }

    toast.loading('Generando PDF...', { duration: 1500 });
    
    // Simulate PDF generation with realistic delay
    setTimeout(() => {
      // Create a simple text-based "PDF" content for demo
      const pdfContent = `
FACTURA: ${invoice.id}
Fecha: ${invoice.date}
Estado: ${invoice.status}
Importe: €${invoice.total.toFixed(2)}

Empresa: ${user?.company || 'N/A'}
Cliente: ${user?.name || 'N/A'}
Email: ${user?.email || 'N/A'}

Gracias por confiar en TopGel Distribuciones.
      `;
      
      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoice.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`✅ Factura ${invoice.id} descargada correctamente`);
    }, 1500);
  };

  // Calculate stats for dashboard
  const totalOrders = sampleOrders.length;
  const totalSpent = sampleOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = sampleOrders.filter(order => order.status === 'pending').length;
  const deliveredOrders = sampleOrders.filter(order => order.status === 'delivered').length;

  // Filter orders based on search and status
  const filteredOrders = sampleOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter invoices based on search
  const filteredInvoices = sampleInvoices.filter(invoice => 
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-20">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 45, 0],
            opacity: [0.03, 0.08, 0.03],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 pt-24 md:pt-32 lg:pt-36 xl:pt-40 pb-8 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          
          {/* Enhanced Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* User Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 overflow-hidden"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-indigo-500/10 rounded-3xl" />
              
              <div className="relative z-10 text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {user?.name}
                </h2>
                <p className="text-sm font-medium text-gray-700 mb-1">{user?.company}</p>
                <p className="text-xs text-gray-500 flex items-center justify-center">
                  <Mail className="w-3 h-3 mr-1" />
                  {user?.email}
                </p>
                
                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{totalOrders}</div>
                    <div className="text-xs text-gray-600">Pedidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-600">€{totalSpent.toFixed(0)}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Navigation Menu */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
            >
              <nav className="space-y-2">
                {tabs.map((tab, index) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      <span className="font-medium">{tab.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="ml-auto"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </nav>
              
              <Separator className="my-6" />
              
              <motion.button
                onClick={handleLogoutClick}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-300 group"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar sesión</span>
              </motion.button>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-500" />
                Acciones rápidas
              </h3>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <ShoppingCart className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">Nuevo pedido</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-emerald-600 mr-2" />
                    <span className="text-sm font-medium text-emerald-900">Contactar</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600" />
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20"
              >
                
                {/* DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-8">
                    {/* Welcome Header */}
                    <div className="text-center lg:text-left">
                      <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
                      >
                        ¡Hola, {user?.name?.split(' ')[0]}! 👋
                      </motion.h1>
                      <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-600 text-lg"
                      >
                        Aquí tienes un resumen de tu actividad reciente
                      </motion.p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        {
                          title: 'Total Pedidos',
                          value: totalOrders,
                          icon: ShoppingBag,
                          color: 'from-blue-500 to-cyan-500',
                          bgColor: 'from-blue-50 to-cyan-50',
                          textColor: 'text-blue-700'
                        },
                        {
                          title: 'Total Gastado',
                          value: `€${totalSpent.toFixed(2)}`,
                          icon: DollarSign,
                          color: 'from-emerald-500 to-teal-500',
                          bgColor: 'from-emerald-50 to-teal-50',
                          textColor: 'text-emerald-700'
                        },
                        {
                          title: 'Pendientes',
                          value: pendingOrders,
                          icon: Clock,
                          color: 'from-amber-500 to-orange-500',
                          bgColor: 'from-amber-50 to-orange-50',
                          textColor: 'text-amber-700'
                        },
                        {
                          title: 'Entregados',
                          value: deliveredOrders,
                          icon: Check,
                          color: 'from-purple-500 to-pink-500',
                          bgColor: 'from-purple-50 to-pink-50',
                          textColor: 'text-purple-700'
                        }
                      ].map((stat, index) => (
                        <motion.div
                          key={stat.title}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          className={`relative bg-gradient-to-br ${stat.bgColor} rounded-2xl p-6 border border-white/50 shadow-lg overflow-hidden group cursor-pointer`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                          
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                                <stat.icon className="w-6 h-6 text-white" />
                              </div>
                              <TrendingUp className="w-5 h-5 text-gray-400" />
                            </div>
                            
                            <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                              {stat.value}
                            </div>
                            <div className="text-sm text-gray-600 font-medium">
                              {stat.title}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Recent Orders */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center text-lg">
                              <Package className="w-5 h-5 mr-2 text-blue-600" />
                              Pedidos recientes
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {sampleOrders.slice(0, 3).map((order, index) => {
                              const StatusIcon = statusIcons[order.status];
                              return (
                                <motion.div
                                  key={order.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.6 + index * 0.1 }}
                                  className="flex items-center justify-between p-4 bg-white/70 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                      <StatusIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-sm text-gray-900">
                                        Pedido #{order.id}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(order.date).toLocaleDateString('es-ES')}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <Badge className={statusColors[order.status]}>
                                      {statusLabels[order.status]}
                                    </Badge>
                                    <div className="text-sm font-semibold text-gray-900 mt-1">
                                      €{order.total.toFixed(2)}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                            
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setActiveTab('pedidos')}
                              className="w-full mt-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center"
                            >
                              Ver todos los pedidos
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </motion.button>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Quick Stats */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/30">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center text-lg">
                              <PieChart className="w-5 h-5 mr-2 text-emerald-600" />
                              Estadísticas rápidas
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* Progress bars for different metrics */}
                            {[
                              { label: 'Pedidos entregados', value: deliveredOrders, total: totalOrders, color: 'bg-emerald-500' },
                              { label: 'Facturas pagadas', value: sampleInvoices.filter(i => i.status === 'paid').length, total: sampleInvoices.length, color: 'bg-blue-500' },
                              { label: 'Productos favoritos', value: 8, total: 12, color: 'bg-purple-500' }
                            ].map((metric, index) => (
                              <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                className="space-y-2"
                              >
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700 font-medium">{metric.label}</span>
                                  <span className="text-gray-900 font-semibold">{metric.value}/{metric.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(metric.value / metric.total) * 100}%` }}
                                    transition={{ delay: 0.8 + index * 0.1, duration: 1, ease: "easeOut" }}
                                    className={`h-full ${metric.color} rounded-full`}
                                  />
                                </div>
                              </motion.div>
                            ))}

                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1, duration: 0.5 }}
                              className="pt-4 border-t border-gray-100"
                            >
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                                <div className="flex items-center">
                                  <Award className="w-5 h-5 text-emerald-600 mr-2" />
                                  <div>
                                    <div className="font-semibold text-emerald-900 text-sm">Cliente Premium</div>
                                    <div className="text-emerald-700 text-xs">Descuentos exclusivos</div>
                                  </div>
                                </div>
                                <Star className="w-5 h-5 text-amber-500" />
                              </div>
                            </motion.div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* PEDIDOS TAB */}
                {activeTab === 'pedidos' && (
                  <div className="space-y-6">
                    {/* Header with search and filters */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                          Mis pedidos
                        </h1>
                        <p className="text-gray-600">
                          Consulta el estado de todos tus pedidos
                        </p>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo pedido
                      </motion.button>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="Buscar pedidos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-0 bg-white shadow-sm"
                        />
                      </div>
                      
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-white border-0 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="processing">Procesando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                      </select>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                      {filteredOrders.map((order, index) => {
                        const StatusIcon = statusIcons[order.status];
                        return (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            whileHover={{ y: -2, scale: 1.01 }}
                            className="bg-gradient-to-r from-white to-blue-50/30 rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-blue-50 rounded-xl">
                                    <StatusIcon className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                      Pedido #{order.id}
                                    </h3>
                                    <div className="flex items-center text-sm text-gray-600 space-x-4 mt-1">
                                      <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {new Date(order.date).toLocaleDateString('es-ES')}
                                      </div>
                                      <div className="flex items-center">
                                        <CreditCard className="w-4 h-4 mr-1" />
                                        €{order.total.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="pl-11">
                                  <h4 className="font-medium text-gray-900 text-sm mb-2">
                                    Productos ({order.items.length}):
                                  </h4>
                                  <div className="space-y-1">
                                    {order.items.map((item, itemIndex) => (
                                      <div key={itemIndex} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700">{item.product.name} x{item.quantity}</span>
                                        <span className="font-semibold text-gray-900">
                                          €{(item.product.price * item.quantity).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end space-y-3">
                                <Badge className={statusColors[order.status]}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusLabels[order.status]}
                                </Badge>
                                
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200">
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver detalle
                                  </Button>
                                  
                                  {order.status === 'delivered' && (
                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                      <Download className="w-4 h-4 mr-1" />
                                      Repetir pedido
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {filteredOrders.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-12"
                        >
                          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No se encontraron pedidos
                          </h3>
                          <p className="text-gray-600">
                            {searchTerm || filterStatus !== 'all' 
                              ? 'Prueba con diferentes criterios de búsqueda'
                              : 'Todavía no has realizado ningún pedido'
                            }
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* FACTURAS TAB */}
                {activeTab === 'facturas' && (
                  <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                          Mis facturas
                        </h1>
                        <p className="text-gray-600">
                          Descarga y consulta todas tus facturas en PDF
                        </p>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="Buscar facturas por número o pedido..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-0 bg-white shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Enhanced Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50/70">
                              <TableHead className="font-semibold text-gray-900 py-4">Factura</TableHead>
                              <TableHead className="font-semibold text-gray-900">Pedido</TableHead>
                              <TableHead className="font-semibold text-gray-900">Fecha</TableHead>
                              <TableHead className="font-semibold text-gray-900">Estado</TableHead>
                              <TableHead className="font-semibold text-gray-900">Total</TableHead>
                              <TableHead className="font-semibold text-gray-900">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredInvoices.map((invoice, index) => (
                              <motion.tr
                                key={invoice.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="hover:bg-blue-50/30 transition-colors duration-200"
                              >
                                <TableCell className="font-bold text-blue-700">
                                  <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                    {invoice.id}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">#{invoice.orderId}</TableCell>
                                <TableCell className="text-gray-700">
                                  {new Date(invoice.date).toLocaleDateString('es-ES')}
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusColors[invoice.status]}>
                                    <Check className="w-3 h-3 mr-1" />
                                    {statusLabels[invoice.status]}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-bold text-lg text-emerald-700">
                                  €{invoice.total.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownloadInvoice(invoice.id)}
                                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-200 hover:border-blue-300 transition-all duration-200"
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        Descargar PDF
                                      </Button>
                                    </motion.div>
                                    
                                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {filteredInvoices.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-12"
                        >
                          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No se encontraron facturas
                          </h3>
                          <p className="text-gray-600">
                            {searchTerm ? 'Prueba con diferentes criterios de búsqueda' : 'Todavía no tienes facturas disponibles'}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* PERFIL TAB */}
                {activeTab === 'perfil' && (
                  <div className="space-y-8">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        Mi perfil
                      </h1>
                      <p className="text-gray-600">
                        Gestiona tu información personal y de empresa
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Personal Info */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                      >
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
                          <CardHeader>
                            <CardTitle className="flex items-center text-xl">
                              <User className="w-6 h-6 mr-2 text-blue-600" />
                              Información personal
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {[
                              { label: 'Nombre completo', value: user?.name, icon: User },
                              { label: 'Email', value: user?.email, icon: Mail },
                              { label: 'Teléfono', value: user?.phone, icon: Phone },
                            ].map((field, index) => (
                              <motion.div
                                key={field.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="space-y-2"
                              >
                                <label className="flex items-center text-sm font-medium text-gray-700">
                                  <field.icon className="w-4 h-4 mr-2" />
                                  {field.label}
                                </label>
                                <input
                                  type="text"
                                  value={field.value}
                                  readOnly
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/70 text-gray-700 focus:outline-none"
                                />
                              </motion.div>
                            ))}
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Company Info & Actions */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-6"
                      >
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50/30">
                          <CardHeader>
                            <CardTitle className="flex items-center text-xl">
                              <Building className="w-6 h-6 mr-2 text-emerald-600" />
                              Información de empresa
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="space-y-2"
                            >
                              <label className="flex items-center text-sm font-medium text-gray-700">
                                <Building className="w-4 h-4 mr-2" />
                                Empresa
                              </label>
                              <input
                                type="text"
                                value={user?.company}
                                readOnly
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/70 text-gray-700 focus:outline-none"
                              />
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                              className="space-y-2"
                            >
                              <label className="flex items-center text-sm font-medium text-gray-700">
                                <MapPin className="w-4 h-4 mr-2" />
                                Dirección
                              </label>
                              <textarea
                                value="Calle Principal 123, 28001 Madrid, España"
                                readOnly
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/70 text-gray-700 focus:outline-none resize-none"
                              />
                            </motion.div>
                          </CardContent>
                        </Card>

                        {/* Action Cards */}
                        <div className="space-y-4">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6"
                          >
                            <div className="flex items-center mb-3">
                              <Settings className="w-5 h-5 text-blue-600 mr-2" />
                              <h3 className="font-bold text-blue-900 text-lg">
                                Actualizar información
                              </h3>
                            </div>
                            <p className="text-blue-700 mb-4 leading-relaxed">
                              Para modificar tus datos de perfil o empresa, ponte en contacto con nuestro equipo de soporte.
                            </p>
                            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                              <Phone className="w-4 h-4 mr-2" />
                              Contactar soporte
                            </Button>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6"
                          >
                            <div className="flex items-center mb-3">
                              <Bell className="w-5 h-5 text-emerald-600 mr-2" />
                              <h3 className="font-bold text-emerald-900 text-lg">
                                Preferencias de notificación
                              </h3>
                            </div>
                            <div className="space-y-3">
                              {[
                                'Notificaciones por email',
                                'Actualizaciones de pedidos',
                                'Ofertas y promociones'
                              ].map((pref, index) => (
                                <label key={index} className="flex items-center justify-between">
                                  <span className="text-emerald-700 text-sm">{pref}</span>
                                  <input
                                    type="checkbox"
                                    defaultChecked
                                    className="w-4 h-4 text-emerald-600 bg-emerald-100 border-emerald-300 rounded focus:ring-emerald-500"
                                  />
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* FAVORITOS TAB */}
                {activeTab === 'favoritos' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                          Productos favoritos
                        </h1>
                        <p className="text-gray-600">
                          Tienes {getFavoritesCount()} productos en favoritos
                        </p>
                      </div>
                      {getFavoritesCount() > 0 && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            favorites.forEach(productId => removeFavorite(productId));
                            toast.success('Todos los favoritos eliminados');
                          }}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Limpiar todo
                        </Button>
                      )}
                    </div>

                    {getFavoritesCount() === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16"
                      >
                        <Heart className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Aún no tienes productos favoritos
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Explora nuestro catálogo y marca como favoritos los productos que más te gusten para acceder a ellos rápidamente.
                        </p>
                        <Button className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700">
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Ver productos
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map((productId, index) => {
                          const product = products.find(p => p.id === productId);
                          if (!product) return null;
                          
                          return (
                            <motion.div
                              key={productId}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
                            >
                              <div className="relative">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-48 object-cover"
                                />
                                <div className="absolute top-3 right-3">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      removeFavorite(productId);
                                      toast.success(`${product.name} eliminado de favoritos`);
                                    }}
                                    className="bg-white/90 hover:bg-white text-red-500 hover:text-red-600 w-8 h-8 p-0 rounded-full shadow-md"
                                  >
                                    <Heart className="w-4 h-4 fill-current" />
                                  </Button>
                                </div>
                                {product.discount && (
                                  <div className="absolute top-3 left-3">
                                    <Badge className="bg-red-500 text-white">
                                      -{product.discount}%
                                    </Badge>
                                  </div>
                                )}
                              </div>
                              
                              <div className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                  {product.name}
                                </h3>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                  {product.description}
                                </p>
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <span className="text-xl font-bold text-gray-900">
                                      €{product.price.toFixed(2)}
                                    </span>
                                    {product.originalPrice && (
                                      <span className="text-sm text-gray-500 line-through ml-2">
                                        €{product.originalPrice.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">/{product.units}</span>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => window.location.href = `/productos/${product.id}`}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    onClick={() => {
                                      addItem(product, 1);
                                      toast.custom((t) => (
                                        <CustomToast 
                                          message={`${product.name} añadido al carrito!`}
                                          productName={product.name}
                                          productImage={product.image}
                                          quantity={1}
                                          onDismiss={() => toast.dismiss(t.id)}
                                        />
                                      ), {
                                        duration: 4000,
                                        position: 'top-right',
                                      });
                                    }}
                                    disabled={!product.inStock}
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    {product.inStock ? 'Añadir' : 'Agotado'}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de logout */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
                className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                    <LogOut className="w-8 h-8 text-red-600" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    ¿Cerrar sesión?
                  </h2>
                  
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowLogoutModal(false)}
                      className="flex-1 rounded-2xl border-gray-200 hover:bg-gray-50 transition-all duration-300"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleLogout}
                      className="flex-1 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
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
    </div>
  );
}