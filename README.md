# Storage Abstraction Service

API-first, provider-agnostic object storage backend built with NestJS, TypeScript, PostgreSQL (Prisma), and Redis (BullMQ).

## Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
pnpm install
```

3. Generate Prisma client:

```bash
pnpm prisma:generate
```

4. Run database migrations:

```bash
pnpm prisma:migrate
```

5. Start in development:

```bash
pnpm start:dev
```

## Core Endpoints

- `POST /auth/keys` create an account + API key
- `POST /objects/store` queue object storage (requires `x-api-key`)
- `GET /objects/:id` check object status (requires `x-api-key`)
- `POST /webhooks` register webhook endpoint (requires `x-api-key`)

## Architecture Highlights

- Provider abstraction via `StorageProvider` interface
- Queue-based processing via BullMQ
- Retry + failover strategy in `StorageProcessor` (3 attempts per provider)
- Hashed API key auth + per-key Redis rate limit
- Provider attempt logging and webhook event emission
