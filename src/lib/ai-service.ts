export interface AIAnalysisResult {
  label: string;
  summary: string;
  mention?: string;
}

export class AIService {
  private static API_URL = process.env.OLLAMA_API_URL || 'http://185.173.110.54:11434';
  private static MODEL = process.env.AI_MODEL_NAME || 'minimax';

  static async analyzeGazetteExcerpt(text: string, searchTerm?: string): Promise<AIAnalysisResult | null> {
    // Lista de modelos na ordem de tentativa (baseado no seu ollama list)
    const modelsToTry = [this.MODEL, 'phi3:mini', 'phi:latest', 'tinyllama:latest'];
    let lastError = null;

    for (const model of modelsToTry) {
      if (!model || model === 'minimax') continue; // Pula se for o nome genérico

      try {
        console.log(`[IA] Tentando análise com modelo: ${model}...`);
        
        const prompt = `Você é um assistente jurídico especializado. 
Analise o trecho do Diário Oficial e responda APENAS com um JSON.

INSTRUÇÕES:
1. 'label': Categoria em maiúsculas (ex: [LICITAÇÃO], [RH/PESSOAL]).
2. 'summary': Resumo curto de uma frase.
3. 'mention': ${searchTerm ? `O trecho exato onde aparece "${searchTerm}".` : 'O trecho mais relevante.'}

TRECHO:
"""
${text}
"""

Responda seguindo exatamente este formato JSON:
{"label": "...", "summary": "...", "mention": "..."}`;

        const response = await fetch(`${this.API_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false,
            // Removido format: 'json' temporariamente para maior compatibilidade
            options: { 
              temperature: 0.1,
              num_predict: 500
            }
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro Ollama (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const content = data.response;

        // Tenta extrair o JSON da resposta (caso venha com lixo em volta)
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
              label: result.label || '[ANALISADO]',
              summary: result.summary || 'Resumo indisponível.',
              mention: result.mention
            };
          }
          throw new Error("JSON não encontrado na resposta");
        } catch (e) {
          console.error(`[IA] Erro ao processar resposta do modelo ${model}:`, content);
          continue;
        }

      } catch (error: any) {
        lastError = error;
        console.warn(`[IA] Falha com modelo ${model}:`, error.message);
      }
    }

    console.error('[IA] Todos os modelos falharam ou VPS inacessível:', lastError?.message);
    return null;
  }
}
