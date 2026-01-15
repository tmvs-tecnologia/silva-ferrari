# Recriar Fluxo de Protocolo (Passo 2)

## 1. Analisar Estrutura Atual
- O passo 2 ("Protocolo") já está parcialmente implementado, mas precisa ser ajustado para corresponder exatamente ao layout de "Cadastro de Documentos" e garantir funcionalidade robusta.
- A função auxiliar `renderRow` já foi movida para o escopo principal, permitindo reutilização segura.
- O componente `Header` também está disponível.

## 2. Ajustar Implementação do Passo 2
- Localizar o `case 2` dentro de `renderVistoTrabalhoStepContent` em `src/app/dashboard/vistos/[id]/page.tsx`.
- Refatorar o retorno para usar a estrutura padrão de cards e headers, similar ao `case 0` (Cadastro de Documentos).
- **Campos Solicitados:**
    1.  **Comprovante Protocolo (Upload):** Utilizar `renderRow(stepId, "Comprovante Protocolo", undefined, "comprovanteProtocolo")`.
    2.  **Número do Processo (Input):** Utilizar `renderRow(stepId, "Número do Processo", "numeroProcesso", undefined)`.
- **Layout:**
    - Container principal: `bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden` (já fornecido pelo `Header` + container).
    - Grid: `grid grid-cols-1 md:grid-cols-2 gap-6 p-6`.

## 3. Garantir Consistência e Validação
- O uso de `renderRow` garante automaticamente a consistência visual (componente `DocumentRow` padronizado).
- A validação de "obrigatório" pode ser adicionada passando `true` como último argumento de `renderRow` se necessário (o usuário pediu "Implementar validações de campos obrigatórios", então farei isso).
- O upload já suporta formatos e limites definidos na lógica de `handleSpecificFileUpload` (que deve ser verificada se atende aos 10MB, caso contrário, ajustaremos).

## 4. Plano de Código
```tsx
case 2: // Protocolo
  if ((caseData?.type as string) === "Visto de Trabalho - Brasil") {
    return (
      <div className="space-y-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <Header title="Protocolo" />
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo 1: Comprovante de Protocolo (Upload) - Obrigatório */}
            {renderRow(stepId, "Comprovante de Protocolo", undefined, "comprovanteProtocolo", undefined, true)}
            
            {/* Campo 2: Número do Processo (Input) - Obrigatório */}
            {renderRow(stepId, "Número do Processo", "numeroProcesso", undefined, undefined, true)}
          </div>
        </div>
      </div>
    );
  }
  // ... fallback
```
