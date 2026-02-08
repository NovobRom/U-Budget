# Comprehensive Code Review & Audit Report

> **Date:** 2026-02-08
> **Scope:** `functions/`, `src/services/`, `src/store/`, `src/firebase.js`
> **Skills Applied:** `code-review`, `kaizen`, `systematic-debugging`

## 1. Executive Summary

The codebase demonstrates a solid foundation using React, Vite, and Firebase. The architecture leverages Cloud Functions for backend logic and Zustand for state management, which are good choices.

However, the project is currently in a **transitional state** regarding type safety and modularity, leading to several violations of the **Project Rules** (specifically `SOLID` principles and `No God Objects`).

**Key Risks:**
*   **Maintainability**: Identify "God Objects" (e.g., `useBudgetStore.ts`) that combine too many responsibilities.
*   **Type Safety**: Widespread use of `any` and mixed JS/TS files reduces confidence in code correctness.
*   **Security/Robustness**: Input validation in Cloud Functions and hardcoded values need addressing to prevent future issues.

---

## 2. Detailed Findings

### 2.1. Logic & Functionality
*   **Cloud Function (`functions/index.js`)**:
    *   **Prompt Injection Risk**: User inputs (`categoriesList`) are directly interpolated into the prompt. While Gemini is robust, malicious category names could theoretically manipulate the prompt.
    *   **Hardcoded Origins**: `allowedOrigins` contains hardcoded strings. This makes environment switching (dev/staging/prod) error-prone.
    *   **JSON Parsing**: The usage of `text.match(/\[[\s\S]*\]/)` is a fragile fallback. Ensuring strict JSON output from the AI (via `response_mime_type`) is preferred.
    *   **Rate Limiting**: No backoff strategy for the AI service. If the quota is hit, the user just gets an error.

*   **AI Service (`geminiCategorizer.service.js`)**:
    *   **Relative Path Usage**: `const CATEGORIZE_ENDPOINT = '/categorize';` assumes a proxy configuration exists (Vite proxy or Firebase Rewrite). If not configured correctly in `vite.config.ts`, this will fail in local dev.
    *   **Shallow Copy**: The logic `results[txIndex] = { ...results[txIndex], category };` correctly updates the specific item, but relies on `transactions` being a mutable array reference in the outer scope (which it is, `[...transactions]`), so this is safe but subtle.

### 2.2. Architecture & Modularity
*   **Violation of Rule #2 (God Objects)**:
    *   **`src/store/useBudgetStore.ts`**: This file is **284 lines** (Limit: 250). It acts as a "catch-all" manager for Transactions, Assets, Loans, Categories, and Settings.
    *   **Impact**: High coupling. Modifying "Loans" logic requires touching the same file as "Transactions" logic, increasing merge conflict risks.
    *   **Recommendation**: Split into `useTransactionStore`, `useAssetStore`, etc., or use Zustand slices.

*   **Service Layer Pattern**: The pattern of having `services/` handle API calls and `store/` handle state + toast + error handling is good and consistent.

### 2.3. Type Safety (TypeScript)
*   **Inconsistency**: The project mixes `.js` and `.ts` files randomly (e.g., `useBudgetStore.ts` imports `budget.service` which is likely JS).
*   **`any` Usage**: `useBudgetStore.ts` contains multiple `any` types (`user: any`, `data: any` for loans).
    *   *Explicit Technical Debt*: `// Loans (Using 'any' for data until loansService is migrated)`
    *   **Risk**: If `loansService` changes its contract, the store will not catch the error at compile time.

### 2.4. Security Audit
*   **`functions/index.js`**:
    *   **Secrets**: Uses `defineSecret` correctly.
    *   **Error Leaking**: The `monobank` proxy swallows the error details but logs them. This is generally good for security, but `res.status(500).json({ error: 'Proxy Failed', details: error.message });` might leak internal error structures if `error.message` is verbose.
*   **`src/firebase.js`**:
    *   Safe. Usage of `import.meta.env` prevents committing API keys (assuming `.env` is gitignored).

---

## 3. Kaizen (Continuous Improvement) Opportunities

| ID | Category | Current State | Kaizen Improvement | Effort |
|----|----------|---------------|-------------------|--------|
| K1 | **Poka-Yoke** | `type: any` in Stores | Define strict interfaces (`Loan`, `Category`) to prevent runtime crashes. | Medium |
| K2 | **Modularity** | `useBudgetStore.ts` (284 lines) | Split into `useTransactions`, `useAssets`, `useLoans` using Zustand Slices pattern. | Medium |
| K3 | **Standard** | Mixed JS/TS | Rename `.js` to `.ts`, add types incrementally. Don't use `any` unless strictly necessary. | High |
| K4 | **Robustness** | Local `fetch` calls | Verify `vite.config.ts` has proper proxy setup to avoid CORS/404 errors in dev. | Low |
| K5 | **Security** | Hardcoded Origins | Move origins to Firebase Environment Configuration. | Low |

---

## 4. Recommendations

1.  **Immediate Fix (Rule Violation)**: Refactor `useBudgetStore.ts` to reduce file size below 250 lines.
2.  **Logic Fix**: Verify prompt sanitization in `functions/index.js` to ensure stability.
3.  **Process**: Enforce "No new `.js` files" rule. All new code must be TypeScript.
