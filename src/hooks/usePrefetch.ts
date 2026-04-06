import { useCallback } from 'react';
import { clearCache, setCacheData } from './useDataCache';

// Hook para prefetch de dados - carrega dados antes que sejam necessários
export function usePrefetch() {
  const prefetchData = useCallback(async (key: string, fetchFunction: () => Promise<any>) => {
    try {
      // Usar requestAnimationFrame para não bloquear a UI
      requestAnimationFrame(async () => {
        const data = await fetchFunction();
        if (data) {
          // Salva o dado no cache global para que o useDataCache o encontre imediatamente
          setCacheData(key, data);
        }
      });
    } catch (error) {
      console.warn(`Prefetch failed for ${key}:`, error);
    }
  }, []);

  return {
    prefetchData,
    clearCache
  };
}