import { NextResponse } from "next/server";
// @ts-ignore - Supabase types will be resolved in production
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {

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