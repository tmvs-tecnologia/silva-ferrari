import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import { computePendingByFlow, getTurismoDocRequirements, getVistosDocRequirements } from "@/lib/pending-documents";

export const runtime = "nodejs";

type RebuildBody = {
  moduleTypes?: Array<"vistos" | "turismo">;
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
  for (;;) {
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

    const moduleTypes = (body.moduleTypes?.length ? body.moduleTypes : ["vistos", "turismo"]) as Array<"vistos" | "turismo">;
    let processed = 0;

    for (const moduleType of moduleTypes) {
      if (moduleType === "vistos") {
        const records = await listAllRows<{ id: number; client_name: string; type: string; country?: string }>(
          supabase.from("vistos").select("id, client_name, type, country").order("id", { ascending: true })
        );

        for (const r of records) {
          const docsPrimary = await supabase.from("documents").select("*").eq("record_id", r.id).eq("module_type", "vistos");
          const docsFallback = docsPrimary.error ? null : docsPrimary.data;
          const docs = Array.isArray(docsFallback) ? docsFallback : [];
          const uploaded = extractUploadedKeys(docs);
          const requirements = getVistosDocRequirements({ type: r.type, country: r.country });
          const computed = computePendingByFlow(requirements, uploaded);

          const { error: upsertError } = await supabase
            .from("pending_documents")
            .upsert(
              {
                module_type: "vistos",
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

      if (moduleType === "turismo") {
        const records = await listAllRows<{ id: number; client_name: string; tipo_de_visto: string }>(
          supabase.from("turismo").select("id, client_name, tipo_de_visto").order("id", { ascending: true })
        );

        for (const r of records) {
          const primary = await supabase.from("documents").select("*").eq("record_id", r.id).eq("module_type", "vistos");
          let docs = Array.isArray(primary.data) ? primary.data : [];

          if ((!docs || docs.length === 0) && !primary.error) {
            const fallback = await supabase.from("documents").select("*").eq("record_id", r.id).eq("module_type", "turismo");
            docs = Array.isArray(fallback.data) ? fallback.data : docs;
          }

          const uploaded = extractUploadedKeys(docs);
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
