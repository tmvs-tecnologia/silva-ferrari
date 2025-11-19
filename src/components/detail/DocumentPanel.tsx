"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Download, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Document {
  id: string | number;
  document_name?: string;
  file_name?: string;
  file_path: string;
  uploaded_at: string;
  field_name?: string;
}

interface DocumentPanelProps {
  onDropFiles?: (files: File[]) => void;
  uploading?: boolean;
  emptyText?: string;
  documents?: Document[];
  loadingDocuments?: boolean;
  isDragOver?: boolean;
  onDocumentDownload?: (document: Document) => void;
  onDocumentDelete?: (document: Document) => void;
  onDocumentEdit?: (document: Document, newName: string) => void;
  editingDocumentId?: string | number | null;
  editingDocumentName?: string;
  onDocumentNameChange?: (name: string) => void;
  onDocumentNameSave?: (documentId: string) => void;
  onDocumentNameKeyPress?: (e: React.KeyboardEvent, documentId: string) => void;
  onDocumentDoubleClick?: (document: Document) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
}

export function DocumentPanel({ 
  onDropFiles, 
  uploading, 
  emptyText = "Nenhum documento anexado ainda",
  documents = [],
  loadingDocuments = false,
  isDragOver = false,
  onDocumentDownload,
  onDocumentDelete,
  onDocumentEdit,
  editingDocumentId,
  editingDocumentName,
  onDocumentNameChange,
  onDocumentNameSave,
  onDocumentNameKeyPress,
  onDocumentDoubleClick,
  onDragOver,
  onDragLeave
}: DocumentPanelProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    onDragLeave?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onDropFiles?.(files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className={`text-sm ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}>
              {uploading 
                ? 'Fazendo upload...' 
                : isDragOver 
                  ? 'Solte os arquivos aqui' 
                  : 'Arraste e solte arquivos aqui para anexar'
              }
            </p>
            {!uploading && (
              <p className="text-xs text-muted-foreground mt-1">
                Ou clique nos botões de upload nas etapas acima
              </p>
            )}
          </div>
        </div>

        {loadingDocuments ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    {editingDocumentId === doc.id ? (
                      <input
                        type="text"
                        value={editingDocumentName}
                        onChange={(e) => onDocumentNameChange?.(e.target.value)}
                        onBlur={() => onDocumentNameSave?.(doc.id.toString())}
                        onKeyDown={(e) => onDocumentNameKeyPress?.(e, doc.id.toString())}
                        className="text-sm font-medium bg-background border border-input rounded px-2 py-1 flex-1 mr-2"
                        autoFocus
                      />
                    ) : (
                      <h4 
                        className="text-sm font-medium truncate cursor-pointer hover:text-blue-600 transition-colors"
                        onDoubleClick={() => onDocumentDoubleClick?.(doc)}
                        title="Clique duas vezes para renomear"
                      >
                        {doc.document_name || doc.file_name}
                      </h4>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDocumentDownload?.(doc)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDocumentDelete?.(doc)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enviado em {new Date(doc.uploaded_at).toLocaleDateString("pt-BR", {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {doc.field_name && (
                    <p className="text-xs text-blue-600 mt-1">
                      Campo: {doc.field_name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{emptyText}</p>
            <p className="text-xs mt-1">
              Arraste arquivos para esta área ou use os botões de upload nas etapas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}