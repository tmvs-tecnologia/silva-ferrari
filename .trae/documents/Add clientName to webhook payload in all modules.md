I will modify the `handleSaveAssignment` function in the 6 dashboard detail pages to include the `clientName` in the JSON payload sent to the `/api/step-assignments` webhook.

**Files to be modified:**

1. `src/app/dashboard/acoes-civeis/[id]/page.tsx`
2. `src/app/dashboard/acoes-trabalhistas/[id]/page.tsx`
3. `src/app/dashboard/vistos/[id]/page.tsx`
4. `src/app/dashboard/compra-venda/[id]/page.tsx`
5. `src/app/dashboard/perda-nacionalidade/[id]/page.tsx`
6. `src/app/dashboard/acoes-criminais/[id]/page.tsx`

**Implementation Details:**

* In each `handleSaveAssignment` function, I will add `clientName: caseData?.clientName || "Cliente"` to the request body object.

* This ensures that the client's name (displayed in the header/card) is consistently passed to the webhook handler.

**Example Change:**

```typescript
// Before
body: JSON.stringify({ moduleType: "...", recordId: id, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle })

// After
body: JSON.stringify({ moduleType: "...", recordId: id, stepIndex: index, responsibleName, dueDate, workflowName: stepTitle, clientName: caseData?.clientName || "Cliente" })
```

