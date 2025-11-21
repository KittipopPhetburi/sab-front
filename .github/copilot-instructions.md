### Quickcontext — Front-sab (Vite/React/TS)

This repository is a Vite + React + TypeScript front-end that works with a separate backend API (default base: http://127.0.0.1:8000/api). The project uses a central `apiClient` in `src/services/api.ts` for most service requests but several pages directly call axios or fetch (e.g., `QuotationPage.tsx` uses `axios` directly).

Key areas to scan when making changes:
- UI pages: `src/components/pages/*` (each page loads data from a REST endpoint and uses local translation/formatting)
- Document forms: `src/components/TaxInvoiceForm.tsx` — shared form used for invoice, receipt, quotation, etc.
- Services: `src/services/*` (e.g., `companySettingService`, `customerService`) — prefer `apiClient` for consistent headers and interceptors

Common project patterns and routing knowledge
- REST endpoints live at port 8000 by default; the frontend expects `http://127.0.0.1:8000/api/<resource>`.
- Document types are centralized in `TaxInvoiceForm` using `documentType` prop. Many pages (invoices, receipts, quotations) reuse the same form for editing/creating.
- Some pages use Thai-language status values (e.g., `QuotationPage` uses `ร่าง`, `รออนุมัติ`, ...), while others map to English back-end statuses (e.g., `InvoicePage` uses `draft`, `pending`). Verify which form of status your API returns — UI filters rely on a match.

Why Quotation data might not show — a short debug checklist
1. Confirm backend is running on port 8000 and accessible via `http://127.0.0.1:8000/api/quotations`.
2. Check Browser DevTools → Network to confirm the request status (200 vs 4xx/5xx) and the exact JSON structure returned. The frontend expects an array (e.g. `[{...}, {...}]`) but some patterns return `{data: [...]}`.
   - If backend wraps the results, set data with `setData(response.data?.data || response.data)`.
3. Confirm CORS / credentials — the front-end runs at Vite's port (usually 5173). Add CORS to backend if the request is blocked or returns status 0.
4. Check status values — the UI filters and status counts compare strict strings (e.g., `item.status === "ร่าง"`), so mismatched language will filter everything out. Either map server statuses to local strings or unify on one set.
   - Example mapping snippet for `QuotationPage`: `const statusMap = { draft: 'ร่าง', pending: 'รออนุมัติ', approved: 'อนุมัติแล้ว' };` then use `statusMap[item.status] || item.status`.
5. Check property names for `branch_name`, `customer_name`, `grand_total` etc — fields are consistent across services but double-check the backend keys.

Small actionable examples for this repo
- Use `apiClient` for new services instead of raw axios to benefit from interceptors/config in `src/services/api.ts`.
- Debugging tip: Add a one-line `console.log('quotation fetch', response)` in `fetchQuotations()` to inspect the live payload during development.
- If the UI is empty but network returns data, try `setData(Array.isArray(response.data) ? response.data : response.data?.data || [])`.

Developer workflows
- Start frontend: `npm run dev` (Vite; HMR enabled)
- Build: `npm run build`; Preview: `npm run preview`
- Lint: `npm run lint`

Integration & printing notes
- Quotation printing (open `QuotationPage.tsx` and search `handlePrintWithType`) — prints with A4 templates and uses `ThaiBahtText` to format amounts into Thai text.
- Company settings are loaded via `companySettingService.get()` and used to render logos and contact info on the printed PDF. If logos do not show, inspect `resolveLogoUrl` in the page (it assumes server path or data URI).

If you want help debugging a specific empty-page problem, provide:
- the Browser Console / Network logs for `/api/quotations`; or
- the response JSON body from the backend (scrub secrets); or
- the exact steps to reproduce (e.g., new data created in the backend but not showing in page after refresh).

---
⚠️ Note: This file is targeted at AI agents to reduce guesswork: use network logs + service wrappers + status mapping when inspecting data display issues.