# AprovaJá

Uma plataforma educacional SaaS premium com IA para estudantes brasileiros — ENEM, vestibulares e concursos públicos.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/aprovaja run dev` — run the frontend (port 19323)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Recharts, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/db/src/schema/` — Drizzle schema files (one per domain)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/aprovaja/src/` — React frontend

## Architecture decisions

- Single default user (id=1) with no auth — all routes use DEFAULT_USER_ID=1 for demo
- SM-2 spaced repetition algorithm implemented in the flashcard review route
- AI essay correction is simulated server-side (word count → competência scores)
- Simulado questions are seeded with 5 ENEM-style sample questions; correct answers stored server-side
- Performance log table tracks daily XP/minutes/questions for chart data
- Medals seeded directly via SQL; unlocking via specific triggers

## Product

AprovaJá tem: landing page de marketing, dashboard gamificado (XP, streak, missões diárias), plano de estudos, simulados ENEM, correção de redação por IA, flashcards com repetição espaçada (SM-2), ranking global/semanal, perfil com medalhas, e missões diárias.

## User preferences

- All UI content must be in Brazilian Portuguese
- Code, comments, and dev logic in English
- Premium, futuristic, dark-mode-first design

## Gotchas

- After schema changes: run `pnpm --filter @workspace/db run push`
- After OpenAPI spec changes: run `pnpm --filter @workspace/api-spec run codegen`
- The `simulados/recent-results` route must be defined BEFORE `simulados/:id` in the router (Express 5 path specificity)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
