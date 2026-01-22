import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: any
) {
  const { id } = params;
  try {
    const supabase = getSupabaseAdminClient();

    // Buscar documentos relacionados a esta ação cível
    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("module_type", "acoes_civeis")
      .eq("record_id", parseInt(id))
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar documentos:", error);
      return NextResponse.json(
        { error: "Erro ao buscar documentos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
