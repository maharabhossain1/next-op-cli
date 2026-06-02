# next-op-cli

Opinionated Next.js scaffolding CLI — spins up a fully-configured project in seconds.

## What it sets up

Every project gets:

- **Next.js 16** with App Router + Turbopack
- **React 19** with React Compiler enabled
- **TypeScript** strict mode + `@/` alias
- **Tailwind CSS v4** with `@theme` tokens
- **ESLint 9** flat config — typescript-eslint, react-hooks, unicorn, import-x, prettier
- **Prettier** — single quotes, 100 width, trailing commas
- **Husky** pre-commit hook — lint-staged + `tsc --noEmit`
- **next.config.ts** — security headers, bundle analyzer, aggressive caching
- **config/env.ts** — Zod-validated env vars
- **config/site.ts** — site metadata
- **lib/utils.ts** — `cn()` helper
- **types/** — `ApiResponse`, `NavItem`, `BreadcrumbItem`

## Project types

| Type | What you get |
|---|---|
| **Static site** | Base setup, no auth, no backend |
| **Auth.js** | NextAuth v5 — Google/GitHub/Credentials, sessions, protected routes |
| **External backend** | JWT access+refresh token rotation, auto-refresh on 401, or API key |
| **Fullstack** | Drizzle ORM + PostgreSQL/SQLite + Auth.js DrizzleAdapter |

## Options

- **Auth providers** (Auth.js): Google, GitHub, Credentials (bcrypt)
- **Auth strategy** (external backend): JWT tokens (auto-refresh) | API key | none
- **Data fetching**: SWR | TanStack Query | none
- **State management**: Zustand | Jotai | none
- **shadcn/ui**: minimal (6 components) | extended (16 components) | init only
- **Analytics**: Vercel Analytics | PostHog | none
- **PWA**: next-pwa
- **Package manager**: pnpm (recommended) | npm | yarn | bun

## Usage

```bash
# with pnpm
pnpm dlx next-op-cli my-app

# with npm/npx
npx next-op-cli my-app

# interactive (prompts for project name)
pnpm dlx next-op-cli
```

## Local development

```bash
pnpm install
pnpm build          # compiles to dist/
node dist/index.js my-test-app  # test it
```

## Publishing

```bash
# bump version in package.json, then:
npm publish --access public
```

## JWT token auth pattern

When you choose **External backend + JWT tokens**, the generated project implements:

1. **Access token** — stored in Zustand (in-memory, never localStorage)
2. **Refresh token** — stored in localStorage (set refresh in httpOnly cookie on your backend for higher security)
3. **`lib/api.ts`** — fetch wrapper that auto-refreshes the access token on 401, queues concurrent requests during refresh
4. **`lib/services/auth.service.ts`** — `login()`, `logout()`, `initAuth()` (called on app mount to restore session from refresh token)
5. **`components/layout/auth-guard.tsx`** — client-side route guard that calls `initAuth()` and redirects to `/login` if unauthenticated

The default token endpoint paths follow Django SimpleJWT convention (`/auth/token/`, `/auth/token/refresh/`, `/auth/token/blacklist/`). Update them in `lib/api.ts` and `lib/services/auth.service.ts` to match your backend.

## Project structure generated

```
my-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   └── layout.tsx
│   ├── api/auth/[...nextauth]/route.ts  (if auth)
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/          (shadcn components)
│   ├── layout/      (AuthGuard, etc.)
│   └── features/
├── hooks/
├── lib/
│   ├── api.ts       (API client)
│   ├── auth/        (password utils)
│   ├── db/          (Drizzle — fullstack only)
│   ├── services/    (auth.service.ts)
│   └── utils.ts
├── store/           (Zustand)
├── types/
├── config/
│   ├── env.ts
│   └── site.ts
├── public/
├── auth.ts          (NextAuth config — if auth)
├── middleware.ts    (route protection)
├── drizzle.config.ts (fullstack only)
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── .env.example
```
