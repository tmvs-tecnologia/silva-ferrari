import { 
  JurisprudenciaDecision, 
  JurisprudenciaCourt, 
  JurisprudenciaSearchResponse 
} from "@/types/jurisprudencia";

export class JurisprudenciaService {
  private static BASE_URL = "https://jurisprudencias.ai/api/v1";
  private static API_KEY = process.env.JURISPRUDENCIAS_AI_API_KEY;

  private static getHeaders() {
    return {
      "Authorization": `Bearer ${this.API_KEY}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
  }

  /**
   * Lista os tribunais disponíveis na plataforma
   */
  static async listCourts(): Promise<JurisprudenciaCourt[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/courts`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erro ao listar tribunais: ${response.statusText}`);
      }

      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.error("JurisprudenciaService.listCourts Error:", error);
      return [];
    }
  }

  /**
   * Busca decisões em um tribunal específico
   */
  static async search(
    courtId: string, 
    query: string, 
    page: number = 0, 
    limit: number = 10
  ): Promise<JurisprudenciaSearchResponse> {
    try {
      const url = new URL(`${this.BASE_URL}/courts/${courtId}/decisions`);
      url.searchParams.set("q", query);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());

      const response = await fetch(url.toString(), {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na busca: ${response.statusText}`);
      }

      const json = await response.json();
      return {
        success: true,
        data: json.data || [],
        meta: json.meta || { page, per_page: limit, has_next_page: false }
      };
    } catch (error: any) {
      console.error(`JurisprudenciaService.search (${courtId}) Error:`, error);
      return {
        success: false,
        data: [],
        meta: { page, per_page: limit, has_next_page: false },
        error: error.message
      };
    }
  }

  /**
   * Busca detalhada de um processo específico
   */
  static async lookup(courtId: string, processNumber: string): Promise<JurisprudenciaDecision | null> {
    try {
      const url = new URL(`${this.BASE_URL}/courts/${courtId}/decisions/lookup`);
      url.searchParams.set("n", processNumber);

      const response = await fetch(url.toString(), {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erro no lookup: ${response.statusText}`);
      }

      const json = await response.json();
      return json.data || null;
    } catch (error) {
      console.error("JurisprudenciaService.lookup Error:", error);
      return null;
    }
  }
}
