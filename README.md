# Bravechat

Bravechat is a highly scalable, real-time communication platform engineered for communities, teams, and friends. Built with a modern monolithic-repo architecture, it delivers a seamless and secure messaging experience with a distinct Swiss Modern Minimalist design language.

**Authors**: [Bravee9](https://github.com/Bravee9) & [Shuji7245](https://github.com/Shuji7245)

---

## Architecture & Technology Stack

Bravechat utilizes a Turborepo-based monorepo structure to share types and configurations across the frontend and backend efficiently.

### Frontend (Web Application)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS (Custom Ocean Swiss Minimalist Design System)
- **State Management & Validation**: Zod, React Hook Form

### Backend (API & Real-time Server)
- **Core Framework**: Fastify (Node.js)
- **Database ORM**: Prisma
- **Real-time Engine**: Socket.io with Redis Pub/Sub Adapter
- **Authentication**: JWT-based with HttpOnly cookies and Refresh Token rotation

### Infrastructure & Storage
- **Database**: PostgreSQL 16
- **Caching**: Redis 7
- **Object Storage**: Cloudflare R2 (S3-compatible API for media storage)
- **Containerization**: Docker & Docker Compose

---

## Project Structure

```text
discord/
├── apps/
│   ├── web/          # Next.js 14 frontend client (Port 3000)
│   └── api/          # Fastify REST & WebSocket server (Port 4000)
├── packages/
│   ├── shared/       # Shared TypeScript interfaces and utility functions
│   └── database/     # Prisma schema, migrations, and seed data
├── docs/             # Technical specifications and architecture decisions
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Docker and Docker Compose

### 1. Installation
Clone the repository and install dependencies using pnpm workspaces:
```bash
git clone https://github.com/Bravee9/Bravechat.git
cd Bravechat
pnpm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory based on the provided example:
```bash
cp .env.example .env
```
Update the `.env` file with your specific Cloudflare R2 credentials and JWT secrets.

### 3. Start Infrastructure
Launch the PostgreSQL and Redis containers:
```bash
docker-compose up -d
```

### 4. Database Initialization
Run Prisma migrations to set up the database schema and seed initial data:
```bash
cd packages/database
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

### 5. Start Development Servers
Start both the frontend and backend development servers concurrently:
```bash
# From the root directory
pnpm dev
```
- Frontend Application: `http://localhost:3000`
- API Server: `http://localhost:4000`

---

## Technical Documentation

Detailed documentation regarding system design and specific modules can be found in the `/docs` directory:

- [System Architecture](./docs/architecture.md)
- [Database Schema & ERD](./docs/database-schema.md)
- [API & WebSocket Reference](./docs/api-reference.md)
- [Authentication Flow](./docs/auth-flow.md)
- [Cloudflare R2 Integration](./docs/r2-storage.md)

---

## Current Status (Phase 1)

- **User Interface**: Implemented responsive Landing, Login, and Registration pages adhering to the Ocean UI design system.
- **Database**: Designed comprehensive PostgreSQL schema (Users, Servers, Channels, Messages, Direct Messages).
- **Backend Core**: Established Fastify application structure with Zod input validation and rate limiting.
- **Documentation**: Completed core architecture and flow documentation.

## License

This project is licensed under the MIT License.
