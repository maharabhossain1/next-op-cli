import { basename } from 'node:path';

import * as p from '@clack/prompts';
import pc from 'picocolors';

import type { ProjectConfig } from './types.js';

function cancelCheck(value: unknown): asserts value is NonNullable<typeof value> {
  if (p.isCancel(value)) {
    p.cancel('Scaffold cancelled.');
    process.exit(0);
  }
}

export async function runPrompts(nameArg?: string): Promise<ProjectConfig> {
  p.intro(pc.bgCyan(pc.black(' next-op-cli ')) + ' ' + pc.dim('Opinionated Next.js scaffolding'));

  // ── Project name ──────────────────────────────────────────────────────────
  const inPlace = nameArg === '.';
  let name: string;
  if (inPlace) {
    name = basename(process.cwd());
    p.log.info(`Project name: ${pc.cyan(name)} ${pc.dim('(current directory)')}`);
  } else if (nameArg) {
    name = nameArg;
    p.log.info(`Project name: ${pc.cyan(name)}`);
  } else {
    const nameInput = await p.text({
      message: 'Project name',
      placeholder: 'my-app',
      validate: val => (val.trim().length === 0 ? 'Project name is required' : undefined),
    });
    cancelCheck(nameInput);
    name = String(nameInput).trim();
  }

  // ── Project type ──────────────────────────────────────────────────────────
  const projectType = await p.select({
    message: 'Project type',
    options: [
      {
        value: 'static',
        label: 'Static site',
        hint: 'No backend — marketing, docs, portfolio',
      },
      {
        value: 'auth-js',
        label: 'Auth.js (Next-Auth v5)',
        hint: 'Social/credentials login, sessions',
      },
      {
        value: 'external-backend',
        label: 'External backend',
        hint: 'REST API — Django, Rails, Express, etc.',
      },
      {
        value: 'fullstack',
        label: 'Fullstack Next.js',
        hint: 'Next.js + Drizzle ORM + DB',
      },
    ],
  });
  cancelCheck(projectType);

  // ── Auth.js providers ─────────────────────────────────────────────────────
  let authProviders: string[] = [];
  if (projectType === 'auth-js') {
    const providers = await p.multiselect({
      message: 'Auth providers',
      options: [
        { value: 'google', label: 'Google' },
        { value: 'github', label: 'GitHub' },
        { value: 'credentials', label: 'Credentials (email + password)' },
      ],
      required: true,
    });
    cancelCheck(providers);
    authProviders = providers as string[];
  }

  // ── External backend auth ─────────────────────────────────────────────────
  let externalAuthStrategy = 'none';
  if (projectType === 'external-backend') {
    const strategy = await p.select({
      message: 'Authentication strategy',
      options: [
        {
          value: 'jwt-tokens',
          label: 'JWT tokens (access + refresh)',
          hint: 'Auto-refresh, token rotation, protected routes',
        },
        {
          value: 'api-key',
          label: 'API key',
          hint: 'Static key in headers',
        },
        {
          value: 'none',
          label: 'No auth',
          hint: 'Public API or handle yourself',
        },
      ],
    });
    cancelCheck(strategy);
    externalAuthStrategy = String(strategy);
  }

  // ── Database (fullstack) ──────────────────────────────────────────────────
  let database: string = 'postgres';
  if (projectType === 'fullstack') {
    const db = await p.select({
      message: 'Database',
      options: [
        { value: 'postgres', label: 'PostgreSQL', hint: 'Production-grade — Supabase, Neon, Railway' },
        { value: 'sqlite', label: 'SQLite', hint: 'Zero-dependency local dev' },
      ],
    });
    cancelCheck(db);
    database = String(db);
  }

  // ── Data fetching ─────────────────────────────────────────────────────────
  let dataFetching = 'none';
  const needsDataFetching = projectType === 'external-backend' || projectType === 'auth-js';
  if (needsDataFetching) {
    const df = await p.select({
      message: 'Client-side data fetching',
      options: [
        { value: 'swr', label: 'SWR', hint: 'Lightweight, great for most apps' },
        {
          value: 'tanstack-query',
          label: 'TanStack Query',
          hint: 'Powerful — mutations, optimistic updates, devtools',
        },
        { value: 'none', label: 'None', hint: 'Server Components + fetch only' },
      ],
    });
    cancelCheck(df);
    dataFetching = String(df);
  }

  // ── State management ──────────────────────────────────────────────────────
  const needsState =
    projectType === 'external-backend' ||
    projectType === 'auth-js' ||
    projectType === 'fullstack';
  let stateManagement = 'none';
  if (needsState) {
    const sm = await p.select({
      message: 'Client-side state management',
      options: [
        {
          value: 'zustand',
          label: 'Zustand',
          hint: 'Recommended — tiny, no boilerplate',
        },
        { value: 'jotai', label: 'Jotai', hint: 'Atomic state — good for fine-grained updates' },
        { value: 'none', label: 'None', hint: 'useState + context only' },
      ],
    });
    cancelCheck(sm);
    stateManagement = String(sm);
  }

  // ── shadcn/ui ─────────────────────────────────────────────────────────────
  const shadcnChoice = await p.confirm({
    message: 'Add shadcn/ui?',
    initialValue: true,
  });
  cancelCheck(shadcnChoice);
  const shadcn = Boolean(shadcnChoice);

  let shadcnPreset = 'init-only';
  if (shadcn) {
    const preset = await p.select({
      message: 'Pre-install shadcn components',
      options: [
        {
          value: 'minimal',
          label: 'Minimal',
          hint: 'button, input, card, dialog, badge, separator',
        },
        {
          value: 'extended',
          label: 'Extended',
          hint: '+ table, select, checkbox, switch, toast, dropdown, avatar, skeleton, tooltip',
        },
        { value: 'init-only', label: 'Init only', hint: 'Just the config, add components later' },
      ],
    });
    cancelCheck(preset);
    shadcnPreset = String(preset);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  const analytics = await p.select({
    message: 'Analytics',
    options: [
      { value: 'none', label: 'None' },
      { value: 'vercel', label: 'Vercel Analytics', hint: 'Zero-config on Vercel' },
      { value: 'posthog', label: 'PostHog', hint: 'Self-hostable, open source' },
    ],
  });
  cancelCheck(analytics);

  // ── PWA ───────────────────────────────────────────────────────────────────
  const pwaChoice = await p.confirm({
    message: 'Add PWA support? (next-pwa)',
    initialValue: false,
  });
  cancelCheck(pwaChoice);

  // ── Package manager ───────────────────────────────────────────────────────
  const pm = await p.select({
    message: 'Package manager',
    options: [
      { value: 'pnpm', label: 'pnpm', hint: 'Recommended — fast, disk-efficient' },
      { value: 'npm', label: 'npm' },
      { value: 'yarn', label: 'Yarn' },
      { value: 'bun', label: 'Bun' },
    ],
  });
  cancelCheck(pm);

  // ── Git ───────────────────────────────────────────────────────────────────
  const gitChoice = await p.confirm({
    message: 'Initialize git?',
    initialValue: true,
  });
  cancelCheck(gitChoice);

  return {
    name,
    projectType: projectType as ProjectConfig['projectType'],
    authProviders: authProviders as ProjectConfig['authProviders'],
    externalAuthStrategy: externalAuthStrategy as ProjectConfig['externalAuthStrategy'],
    database: database as ProjectConfig['database'],
    dataFetching: dataFetching as ProjectConfig['dataFetching'],
    stateManagement: stateManagement as ProjectConfig['stateManagement'],
    shadcn,
    shadcnPreset: shadcnPreset as ProjectConfig['shadcnPreset'],
    analytics: analytics as ProjectConfig['analytics'],
    pwa: Boolean(pwaChoice),
    packageManager: pm as ProjectConfig['packageManager'],
    initGit: Boolean(gitChoice),
    inPlace,
  };
}
