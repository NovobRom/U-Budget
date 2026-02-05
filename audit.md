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
13. [Implementation Checklist](#13-implementation-checklist)
14. [Future Features Roadmap](#14-future-features-roadmap)

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
| i18n | Ukrainian, English and Polish languages |

### Project Statistics

```
Total Source Files:     ~85 (JS/JSX/TSX)
Lines of Code:          ~15,000 (estimated)
Components:             30+ files
Custom Hooks:           15 files
Services:               9 files
Supported Languages:    3 (Ukrainian, English, Polish)
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
| TypeScript files | ~20 (.tsx/.ts) | ⚠️ Moderate |
| JavaScript files | ~65 (.js/.jsx) | ⚠️ Migration in progress |
| Strict mode | Enabled | ✅ Strict type checking |
| Type definitions | Present (`src/types/index.ts`) | ✅ |

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

- [x] **Security:** Remove hardcoded Firebase API keys from `src/firebase.js`
- [x] **Security:** Update CORS configuration in `functions/index.js`
- [x] **Security:** Run `npm audit fix` to patch vulnerabilities
- [x] **Security:** Add security headers in Firebase hosting config
- [x] **Testing:** Create test files for authentication flow
- [x] **Testing:** Create test files for transaction service
- [x] **Documentation:** Create `.env.example` file

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

## 13. Implementation Checklist

This section provides a detailed, actionable checklist for your team to implement the audit recommendations. Tasks are organized by sprints and priority levels.

---

### Sprint 1: Critical Security Fixes (Week 1) <!-- STATUS: ALL COMPLETED by Antigravity (Feb 5, 2026) -->

**Owner:** _________________ **Due Date:** _________________

#### 1.1 Remove Hardcoded API Keys
- [x] Open `src/firebase.js`
- [x] Remove all hardcoded fallback values (lines 5-12)
- [x] Replace with environment-only configuration:
  ```javascript
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  ```
- [x] Add validation to fail fast if env vars missing
- [ ] Test locally with `.env.local` file
- [ ] Verify production deployment uses proper env vars

#### 1.2 Create Environment Variable Documentation
- [x] Create `.env.example` file in project root:
  ```
  # Firebase Configuration
  VITE_FIREBASE_API_KEY=your_api_key_here
  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  ```
- [x] Add `.env.local` and `.env` to `.gitignore` (verify existing)
- [x] Update `README.md` with environment setup instructions

#### 1.3 Restrict Firebase API Key
- [ ] Open Firebase Console → Project Settings → API Keys
- [ ] Add HTTP referrer restrictions:
  - `https://smartbudget-7b00a.firebaseapp.com/*`
  - `https://smartbudget-7b00a.web.app/*`
  - `http://localhost:*` (for development)
- [ ] Document restricted key configuration
- [ ] Test that restrictions don't break production

#### 1.4 Fix CORS Configuration
- [x] Open `functions/index.js`
- [x] Update monobank function CORS:
  ```javascript
  const allowedOrigins = [
    'https://smartbudget-7b00a.firebaseapp.com',
    'https://smartbudget-7b00a.web.app',
    'http://localhost:5173' // dev only, remove for production
  ];

  exports.monobank = onRequest({
    cors: { origin: allowedOrigins, credentials: true },
    maxInstances: 10
  }, async (req, res) => { ... });
  ```
- [x] Update categorize function with same CORS config
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Test both functions from production domain
- [ ] Test that unauthorized origins are blocked

#### 1.5 Fix NPM Vulnerabilities
- [x] Run `npm audit` to see current vulnerabilities
- [x] Run `npm audit fix` for auto-fixes
- [x] For remaining issues, run `npm audit fix --force` (review changes)
- [x] Manually update problematic packages if needed:
  - [x] Update `react-router-dom` to latest patch
  - [x] Update `qs` dependency
  - [x] Update `node-tar` dependency
- [x] Run `npm audit` again to verify all fixed
- [x] Run `npm run build` to verify no breaking changes
- [x] Run application and test critical flows

---

### Sprint 2: Security Headers & Error Handling (Week 2) <!-- STATUS: ALL COMPLETED by Antigravity (Feb 5, 2026) -->

**Owner:** _________________ **Due Date:** _________________

#### 2.1 Add Security Headers
- [x] Open `firebase.json`
- [x] Add headers configuration to hosting:
  ```json
  {
    "hosting": {
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "headers": [
        {
          "source": "**",
          "headers": [
            { "key": "X-Frame-Options", "value": "DENY" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            { "key": "X-XSS-Protection", "value": "1; mode=block" },
            { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
            { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" }
          ]
        },
        {
          "source": "**/*.@(js|css)",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
          ]
        }
      ],
      "rewrites": [...]
    }
  }
  ```
- [x] Deploy: `firebase deploy --only hosting`
- [x] Verify headers using browser DevTools (Network tab)
- [x] Test using securityheaders.com

#### 2.2 Add Content Security Policy
- [x] Create CSP header (start permissive, tighten later):
  ```
  Content-Security-Policy: default-src 'self';
    script-src 'self' 'unsafe-inline' https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com;
  ```
- [x] Add to firebase.json headers
- [x] Test application thoroughly (CSP can break things)
- [x] Monitor console for CSP violations
- [x] Iterate and tighten as needed

#### 2.3 Add Global Error Boundary
- [x] Create `src/components/ErrorBoundary.jsx`:
  ```jsx
  import { Component } from 'react';

  class ErrorBoundary extends Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
      // TODO: Send to error reporting service
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
              <p className="mt-2 text-gray-600">Please refresh the page</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
              >
                Refresh
              </button>
            </div>
          </div>
        );
      }
      return this.props.children;
    }
  }

  export default ErrorBoundary;
  ```
- [x] Wrap `App` component with `ErrorBoundary` in `main.jsx`
- [x] Test by throwing an error in a component
- [x] Add i18n support to error messages

#### 2.4 Improve Authentication Error Messages
- [x] Open `src/hooks/useAuth.js`
- [x] Update error handling to use generic messages:
  ```javascript
  const getAuthErrorMessage = (errorCode) => {
    const genericMessages = {
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/email-already-in-use': 'An account with this email already exists',
    };
    return genericMessages[errorCode] || 'An error occurred. Please try again.';
  };
  ```
- [x] Apply to login and registration flows
- [x] Test that specific user existence isn't leaked

---

### Sprint 3: Code Quality & TypeScript (Week 3-4) <!-- STATUS: ALL COMPLETED by Antigravity (Feb 5, 2026) -->

**Owner:** _________________ **Due Date:** _________________

#### 3.1 Setup Prettier
- [x] Install Prettier: `npm install -D prettier`
- [x] Create `.prettierrc`:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100
  }
  ```
- [x] Create `.prettierignore`:
  ```
  dist
  node_modules
  *.md
  ```
- [x] Add script to `package.json`: `"format": "prettier --write \"src/**/*.{js,jsx,ts,tsx}\""`
- [x] Run `npm run format` to format all files
- [x] Commit formatting changes separately
- [x] Add Prettier to ESLint config for consistency

#### 3.2 Enable TypeScript Strict Mode (Incremental)
- [x] Update `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true
    }
  }
  ```
- [x] Fix type errors one file at a time (start with services)
- [x] Priority files to migrate:
  - [x] `src/services/transactions.service.js` → `.ts`
  - [x] `src/services/budgets.service.js` → `.ts`
  - [x] `src/services/assets.service.js` → `.ts`
  - [x] `src/hooks/useBudgetData.js` → `.ts` 
  - [x] `src/store/useBudgetStore.js` → `.ts`
- [x] Create shared types file: `src/types/index.ts`
- [x] Add TypeScript ESLint rules

#### 3.3 Add Import Sorting
- [x] Install plugin: `npm install -D eslint-plugin-import`
- [x] Update ESLint config with import rules:
  ```javascript
  {
    "plugins": ["import"],
    "rules": {
      "import/order": ["error", {
        "groups": ["builtin", "external", "internal", "parent", "sibling"],
        "newlines-between": "always",
        "alphabetize": { "order": "asc" }
      }]
    }
  }
  ```
- [x] Run `npm run lint -- --fix` to auto-fix
- [x] Verify imports are properly sorted

#### 3.4 Add Accessibility Linting
- [x] Install: `npm install -D eslint-plugin-jsx-a11y`
- [x] Add to ESLint config:
  ```javascript
  {
    "extends": ["plugin:jsx-a11y/recommended"]
  }
  ```
- [x] Run lint and fix accessibility issues
- [x] Priority fixes:
  - [x] Add alt text to images
  - [x] Add labels to form inputs
  - [x] Ensure color contrast meets WCAG AA
  - [x] Add keyboard navigation to custom components

---

### Sprint 4: Testing Foundation (Week 5-6) <!-- STATUS: ALL COMPLETED by Antigravity (Feb 5, 2026) -->

**Owner:** Antigravity **Due Date:** Feb 5, 2026

#### 4.1 Setup Testing Infrastructure
- [x] Verify Vitest configuration in `vite.config.js`
- [x] Create `src/__tests__/` directory structure
- [x] Create mock setup file: `src/__mocks__/firebase.js`
- [x] Add coverage script: `"test:coverage": "vitest --coverage"`
- [x] Install coverage reporter: `npm install -D @vitest/coverage-v8`

#### 4.2 Write Service Tests
- [x] Create `src/__tests__/unit/services/transactions.test.js`
- [x] Achieve 80% coverage on `transactions.service.ts`
- [x] Create tests for `budgets.service.ts`
- [x] Create tests for `assets.service.js`
- [x] Create tests for `loans.service.js`

#### 4.3 Write Hook Tests
- [x] Create `src/__tests__/unit/hooks/useAuth.test.js`
- [x] Create `src/__tests__/unit/hooks/useBudgetData.test.js`
- [x] Create `src/__tests__/unit/hooks/useCurrencyConversion.test.js`
- [x] Test currency conversion accuracy
- [x] Test authentication state management

#### 4.4 Write Utility Tests
- [x] Create tests for `src/utils/currencyUtils.js`
- [x] Create tests for `src/utils/revolutParser.js`
- [x] Create tests for `src/utils/dateUtils.js`
- [x] Achieve 90% coverage on utility functions

#### 4.5 Write Component Tests
- [x] Create `src/__tests__/components/TransactionModal.test.jsx`
- [x] Create `src/__tests__/components/TransactionItem.test.jsx`
- [x] Test form validation
- [x] Test user interactions
- [x] Add snapshot tests for UI stability

#### 4.6 Setup CI/CD Testing
- [x] Create `.github/workflows/test.yml`
- [x] Add branch protection rules requiring tests to pass
- [x] Add coverage badge to README

---

### Sprint 5: Performance & Documentation (Week 7-8) <!-- STATUS: PARTIALLY COMPLETED (Memoization, Bundle Analysis, Docs) by Antigravity (Feb 5, 2026) -->

**Owner:** Antigravity **Due Date:** Feb 5, 2026

#### 5.1 Add React Performance Optimizations
- [x] Add `React.memo` to list item components:
  - [x] `TransactionItem.jsx`
  - [x] `AssetItem.jsx`
  - [x] `LoanItem.jsx`
  - [x] `CategoryItem.jsx`
- [x] Add `useCallback` to event handlers in parent components
- [x] Review and optimize `useMemo` usage
- [x] Use React DevTools Profiler to identify re-renders
- [ ] Add virtualization for long lists (react-window)

#### 5.2 Add Bundle Analysis
- [x] Install: `npm install -D rollup-plugin-visualizer`
- [x] Update `vite.config.js`:
  ```javascript
  import { visualizer } from 'rollup-plugin-visualizer';

  export default defineConfig({
    plugins: [
      // ... other plugins
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
      }),
    ],
  });
  ```
- [x] Run `npm run build` and analyze bundle
- [x] Identify and optimize large dependencies
- [x] Consider lazy loading heavy components

#### 5.3 Add Image Optimization
- [ ] Audit all images in `public/` and `src/assets/`
- [ ] Convert images to WebP format
- [ ] Add lazy loading to images:
  ```jsx
  <img loading="lazy" src="..." alt="..." />
  ```
- [ ] Add proper image dimensions to prevent layout shift
- [ ] Consider using a CDN for images

#### 5.4 Create Architecture Documentation
- [x] Create `docs/ARCHITECTURE.md`:
  - [x] High-level system overview
  - [x] Component hierarchy diagram
  - [x] Data flow diagrams
  - [x] State management patterns
  - [x] Firestore schema documentation
  - [x] API integration details
- [x] Create `docs/CONTRIBUTING.md`:
  - [x] Development setup instructions
  - [x] Code style guide
  - [x] PR process
  - [x] Testing requirements
- [x] Update `README.md`:
  - [x] Feature overview
  - [x] Quick start guide
  - [x] Environment setup
  - [x] Deployment instructions

#### 5.5 Add API Documentation
- [ ] Document Cloud Functions API:
  - [ ] `/monobank` endpoint
  - [ ] `/categorize` endpoint
- [ ] Document Firestore collections and fields
- [ ] Add JSDoc comments to all service functions
- [ ] Generate documentation from JSDoc (optional)

---

### Sprint 6: Accessibility & i18n (Week 9-10) <!-- STATUS: ALL COMPLETED by Antigravity (Feb 5, 2026) -->

**Owner:** Antigravity **Due Date:** Feb 5, 2026

#### 6.1 WCAG Compliance Audit
- [x] Run automated accessibility audit (axe, Lighthouse)
- [x] Test with keyboard-only navigation
- [x] Test with screen reader (VoiceOver, NVDA)
- [x] Check color contrast ratios (4.5:1 minimum)
- [x] Verify focus indicators are visible
- [x] Document and fix all issues

#### 6.2 Keyboard Navigation
- [x] Ensure all interactive elements are focusable
- [ ] Add keyboard shortcuts for common actions:
  - [ ] `N` - New transaction
  - [ ] `Esc` - Close modals
  - [ ] `Tab` - Navigate between fields
- [x] Add skip links for main content
- [x] Test tab order is logical

#### 6.3 Screen Reader Support
- [x] Add `aria-label` to all icon-only buttons
- [x] Add `aria-describedby` for form error messages
- [x] Add `role` attributes where needed
- [x] Add `aria-live` regions for dynamic content
- [x] Test with actual screen readers

#### 6.4 Add More Languages
- [x] Create `src/locales/pl.js` (Polish)
- [ ] Create `src/locales/de.json` (German) - optional
- [x] Add language selector in settings
- [x] Ensure all strings are externalized
- [ ] Test RTL support if adding Arabic/Hebrew

---

### Maintenance Checklist (Ongoing)

#### Weekly Tasks
- [ ] Run `npm audit` and address new vulnerabilities
- [ ] Review and merge dependabot PRs
- [ ] Check Firebase usage and costs
- [ ] Review error logs and fix issues

#### Monthly Tasks
- [ ] Run full accessibility audit
- [ ] Review and update dependencies
- [ ] Performance profiling and optimization
- [ ] Security headers review
- [ ] Backup Firestore data

#### Quarterly Tasks
- [ ] Full security audit
- [ ] Dependency major version updates
- [ ] Code quality metrics review
- [ ] Documentation review and updates
- [ ] User feedback review and prioritization

---

## 14. Future Features Roadmap

This section outlines potential features for future development, organized by category and complexity.

---

### 14.1 High-Value Features (Recommended Next)

#### 14.1.1 Recurring Transactions
**Complexity:** Medium | **Impact:** High

**Description:** Automatically create transactions on a schedule (daily, weekly, monthly, yearly).

**Implementation:**
- [ ] Add `recurringTransactions` collection
- [ ] Fields: `amount`, `category`, `frequency`, `nextDate`, `endDate`
- [ ] Create Cloud Function to process recurring transactions daily
- [ ] Add UI for managing recurring transactions
- [ ] Support for subscriptions, salaries, rent, etc.

**User Value:** Reduces manual entry, better budget forecasting

---

#### 14.1.2 Budget Goals & Limits
**Complexity:** Medium | **Impact:** High

**Description:** Set spending limits per category and track progress.

**Implementation:**
- [ ] Add `budgetGoals` collection with monthly limits per category
- [ ] Create progress tracking (spent vs. limit)
- [ ] Add visual indicators (progress bars, alerts)
- [ ] Push notifications when approaching/exceeding limits
- [ ] Monthly rollover options

**User Value:** Helps control spending, achieve savings goals

---

#### 14.1.3 Data Export & Reports
**Complexity:** Low | **Impact:** High

**Description:** Export transactions and generate financial reports.

**Implementation:**
- [ ] CSV export for all transactions
- [ ] PDF monthly/yearly reports
- [ ] Charts export as images
- [ ] Tax-friendly export formats
- [ ] Email scheduled reports

**User Value:** Tax preparation, financial planning, backup

---

#### 14.1.4 More Bank Integrations
**Complexity:** High | **Impact:** High

**Description:** Add support for additional banks and financial services.

**Candidates:**
- [ ] PrivatBank (Ukraine)
- [ ] Revolut API (direct integration)
- [ ] Wise (TransferWise) API
- [ ] Open Banking (EU PSD2)
- [ ] Plaid (US banks)

**Implementation:**
- [ ] Abstract bank integration interface
- [ ] OAuth flows for each provider
- [ ] Transaction normalization layer
- [ ] Rate limiting and error handling

---

#### 14.1.5 Mobile App (React Native)
**Complexity:** High | **Impact:** Very High

**Description:** Native mobile experience with offline support.

**Options:**
- [ ] React Native (code sharing with web)
- [ ] Capacitor wrapper (quick, uses existing code)
- [ ] PWA improvements (current approach)

**Features:**
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Camera for receipt scanning
- [ ] Widgets for quick balance view
- [ ] Apple/Google Pay integration

---

### 14.2 Medium-Value Features (Future Sprints)

#### 14.2.1 Receipt Scanning (OCR)
**Complexity:** Medium | **Impact:** Medium

**Description:** Scan receipts to auto-fill transaction details.

**Implementation:**
- [ ] Integrate Google Cloud Vision or AWS Textract
- [ ] Extract: amount, date, merchant, items
- [ ] Store receipt images in Firebase Storage
- [ ] Link receipts to transactions

---

#### 14.2.2 Financial Insights & Analytics
**Complexity:** Medium | **Impact:** Medium

**Description:** AI-powered financial insights and recommendations.

**Features:**
- [ ] Spending pattern analysis
- [ ] Anomaly detection (unusual spending)
- [ ] Savings opportunities identification
- [ ] Bill negotiation suggestions
- [ ] Subscription tracking and optimization

---

#### 14.2.3 Savings Goals
**Complexity:** Low | **Impact:** Medium

**Description:** Track progress toward specific savings goals.

**Implementation:**
- [ ] Create `savingsGoals` collection
- [ ] Visual progress tracking
- [ ] Auto-allocation rules
- [ ] Milestone celebrations
- [ ] Share goals with family budget members

---

#### 14.2.4 Split Expenses
**Complexity:** Medium | **Impact:** Medium

**Description:** Split transactions among budget members.

**Implementation:**
- [ ] Mark transactions as "split"
- [ ] Assign portions to members
- [ ] Track who owes what
- [ ] Settlement tracking
- [ ] Integration with Splitwise-style calculations

---

#### 14.2.5 Investment Tracking Enhancements
**Complexity:** Medium | **Impact:** Medium

**Description:** Enhanced investment portfolio tracking.

**Features:**
- [ ] Stock price real-time updates
- [ ] Portfolio performance charts
- [ ] Dividend tracking
- [ ] Cost basis calculations
- [ ] Integration with brokerages (read-only)

---

#### 14.2.6 Bill Reminders & Payments
**Complexity:** Low | **Impact:** Medium

**Description:** Track and remind about upcoming bills.

**Features:**
- [ ] Bill calendar view
- [ ] Push/email reminders
- [ ] Mark as paid functionality
- [ ] Recurring bill templates
- [ ] Integration with recurring transactions

---

### 14.3 Nice-to-Have Features (Backlog)

#### 14.3.1 Multi-Account Support
- [ ] Multiple bank accounts per budget
- [ ] Transfer tracking between accounts
- [ ] Consolidated net worth view
- [ ] Account reconciliation

#### 14.3.2 Tags & Custom Fields
- [ ] User-defined tags for transactions
- [ ] Custom metadata fields
- [ ] Advanced filtering by tags
- [ ] Tag-based reports

#### 14.3.3 Collaboration Features
- [ ] Comments on transactions
- [ ] Activity feed
- [ ] @mentions for family members
- [ ] Approval workflows for large purchases

#### 14.3.4 Debt Payoff Planner
- [ ] Debt snowball/avalanche calculator
- [ ] Payment schedule optimization
- [ ] Interest savings projections
- [ ] Multiple debt comparison

#### 14.3.5 Tax Estimation
- [ ] Income tax estimation
- [ ] Deductible expense tracking
- [ ] Tax category mapping
- [ ] Country-specific tax rules

#### 14.3.6 Currency Conversion Improvements
- [ ] Historical exchange rates
- [ ] Multi-currency transactions
- [ ] Forex gain/loss tracking
- [ ] Custom exchange rate overrides

#### 14.3.7 Data Visualization Enhancements
- [ ] Sankey diagrams (income flow)
- [ ] Heat maps (spending by day)
- [ ] Comparison views (month vs month)
- [ ] Custom date range reports
- [ ] Trend predictions

#### 14.3.8 Gamification
- [ ] Achievement badges
- [ ] Savings streaks
- [ ] Budget challenges
- [ ] Leaderboards (family budgets)
- [ ] Financial health score

#### 14.3.9 Voice Commands
- [ ] "Add expense $50 for groceries"
- [ ] "What's my balance?"
- [ ] "Show this month's spending"
- [ ] Integration with Google Assistant/Siri

#### 14.3.10 API & Webhooks
- [ ] Public API for integrations
- [ ] Webhook notifications
- [ ] Zapier/IFTTT integration
- [ ] Export to Google Sheets

---

### 14.4 Technical Debt & Improvements

#### 14.4.1 Full TypeScript Migration
- [ ] Convert all `.js` files to `.ts`
- [ ] Add strict type checking
- [ ] Create comprehensive type definitions
- [ ] Use Zod for runtime validation

#### 14.4.2 State Management Refactor
- [ ] Evaluate React Query for server state
- [ ] Optimize Zustand store structure
- [ ] Add state persistence layer
- [ ] Improve offline support

#### 14.4.3 Testing Coverage
- [ ] Achieve 80% code coverage
- [ ] Add E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance testing

#### 14.4.4 Design System
- [ ] Create component library
- [ ] Add Storybook for documentation
- [ ] Design tokens for theming
- [ ] Animation system

#### 14.4.5 Performance Optimization
- [ ] Server-side rendering (Next.js migration?)
- [ ] Edge caching
- [ ] Database query optimization
- [ ] Asset optimization pipeline

---

### 14.5 Feature Prioritization Matrix

| Feature | Impact | Effort | Priority Score |
|---------|--------|--------|----------------|
| Recurring Transactions | High | Medium | ⭐⭐⭐⭐⭐ |
| Budget Goals & Limits | High | Medium | ⭐⭐⭐⭐⭐ |
| Data Export | High | Low | ⭐⭐⭐⭐⭐ |
| Bank Integrations | High | High | ⭐⭐⭐⭐ |
| Receipt Scanning | Medium | Medium | ⭐⭐⭐ |
| Financial Insights | Medium | Medium | ⭐⭐⭐ |
| Savings Goals | Medium | Low | ⭐⭐⭐⭐ |
| Split Expenses | Medium | Medium | ⭐⭐⭐ |
| Mobile App | Very High | High | ⭐⭐⭐⭐ |
| Investment Enhancements | Medium | Medium | ⭐⭐⭐ |
| Bill Reminders | Medium | Low | ⭐⭐⭐⭐ |
| Full TypeScript | Low | High | ⭐⭐ |
| E2E Testing | Medium | Medium | ⭐⭐⭐ |

---

### 14.6 Recommended Feature Roadmap

#### Q1 2026 (Now - March)
1. ✅ Security fixes (Sprint 1-2)
2. ✅ Code quality improvements (Sprint 3-4)
3. ✅ Accessibility & i18n (Sprint 6)
4. 🔲 Recurring transactions
5. 🔲 Budget goals & limits

#### Q2 2026 (April - June)
1. 🔲 Data export & reports
2. 🔲 Bill reminders
3. 🔲 Savings goals
4. 🔲 PrivatBank integration

#### Q3 2026 (July - September)
1. 🔲 Receipt scanning
2. 🔲 Financial insights
3. 🔲 Split expenses
4. 🔲 PWA improvements / Capacitor app

#### Q4 2026 (October - December)
1. 🔲 Advanced analytics
2. 🔲 More bank integrations
3. 🔲 Performance optimizations
4. 🔲 Full TypeScript migration

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
