"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Download, Trash2, File, FileImage, FileSpreadsheet, FileVideo, FileAudio, FileArchive, FileCode, Paperclip } from "lucide-react";
import { FIELD_TO_DOCUMENT_NAME } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { documentIconClassName } from "@/components/ui/document-style";

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

  const getFieldDisplayName = (field?: string) => {
    if (!field) return "—";
    const key = field.endsWith("File") ? field : `${field}File`;
    const mapped = FIELD_TO_DOCUMENT_NAME[key];
    if (mapped) return mapped;
    const humanized = field
      .replace(/([A-Z])/g, " $1")
      .replace(/^\s+/, "")
      .toLowerCase();
    return humanized.charAt(0).toUpperCase() + humanized.slice(1);
  };

  const renderIcon = (doc: Document) => {
    const name = String(doc.file_path || doc.file_name || "").toLowerCase();
    const hasExt = name.includes(".");
    const ext = hasExt ? name.split(".").pop() || "" : "";
    if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) return <FileImage className={`${documentIconClassName} text-blue-600`} />;
    if (["pdf"].includes(ext)) return <FileText className={`${documentIconClassName} text-red-600`} />;
    if (["xls","xlsx","csv"].includes(ext)) return <FileSpreadsheet className={`${documentIconClassName} text-green-600`} />;
    if (["mp4","mov","avi","mkv","webm"].includes(ext)) return <FileVideo className={`${documentIconClassName} text-indigo-600`} />;
    if (["mp3","wav","aac","flac","ogg"].includes(ext)) return <FileAudio className={`${documentIconClassName} text-purple-600`} />;
    if (["zip","rar","7z","tar","gz"].includes(ext)) return <FileArchive className={`${documentIconClassName} text-amber-600`} />;
    if (["doc","docx","rtf","odt"].includes(ext)) return <FileText className={`${documentIconClassName} text-blue-600`} />;
    if (["json","js","ts","tsx","py","java","go","rb","c","cpp","md","txt"].includes(ext)) return <FileCode className={`${documentIconClassName} text-slate-600`} />;
    return <Paperclip className={`${documentIconClassName} text-slate-600`} />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className={documentIconClassName} />
          Documentos do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`col-span-1 md:col-span-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'} ${uploading ? 'opacity-50 pointer-events-none' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="p-3 bg-blue-50 rounded-full mb-3">
              <Upload className={`h-6 w-6 ${isDragOver ? 'text-primary' : 'text-secondary'}`} />
            </div>
            <p className="text-sm font-medium text-gray-700">Arraste e solte arquivos aqui para anexar</p>
            <p className="text-xs text-gray-500 mt-1">Ou use os botões de envio nas etapas acima</p>
          </div>

          {loadingDocuments ? (
            <div className="col-span-1 md:col-span-2 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="bg-gray-50 border rounded-lg p-3 flex items-start gap-3">
                <div className="p-2 bg-white rounded border">
                  {renderIcon(doc)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.document_name || doc.file_name}</p>
                  <p className="text-xs text-gray-500">Enviado em {new Date(doc.uploaded_at).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  {doc.field_name && (
                    <p className="text-xs text-blue-600 mt-0.5">Campo: {getFieldDisplayName(doc.field_name)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onDocumentDownload?.(doc)}>
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDocumentDelete?.(doc)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDocumentDoubleClick?.(doc)}>
                    <svg viewBox="0 0 24 24" className="h-3 w-3"><path d="M12 20h9" stroke="currentColor" strokeWidth="2"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{emptyText}</p>
              <p className="text-xs mt-1">Arraste arquivos para esta área ou use os botões de upload nas etapas</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
