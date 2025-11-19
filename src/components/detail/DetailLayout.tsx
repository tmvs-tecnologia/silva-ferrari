"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2 } from "lucide-react";

interface DetailLayoutProps {
  backHref: string;
  title: string;
  subtitle?: string;
  onDelete?: () => void;
  left: ReactNode;
  right: ReactNode;
}

export function DetailLayout({ backHref, title, subtitle, onDelete, left, right }: DetailLayoutProps) {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={backHref}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        {onDelete ? (
          <div className="flex-shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta ação? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-white text-red-600 border border-red-500 hover:bg-red-50 hover:text-red-700">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {left}
        </div>
        <div className="space-y-6">
          {right}
        </div>
      </div>
    </div>
  );
}