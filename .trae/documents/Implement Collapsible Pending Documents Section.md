I will implement the collapsible functionality for the "Documentos Pendentes" section.

**Implementation Details:**
1.  **State Management**:
    -   Add a new state variable `isPendingDocsOpen` (initialized to `false`) to control the visibility of the pending documents list.

2.  **Modify Trigger (Progress Bar)**:
    -   Make the progress bar container clickable (`cursor-pointer`).
    -   Add an `onClick` handler to toggle `isPendingDocsOpen`.
    -   Add a visual indicator (Chevron icon) next to the "Progresso da Documentação" text that rotates based on the state.
    -   Add ARIA attributes: `role="button"`, `aria-expanded`, and `aria-controls`.

3.  **Modify Target (Pending Documents List)**:
    -   Wrap the "Documentos Pendentes" section (the red alert box) in a transition container using Tailwind's `grid-rows` utility for a smooth height animation.
    -   Ensure it is initially hidden (`grid-rows-[0fr]`) and expands (`grid-rows-[1fr]`) when triggered.
    -   Only apply this collapsible behavior when there are pending documents (i.e., when the red box is rendered). The success message (green box) will remain visible as immediate feedback is important there, unless implicit context suggests otherwise (but usually success is just shown). However, strict reading of "div selected" suggests the red box.

**File:** `src/app/dashboard/vistos/[id]/page.tsx`

**Imports**:
-   Ensure `ChevronDown` and `ChevronUp` are imported from `lucide-react`.