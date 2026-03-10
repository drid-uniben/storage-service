# Storage Abstraction Service

API-first object storage backend built with modular Express, TypeScript, PostgreSQL (Prisma), and VPS-mounted disk storage.

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

## Required Env

- `DATABASE_URL` PostgreSQL connection string
- `STORAGE_ROOT` absolute path where files are written (default: `/data/storage`)
- `API_KEY_RATE_LIMIT_PER_MINUTE` set `0` to disable rate limiting

## Optional Dev Env

- `SHADOW_DATABASE_URL` only needed for Prisma development migrations (`prisma migrate dev`)

Redis is not required in the current architecture.

## Core Endpoints

- `POST /auth/keys` create an account + API key
- `POST /objects/store` queue object storage to local disk (requires `x-api-key`)
- `GET /objects/:id` check object status (requires `x-api-key`)
- `POST /webhooks` register webhook endpoint (requires `x-api-key`)

## Architecture Highlights

- Modular structure with route/service/middleware separation
- Asynchronous background processing to a mounted disk path (`STORAGE_ROOT`)
- Hashed API key auth + in-memory rate limit
- Storage attempt logging and webhook event emission
