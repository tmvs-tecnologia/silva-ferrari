I have identified the issue causing the "Details" page to crash.

**Problem:**
The component attempts to use the `ChevronUp` icon (for collapsing/expanding steps) but it is missing from the `lucide-react` imports. This causes a "ReferenceError: ChevronUp is not defined" which crashes the page rendering.

**Plan:**
1.  **Fix Import:** Add `ChevronUp` to the list of imports from `"lucide-react"` in `src/app/dashboard/compra-venda/[id]/page.tsx`.
2.  **Cleanup:** Remove the unused `DetailLayout` import to clean up the code.

This will resolve the crash and allow the page to open correctly.