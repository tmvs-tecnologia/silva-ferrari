"use client";

import { Button } from "@/components/ui/button";
import { FileText, Download, X } from "lucide-react";
import { documentIconClassName } from "@/components/ui/document-style";

interface DocumentPreviewProps {
  fileUrl: string;
  fileName?: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export function DocumentPreview({ fileUrl, fileName, onRemove, showRemoveButton = true }: DocumentPreviewProps) {
  const displayName = fileName || fileUrl.split('/').pop() || 'Documento';
  const handleOpen = async () => {
    if (typeof window === 'undefined') return;

    // Tenta abrir direto primeiro, se falhar, tenta fallback
    // Não usamos window.open antes para evitar janelas em branco se der erro
    // Em vez disso, confiamos que o usuário permitirá o popup ou usará o toast de fallback
    
    // toast deve ser importado ou passado. Como este é um componente UI puro, 
    // idealmente ele não deveria depender de 'sonner' diretamente se não estiver configurado,
    // mas vamos assumir que 'sonner' é global no projeto ou usar console.
    // Para simplificar e evitar dependências circulares ou faltantes neste componente UI:
    // Vamos tentar window.open direto se não tivermos certeza.
    
    // Mas para manter consistência, vamos tentar fetch primeiro.
    
    try {
      const res = await fetch('/api/documents/sign-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fileUrl })
      });
      
      if (res.ok) {
        const { signedUrl } = await res.json();
        if (signedUrl) {
            window.open(signedUrl, '_blank');
            return;
        }
      }
      
      // Fallback
      window.open(fileUrl, '_blank');
    } catch (e) {
      console.error("Erro ao gerar preview:", e);
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <div className="mt-2 p-2 rounded-md border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className={`${documentIconClassName} text-blue-600`} />
          <button type="button" onClick={handleOpen} className="text-sm font-medium text-blue-600 hover:underline truncate" title={displayName}>
            {displayName}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleOpen} className="h-7 w-7 p-0" title="Abrir">
            <Download className="h-4 w-4" />
          </Button>
          {showRemoveButton && onRemove && (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-7 w-7 p-0 text-destructive" title="Remover">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
