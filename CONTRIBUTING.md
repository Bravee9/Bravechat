# Contributing to Bravechat

This document establishes the technical and procedural standards for contributing to the Bravechat codebase. All contributors must adhere to the engineering workflows outlined herein.

---

## 1. Codebase Architecture

Bravechat operates as a high-performance monorepo powered by Turborepo and pnpm workspaces:

- `apps/web`: Next.js 14 App Router application delivering the real-time client experience using Ocean Swiss Minimalist design principles.
- `apps/api`: Fastify backend delivering REST APIs and WebSocket real-time event distribution.
- `packages/shared`: Common domain DTOs, API envelopes, and bi-directional WebSocket event schemas.
- `packages/database`: PostgreSQL schema definitions, Prisma ORM clients, and versioned migrations.

---

## 2. Branching and Release Model

Bravechat adopts a structured Git Flow branching model:

- `main`: Production release branch. Direct commits are restricted. Merges require verified automated test suites and reviewed Pull Requests.
- `dev`: Active integration and staging branch. All feature and maintenance branches branch from and merge into `dev`.
- `feature/*`: New functional capabilities (e.g. `feature/minio-storage-pipeline`).
- `fix/*`: Defect resolutions originating from staging or hotfixes.
- `refactor/*`: Architectural restructurings without behavior alterations.
- `chore/*`: Tooling, build system, CI/CD, or dependency upgrades.
- `docs/*`: Technical documentation and architecture records.

---

## 3. Commit Message Standards

Commit messages must follow the Conventional Commits specification:

```text
<type>(<scope>): <short imperative summary>

[optional body providing technical context]

[optional footer referencing issue numbers]
```

### Supported Types
- `feat`: A new feature or capability.
- `fix`: A bug resolution.
- `docs`: Documentation updates only.
- `style`: Formatting changes that do not affect code logic.
- `refactor`: Code reorganization without functional alteration.
- `perf`: Performance optimization.
- `test`: Addition or modification of automated tests.
- `chore`: Build configuration, auxiliary tools, or dependency maintenance.

---

## 4. Local Development Workflow

### Prerequisites
- Node.js 18.x or 20.x LTS
- pnpm 8.x or later (`npm install -g pnpm`)
- Docker and Docker Compose (PostgreSQL 16, Redis 7, MinIO S3, LiveKit)

### Setup Steps
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/Bravee9/Bravechat.git
   cd Bravechat
   pnpm install
   ```

2. Initialize environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Launch infrastructure containers:
   ```bash
   docker-compose up -d postgres redis
   ```

4. Apply database migrations:
   ```bash
   cd packages/database
   pnpm prisma migrate dev
   cd ../..
   ```

5. Start the development environment:
   ```bash
   pnpm dev
   ```

---

## 5. Quality Verification Checklist

Prior to submitting any Pull Request, ensure the following commands complete without errors:

```bash
# Verify static TypeScript types across all workspaces
pnpm type-check

# Verify ESLint rules
pnpm lint

# Execute frontend unit test suites
pnpm --filter @discord-clone/web test
```

---

## 6. Pull Request Submission

1. Ensure the Pull Request targets the `dev` branch.
2. Complete all sections of `.github/PULL_REQUEST_TEMPLATE.md`.
3. Provide evidence of testing in the verification section.
4. Ensure continuous integration checks pass successfully.
