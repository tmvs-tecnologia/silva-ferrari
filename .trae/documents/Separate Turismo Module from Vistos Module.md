I will implement the strict separation between the "Turismo" and "Vistos" modules as requested.

### 1. API Changes (Backend)

*   **`src/app/api/vistos/route.ts`**:
    *   **GET**: Modify the query to explicitly exclude tourism records using `.neq('type', 'Turismo')`.
    *   **POST**: Add validation to reject creation of "Turismo" records via this endpoint (return 400 if type is Turismo).
*   **`src/app/api/turismo/route.ts`**:
    *   **POST**: Correct the forced type from `"Visto de Turismo"` to `"Turismo"` to match the database convention and the GET filter.
    *   **GET**: Ensure it strictly filters for `.eq('type', 'Turismo')` (already present, but verifying consistency).
*   **`src/app/api/processos/count/route.ts`**:
    *   Update the counting logic to split the `vistos` table count.
    *   `vistos`: Count where `type != 'Turismo'`.
    *   `turismo`: Count where `type = 'Turismo'`.

### 2. Vistos Frontend Changes

*   **`src/app/dashboard/vistos/novo/page.tsx` (Creation Form)**:
    *   Remove the "Turismo" option from the "Tipo de Visto" dropdown `<Select>`.
    *   Remove the conditional rendering block for "Período da Viagem" (specific to Turismo).
    *   Remove "Turismo" specific document sections (like "Roteiro de Viagem", "Reservas", etc.) from the conditional rendering logic to clean up the interface.
*   **`src/app/dashboard/vistos/page.tsx` (List/Dashboard)**:
    *   Remove "Turismo" from the "Tipo de Visto" filter dropdown.
    *   Remove any Turismo-specific icons or logic from the list view (if any remain that are exclusive to Turismo).

### 3. Turismo Frontend Changes

*   **`src/app/dashboard/turismo/page.tsx`**:
    *   Ensure the list is fetching from `/api/turismo` (already implemented).
    *   Verify filters are appropriate for Turismo.

### 4. Verification

*   Create a new Visto and verify "Turismo" is not an option.
*   Check the Vistos list to ensure no Turismo records appear.
*   Check the Turismo list to ensure only Turismo records appear.
*   Check the global counters to ensure numbers are correct and separated.
