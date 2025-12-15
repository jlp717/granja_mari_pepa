/**
 * 🔐 useApiData - Hook para cargar datos de API con HttpOnly Cookies
 * 
 * SEGURIDAD: Ya no usa localStorage para tokens. Los tokens se envían
 * automáticamente como cookies HttpOnly por el browser.
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store';
import { secureFetch } from '@/lib/secureFetch';

interface UseApiDataOptions {
  endpoint: string;
  dataKey: string;
  errorMessage?: string;
  showErrorToast?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

interface ApiDataState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useApiData<T>({
  endpoint,
  dataKey,
  errorMessage = 'Error al cargar datos',
  showErrorToast = true,
  retryAttempts = 3,
  retryDelay = 1000
}: UseApiDataOptions) {
  const [state, setState] = useState<ApiDataState<T>>({
    data: [],
    loading: false,
    error: null
  });

  const { logout, isAuthenticated } = useAuthStore();

  const fetchData = useCallback(async (attempt = 1): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 🔐 SEGURIDAD: Verificar autenticación desde el store (no localStorage)
      if (!isAuthenticated) {
        if (showErrorToast) {
          toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        logout();
        setState({ data: [], loading: false, error: new Error('Not authenticated') });
        return;
      }

      // 🔐 SEGURIDAD: Usar secureFetch que incluye credentials automáticamente
      const { data, ok, status } = await secureFetch<{ success: boolean; [key: string]: any }>(endpoint);

      if (!ok) {
        if (status === 401) {
          if (showErrorToast) {
            toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
          }
          logout();
          setState({ data: [], loading: false, error: new Error('Unauthorized') });
          return;
        }

        // Retry logic for 500-level errors
        if (status >= 500 && attempt < retryAttempts) {
          console.warn(`Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          return fetchData(attempt + 1);
        }

        throw new Error(`HTTP error! status: ${status}`);
      }

      if (data.success && Array.isArray(data[dataKey])) {
        setState({ data: data[dataKey], loading: false, error: null });
      } else {
        setState({ data: [], loading: false, error: null });
        console.warn(`No data found or invalid format for ${dataKey}`);
      }
    } catch (error) {
      console.error(`Error loading ${dataKey}:`, error);
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: [], loading: false, error: errorObj });
      
      if (showErrorToast && attempt >= retryAttempts) {
        toast.error(`${errorMessage}. Intenta de nuevo más tarde.`);
      }
    }
  }, [endpoint, dataKey, errorMessage, showErrorToast, retryAttempts, retryDelay, logout, isAuthenticated]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    fetchData,
    refetch
  };
}
