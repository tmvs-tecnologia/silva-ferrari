import { useState, useEffect, useCallback } from 'react';

interface CacheEntry {
  data: any;
  timestamp: number;
  isLoading: boolean;
  error: any;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const cache = new Map<string, CacheEntry>();

export function useDataCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async () => {
    // Verificar cache primeiro
    const cached = cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setData(cached.data);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Se não tem cache ou expirou, buscar dados
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction();
      setData(result);
      
      // Atualizar cache
      cache.set(key, {
        data: result,
        timestamp: now,
        isLoading: false,
        error: null
      });
    } catch (err) {
      setError(err);
      
      // Atualizar cache com erro
      cache.set(key, {
        data: null,
        timestamp: now,
        isLoading: false,
        error: err
      });
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFunction, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    cache.delete(key);
    fetchData();
  }, [key, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

// Função para limpar cache específico ou todo cache
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Função para atualizar o cache manualmente (usada pelo prefetch)
export function setCacheData(key: string, data: any) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    isLoading: false,
    error: null
  });
}