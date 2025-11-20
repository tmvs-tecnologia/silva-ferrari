"use client";

import Link from "next/link";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useCallback } from "react";

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchData?: () => Promise<any>;
  onClick?: () => void;
}

export function OptimizedLink({ 
  href, 
  children, 
  className, 
  prefetchData, 
  onClick,
  ...props 
}: OptimizedLinkProps) {
  const { prefetchData: prefetch } = usePrefetch();

  const handleMouseEnter = useCallback(() => {
    if (prefetchData) {
      // Usar requestIdleCallback para prefetch não bloqueante
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          prefetch(href, prefetchData);
        });
      } else {
        // Fallback para navegadores que não suportam requestIdleCallback
        setTimeout(() => {
          prefetch(href, prefetchData);
        }, 100);
      }
    }
  }, [href, prefetchData, prefetch]);

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