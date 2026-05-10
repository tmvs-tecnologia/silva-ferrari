export interface GazetteItem {
  territory_id: string;
  date: string;
  scraped_at: string;
  url: string;
  territory_name: string;
  state_code: string;
  excerpts: string[];
  edition: string | null;
  is_extra_edition: boolean | null;
  txt_url: string | null;
}

export interface GazetteSearchResponse {
  total_gazettes: number;
  gazettes: GazetteItem[];
}

export interface Territory {
  territory_id: string;
  territory_name: string;
  state_code: string;
}

export class QueridoDiarioService {
  private static BASE_URL = 'https://api.queridodiario.ok.org.br';

  static async search(query: string, page: number = 0, size: number = 10, territoryId?: string): Promise<{ success: boolean; data?: GazetteSearchResponse; error?: string }> {
    try {
      const offset = page * size;
      let url = `${this.BASE_URL}/gazettes?querystring=${encodeURIComponent(query)}&size=${size}&offset=${offset}&sort_by=descending_date`;

      if (territoryId) {
        url += `&territory_ids=${territoryId}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro na API Querido Diário: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro desconhecido ao acessar Querido Diário" };
    }
  }

  static async searchTerritories(name: string): Promise<{ success: boolean; data?: Territory[]; error?: string }> {
    try {
      const url = `${this.BASE_URL}/cities?name=${encodeURIComponent(name)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar territórios: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data: data.cities };
    } catch (error: any) {
      console.error("Erro ao buscar territórios:", error);
      return { success: false, error: error.message };
    }
  }
}
