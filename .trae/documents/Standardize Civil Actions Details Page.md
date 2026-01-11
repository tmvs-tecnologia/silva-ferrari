I will standardize the **Civil Actions Details Page** (`src/app/dashboard/acoes-civeis/[id]/page.tsx`) to match the **Visa Details Page** exactly, while preserving all Civil Actions business logic.

### 1. Layout & Grid Standardization
- **Structure:** Adopt the exact `grid-cols-12` layout with `col-span-8` (Left) and `col-span-4` (Right).
- **Vertical Alignment:** Enforce `min-h-[560px]` and Flexbox properties on the right column to ensure the "Notes" card expands to fill available space, matching the visual balance of the reference page.
- **Components:** Re-implement the Right Column to strictly follow the order: `StatusPanel` → `Notes Card` (Flexible Height) → `Responsibles Card`.

### 2. Notes System Implementation (Porting from Vistos)
- **Data Structure:** Switch from simple string notes to the **JSON-based History System** used in Vistos (`[{ id, content, timestamp, author }]`).
- **Functionality:**
    - Implement `parseNotesArray` to handle the history.
    - Implement `saveStepNotes` to append new notes with automatic timestamps and author tagging (e.g., "Advogado - Fábio Ferrari").
    - Implement `deleteNote` to allow removing entries.
- **UI Components:**
    - Add the **Notes Modal** (Dialog) to view the full timeline of observations.
    - Update the "Observações" Card to include the "View All" button and match the specific styling (Textarea + Save Button positioning).

### 3. Civil Actions Logic Preservation
- **Workflows:** Keep the `WORKFLOWS` constant intact (Exame DNA, Usucapião, etc.).
- **Specific Fields:** Preserve all inputs for `nomeMae`, `dnaExamDate`, `localExameDna`, etc.
- **Step Content:** Wrap the existing form fields for Civil Actions inside the new layout structure, ensuring they function exactly as before but look consistent with the new design container.

### 4. Code Refactoring
- Consolidate state management to match the reference patterns.
- Ensure all Lucide icons (`CheckCircle`, `FileText`, `Mail`, etc.) are imported and used consistently.
