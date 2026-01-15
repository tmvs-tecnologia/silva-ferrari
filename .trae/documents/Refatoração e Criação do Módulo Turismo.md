# Refatoração do Módulo de Vistos Turismo

Este plano detalha a criação do novo módulo independente "Turismo", separado do módulo de "Vistos", mantendo a integridade dos dados e retrocompatibilidade.

## Estratégia de Implementação

Para garantir que "todos os dados históricos permaneçam acessíveis" e manter a "retrocompatibilidade" sem riscos de migração de dados complexa, utilizaremos a tabela `vistos` existente como base de dados, mas o novo módulo `Turismo` funcionará de forma independente na interface e na API, filtrando e gerenciando apenas os registros do tipo "Visto de Turismo".

## Passos da Implementação

### 1. Criação da Estrutura do Frontend (`src/app/dashboard/turismo`)

Criaremos uma nova estrutura de pastas espelhando o módulo de Vistos, mas simplificada para Turismo.

* **Listagem (`page.tsx`)**:

  * Clonar `src/app/dashboard/vistos/page.tsx`.

  * Fixar o filtro de busca para exibir apenas registros onde `type === 'Visto de Turismo'`.

  * Remover filtros de tipo da interface (já que será exclusivo para Turismo).

* **Formulário de Criação (`novo/page.tsx`)**:

  * Clonar `src/app/dashboard/vistos/novo/page.tsx`.

  * Remover a lógica condicional para outros tipos de visto (Trabalho, Estudante, etc.).

  * Fixar o campo oculto `type` como "Visto de Turismo".

  * Manter todas as validações e campos existentes pertinentes a Turismo.

* **Detalhes do Processo (`[id]/page.tsx`)**:

  * Clonar `src/app/dashboard/vistos/[id]/page.tsx`.

  * Adaptar para exibir apenas os workflows e etapas de Turismo.

### 2. Criação da API Dedicada (`src/app/api/turismo/route.ts`)

Criaremos uma rota de API específica para isolar a lógica de negócio.

* **GET**: Retornará apenas registros da tabela `vistos` onde `type = 'Visto de Turismo'`.

* **POST**: Criará novos registros na tabela `vistos` forçando `type = 'Visto de Turismo'`, ignorando qualquer outro tipo enviado.

* **PUT/DELETE**: Manterão a lógica existente, garantindo segurança.

### 3. Integração na Navegação (`src/app/dashboard/layout.tsx`)

* Adicionar o item "Turismo" no menu lateral (`Sidebar`), posicionado logo abaixo de "Vistos".

* Configurar o ícone e a descrição conforme o padrão do sistema.

### 4. Ajustes no Banco de Dados (Supabase)

* **Não será necessário criar nova tabela**: Reutilizaremos a tabela `vistos` para garantir integridade e acesso imediato ao histórico.

* **Migração**: Não haverá necessidade de scripts de migração arriscados, pois os dados já residem na tabela correta. O sistema apenas passará a acessá-los por uma "porta" dedicada.

## Validação

* Verificar se novos processos criados no módulo "Turismo" aparecem corretamente.

* Confirmar se processos antigos de "Visto de Turismo" são listados no novo módulo.

* Garantir que o módulo "Vistos" continue funcionando para os outros tipos.

