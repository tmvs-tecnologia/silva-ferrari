I will implement the requested changes to separate the "Turismo" module into its own database table and schema.

### 1. Database Schema Changes (`src/db/schema.ts`)
*   Create a new table definition `turismo` using Drizzle ORM.
*   **Structure**:
    *   **Mandatory**: `id` (PK), `tipo_de_visto` (mapped from `type`), `data_emissao`, `data_validade`, `status`, `client_name` (essential).
    *   **Optional**: `observacoes` (mapped from `notes`), `documentos_anexos` (new JSON field), `numero_processo`.
    *   **Legacy Support**: I will retain the specific document columns (e.g., `passaporte_doc`) from the `vistos` structure to ensure the existing file upload system and data remain accessible without a complex file migration strategy right now.
    *   **Mapping**:
        *   `type` (vistos) -> `tipo_de_visto` (turismo)
        *   `notes` (vistos) -> `observacoes` (turismo)
        *   `travel_start_date` (vistos) -> `data_emissao` (initial mapping)
        *   `travel_end_date` (vistos) -> `data_validade` (initial mapping)

### 2. Migration Strategy
*   I will create a SQL migration file (`drizzle/0099_migrate_turismo.sql`) that:
    1.  Creates the `turismo` table.
    2.  Migrates data from `vistos` to `turismo` using `INSERT INTO ... SELECT`, mapping the columns as decided.
    3.  Deletes the migrated records from `vistos`.
*   I will execute this migration using a temporary API route (`src/app/api/admin/run-migration/route.ts`) to leverage the existing database connection and environment variables.

### 3. API Updates
*   **`src/app/api/turismo/route.ts`**:
    *   Update `GET`, `POST`, `PUT`, `DELETE` handlers to interact with the new `turismo` table.
    *   Update the `mapVistosDbFieldsToFrontend` helper (rename to `mapTurismoDbFieldsToFrontend`) to map the new DB column names (`tipo_de_visto`, `data_emissao`, etc.) to the frontend expected camelCase fields (`type`, `travelStartDate`, etc.) to maintain frontend compatibility.
*   **`src/app/api/processos/count/route.ts`**:
    *   Update the counting logic to query the `turismo` table directly instead of filtering `vistos`.

### 4. Verification & Documentation
*   Verify that `vistos` endpoints no longer need to filter out 'Turismo' (as the data is gone).
*   Verify that new Tourism records are saved to the `turismo` table.
*   Update `README.md` with the new schema diagram and instructions.

### 5. Frontend
*   No major frontend changes should be required if I map the API response correctly, preserving the user interface while changing the backend storage.

This plan ensures data integrity, strict separation, and compliance with the user's requested structure.