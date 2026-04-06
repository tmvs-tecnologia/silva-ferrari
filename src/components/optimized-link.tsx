"use client";

import Link from "next/link";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useCallback } from "react";

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchData?: () => Promise<any>;
  cacheKey?: string; // Chave opcional para parear com useDataCache no destino
  onClick?: () => void;
}

export function OptimizedLink({ 
  href, 
  children, 
  className, 
  prefetchData, 
  cacheKey,
  onClick,
  ...props 
}: OptimizedLinkProps) {
  const { prefetchData: prefetch } = usePrefetch();

  const handleMouseEnter = useCallback(() => {
    if (prefetchData) {
      // Usar a chave explícita ou o href como fallback
      const key = cacheKey || href;
      
      // Usar requestIdleCallback para prefetch não bloqueante
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          prefetch(key, prefetchData);
        });
      } else {
        // Fallback para navegadores que não suportam requestIdleCallback
        setTimeout(() => {
          prefetch(key, prefetchData);
        }, 100);
      }
    }
  }, [href, cacheKey, prefetchData, prefetch]);

  return (
    <Link
      href={href}
      className={className}
      prefetch={false}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  );
}