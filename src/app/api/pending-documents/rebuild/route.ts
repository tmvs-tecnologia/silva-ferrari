import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import {
  computePendingByFlow,
  extractDocumentsFromRecord,
  getAcoesCiveisDocRequirements,
  getAcoesCriminaisDocRequirements,
  getAcoesTrabalhistasDocRequirements,
  getCompraVendaDocRequirements,
  getPerdaNacionalidadeDocRequirements,
  getTurismoDocRequirements,
  getVistosDocRequirements
} from "@/lib/pending-documents";

export const runtime = "nodejs";

type RebuildBody = {
  moduleTypes?: Array<"vistos" | "turismo" | "acoes_trabalhistas" | "acoes_civeis" | "acoes_criminais" | "compra_venda_imoveis" | "perda_nacionalidade">;
};

function extractUploadedKeys(documents: any[]) {
  const keys = new Set<string>();
  for (const d of documents || []) {
    const k = d?.field_name || d?.fieldName || d?.document_type || d?.documentType;
    if (k) keys.add(String(k));
  }
  return keys;
}

async function listAllRows<T>(query: any): Promise<T[]> {
  const out: T[] = [];
  const pageSize = 1000;
  let offset = 0;
  for (; ;) {
    const { data, error } = await query.range(offset, offset + pageSize - 1);
    if (error) throw error;
    const arr = Array.isArray(data) ? data : [];
    out.push(...(arr as T[]));
    if (arr.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdminClient();
    const tableCheck = await supabase.from("pending_documents").select("id").limit(1);
    if (tableCheck.error) {
      return NextResponse.json(
        {
          ok: false,
          error: "A tabela pending_documents não está disponível no Supabase. Execute o SUPABASE_MIGRATION.sql atualizado (ou crie a tabela) e tente novamente.",
          code: tableCheck.error.code || null,
          details: tableCheck.error.message || null,
        },
        { status: 500 }
      );
    }

    let body: RebuildBody = {};
    try {
      body = (await request.json()) as RebuildBody;
    } catch {
      body = {};
    }

    const allModules = ["vistos", "turismo", "acoes_trabalhistas", "acoes_civeis", "acoes_criminais", "compra_venda_imoveis", "perda_nacionalidade"];
    const moduleTypes = (body.moduleTypes?.length ? body.moduleTypes : allModules) as string[];
    let processed = 0;

    // Limpar tabela antes de reconstruir para evitar duplicatas/órfãos
    await supabase.from("pending_documents").delete().neq("id", 0);

    for (const moduleType of moduleTypes) {
      if (moduleType === "vistos") {
        const records = await listAllRows<any>(
          supabase.from("vistos").select("*").order("id", { ascending: true })
        );

        for (const r of records) {
          const docsPrimary = await supabase.from("documents").select("*").eq("record_id", r.id).eq("module_type", "vistos");
          const docs = Array.isArray(docsPrimary.data) ? docsPrimary.data : [];

          // Combine documents table and record columns
          const uploaded = extractUploadedKeys(docs);
          const recordDocs = extractDocumentsFromRecord(r);
          recordDocs.forEach((k: string) => uploaded.add(k));

          const isTurismo = r.type === "Turismo";
          const targetModule = isTurismo ? "turismo" : "vistos";
          const requirements = isTurismo
            ? getTurismoDocRequirements()
            : getVistosDocRequirements({ type: r.type, country: r.country });

          const computed = computePendingByFlow(requirements, uploaded);
          // ... rest of the loop ...

          const { error: upsertError } = await supabase
            .from("pending_documents")
            .upsert(
              {
                module_type: targetModule,
                record_id: r.id,
                client_name: r.client_name,
                pending: computed.pending,
                missing_count: computed.missingCount,
                total_count: computed.totalCount,
                computed_at: new Date().toISOString(),
              },
              { onConflict: "module_type,record_id" }
            );
          if (upsertError) throw upsertError;
          processed += 1;
        }
      }

      // Generic handler for other modules to avoid repetition
      if (["acoes_trabalhistas", "acoes_civeis", "acoes_criminais", "compra_venda_imoveis", "perda_nacionalidade"].includes(moduleType)) {
        let tableName = moduleType;
        let getReqs: any = null;

        switch (moduleType) {
          case "acoes_trabalhistas":
            getReqs = getAcoesTrabalhistasDocRequirements;
            break;
          case "acoes_civeis":
            getReqs = getAcoesCiveisDocRequirements;
            break;
          case "acoes_criminais":
            getReqs = getAcoesCriminaisDocRequirements;
            break;
          case "compra_venda_imoveis":
            getReqs = getCompraVendaDocRequirements;
            break;
          case "perda_nacionalidade":
            getReqs = getPerdaNacionalidadeDocRequirements;
            break;
        }

        if (getReqs) {
          const records = await listAllRows<any>(
            supabase.from(tableName).select("*").order("id", { ascending: true })
          );

          for (const r of records) {
            const docsPrimary = await supabase.from("documents").select("*").eq("record_id", r.id).eq("module_type", moduleType);
            const docs = Array.isArray(docsPrimary.data) ? docsPrimary.data : [];

            const uploaded = extractUploadedKeys(docs);
            // Extract from record itself (e.g. procuracao_doc column)
            const recordDocs = extractDocumentsFromRecord(r);
            recordDocs.forEach((k: string) => uploaded.add(k));

            const requirements = getReqs();
            const computed = computePendingByFlow(requirements, uploaded);

            const { error: upsertError } = await supabase
              .from("pending_documents")
              .upsert(
                {
                  module_type: moduleType,
                  record_id: r.id,
                  client_name: r.client_name || "Cliente sem nome",
                  pending: computed.pending,
                  missing_count: computed.missingCount,
                  total_count: computed.totalCount,
                  computed_at: new Date().toISOString(),
                },
                { onConflict: "module_type,record_id" }
              );
            if (upsertError) throw upsertError;
            processed += 1;
          }
        }
      }

      if (moduleType === "turismo") {
        const records = await listAllRows<any>(
          supabase.from("turismo").select("*").order("id", { ascending: true })
        );

        for (const r of records) {
          const primary = await supabase.from("documents")
            .select("*")
            .eq("record_id", r.id)
            .in("module_type", ["vistos", "turismo"]);

          const docs = Array.isArray(primary.data) ? primary.data : [];

          const uploaded = extractUploadedKeys(docs);
          const recordDocs = extractDocumentsFromRecord(r);
          recordDocs.forEach((k: string) => uploaded.add(k));

          const requirements = getTurismoDocRequirements();
          const computed = computePendingByFlow(requirements, uploaded);

          const { error: upsertError } = await supabase
            .from("pending_documents")
            .upsert(
              {
                module_type: "turismo",
                record_id: r.id,
                client_name: r.client_name,
                pending: computed.pending,
                missing_count: computed.missingCount,
                total_count: computed.totalCount,
                computed_at: new Date().toISOString(),
              },
              { onConflict: "module_type,record_id" }
            );
          if (upsertError) throw upsertError;
          processed += 1;
        }
      }
    }

    return NextResponse.json({ ok: true, processed, moduleTypes }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erro interno",
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}
