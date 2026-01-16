"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Upload, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PendingDocument {
  key: string;
  label: string;
  group: string;
  stepId?: number;
  required?: boolean;
}

interface PendingDocumentsListProps {
  documents: PendingDocument[];
  onUploadClick: (doc: PendingDocument) => void;
  totalDocs: number;
  completedDocs: number;
}

export function PendingDocumentsList({ 
  documents = [], 
  onUploadClick, 
  totalDocs, 
  completedDocs 
}: PendingDocumentsListProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("priority");

  const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  // Filter documents
  const filteredDocs = (documents || [])
    .filter(doc => {
      const matchesSearch = doc.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = filterGroup === "all" || doc.group === filterGroup;
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const pA = priorityOrder[(a as any).priority || "low"] || 0;
        const pB = priorityOrder[(b as any).priority || "low"] || 0;
        return pB - pA;
      } else {
        // Sort by date (newest first) if available, otherwise keep order
        return 0; 
      }
    });

  // Get unique groups for filter
  const groups = Array.from(new Set((documents || []).map(d => d.group)));

  const getStatusBadge = (doc: PendingDocument) => {
    const status = (doc as any).status || "pending";
    const priority = (doc as any).priority || "low";
    
    if (status === "critical" || priority === "high") {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
          Crítico
        </Badge>
      );
    }
    if (status === "late") {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
          Atrasado
        </Badge>
      );
    }
    if (status === "new") {
       return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
          Novo
        </Badge>
      );
    }
    return (
       <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
          <Clock className="h-3.5 w-3.5" />
          Pendente
       </div>
    );
  };

  if (documents.length === 0 && progress === 100) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-start gap-4 text-green-800 animate-in fade-in duration-500 mb-6">
        <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1">Documentação Completa!</h4>
          <p className="text-green-700">Todos os documentos obrigatórios foram anexados com sucesso.</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0 && totalDocs === 0) {
      return null; 
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Progress Header */}
      <div 
        className="space-y-2 cursor-pointer group select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Progresso da Documentação</span>
            {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
          <span className="text-gray-900">{progress}% ({completedDocs}/{totalDocs})</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div 
            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Expanded List */}
      {isOpen && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 font-medium">
              <AlertCircle className="h-5 w-5" />
              <span>{documents.length} Pendências</span>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar documento..."
                  className="pl-9 h-9 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger className="w-[130px] h-9 bg-white">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Filter className="h-3.5 w-3.5" />
                    <SelectValue placeholder="Etapa" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[130px] h-9 bg-white">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <SelectValue placeholder="Ordenar" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Prioridade</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Etapa</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <tr key={doc.key} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {doc.label}
                        {doc.required && <span className="text-red-500 ml-1" title="Obrigatório">*</span>}
                        {doc.dueDate && (
                           <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                              Prazo: {new Date(doc.dueDate).toLocaleDateString('pt-BR')}
                           </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <Badge variant="outline" className="font-normal bg-white whitespace-nowrap">
                          {doc.group}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(doc)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => onUploadClick(doc)}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          Anexar
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Nenhum documento encontrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
