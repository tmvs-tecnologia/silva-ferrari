// Funções de prefetch para cada módulo do sistema

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isAbortError = (e: any) => !!e && (e.name === "AbortError" || (typeof e.message === "string" && e.message.toLowerCase().includes("aborted")));
const shouldRetryStatus = (s: number) => s === 429 || (s >= 500 && s <= 599);

async function fetchWithRetry(url: string, init?: RequestInit, retries = 2, backoffMs = 200) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok && shouldRetryStatus(res.status) && attempt < retries) {
        await sleep(backoffMs * Math.pow(2, attempt));
        attempt++;
        continue;
      }
      return res;
    } catch (err: any) {
      if (isAbortError(err)) {
        // Do not retry on abort (navigation or timeout)
        return null;
      }
      if (attempt < retries) {
        await sleep(backoffMs * Math.pow(2, attempt));
        attempt++;
        continue;
      }
      return null;
    }
  }
  return null;
}

async function safeJson(res: Response | null, fallback: any) {
  if (!res || !res.ok) return fallback;
  const text = await res.text();
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export const prefetchAcoesCiveis = async () => {
  const columns = 'id,client_name,type,status,current_step,notes,created_at,updated_at';
  const res = await fetchWithRetry(`/api/acoes-civeis?limit=100&select=${columns}`);
  return await safeJson(res, []);
};

export const prefetchAcoesTrabalhistas = async () => {
  const columns = 'id,client_name,current_step,status,notes,responsavel_name,responsavel_date,numero_processo,reu_name';
  const res = await fetchWithRetry(`/api/acoes-trabalhistas?limit=100&select=${columns}`);
  return await safeJson(res, []);
};

export const prefetchAcoesCriminais = async () => {
  const columns = 'id,client_name,status,responsavel_name,responsavel_date,numero_processo,reu_name,notes';
  const res = await fetchWithRetry(`/api/acoes-criminais?limit=100&select=${columns}`);
  return await safeJson(res, []);
};

export const prefetchCompraVenda = async () => {
  const columns = 'id,client_name,status,current_step,endereco_imovel,prazo_sinal,prazo_escritura,contract_notes,rg_vendedores,rg_vendedores_doc,cpf_comprador,rnm_comprador';
  const res = await fetchWithRetry(`/api/compra-venda-imoveis?limit=100&select=${columns}`);
  return await safeJson(res, []);
};

export const prefetchPerdaNacionalidade = async () => {
  const columns = 'id,client_name,status,current_step,notes,created_at';
  const res = await fetchWithRetry(`/api/perda-nacionalidade?limit=100&select=${columns}`);
  return await safeJson(res, []);
};

export const prefetchVistos = async () => {
  const columns = 'id,client_name,type,status,created_at,current_step,completed_steps,country,travel_start_date,travel_end_date,status_final,status_final_outro,step_data';
  const res = await fetchWithRetry(`/api/vistos?limit=100&select=${columns}`);
  return await safeJson(res, []);
};

export const prefetchTurismo = async () => {
  const columns = 'id,client_name,status,current_step,country,travel_start_date,travel_end_date,status_final,status_final_outro,created_at';
  const res = await fetchWithRetry(`/api/turismo?limit=20&offset=0&select=${columns}`);
  return await safeJson(res, []);
};

export const prefetchDashboard = async () => {
  try {
    const res = await fetchWithRetry("/api/processos/count");
    return await safeJson(res, { total: 0, byTable: {} });
  } catch {
    return { total: 0, byTable: {} };
  }
};

// Funções de prefetch para páginas de detalhes individuais
export const prefetchAcaoTrabalhistaById = async (id: string) => {
  const res = await fetchWithRetry(`/api/acoes-trabalhistas/${id}`);
  return await safeJson(res, null);
};

export const prefetchAcaoCivilById = async (id: string) => {
  const res = await fetchWithRetry(`/api/acoes-civeis/${id}`);
  return await safeJson(res, null);
};

export const prefetchAcaoCriminalById = async (id: string) => {
  const res = await fetchWithRetry(`/api/acoes-criminais/${id}`);
  return await safeJson(res, null);
};

export const prefetchCompraVendaById = async (id: string) => {
  const res = await fetchWithRetry(`/api/compra-venda-imoveis?id=${id}`);
  return await safeJson(res, null);
};

export const prefetchPerdaNacionalidadeById = async (id: string) => {
  const res = await fetchWithRetry(`/api/perda-nacionalidade?id=${id}`);
  return await safeJson(res, null);
};

export const prefetchVistoById = async (id: string) => {
  const res = await fetchWithRetry(`/api/vistos/${id}`);
  return await safeJson(res, null);
};

export const prefetchTurismoById = async (id: string) => {
  const res = await fetchWithRetry(`/api/turismo?id=${id}`);
  return await safeJson(res, null);
};
