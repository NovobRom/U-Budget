# Smart Budget Refactor Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve critical architectural violations ("God Object" in Store), improve type safety, and harden AI service security.

**Architecture:** Split monolithic `useBudgetStore` into domain-specific stores (`useTransactionStore`, `useLoanStore`, etc.). Move hardcoded configuration to environment variables.

**Tech Stack:** React (Zustand), TypeScript, Firebase Functions (Node.js).

---

## 1. Store Refactoring (Priority: High)
**Context**: `useBudgetStore.ts` violates the 250-line rule and SRP. It mixes transactions, assets, loans, and settings.

### Task 1.1: Create `useLoanStore`
**Files:**
- Create: `src/store/useLoanStore.ts`
- Modify: `src/store/useBudgetStore.ts` (Remove loan logic)
- Modify: `src/components/LoanList.tsx` (Update import)

**Step 1: Define Loan Interface**
Create strict type definition in `src/types/index.ts` (if missing) or locally in store to replace `any`.

**Step 2: Create Store**
Move `addLoan`, `updateLoan`, `deleteLoan`, `payLoan` and `isLoanLoading` state to new store.

**Step 3: Update Consumers**
Find usages of `useBudgetStore` for loans and update to `useLoanStore`.

---

### Task 1.2: Create `useAssetStore`
**Files:**
- Create: `src/store/useAssetStore.ts`
- Modify: `src/store/useBudgetStore.ts` (Remove asset logic)

**Step 1: Move Logic**
Move `addAsset`, `updateAsset`, `deleteAsset`, `isAssetLoading` to new store.

---

### Task 1.3: Rename/Cleanup `useBudgetStore`
**Files:**
- Modify: `src/store/useBudgetStore.ts`

**Step 1: Rename to `useTransactionStore`?**
If only transactions remain, rename it. If it keeps settings + categories, maybe `useMainStore`. But better to split Settings/Categories too.

---

## 2. Cloud Function Hardening (Priority: High)
**Context**: Hardcoded origins and potential prompt injection risks in `functions/index.js`.

### Task 2.1: Secure Origins & Configuration
**Files:**
- Modify: `functions/index.js`

**Step 1: Use Environment Configuration**
Replace `allowedOrigins` array with `process.env.ALLOWED_ORIGINS` (splitting by comma).

**Step 2: Add Config**
Run `firebase functions:config:set app.allowed_origins="https://smartbudget-7b00a.web.app,http://localhost:5173"`

### Task 2.2: Robust AI Prompting
**Files:**
- Modify: `functions/index.js`

**Step 1: Sanitize Inputs**
Ensure `req.body.categories` names are stripped of special characters that might break the prompt structure.

**Step 2: Enforce JSON Output**
Update Gemini API call to use `response_mime_type: "application/json"` (if model supports) or reinforce prompt instructions.

---

## 3. Type Safety Improvements (Priority: Medium)
**Context**: `any` types in `src/store`.

### Task 3.1: Define Missing Types
**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/services/loans.service.js` -> `src/services/loans.service.ts` (Incremental migration)

**Step 1: Define Interfaces**
Define `Loan`, `Category`, `Asset` interfaces.

**Step 2: Apply to Stores**
Replace `any` with defined interfaces in new stores created in Task 1.
