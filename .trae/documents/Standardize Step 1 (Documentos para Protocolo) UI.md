I will update the "Documentos para Protocolo" step (Step 1) in the Visto de Trabalho - Brasil workflow to match the standardized design system used in Steps 3 and 4.

**Implementation Details:**
- File: `src/app/dashboard/vistos/[id]/page.tsx`
- Location: `case 1` block inside `renderVistoTrabalhoStepContent` function.
- **Changes:**
    - Wrap the content in the standard container: `<div className="space-y-8 pb-8">` and `<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">`.
    - Add the standard `<Header title="Documentos para Protocolo" />` component to enable "Edit" mode toggling.
    - Organize fields into a responsive grid: `<div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">`.
    - Update all `renderRow` calls to include the `stepId` parameter, ensuring they work correctly with the editing logic.
    - Preserve all existing fields (Formulário RN01, Declarações, Contratos, GRU, I1-I6 documents, etc.) and their tooltips.

This ensures Step 1 has the same visual style (card layout, spacing, typography) and functionality (edit mode, file management) as the recently updated steps.