<p align="center">
  <img src="./apps/web/public/brave-chat.png" alt="Bravechat Logo" width="360" />
</p>

# Bravechat

Bravechat is an enterprise-grade, high-performance real-time communication platform built for communities, engineering teams, and collaborative organizations. The platform is architected as a Turborepo monorepo adhering strictly to Layered Architecture principles, domain-driven contracts, and the Ocean Swiss Minimalist design system.

Authors: [Bravee9](https://github.com/Bravee9) and [Shuji7245](https://github.com/Shuji7245)

---

## System Architecture

Bravechat enforces strict separation of concerns across independent architectural layers. This decoupling enables frontend and backend services to evolve concurrently while sharing type-safe contracts.

```text
+-----------------------------------------------------------------+
|                  SHARED CONTRACTS LAYER                         |
|      packages/shared (Domain DTOs, API Envelopes, WS Events)    |
+--------------------------------+--------------------------------+
                                 |
            +--------------------+--------------------+
            |                                         |
            v                                         v
+-------------------------------+         +-------------------------------+
|      FRONTEND CLIENT (WEB)    |         |       BACKEND SERVICE (API)   |
|            apps/web           |         |             apps/api          |
+-------------------------------+         +-------------------------------+
| Presentation (Next.js 14)     |         | REST Routes & Controllers     |
| Features & UI Components      |         | Business Services             |
| State Stores & Typed Clients  |         | Prisma ORM Repositories       |
| HTTP Client & WS Realtime     |         | Plugins (JWT, S3/R2, WS, Redis|
+-------------------------------+         +---------------+---------------+
                                                          |
                                          +---------------+---------------+
                                          |                               |
                                          v                               v
                          +-------------------------------+ +-------------+-------------+
                          |   PERSISTENCE & CACHE LAYER   | |    OBJECT STORAGE LAYER   |
                          |  PostgreSQL 16 + Redis 7      | |  MinIO S3 / Cloudflare R2 |
                          +-------------------------------+ +---------------------------+
```

### 1. Shared Contracts Layer (`packages/shared`)
- **Domain Data Transfer Objects**: Single source of truth for entity definitions including `CurrentUser`, `ServerListItem`, `ServerDetail`, `Channel`, `DirectConversation`, and `Message`.
- **API Response Envelopes**: Standardized response format `{ statusCode, data, message }` and structured error responses `{ statusCode, error, message, details }`.
- **API Route Map (`API_ROUTES`)**: Centralized endpoint registry ensuring URL consistency between web clients and backend handlers.
- **Realtime Contracts**: Strongly-typed bi-directional WebSocket event schemas (`ClientEvent` and `ServerEvent`).

### 2. Frontend Web Application (`apps/web`)
Built on Next.js 14 App Router with isolated route groups and a persistent multi-layered workspace layout:
- **Route Groups**:
  - `(marketing)`: Public portal, product documentation (`/docs`), service status (`/status`), roadmap (`/roadmap`), and legal disclosures (`/terms`, `/privacy`).
  - `(auth)`: User authentication flows including registration (`/register`), login (`/login`), forgot password (`/forgot-password`), and password reset (`/reset-password`).
  - `(app)`: Core real-time workspace located under `/channels/*`.
- **Three-Layer Workspace Layout**:
  - **Layer 1 - Server Rail (`ServerRail`)**: Persistent left-hand column (`w-[72px]`) located at `apps/web/src/app/(app)/channels/layout.tsx`. Retains mount state across route navigations, displaying server squircle icons, active indicators, and the primary home navigation item.
  - **Layer 2 - Channel Sidebar (`ServerChannelSidebar` / `DmSidebar`)**: Contextual secondary navigation located at `apps/web/src/app/(app)/channels/[serverId]/layout.tsx` displaying voice/text channels, active direct conversations, and the persistent user control dock.
  - **Layer 3 - Main Chat View (`ChatView`)**: Primary communication viewport located at `apps/web/src/app/(app)/channels/[serverId]/[channelId]/page.tsx`. Manages room-scoped WebSocket streams, optimistic message dispatch, media attachments, reactions, thread replies, and the contextual member directory.

### 3. Backend API Service (`apps/api`)
High-performance REST API and WebSocket daemon powered by Fastify:
- **Fastify Core**: Optimized request pipeline with custom JWT authentication hooks and strict rate-limiting policies.
- **WebSocket Gateway**: Distributed channel and direct message multiplexer with Redis Pub/Sub backplane.
- **Hybrid Object Storage Engine**: S3-compatible storage abstraction supporting both local self-hosted MinIO and Cloudflare R2.
- **Relational Data Layer**: PostgreSQL 16 managed via Prisma ORM with version-controlled migrations.

---

## Enterprise Git Flow Strategy

Development follows a structured branching strategy to maintain stability across integration environments:

| Branch | Purpose and Governance |
| :--- | :--- |
| `main` | Production release branch. Accepts merges exclusively from `dev` following full test suite verification. |
| `dev` | Integration and staging branch. All functional changes and refactors converge here. |
| `feature/*` | Feature development branches (e.g. `feature/storage-minio-multimedia`, `feature/user-settings-2fa`). |
| `fix/*` | Defect resolutions and security patches. |
| `refactor/*` | Codebase restructuring and optimization without functional change. |
| `chore/*` | Infrastructure, dependencies, governance templates, and CI/CD automation. |
| `docs/*` | Technical documentation, architecture decision records, and API specifications. |

---

## Repository Structure

```text
Bravechat/
|-- .github/
|   |-- ISSUE_TEMPLATE/               # Standardized issue templates
|   |-- PULL_REQUEST_TEMPLATE.md      # Pull request review template
|   `-- workflows/ci.yml              # Automated continuous integration pipeline
|-- apps/
|   |-- web/                          # Next.js 14 frontend client (Port 3000)
|   |   |-- src/
|   |   |   |-- app/                  # App router pages and layouts
|   |   |   |-- components/           # Reusable UI primitives and design components
|   |   |   |-- features/             # Domain modules (auth, channels, messages, servers, members)
|   |   |   |-- services/             # HTTP client and API integration layer
|   |   |   |-- stores/               # Client-side state stores and audio controls
|   |   |   `-- test/                 # Component and interaction unit test suites
|   |   `-- package.json
|   `-- api/                          # Fastify REST API and WebSocket server (Port 4000)
|       |-- src/
|       |   |-- config/               # Environment, Prisma, and Redis configuration
|       |   |-- plugins/              # Authentication, rate limit, and storage plugins
|       |   |-- routes/               # REST and WebSocket route definitions
|       |   `-- services/             # Core business logic and storage service
|       `-- package.json
|-- packages/
|   |-- shared/                       # Cross-workspace contracts and DTOs
|   |   |-- src/
|   |   |   |-- api/                  # API routes and response envelopes
|   |   |   |-- domain/               # Domain entity schemas
|   |   |   `-- realtime/             # WebSocket event definitions
|   |   `-- package.json
|   `-- database/                     # Database layer
|       |-- prisma/
|       |   |-- schema.prisma         # Relational schema specification
|       |   `-- migrations/           # Database migration history
|       `-- package.json
|-- assets/                           # Brand graphics and multimedia assets
|-- docs/                             # Technical documentation and ADRs
|-- docker-compose.yml                # Multi-container local infrastructure stack
|-- livekit.yaml                      # LiveKit SFU configuration
|-- nginx.conf                        # Reverse proxy gateway configuration
|-- turbo.json                        # Turborepo task graph pipeline
`-- pnpm-workspace.yaml               # Monorepo workspace configuration
```

---

## Getting Started

### Prerequisites
- Node.js 18.x or 20.x LTS
- pnpm 8.x or higher (`npm install -g pnpm`)
- Docker and Docker Compose

### 1. Clone Repository and Install Dependencies
```bash
git clone https://github.com/Bravee9/Bravechat.git
cd Bravechat
pnpm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
```

Verify or configure the environment variables:
```env
DATABASE_URL=postgresql://discord_user:discord_secret_2024@localhost:5432/discord_db
REDIS_URL=redis://:redis_secret_2024@localhost:6379
JWT_SECRET=super_secret_jwt_key_that_is_at_least_32_chars_long
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000/api/ws
```

### 3. Launch Infrastructure Services
Start the PostgreSQL database, Redis broker, and MinIO storage services:
```bash
docker-compose up -d postgres redis
```

### 4. Initialize Database Schema
Generate the Prisma Client and execute migrations:
```bash
cd packages/database
pnpm prisma migrate dev
cd ../..
```

### 5. Launch Development Services
Start both frontend and backend processes via Turborepo:
```bash
pnpm dev
```

- Web Client: http://localhost:3000
- API Gateway: http://localhost:4000
- Health Check: http://localhost:4000/health

---

## Code Quality and Verification

Run the full verification suite before committing changes:

```bash
# Verify TypeScript compilation across all packages
pnpm type-check

# Verify ESLint rules
pnpm lint

# Execute frontend unit test suites
pnpm --filter @discord-clone/web test
```

---

## License

This project is licensed under the MIT License. Contributions are governed according to [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
