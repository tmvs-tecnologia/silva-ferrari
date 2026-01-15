I will modify `src/app/dashboard/vistos/[id]/page.tsx` to implement the requested changes:

1.  **Remove Mandatory Visual Indicators**: In the `DocumentRow` component, I will remove the logic that renders the red asterisk (`*`) when `required` is true. This ensures no document field appears as strictly mandatory.
2.  **Update "Pending Documents" Section**: I will modify the "Documentos Pendentes" alert block to be non-blocking and informative:
    *   Change the background color from `bg-red-50` to `bg-amber-50` (or yellow) and text color to `text-amber-800` to indicate a warning/suggestion rather than an error.
    *   Update the title to "Documentos Sugeridos (Opcional)".
    *   Add a clear message: "Você pode salvar e continuar o processo mesmo sem anexar todos os documentos listados abaixo."
3.  **Documentation**: I will add a code comment near the `docRequirements` definition explicitly stating that these requirements are for progress tracking only and do not block the save functionality.

The save logic (`handleSaveVisto`) already permits partial saving without validation checks, so no changes are needed there to "enable" saving; the UI changes will clarify this capability to the user.