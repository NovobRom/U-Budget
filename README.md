# U-Budget

Personal Finance Progressive Web Application (PWA) with multi-currency support, team budgets, and AI-powered transaction categorization.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)

### Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in your Firebase configuration keys in `.env.local`.

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Deploy
```bash
# Deploy Frontend
npm run build
firebase deploy --only hosting

# Deploy Cloud Functions
firebase deploy --only functions
```

## Security
This project uses environment variables for sensitive configuration. **Never** commit `.env` or `.env.local` files to version control.
