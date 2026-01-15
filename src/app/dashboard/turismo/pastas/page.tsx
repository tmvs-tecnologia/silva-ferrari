"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FolderPlus, Folder, Pencil, Trash2, ArrowLeft } from "lucide-react";

interface FolderRow {
  id: number;
  name: string;
  module_type: string;
  created_at?: string;
  updated_at?: string;
}

export default function PastasTurismoPage() {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingName, setCreatingName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [counts, setCounts] = useState<Record<number, number>>({});

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/folders?moduleType=turismo`);
      const data = await res.json();
      setFolders(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    let active = true;
    const loadCounts = async () => {
      const next: Record<number, number> = {};
      for (const f of folders) {
        try {
          const r = await fetch(`/api/folders/${f.id}/records`);
          if (!r.ok) continue;
          const arr = await r.json();
          next[f.id] = Array.isArray(arr) ? arr.length : 0;
        } catch {}
      }
      if (active) setCounts(next);
    };
    if (folders.length) loadCounts();
    return () => { active = false; };
  }, [folders]);

  const createFolder = async () => {
    const name = creatingName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, moduleType: "turismo" }),
      });
      if (res.ok) {
        setCreatingName("");
        await fetchFolders();
      }
    } catch {}
  };

  const renameFolder = async (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditingName("");
        await fetchFolders();
      }
    } catch {}
  };

  const removeFolder = async (id: number) => {
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (res.ok) await fetchFolders();
    } catch {}
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/turismo">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Pastas de Turismo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-amber-600" /> Nova Pasta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nome da pasta"
              value={creatingName}
              onChange={(e) => setCreatingName(e.target.value)}
            />
            <Button onClick={createFolder} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              Criar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card><CardContent className="p-6">Carregando...</CardContent></Card>
        ) : folders.length === 0 ? (
          <Card><CardContent className="p-6">Nenhuma pasta criada</CardContent></Card>
        ) : (
          folders.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-amber-500 rounded-md"><Folder className="h-5 w-5 text-white" /></div>
                    {editingId === f.id ? (
                      <Input className="h-8" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    ) : (
                      <Link href={`/dashboard/turismo/pastas/${f.id}`} className="text-base font-semibold truncate hover:underline">
                        {f.name}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === f.id ? (
                      <Button size="sm" onClick={() => renameFolder(f.id)}>Salvar</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(f.id); setEditingName(f.name); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeFolder(f.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-slate-600 mt-2">{counts[f.id] ?? 0} cadastros</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
