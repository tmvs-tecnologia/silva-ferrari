I will fix the crash by adding the missing icon imports in `src/app/dashboard/vistos/[id]/page.tsx`.

1.  **Update Imports**: Add `ChevronUp` and `ChevronDown` to the `lucide-react` import statement.
    *   **Current**: `import { ..., ChevronRight, ... } from "lucide-react";`
    *   **Change**: `import { ..., ChevronRight, ChevronUp, ChevronDown, ... } from "lucide-react";`

This will resolve the `ReferenceError` causing the "Algo deu errado" screen.