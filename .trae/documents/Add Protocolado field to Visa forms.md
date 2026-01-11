I will implement the "Protocolado" field (with upload capability) for the specified Visa forms in both the creation and details pages.

**1. Create New Visa Page (`src/app/dashboard/vistos/novo/page.tsx`)**
I will add the `DocumentRow` for "Protocolado" to the "Documentos da Empresa" section (or equivalent) for the following visa types:
- **Trabalho - Brasil**: Add to the "Documentos da Empresa" section.
- **Trabalho - Residência Prévia**: Add to the "Documentos da Empresa" section.
- **Trabalho - Renovação 1 ano**: Add to the "Documentos da Empresa" section.
- **Trabalho - Indeterminado**: Add to the "Documentos da Empresa" section.
- **Trabalho - Mudança de Empregador**: Add to the "Documentos da Empresa" section.

**2. Visa Details Page (`src/app/dashboard/vistos/[id]/page.tsx`)**
I will add the `renderField` call for "Protocolado" to the relevant display blocks for the same visa types:
- **Trabalho - Brasil**: Add to the "Documentos da Empresa" block.
- **Trabalho - Residência Prévia**: Add to the existing grid.
- **Trabalho - Renovação 1 ano**: Add to the existing grid.
- **Trabalho - Indeterminado**: Add to the existing grid.
- **Trabalho - Mudança de Empregador**: Add to the shared "Trabalhistas" grid.

**Database Sync**:
The `vistos` table already contains the `protocolado` and `protocoladoDoc` columns, so no database migration is required. The changes in the frontend will automatically use these existing columns.