'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  CreditCard
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { sampleOrders, sampleInvoices } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'pedidos', name: 'Pedidos', icon: ShoppingBag },
  { id: 'facturas', name: 'Facturas', icon: FileText },
  { id: 'perfil', name: 'Perfil', icon: User }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800'
};

const statusLabels = {
  pending: 'Pendiente',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  paid: 'Pagada'
};

export function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('pedidos');
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada correctamente');
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    // Simulate PDF download
    toast.success(`Descargando factura ${invoiceId}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-6">
            {/* User Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {user?.name}
                </h2>
                <p className="text-sm text-gray-600 mb-2">{user?.company}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </motion.div>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
                
                <Separator className="my-4" />
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Cerrar sesión</span>
                </button>
              </nav>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              {activeTab === 'pedidos' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Mis pedidos
                      </h1>
                      <p className="text-gray-600">
                        Consulta el estado de todos tus pedidos
                      </p>
                    </div>
                    <Button className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Nuevo pedido
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {sampleOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              Pedido #{order.id}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(order.date).toLocaleDateString('es-ES')}
                              </div>
                              <div className="flex items-center">
                                <CreditCard className="w-4 h-4 mr-1" />
                                {order.total.toFixed(2)}€
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <Badge className={statusColors[order.status]}>
                              {statusLabels[order.status]}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver detalle
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 text-sm">
                            Productos ({order.items.length}):
                          </h4>
                          {order.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex justify-between items-center text-sm text-gray-600">
                              <span>{item.product.name} x{item.quantity}</span>
                              <span>{(item.product.price * item.quantity).toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'facturas' && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Mis facturas
                      </h1>
                      <p className="text-gray-600">
                        Descarga y consulta todas tus facturas
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Factura</TableHead>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sampleInvoices.map((invoice, index) => (
                          <motion.tr
                            key={invoice.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                          >
                            <TableCell className="font-medium">{invoice.id}</TableCell>
                            <TableCell>{invoice.orderId}</TableCell>
                            <TableCell>
                              {new Date(invoice.date).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[invoice.status]}>
                                {statusLabels[invoice.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {invoice.total.toFixed(2)}€
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadInvoice(invoice.id)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Descargar
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {activeTab === 'perfil' && (
                <div>
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Mi perfil
                    </h1>
                    <p className="text-gray-600">
                      Actualiza tu información personal y de empresa
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre completo
                        </label>
                        <input
                          type="text"
                          value={user?.name}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user?.email}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={user?.phone}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Empresa
                        </label>
                        <input
                          type="text"
                          value={user?.company}
                          readOnly
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                        />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-center mb-3">
                          <Settings className="w-5 h-5 text-blue-600 mr-2" />
                          <h3 className="font-semibold text-blue-900">
                            Actualizar información
                          </h3>
                        </div>
                        <p className="text-blue-700 text-sm mb-4">
                          Para modificar tus datos de perfil o empresa, ponte en contacto con nuestro equipo.
                        </p>
                        <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                          Contactar soporte
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}