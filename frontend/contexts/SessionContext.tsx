'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { secureFetch } from '@/lib/secureFetch'; // 🔐 HttpOnly Cookie Auth
import { useSessionManager } from '@/hooks/useSessionManager'; // 🔐 Session manager

interface Cliente {
  codigo: string;
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  direccion: {
    calle: string;
    poblacion: string;
    provincia: string;
    codigoPostal: string;
    completa: string;
  };
  nif: string;
}

interface SessionContextType {
  cliente: Cliente | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();

  // 🔐 CRÍTICO: Activar session manager para TODA la app
  // Esto detecta token expirado, monitorea inactividad, y hace logout automático
  useSessionManager({ enabled: true });

  const refreshSession = useCallback(async () => {
    // 🔐 SEGURIDAD: Ya no verificamos localStorage, usamos estado de auth store
    if (!isAuthenticated) {
      setCliente(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // 🔐 SEGURIDAD: Usar secureFetch con HttpOnly cookies
      const { data, ok } = await secureFetch<{ success: boolean; perfil: Cliente }>('/api/auth/perfil');

      if (ok && data.success && data.perfil) {
        setCliente(data.perfil);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Cargar sesión al montar o cuando cambie autenticación
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <SessionContext.Provider 
      value={{ 
        cliente, 
        isAuthenticated, 
        isLoading,
        refreshSession 
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
