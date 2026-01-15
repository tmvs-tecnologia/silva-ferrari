This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Schema Documentation

### Overview
The system is divided into modular tables to separate concerns.

### Tables

#### 1. Vistos (`vistos`)
Stores general visa processes (Work, etc.), excluding Tourism.
- **PK**: `id`
- `client_name`
- `type`
- ...

#### 2. Turismo (`turismo`)
Stores specifically Tourism visa processes.
- **PK**: `id`
- `client_name` (Required)
- `tipo_de_visto` (Required, maps to `type` in frontend)
- `data_emissao` (Date of issue/Start date)
- `data_validade` (Expiry/End date)
- `status` (Default: 'Em Andamento')
- `observacoes`
- `documentos_anexos` (JSON)
- `numero_processo`
- *Legacy fields maintained for compatibility*: `country`, `travel_start_date`, `travel_end_date`, specific document columns.

### API Documentation (Tourism)

**Endpoint:** `/api/turismo`

- **GET**: Retrieve list or single item.
  - Params:
    - `id`: (Optional) Get specific record.
    - `limit`: Records per page (default 10).
    - `offset`: Skip N records.
    - `search`: Filter by name, country, etc.
    - `status`: Filter by status.
- **POST**: Create new record.
  - Body: `{ clientName: string, ... }`
- **PUT**: Update record.
  - Params: `id`
  - Body: Fields to update.
- **DELETE**: Remove record.
  - Params: `id`

### Verification Scripts

- `scripts/verify_supabase.js`: Checks database connection and table existence.
- `scripts/test_turismo_api.js`: Integration test for CRUD operations.

### Migration Notes
- Tourism records were migrated from `vistos` to `turismo` table.
- Queries for Tourism module must target the `turismo` table.
- Queries for Vistos module generally target `vistos` table.
