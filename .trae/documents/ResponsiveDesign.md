# Padrões de Design Responsivo - Sistema Jurídico Integrado

Este documento detalha os padrões adotados para garantir que a interface do sistema seja acessível, funcional e esteticamente consistente em dispositivos móveis, tablets e desktops.

## 1. Breakpoints e Layout

Utilizamos a abordagem **Mobile-First** com Tailwind CSS. O layout base é projetado para telas pequenas e expandido para telas maiores.

| Breakpoint | Prefixo | Largura Mínima | Uso Típico |
| :--- | :--- | :--- | :--- |
| **Mobile** | (padrão) | 0px | Smartphones em modo retrato. Layout em coluna única (`flex-col`, `grid-cols-1`). |
| **Tablet** | `md:` | 768px | Tablets e smartphones grandes. Layouts começam a se dividir (`grid-cols-2`). |
| **Desktop** | `lg:` | 1024px | Laptops e desktops. Grids complexos (`grid-cols-12`), sidebars visíveis. |
| **Wide** | `xl:` | 1280px | Monitores grandes. |

### Exemplo de Grid Responsivo
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {/* Coluna única no mobile, duas colunas no tablet/desktop */}
</div>
```

## 2. Elementos Interativos (Touch Targets)

Para garantir a acessibilidade em dispositivos de toque, todos os elementos interativos seguem as seguintes diretrizes:

*   **Altura Mínima:** Botões e inputs têm `min-h-[44px]` ou `min-h-[48px]` em viewports móveis.
*   **Padding:** Áreas de clique expandidas com padding generoso (`p-3` ou `py-3`).
*   **Empilhamento:** Em telas pequenas, botões de ação (como "Upload") que ficam ao lado de inputs se movem para baixo ou ocupam 100% da largura (`w-full`) para facilitar o alcance.

### Exemplo de Botão Responsivo
```tsx
<Button 
  className="w-full sm:w-auto min-h-[44px] md:min-h-9"
>
  Salvar
</Button>
```

## 3. Tipografia e Espaçamento

*   **Texto:** Tamanhos de fonte ajustados (`text-base` no mobile se `text-sm` for muito pequeno para leitura, embora `text-sm` seja o padrão do sistema).
*   **Padding/Margin:** Espaçamentos reduzidos em mobile para aproveitar a tela (`p-4` vs `md:p-6`).
*   **Truncamento:** Uso de `break-all` ou `truncate` para evitar que textos longos (como nomes de arquivos ou valores) quebrem o layout horizontal.

## 4. Modo Escuro (Dark Mode)

Todos os componentes suportam nativamente o modo escuro, utilizando as variantes `dark:` do Tailwind.

*   **Fundo:** `bg-white` (light) -> `dark:bg-slate-900` (dark).
*   **Bordas:** `border-slate-200` (light) -> `dark:border-slate-700` (dark).
*   **Texto:** `text-slate-700` (light) -> `dark:text-slate-200` (dark).

## 5. Casos de Teste para Validação

Ao desenvolver novas telas, verifique os seguintes cenários:

1.  **iPhone SE / Small Android (320px - 375px):**
    *   O conteúdo não deve causar scroll horizontal.
    *   Botões de upload/ação devem ser fáceis de clicar.
    *   Textos longos não devem vazar dos containers.

2.  **iPad / Tablet (768px):**
    *   Verificar se o layout de 2 colunas (`md:grid-cols-2`) é ativado corretamente.
    *   O menu lateral (se houver) deve se comportar conforme esperado (hidden ou colapsado).

3.  **Orientação Paisagem:**
    *   Garantir que modais e headers fixos não ocupem toda a altura da tela, impedindo a visualização do conteúdo.

## 6. Componentes Padronizados (Turismo/Vistos)

Os componentes `SectionHeader` e `DocumentRow` foram refatorados para encapsular essa lógica responsiva:

*   **`DocumentRow`:** Alterna automaticamente entre layout flexível horizontal (desktop) e vertical (mobile) para o input e botão de upload.
*   **`SectionHeader`:** Ajusta o tamanho dos botões de ação e título conforme o espaço disponível.
