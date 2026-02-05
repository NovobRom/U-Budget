# U-Budget Application Audit Report

**Date:** February 5, 2026
**Version:** 1.0
**Audited By:** Claude Code Analysis

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Analysis](#4-architecture-analysis)
5. [Code Quality Assessment](#5-code-quality-assessment)
6. [Security Audit](#6-security-audit)
7. [Performance Analysis](#7-performance-analysis)
8. [UI/UX Evaluation](#8-uiux-evaluation)
9. [Data Layer Analysis](#9-data-layer-analysis)
10. [Testing Coverage](#10-testing-coverage)
11. [Recommendations](#11-recommendations)
12. [Action Items](#12-action-items)

---

## 1. Executive Summary

### Overview
U-Budget is a sophisticated **Personal Finance Progressive Web Application (PWA)** built with modern React patterns and Firebase as the backend. The application enables users to track income, expenses, assets, and loans with features including multi-currency support, team/family budget sharing, Monobank integration, and AI-powered transaction categorization.

### Overall Assessment

| Category | Rating | Status |
|----------|--------|--------|
| Architecture | ✅ Excellent | Well-structured, scalable |
| Code Quality | ⚠️ Good | Mixed JS/TS, needs migration |
| Security | 🔴 Critical Issues | API keys exposed, CORS too permissive |
| Performance | ✅ Good | Lazy loading, caching implemented |
| UI/UX | ✅ Excellent | Dark mode, i18n, accessibility |
| Testing | 🔴 Minimal | Setup only, no coverage |
| Documentation | ⚠️ Moderate | Inline docs good, external docs missing |

### Key Findings

**Strengths:**
- Clean, modular architecture with separation of concerns
- Real-time multi-device sync via Firestore
- Comprehensive multi-currency and multi-language support
- PWA with offline capabilities
- AI-powered transaction categorization
- Robust Firestore security rules

**Critical Issues Requiring Immediate Attention:**
1. Hardcoded Firebase API keys in source code
2. CORS configuration allows all origins on Cloud Functions
3. 7 high-severity NPM vulnerabilities
4. Minimal test coverage

---

## 2. Project Overview

### Purpose
U-Budget helps users manage personal and family finances by tracking:
- **Transactions** - Income and expenses with categorization
- **Assets** - Stocks, crypto, real estate, vehicles
- **Loans** - Debts, mortgages with payment tracking
- **Budgets** - Shared family/team budgets with permissions

### Key Features

| Feature | Description |
|---------|-------------|
| Budget Management | Track income, expenses, balance |
| Multi-currency | EUR, USD, UAH, PLN with real-time conversion |
| Team Budgets | Invite members, manage permissions |
| Monobank Integration | Auto-import transactions from Ukrainian bank |
| AI Categorization | Gemini-powered transaction categorization |
| Category Rules | Keyword-based auto-categorization |
| PWA | Installable, offline support, push-ready |
| Dark/Light Mode | System-aware theme support |
| i18n | Ukrainian and English languages |

### Project Statistics

```
Total Source Files:     ~85 (JS/JSX/TSX)
Lines of Code:          ~15,000 (estimated)
Components:             30+ files
Custom Hooks:           15 files
Services:               9 files
Supported Languages:    2 (Ukrainian, English)
Supported Currencies:   4 main (EUR, USD, UAH, PLN) + crypto
```

---

## 3. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI library |
| TypeScript | 5.9.3 | Type checking (partial) |
| Vite | 5.2.0 | Build tool |
| Tailwind CSS | 3.4.3 | Styling |
| Zustand | 5.0.9 | State management |
| React Router | 7.10.1 | Routing |
| Recharts | 3.5.1 | Charts |
| Lucide React | 0.378.0 | Icons |

### Backend & Services

| Technology | Version | Purpose |
|------------|---------|---------|
| Firebase | 10.14.1 | BaaS (Auth, Firestore, Hosting, Functions) |
| Firebase Functions | v2 | Cloud Functions |
| Gemini AI | 2.5-flash | Transaction categorization |
| Monobank API | - | Bank integration |

### External APIs

| API | Purpose | Rate Limits |
|-----|---------|-------------|
| Monobank | Transactions, exchange rates | 1 req/60s |
| Gemini AI | Transaction categorization | 50 desc/req |
| CoinGecko | Crypto exchange rates | Public |
| OpenExchangeRates | Currency fallback | Public |

---

## 4. Architecture Analysis

### 4.1 Application Structure

```
/home/user/U-Budget/
├── src/                          # Main application source
│   ├── components/               # React components
│   │   ├── auth/                 # Authentication UI
│   │   ├── forms/                # Form components
│   │   ├── integrations/         # External integrations
│   │   ├── modals/               # Modal dialogs
│   │   │   └── settings/         # Settings modals
│   │   ├── ui/                   # Reusable primitives
│   │   └── views/                # Main page views
│   ├── context/                  # React Context (Lang, Currency, Theme)
│   ├── hooks/                    # Custom React hooks (15)
│   ├── store/                    # Zustand stores (3)
│   ├── services/                 # Firestore service layer (9)
│   ├── utils/                    # Utility functions
│   ├── locales/                  # i18n translations
│   ├── routes/                   # Route configuration
│   └── providers/                # Provider wrapper
├── functions/                    # Firebase Cloud Functions
├── public/                       # Static assets
└── [Config files]                # vite, tailwind, firebase, etc.
```

### 4.2 State Management Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    App (Root Component)                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   AppProviders                          ││
│  │  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐    ││
│  │  │LanguageCtx  │ │ CurrencyCtx  │ │  ThemeCtx     │    ││
│  │  └─────────────┘ └──────────────┘ └───────────────┘    ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   AppContent                            ││
│  │  ┌──────────────────┐ ┌──────────────────────────────┐ ││
│  │  │   Hooks (Read)   │ │      Zustand (Write)         │ ││
│  │  │  - useBudget     │ │  - useBudgetStore            │ ││
│  │  │  - useTransactions│ │  - useModalStore            │ ││
│  │  │  - useAssets     │ │  - useMonobankStore          │ ││
│  │  │  - useLoans      │ │                              │ ││
│  │  └──────────────────┘ └──────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Key Pattern:** Separation of Concerns
- **Hooks** = Data fetching & reading (Firestore subscriptions)
- **Zustand Store** = Writing operations (mutations)
- **Services** = Direct Firestore operations (decoupled from React)
- **Context** = Global configuration (language, currency, theme)

### 4.3 Data Flow

```
User Action (e.g., "Save Transaction")
      │
      ▼
Component (TransactionModal)
      │
      ▼
useAppActions hook
      │
      ▼
useBudgetStore.addTransaction() [Zustand action]
      │
      ▼
transactionsService.addTransaction() [Service layer]
      │
      ▼
Firestore writeBatch (atomic write)
├── Add transaction document
└── Update budget currentBalance
      │
      ▼
Real-time listener (onSnapshot in useBudgetData)
      │
      ▼
UI updates (Re-render with new data)
```

### 4.4 Firestore Database Schema

```
/artifacts/{appId}/
  ├── users/{userId}/
  │   ├── metadata/profile          # User profile, activeBudgetId
  │   ├── integrations/monobank     # Monobank token & config
  │   ├── transactions/             # User's transactions
  │   ├── categories/               # Custom categories
  │   └── settings/categoryRules    # Auto-categorization rules
  │
  └── public/data/
      ├── budgets/{budgetId}        # Budget metadata
      │   ├── assets/               # Subcollection
      │   └── loans/                # Subcollection
      └── budget_requests/          # Join requests

```

### 4.5 Architecture Strengths

| Decision | Rationale |
|----------|-----------|
| Firestore as DB | Real-time sync, mobile-friendly, easy scaling |
| Zustand over Context | Better performance, simpler API, no re-render issues |
| Service layer | Decoupled from React, testable, reusable |
| EUR internal currency | Avoids rounding errors, common pivot |
| Cloud Functions for APIs | Secure API keys, bypass CORS, rate limiting |
| PWA with offline cache | Mobile-first, works without internet |

---

## 5. Code Quality Assessment

### 5.1 TypeScript Usage

| Metric | Value | Assessment |
|--------|-------|------------|
| TypeScript files | 4 (.tsx/.ts) | 🔴 Low |
| JavaScript files | ~80 (.js/.jsx) | ⚠️ Migration needed |
| Strict mode | Disabled | 🔴 Loose type checking |
| Type definitions | None (.d.ts) | 🔴 Missing |

**tsconfig.json Analysis:**
```json
{
  "strict": false,           // ⚠️ Loose mode
  "noUnusedLocals": false,   // ⚠️ Dead code allowed
  "noUnusedParameters": false // ⚠️ Unused params allowed
}
```

**Recommendation:** Enable strict mode and migrate `.js` files incrementally.

### 5.2 Code Organization

| Aspect | Rating | Notes |
|--------|--------|-------|
| Directory structure | ✅ Excellent | Clear separation by feature |
| Naming conventions | ✅ Good | Consistent camelCase/PascalCase |
| Component modularity | ✅ Excellent | Single responsibility |
| Code duplication | ⚠️ Moderate | Some patterns could be extracted |
| Import organization | ⚠️ Moderate | No sorting/grouping rules |

### 5.3 Error Handling

**Patterns Used:**
- Try-catch blocks in services and hooks
- Toast notifications for user feedback
- Firebase error code handling
- Cloud Function HTTP status codes

**Gaps:**
- No global Error Boundary component
- Inconsistent error logging (console vs Firebase logger)
- Some generic error messages

### 5.4 Documentation

| Type | Status | Notes |
|------|--------|-------|
| Inline JSDoc | ✅ Good | Present in services |
| README.md | ⚠️ Basic | Generic Vite template |
| ARCHITECTURE.md | 🔴 Missing | No architecture docs |
| API documentation | 🔴 Missing | No service API docs |
| Code comments | ✅ Good | Complex logic explained |

### 5.5 Linting & Formatting

**ESLint Configuration:**
- ESLint 8.57.0 with React plugins
- `max-warnings: 0` (strict)
- React Hooks rules enabled
- React Refresh plugin

**Gaps:**
- No Prettier configuration (inconsistent formatting)
- No TypeScript ESLint rules
- No import sorting rules
- No accessibility rules (jsx-a11y)

---

## 6. Security Audit

### 6.1 Risk Summary

| Category | Risk Level | Status |
|----------|-----------|--------|
| **API Key Management** | 🔴 CRITICAL | Hardcoded Firebase keys |
| **CORS Configuration** | 🔴 HIGH | All origins allowed |
| **NPM Vulnerabilities** | 🔴 HIGH | 7 high-severity issues |
| **Authentication** | ✅ GOOD | Firebase Auth + email verify |
| **Firestore Rules** | ✅ EXCELLENT | Role-based access |
| **Data Validation** | ✅ GOOD | Input validation present |
| **Security Headers** | ⚠️ MISSING | No CSP, HSTS, etc. |

### 6.2 Critical: Hardcoded API Keys

**File:** `src/firebase.js` (Lines 5-12)

```javascript
// ⚠️ CRITICAL - Hardcoded fallback values
apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB387...",
authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartbudget-7b00a...",
projectId: "smartbudget-7b00a",
messagingSenderId: "367187608778",
appId: "1:367187608778:web:891200fff0881767746033"
```

**Risk:** API keys visible in browser DevTools and source code.

**Recommendation:**
1. Remove hardcoded fallbacks
2. Use environment variables only
3. Restrict API keys in Firebase Console

### 6.3 Critical: CORS Configuration

**File:** `functions/index.js`

```javascript
// ⚠️ CRITICAL - Accepts requests from ANY origin
exports.monobank = onRequest({ cors: true, ... });
exports.categorize = onRequest({ cors: true, ... });
```

**Risk:** Any domain can call these Cloud Functions.

**Recommendation:**
```javascript
cors: {
    origin: ['https://smartbudget-7b00a.firebaseapp.com'],
    credentials: true
}
```

### 6.4 NPM Vulnerabilities

**Total:** 21 vulnerabilities (7 High, 14 Moderate)

| Package | Severity | Issue |
|---------|----------|-------|
| react-router-dom | High | XSS via Open Redirects |
| qs | High | DoS - Array Limit Bypass |
| node-tar | High | Path Traversal |
| @isaacs/brace-expansion | High | DoS - Resource Consumption |

**Recommendation:** Run `npm audit fix` and update dependencies.

### 6.5 Firestore Security Rules

**Status:** ✅ EXCELLENT

**Implemented Controls:**
- User ownership verification
- Budget member authorization
- Subcollection access via parent
- Join request validation
- Self-removal only (members can't remove others)
- Critical field protection (`authorizedUsers`, `ownerId`)

### 6.6 Authentication

**Status:** ✅ GOOD

**Implemented:**
- Firebase Authentication (Email/Password, Google, Apple)
- Email verification required
- Password strength validation (8+ chars, upper, lower, number, special)
- Secure password reset via email

**Gaps:**
- No rate limiting UI feedback
- Error messages could leak user existence

### 6.7 Missing Security Headers

| Header | Status | Recommendation |
|--------|--------|----------------|
| Content-Security-Policy | 🔴 Missing | Add CSP header |
| X-Frame-Options | 🔴 Missing | Add DENY or SAMEORIGIN |
| X-Content-Type-Options | 🔴 Missing | Add nosniff |
| Strict-Transport-Security | 🔴 Missing | Add HSTS header |
| X-XSS-Protection | 🔴 Missing | Add for legacy browsers |

---

## 7. Performance Analysis

### 7.1 Build Optimization

**Vite Configuration Strengths:**
- Code splitting with manual chunks (vendor-react, vendor-firebase, vendor-recharts)
- ES2020 target
- Tree-shaking enabled
- PWA caching with Workbox

### 7.2 Runtime Optimizations

| Technique | Implementation | Status |
|-----------|----------------|--------|
| Lazy Loading | Views lazy-loaded with `React.lazy()` | ✅ |
| Memoization | `useMemo` in charts, conversions | ⚠️ Limited |
| Debouncing | 500ms on exchange rate calculations | ✅ |
| Pagination | 50 transactions, load more | ✅ |
| Caching | Exchange rates (10-min TTL, localStorage) | ✅ |

### 7.3 Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Caching Layers                           │
├─────────────────────────────────────────────────────────────┤
│ Service Worker (Workbox PWA)                                │
│   ├── Firebase Data: NetworkFirst (24h TTL)                 │
│   ├── Google Fonts: StaleWhileRevalidate                    │
│   └── Static Assets: CacheFirst (1 year)                    │
├─────────────────────────────────────────────────────────────┤
│ localStorage                                                │
│   ├── Exchange Rates: 10-min TTL                            │
│   ├── Theme Preference: Persistent                          │
│   ├── Language Preference: Persistent                       │
│   └── Currency Preference: Persistent                       │
├─────────────────────────────────────────────────────────────┤
│ In-Memory (Zustand/useMemo)                                 │
│   ├── Budget Data: Session lifetime                         │
│   ├── Icon Maps: Component lifetime                         │
│   └── Conversion Results: Render cycle                      │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Areas for Improvement

| Area | Current | Recommendation |
|------|---------|----------------|
| Component memoization | Limited `useMemo` | Add `React.memo` to list items |
| useCallback usage | Minimal | Wrap event handlers |
| Image optimization | None | Add lazy loading, WebP format |
| Bundle analysis | Not configured | Add webpack-bundle-analyzer |

---

## 8. UI/UX Evaluation

### 8.1 Design System

| Aspect | Implementation | Status |
|--------|----------------|--------|
| Framework | Tailwind CSS 3.4.3 | ✅ |
| Dark Mode | Class-based with persistence | ✅ |
| Icons | Lucide React (378+ icons) | ✅ |
| Charts | Recharts with memoization | ✅ |
| Components | Custom Button, Input, Modal | ✅ |

### 8.2 Responsive Design

**Approach:** Mobile-first with breakpoints

| Breakpoint | Usage |
|------------|-------|
| Base | Mobile styles |
| `sm:` | Small screens (640px+) |
| `md:` | Medium screens (768px+) |
| `lg:` | Large screens (1024px+) |

**Implementation Examples:**
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Navigation: Mobile tabs vs desktop header
- Modals: Full-width on mobile, max-width on desktop

### 8.3 Accessibility

| Feature | Status | Notes |
|---------|--------|-------|
| ARIA labels | ✅ Good | Present on icon buttons |
| Semantic HTML | ✅ Good | nav, main, footer used |
| Keyboard navigation | ⚠️ Partial | Focus styles present |
| Screen reader | ⚠️ Partial | Some aria-hidden |
| Color contrast | ⚠️ Not audited | Needs WCAG check |

### 8.4 Internationalization

**Supported Languages:**
- Ukrainian (`ua`) - Primary
- English (`en`) - Secondary

**Implementation:**
- Context-based with `useLanguage()` hook
- localStorage persistence
- All UI strings externalized
- Category name translations

### 8.5 Theme Support

**Dark Mode Features:**
- System preference detection
- Manual toggle in settings
- localStorage persistence
- Consistent color palette

**Color Scheme:**
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | white | slate-900 |
| Text | slate-800 | slate-200 |
| Borders | slate-100 | slate-700 |
| Primary | blue-600 | blue-500 |

---

## 9. Data Layer Analysis

### 9.1 Database Architecture

**Storage Currency:** EUR (Euro) - Internal standard
**Display Currencies:** EUR, USD, UAH, PLN (user selectable)

**Conversion Pattern:**
```
Input (Any) → EUR (Storage) → Display Currency
```

### 9.2 Real-time Features

| Feature | Implementation | Listener Type |
|---------|----------------|---------------|
| Budget data | `onSnapshot` | Real-time |
| Transactions | `onSnapshot` with pagination | Real-time |
| Assets | `onSnapshot` with conversion | Real-time |
| Loans | `onSnapshot` with conversion | Real-time |
| Join requests | `onSnapshot` | Real-time |
| User profile | `onSnapshot` | Real-time |

### 9.3 External Integrations

**Monobank Integration:**
- Proxy via Cloud Function (CORS bypass)
- Token stored encrypted in Firestore
- Account selection with hiding feature
- Transaction import with date range

**AI Categorization (Gemini):**
- Cloud Function with secret management
- Batch processing (30 transactions/request)
- Rate limiting (500ms between batches)
- Fallback to "other" category

### 9.4 Data Security

**Storage:**
- Firestore encryption at rest
- No localStorage for sensitive data
- Monobank token in user-private collection
- Gemini API key in Secret Manager

**Access Control:**
- Budget owner full access
- Members read/write data (not settings)
- Members can only remove themselves
- Join requests require approval

---

## 10. Testing Coverage

### 10.1 Current State

| Aspect | Status |
|--------|--------|
| Testing framework | Vitest 4.0.18 |
| DOM simulation | jsdom 28.0.0 |
| React Testing Library | Installed |
| Test files | 1 (example only) |
| Coverage | 🔴 ~0% |

### 10.2 Test Configuration

**File:** `vite.config.js`
```javascript
test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
}
```

### 10.3 Recommended Test Coverage

| Area | Priority | Type |
|------|----------|------|
| Authentication flow | High | Integration |
| Transaction CRUD | High | Unit + Integration |
| Currency conversion | High | Unit |
| Firestore services | Medium | Unit (mocked) |
| Custom hooks | Medium | Unit |
| Components | Medium | Snapshot + Interaction |
| AI categorization | Low | Integration (mocked) |

---

## 11. Recommendations

### 11.1 Critical (Immediate Action Required)

| # | Issue | Action | Priority |
|---|-------|--------|----------|
| 1 | Hardcoded API keys | Remove fallbacks, use env vars only | P0 |
| 2 | CORS all origins | Restrict to production domain | P0 |
| 3 | NPM vulnerabilities | Run `npm audit fix --force` | P0 |
| 4 | No test coverage | Add critical path tests | P1 |

### 11.2 High Priority (Within 2 Weeks)

| # | Issue | Action |
|---|-------|--------|
| 5 | Missing security headers | Add CSP, HSTS, X-Frame-Options |
| 6 | TypeScript loose mode | Enable strict mode incrementally |
| 7 | No Error Boundary | Add global error handling |
| 8 | Missing Prettier | Add for consistent formatting |

### 11.3 Medium Priority (Within 1 Month)

| # | Issue | Action |
|---|-------|--------|
| 9 | Limited memoization | Add React.memo to list components |
| 10 | No architecture docs | Create ARCHITECTURE.md |
| 11 | Basic accessibility | Add WCAG compliance check |
| 12 | No CI/CD tests | Add GitHub Actions for lint/test |

### 11.4 Low Priority (Backlog)

| # | Issue | Action |
|---|-------|--------|
| 13 | JavaScript migration | Convert .js to .ts files |
| 14 | Bundle analysis | Add webpack-bundle-analyzer |
| 15 | E2E testing | Add Playwright or Cypress |
| 16 | API documentation | Generate from JSDoc |

---

## 12. Action Items

### Immediate Actions Checklist

- [ ] **Security:** Remove hardcoded Firebase API keys from `src/firebase.js`
- [ ] **Security:** Update CORS configuration in `functions/index.js`
- [ ] **Security:** Run `npm audit fix` to patch vulnerabilities
- [ ] **Security:** Add security headers in Firebase hosting config
- [ ] **Testing:** Create test files for authentication flow
- [ ] **Testing:** Create test files for transaction service
- [ ] **Documentation:** Create `.env.example` file

### Configuration Updates Needed

**firebase.json** - Add security headers:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" }
        ]
      }
    ]
  }
}
```

**functions/index.js** - Restrict CORS:
```javascript
const allowedOrigins = [
    'https://smartbudget-7b00a.firebaseapp.com',
    'https://smartbudget-7b00a.web.app'
];

exports.monobank = onRequest({
    cors: { origin: allowedOrigins, credentials: true },
    maxInstances: 10
}, ...);
```

**tsconfig.json** - Enable strict mode:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## Appendix A: File Reference

### Key Configuration Files
- `/vite.config.js` - Build configuration
- `/tailwind.config.js` - Styling configuration
- `/tsconfig.json` - TypeScript configuration
- `/firebase.json` - Firebase hosting & functions
- `/firestore.rules` - Database security rules
- `/eslint.config.js` - Linting configuration

### Core Application Files
- `/src/firebase.js` - Firebase initialization
- `/src/App.tsx` - Root component
- `/src/store/useBudgetStore.js` - Main state management
- `/src/services/transactions.service.js` - Transaction operations
- `/functions/index.js` - Cloud Functions

### Documentation Files
- `/README.md` - Project readme
- `/AI_RULES.md` - Development guidelines
- `/TESTING_PLAN.md` - Testing strategy

---

## Appendix B: Dependency List

### Production Dependencies
```
firebase: ^10.14.1
lucide-react: ^0.378.0
papaparse: ^5.5.3
react: ^18.2.0
react-dom: ^18.2.0
react-hot-toast: ^2.4.1
react-router-dom: ^7.10.1
recharts: ^3.5.1
zustand: ^5.0.9
```

### Development Dependencies
```
@testing-library/jest-dom: ^6.9.1
@testing-library/react: ^16.3.2
@vitejs/plugin-react: ^4.2.1
autoprefixer: ^10.4.19
eslint: ^8.57.0
jsdom: ^28.0.0
postcss: ^8.4.38
tailwindcss: ^3.4.3
typescript: ^5.9.3
vite: ^5.2.0
vite-plugin-pwa: ^0.20.0
vitest: ^4.0.18
```

---

**End of Audit Report**

*This audit was conducted on February 5, 2026. Findings are based on static code analysis and may not reflect all runtime behaviors. Regular security audits are recommended.*
