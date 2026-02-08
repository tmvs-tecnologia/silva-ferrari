"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, CheckCircle, X } from "lucide-react";
import { RESPONSAVEIS } from "@/constants/responsibles";

interface ObservationResponsibleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (responsibleName: string) => void;
    currentResponsible?: string;
}

export function ObservationResponsibleModal({
    open,
    onOpenChange,
    onConfirm,
    currentResponsible = "",
}: ObservationResponsibleModalProps) {
    const [selectedResponsible, setSelectedResponsible] = useState(currentResponsible);
    const [searchTerm, setSearchTerm] = useState("");

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setSelectedResponsible(currentResponsible);
            setSearchTerm("");
        }
    }, [open, currentResponsible]);

    const handleConfirm = () => {
        if (selectedResponsible.trim()) {
            onConfirm(selectedResponsible);
            onOpenChange(false);
        }
    };

    const filteredResponsibles = RESPONSAVEIS.filter(r =>
        r.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-0 overflow-hidden gap-0 animate-in fade-in zoom-in-95 duration-200">

                {/* Header with improved styling */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <DialogHeader className="mb-0 space-y-1">
                        <DialogTitle className="text-xl font-semibold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            Responsável pela Observação
                        </DialogTitle>
                        <DialogDescription className="text-base text-slate-500 dark:text-slate-400 ml-1">
                            Identifique quem está registrando esta observação.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Input field */}
                    <div className="space-y-3">
                        <Label htmlFor="responsible" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            Nome do Responsável
                        </Label>
                        <div className="relative group">
                            <User className="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                id="responsible"
                                value={selectedResponsible}
                                onChange={(e) => setSelectedResponsible(e.target.value)}
                                className="pl-11 h-11 text-base bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm hover:border-blue-400 dark:hover:border-blue-600"
                                placeholder="Digite o nome..."
                            />
                        </div>
                    </div>

                    {/* Quick selection pills */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Seleção Rápida
                            </Label>
                            {/* Optional: Add search filter here if list grows too large */}
                        </div>

                        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {RESPONSAVEIS.map((resp) => {
                                const name = resp.split(' – ')[1] || resp;
                                const isSelected = selectedResponsible === name;

                                return (
                                    <button
                                        key={resp}
                                        type="button"
                                        onClick={() => setSelectedResponsible(name)}
                                        className={`
                      group flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer select-none
                      ${isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 scale-[1.02]'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'}
                    `}
                                    >
                                        {isSelected && <CheckCircle className="w-3.5 h-3.5 animate-in zoom-in duration-200" />}
                                        {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="h-10 px-4 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleConfirm}
                        disabled={!selectedResponsible.trim()}
                        className="h-10 px-6 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Confirmar e Salvar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
