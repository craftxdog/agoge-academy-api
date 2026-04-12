# Contributing to AGOGE ACADEMY API Starter

Thank you for contributing! This project follows a structured workflow to ensure code quality, scalability, and maintainability.

---

# 🧭 Git Workflow (GitFlow)

We follow a GitFlow-based branching strategy:

## Branches

- `main` → Production
- `develop` → Integration branch
- `feature/*` → New features
- `fix/*` → Bug fixes
- `hotfix/*` → Critical production fixes
- `release/*` → Release preparation

---

## 🔄 Workflow

### Feature Development

```bash
git checkout develop
git pull
git checkout -b feature/feature-name
```

- Work on your feature
- Use conventional commits
- Push and create PR → `develop`

---

### Bug Fixes

```bash
git checkout develop
git checkout -b fix/bug-name
```

---

### Hotfix (Production)

```bash
git checkout main
git checkout -b hotfix/critical-bug
```

Must be merged into:

- `main`
- `develop`

---

### Release Process

```bash
git checkout develop
git checkout -b release/x.x.x
```

Steps:

1. Update `CHANGELOG.md`
2. Update version (package.json)
3. Run tests and lint
4. Merge into `main`
5. Tag version:

   ```bash
   git tag vX.X.X
   ```

6. Merge back into `develop`

---

# 🔍 Pull Request Rules

- Target branch: `develop`
- CI must pass (lint, build, test)
- Minimum 1 approval required
- No direct push to `main` or `develop`
- PR must include:
  - Description
  - Type of change
  - Testing instructions

---

# 🧾 Commit Convention

We use **Conventional Commits**:

```
type(scope): subject
```

## Types

- feat → New feature
- fix → Bug fix
- docs → Documentation
- refactor → Code improvement
- test → Tests
- chore → Maintenance

## Examples

```
feat(auth): add refresh token support
fix(users): resolve pagination bug
docs(api): update versioning guide
```

---

# 🧪 Development Setup

```bash
git clone git@github.com:craftxdog/agoge-academy-api.git
cd agoge-academy-api

npm install
cp .env.example .env

npm run prisma:migrate:dev
npm run start:dev
```

---

# 🧪 Testing Requirements

- Unit tests for services
- E2E tests for endpoints
- Minimum coverage: **80%**
- All tests must pass before PR

---

# 🧱 Coding Standards

- TypeScript strict mode
- Clean architecture (modules / shared / common)
- Use dependency injection
- Small, focused functions
- No business logic in `common/`

---

# 🔐 Security Rules

- Never trust client input
- Always validate ownership (even with @CurrentUser)
- Do not expose sensitive data

---

# ⚠️ Breaking Changes

- Must create new API version (`/v2`, etc.)
- Must be documented
- Must include migration notes

---

# 📦 Versioning

We follow **Semantic Versioning**:

- MAJOR → Breaking changes
- MINOR → New features
- PATCH → Bug fixes

---

# 📩 Questions

Open an issue or contact maintainers.

---

# 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.
