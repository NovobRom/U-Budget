# Contributing to U-Budget

Thank you for your interest in contributing to U-Budget! This document outlines the process for contributing to the project.

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd smart-budget
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   - Copy `.env.example` to `.env.local`.
   - Populate with your Firebase configuration.

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Coding Standards

- **Language**: TypeScript is preferred for new code. JavaScript is supported for existing files until migrated.
- **Formatting**: We use Prettier. Run `npm run format` to automatically format your code.
- **Linting**: We use ESLint. Run `npm run lint` to check for issues.

## Testing

- We use **Vitest** for unit testing.
- Run tests before pushing:
  ```bash
  npm test
  ```
- Adding new features? Please add corresponding unit tests in `src/__tests__`.

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/my-new-feature`
2. Commit your changes: `git commit -m 'Add some feature'`
3. Push to the branch: `git push origin feature/my-new-feature`
4. Submit a pull request.

## Architecture

Please refer to `ARCHITECTURE.md` for an overview of the project structure and data model.
