// Funções de prefetch para cada módulo do sistema

export const prefetchAcoesTrabalhistas = async () => {
  try {
    const response = await fetch("/api/acoes-trabalhistas?limit=100");
    if (!response.ok) {
      console.warn(`Failed to prefetch Ações Trabalhistas: HTTP ${response.status}`);
      return [];
    }
    const text = await response.text();
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.warn("Failed to prefetch Ações Trabalhistas:", error);
    return [];
  }
};

export const prefetchAcoesCiveis = async () => {
  try {
    const response = await fetch("/api/acoes-civeis?limit=100");
    if (!response.ok) {
      console.warn(`Failed to prefetch Ações Cíveis: HTTP ${response.status}`);
      return [];
    }
    const text = await response.text();
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.warn("Failed to prefetch Ações Cíveis:", error);
    return [];
  }
};

export const prefetchAcoesCriminais = async () => {
  try {
    const response = await fetch("/api/acoes-criminais?limit=100");
    if (!response.ok) {
      console.warn(`Failed to prefetch Ações Criminais: HTTP ${response.status}`);
      return [];
    }
    const text = await response.text();
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.warn("Failed to prefetch Ações Criminais:", error);
    return [];
  }
};

export const prefetchCompraVenda = async () => {
  try {
    const response = await fetch("/api/compra-venda-imoveis?limit=100");
    if (!response.ok) {
      console.warn(`Failed to prefetch Compra e Venda: HTTP ${response.status}`);
      return [];
    }
    const text = await response.text();
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.warn("Failed to prefetch Compra e Venda:", error);
    return [];
  }
};

export const prefetchPerdaNacionalidade = async () => {
  try {
    const response = await fetch("/api/perda-nacionalidade?limit=100");
    if (!response.ok) {
      console.warn(`Failed to prefetch Perda de Nacionalidade: HTTP ${response.status}`);
      return [];
    }
    const text = await response.text();
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.warn("Failed to prefetch Perda de Nacionalidade:", error);
    return [];
  }
};

export const prefetchVistos = async () => {
  try {
    const response = await fetch("/api/vistos?limit=100");
    if (!response.ok) {
      console.warn(`Failed to prefetch Vistos: HTTP ${response.status}`);
      return [];
    }
    const text = await response.text();
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.warn("Failed to prefetch Vistos:", error);
    return [];
  }
};

export const prefetchDashboard = async () => {
  try {
    // Prefetch de dados do dashboard (estatísticas, notificações, etc.)
    const responses = await Promise.allSettled([
      fetch("/api/dashboard/stats"),
      fetch("/api/notifications/unread"),
      fetch("/api/recent-activities")
    ]);
    
    const parseResponse = async (response: Response) => {
      if (!response.ok) return null;
      const text = await response.text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };
    
    return {
      stats: responses[0].status === 'fulfilled' ? await parseResponse(responses[0].value) : {},
      notifications: responses[1].status === 'fulfilled' ? await parseResponse(responses[1].value) : [],
      activities: responses[2].status === 'fulfilled' ? await parseResponse(responses[2].value) : []
    };
  } catch (error) {
    console.warn("Failed to prefetch Dashboard:", error);
    return { stats: {}, notifications: [], activities: [] };
  }
};

// Funções de prefetch para páginas de detalhes individuais
export const prefetchAcaoTrabalhistaById = async (id: string) => {
  try {
    const response = await fetch(`/api/acoes-trabalhistas/${id}`);
    if (!response.ok) {
      console.warn(`Failed to prefetch Ação Trabalhista ${id}: HTTP ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (!text) {
      console.warn(`Empty response for Ação Trabalhista ${id}`);
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.warn(`Failed to prefetch Ação Trabalhista ${id}:`, error);
    return null;
  }
};

export const prefetchAcaoCivilById = async (id: string) => {
  try {
    const response = await fetch(`/api/acoes-civeis/${id}`);
    if (!response.ok) {
      console.warn(`Failed to prefetch Ação Civil ${id}: HTTP ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (!text) {
      console.warn(`Empty response for Ação Civil ${id}`);
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.warn(`Failed to prefetch Ação Civil ${id}:`, error);
    return null;
  }
};

export const prefetchAcaoCriminalById = async (id: string) => {
  try {
    const response = await fetch(`/api/acoes-criminais/${id}`);
    if (!response.ok) {
      console.warn(`Failed to prefetch Ação Criminal ${id}: HTTP ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (!text) {
      console.warn(`Empty response for Ação Criminal ${id}`);
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.warn(`Failed to prefetch Ação Criminal ${id}:`, error);
    return null;
  }
};

export const prefetchCompraVendaById = async (id: string) => {
  try {
    const response = await fetch(`/api/compra-venda/${id}`);
    if (!response.ok) {
      console.warn(`Failed to prefetch Compra e Venda ${id}: HTTP ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (!text) {
      console.warn(`Empty response for Compra e Venda ${id}`);
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.warn(`Failed to prefetch Compra e Venda ${id}:`, error);
    return null;
  }
};

export const prefetchPerdaNacionalidadeById = async (id: string) => {
  try {
    const response = await fetch(`/api/perda-nacionalidade/${id}`);
    if (!response.ok) {
      console.warn(`Failed to prefetch Perda de Nacionalidade ${id}: HTTP ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (!text) {
      console.warn(`Empty response for Perda de Nacionalidade ${id}`);
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.warn(`Failed to prefetch Perda de Nacionalidade ${id}:`, error);
    return null;
  }
};

export const prefetchVistoById = async (id: string) => {
  try {
    const response = await fetch(`/api/vistos/${id}`);
    if (!response.ok) {
      console.warn(`Failed to prefetch Visto ${id}: HTTP ${response.status}`);
      return null;
    }
    const text = await response.text();
    if (!text) {
      console.warn(`Empty response for Visto ${id}`);
      return null;
    }
    return JSON.parse(text);
  } catch (error) {
    console.warn(`Failed to prefetch Visto ${id}:`, error);
    return null;
  }
};