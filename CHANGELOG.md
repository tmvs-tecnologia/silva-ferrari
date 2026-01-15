# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-12

### Changed
- **Vistos Module**: Replaced "País do Visto" (Country) dropdown with "Procurador" (Proxy/Attorney) text input in the "Novo Visto" form (`/dashboard/vistos/novo`).
  - The new field is optional.
  - Validation: Accepts only letters and spaces, max 100 characters.
  - Location: Moved to "Informações do Visto" section (top).
  - Validation for "Procurador" input sanitizes numeric characters.
- **Backend API**: Updated `/api/vistos` to include `procurador` in the search query capabilities.
- **Database**: Confirmed `vistos` table schema supports nullable `country` and `procurador` columns, ensuring backward compatibility with existing records where country was populated.
- **Database**: 
  - Confirmed `vistos` table schema supports nullable `country` and `procurador` columns.
  - Added `gfip` and `gfip_doc` columns to `vistos` table.
- **Visto de Trabalho - Brasil**:
  - Added "CPF" and "RNM" upload fields to "Identificação" section.
  - Implemented file validation (PDF/JPG/PNG, max 10MB) for Passaporte, CPF, and RNM.
  - Removed "Declaração de Compreensão" and "Certidão de Nascimento" fields from "Identificação".
  - Updated "Documentos da Empresa" section:
    - Kept only: Contrato Social, CNPJ, GFIP.
    - Removed: Declarações da Empresa, Procuração, Formulário RN 01, Guia Paga, Protocolado, Publicação DOU.
    - Added "GFIP" upload field.
  - Refactored "Documentos Trabalhistas" to "Certidões do País de Origem":
    - Renamed section title for 'Trabalho:Brasil'.
    - Fields: Certidão Criminal, Certificado de Trabalho, Diploma, Certidão de Nascimento.
    - Added DB columns: `certificado_trabalho`, `certificado_trabalho_doc`.
    - Validation: All 4 fields are mandatory.
  - Refactored Section 4 to "Traduções Juramentadas":
    - Renamed section title for 'Trabalho:Brasil'.
    - Added 4 new upload fields for translated docs: Certidão Criminal, Certificado de Trabalho, Diploma, Certidão de Nascimento.
    - Added DB columns: `traducao_antecedentes_criminais`, `traducao_certificado_trabalho`, `traducao_diploma`, `traducao_certidao_nascimento` (plus `_doc` columns).
    - Validation: All 4 translation fields are mandatory.
  - Refactored Section 5 to "Procurações":
    - Renamed section title for 'Trabalho:Brasil'.
    - Removed "Diploma" (moved to Section 3) from this view.
    - Updated Labels: Removed "(Não obrigatório)" text (fields remain optional).
    - Added 4 optional upload fields:
      - Procuração Empresa
      - Procuração Empresa Assinada (New)
      - Procuração Imigrante
      - Procuração Imigrante Assinada (New)
    - Added DB columns: `procuracao_imigrante` (+doc), `procuracao_empresa_assinada` (+doc), `procuracao_imigrante_assinada` (+doc).
  - Validation: Passaporte, CPF, and RNM documents are now mandatory for this visa type.
  - Removed Section 6 "Outras Informações" for 'Trabalho:Brasil'.
    - Hidden from the form view for this specific visa type.
