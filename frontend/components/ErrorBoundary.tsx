'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

/**
 * Error Boundary Global - Captura errores en toda la aplicación
 * Incluye logging automático y UI elegante de recuperación
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generar ID único para tracking
    const eventId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({ errorInfo, eventId });

    // Log estructurado para debugging
    const errorLog = {
      eventId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR',
    };

    console.error('🚨 [ErrorBoundary] Error capturado:', errorLog);

    // Enviar error al backend para logging centralizado
    this.reportErrorToBackend(errorLog);
  }

  private reportErrorToBackend = async (errorLog: Record<string, unknown>) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      await fetch(`${API_URL}/api/logs/frontend-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog),
        credentials: 'include',
      }).catch(() => {
        // Silenciar errores de red
      });
    } catch {
      // No propagar errores del handler
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, eventId: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const subject = encodeURIComponent(`Error en web - ${this.state.eventId}`);
    const body = encodeURIComponent(
      `Hola,\n\nHe encontrado un error en la web:\n\n` +
      `ID: ${this.state.eventId}\n` +
      `Mensaje: ${this.state.error?.message}\n` +
      `URL: ${typeof window !== 'undefined' ? window.location.href : ''}\n\n` +
      `Descripción de lo que estaba haciendo:\n\n`
    );
    window.open(`mailto:pedidos@granjamaripepa.com?subject=${subject}&body=${body}`, '_blank');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Algo salió mal
            </h1>
            
            <p className="text-gray-600 text-center mb-4">
              Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
            </p>

            {/* ID del error para soporte */}
            {this.state.eventId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700 text-center">
                  Código de error: <code className="font-mono font-bold">{this.state.eventId}</code>
                </p>
              </div>
            )}
            
            {/* Mensaje de error (en desarrollo) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="bg-gray-50 rounded-lg p-4 mb-4">
                <summary className="text-xs text-gray-500 cursor-pointer">
                  Detalles técnicos
                </summary>
                <pre className="text-xs text-red-600 font-mono mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Acciones */}
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar página
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Inicio
                </Button>

                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <Bug className="w-4 h-4" />
                  Reportar
                </Button>
              </div>
            </div>

            <p className="text-center text-gray-400 text-xs mt-6">
              ¿Necesitas ayuda? Llama al{' '}
              <a href="tel:968467514" className="text-blue-600 hover:underline">
                968 46 75 14
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
