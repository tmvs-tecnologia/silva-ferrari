const fs = require("node:fs");

function getProjectRefFromUrl(url) {
  const hostname = new URL(url).hostname;
  return hostname.split(".")[0];
}

async function main() {
  require("dotenv").config({ path: ".env" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não está configurada no .env");
  }

  const managementToken = process.env.SUPABASE_MANAGEMENT_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;
  if (!managementToken) {
    throw new Error(
      "Falta SUPABASE_MANAGEMENT_TOKEN (Personal Access Token) no .env. Crie em Supabase Dashboard > Account > Access Tokens."
    );
  }

  const projectRef = getProjectRefFromUrl(supabaseUrl);

  const sql = `
CREATE TABLE IF NOT EXISTS public.pending_documents (
  id BIGSERIAL PRIMARY KEY,
  module_type VARCHAR(100) NOT NULL,
  record_id BIGINT NOT NULL,
  client_name VARCHAR(500) NOT NULL,
  pending JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_type, record_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_documents_module_type ON public.pending_documents(module_type);
CREATE INDEX IF NOT EXISTS idx_pending_documents_record_id ON public.pending_documents(record_id);
CREATE INDEX IF NOT EXISTS idx_pending_documents_client_name ON public.pending_documents(client_name);
CREATE INDEX IF NOT EXISTS idx_pending_documents_updated_at ON public.pending_documents(updated_at DESC);

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'update_updated_at_column' AND n.nspname = 'public'
  ) THEN
    EXECUTE $func$
      CREATE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    $func$;
  END IF;
END
$block$;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_pending_documents_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_pending_documents_updated_at BEFORE UPDATE ON public.pending_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();';
  END IF;
END
$block$;
`.trim();

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${managementToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Falha ao executar SQL no Supabase (${res.status}): ${bodyText}`);
  }

  fs.writeFileSync("scripts/.last_supabase_query_result.json", bodyText, "utf8");
  process.stdout.write("OK: tabela pending_documents criada/garantida no Supabase.\n");
}

main().catch((err) => {
  process.stderr.write(String(err?.message || err) + "\n");
  process.exit(1);
});

