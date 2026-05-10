import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import { LexmlDocument, LexmlMetadata, LexmlSearchResponse } from "@/types/lexml";

export class LexmlService {
  private static SRU_ENDPOINT = "https://www.lexml.gov.br/busca/SRU";
  private static URN_BASE_URL = "https://www.lexml.gov.br/urn/";

  /**
   * Realiza uma busca no acervo LexML via protocolo SRU (Search/Retrieval via URL)
   */
  static async search(query: string, start: number = 1, limit: number = 10): Promise<LexmlSearchResponse> {
    try {
      const url = new URL(this.SRU_ENDPOINT);
      url.searchParams.set("operation", "searchRetrieve");
      url.searchParams.set("version", "1.1");
      url.searchParams.set("query", query);
      url.searchParams.set("startRecord", start.toString());
      url.searchParams.set("maximumRecords", limit.toString());

      const response = await fetch(url.toString(), {
        headers: {
          "Accept": "application/xml",
          "User-Agent": "SilvaFerrari-LegalSystem/1.0"
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao consultar LexML SRU: ${response.statusText}`);
      }

      const xmlData = await response.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
      });
      const jsonObj = parser.parse(xmlData);

      const sruResponse = jsonObj["zs:searchRetrieveResponse"];
      if (!sruResponse) {
        return { success: true, totalResults: 0, results: [] };
      }

      const totalResults = parseInt(sruResponse["zs:numberOfRecords"] || "0");
      const records = sruResponse["zs:records"]?.["zs:record"] || [];
      
      // Normalizar registros (pode vir como objeto se for apenas um)
      const recordsArray = Array.isArray(records) ? records : [records];

      const results: LexmlDocument[] = recordsArray.map((rec: any) => {
        const data = rec["zs:recordData"];
        // O LexML costuma devolver o conteúdo dentro de tags customizadas ou dublin core
        // Dependendo da configuração do SRU. Vamos tentar extrair campos comuns.
        
        // Se houver metadados lexml:lexml
        const lexml = data?.["lexml:lexml"] || data?.["lexml"] || {};
        
        return {
          id: rec["zs:recordIdentifier"] || "",
          urn: lexml["lexml:urn"] || lexml["urn"] || "",
          title: lexml["lexml:titulo"] || lexml["titulo"] || "Documento sem título",
          description: lexml["lexml:ementa"] || lexml["ementa"] || "",
          date: lexml["lexml:data"] || lexml["data"] || "",
          source: lexml["lexml:autoridade"] || lexml["autoridade"] || "",
          type: lexml["lexml:tipo"] || lexml["tipo"] || "",
          url: lexml["lexml:urn"] ? `${this.URN_BASE_URL}${lexml["lexml:urn"]}` : ""
        };
      });

      return {
        success: true,
        totalResults,
        results
      };
    } catch (error: any) {
      console.error("LexmlService Search Error:", error);
      return {
        success: false,
        totalResults: 0,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Extrai metadados estruturados (JSON-LD) da página de uma URN
   */
  static async getMetadata(urn: string): Promise<LexmlMetadata | null> {
    try {
      const url = `${this.URN_BASE_URL}${urn}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SilvaFerrari-LegalSystem/1.0"
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao acessar URN ${urn}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const jsonLdScript = $('script[type="application/ld+json"]').html();

      if (!jsonLdScript) {
        return { urn };
      }

      const data = JSON.parse(jsonLdScript);
      
      // Mapear campos do Schema.org para nossa interface
      return {
        urn,
        title: data.name || data.headline,
        description: data.description || data.abstract,
        datePublished: data.datePublished,
        author: data.author?.name || data.author,
        publisher: data.publisher?.name || data.publisher,
        keywords: Array.isArray(data.keywords) ? data.keywords : data.keywords?.split(","),
        format: data.encodingFormat,
        language: data.inLanguage,
        rawJsonLd: data
      };
    } catch (error) {
      console.error("LexmlService Metadata Error:", error);
      return null;
    }
  }
}
