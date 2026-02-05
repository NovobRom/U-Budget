# Architecture Overview

## Technology Stack
- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Backend/Database**: Firebase (Auth, Firestore, Cloud Functions)
- **State Management**: React Context, Custom Hooks
- **Testing**: Vitest, React Testing Library, GitHub Actions
- **PWA**: vite-plugin-pwa

## Project Structure
- `src/components`: UI Components, organized by views (Budget, Assets, Credits, Settings).
- `src/services`: Business logic and Firestore data access layer.
   - `transactions.service.ts`: Transaction CRUD and import/export.
   - `budget.service.ts`: Budget management and sharing.
   - `assets.service.ts`: Asset tracking.
   - `loans.service.js`: Loan/Credit management.
- `src/hooks`: Custom React hooks for data fetching and state encapsulation.
   - `useAuth.ts`: Authentication state.
   - `useBudgetData.ts`: Real-time budget subscriptions.
   - `useTransactionTotals.ts`: Aggregation logic.
- `src/utils`: Utility functions (Currency conversion, Formatting).
- `functions`: Firebase Cloud Functions (server-side logic, AI categorization).

## Data Model (Firestore)
The application uses a hierarchical data model stored in Firestore:

- **artifacts/{appId}/public/data/budgets/{budgetId}**:
  Stores budget metadata (owner, authorized users, limits, categories).

- **artifacts/{appId}/users/{budgetId}/transactions/{transactionId}**:
  Individual transaction records. Includes amount, currency, category, and date.

- **artifacts/{appId}/users/{budgetId}/assets/{assetId}**:
  Asset records (cash, bank accounts, crypto, stocks).

- **artifacts/{appId}/users/{budgetId}/loans/{loanId}**:
  Loan and credit card records.

## Security
- Firestore Security Rules enforce data access control based on `authorizedUsers` arrays in budget documents.
- Firebase Authentication manages user identity.

## Performance
- **Virtualization**: Large lists (Transactions) are optimized (planned/in-progress).
- **Memoization**: Heavy components (`TransactionItem`, `AssetItem`) use `React.memo` to prevent unnecessary re-renders.
- **Lazy Loading**: Charts and secondary views are lazy-loaded to reduce initial bundle size.
