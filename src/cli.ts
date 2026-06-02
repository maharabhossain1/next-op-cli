import { join } from 'node:path';

import * as p from '@clack/prompts';
import fs from 'fs-extra';
import pc from 'picocolors';

import type { ProjectConfig } from './types.js';
import { logger } from './logger.js';
import { getInstallCmd, getPmRunner, run } from './runner.js';
import {
  apiClient,
  apiKeyClient,
  apiTypes,
  authConfig,
  authGuard,
  authLayout,
  authRoute,
  authService,
  authStore,
  baseFetchClient,
  componentsJson,
  dashboardLayout,
  dashboardLayoutWithAuth,
  dashboardPage,
  dbClient,
  drizzleConfig,
  envConfig,
  envExample,
  eslintConfig,
  generatePackageJson,
  getComponentsForPreset,
  gitignore,
  globalsCss,
  huskyPreCommit,
  libUtils,
  loginPage,
  loginPageExternal,
  middleware,
  nextAuthDts,
  nextConfig,
  notFound,
  npmrc,
  nvmrc,
  nvmrc as _nvmrc,
  passwordUtils,
  postcssConfig,
  prettierrc,
  queryHookExample,
  queryProvider,
  rootLayout,
  rootPage,
  schemaIndex,
  siteConfig,
  storeIndex,
  swrConfig,
  swrHookExample,
  tokenMiddleware,
  tsconfig,
  typesIndex,
  uiStore,
  uiTypes,
  usersSchema,
} from './generators/index.js';

type FileMap = Map<string, string>;

async function writeFiles(dir: string, files: FileMap): Promise<void> {
  for (const [path, content] of files) {
    const fullPath = join(dir, path);
    await fs.ensureDir(join(dir, path.split('/').slice(0, -1).join('/')));
    await fs.writeFile(fullPath, content, 'utf-8');
  }
}

async function ensureDirs(dir: string, dirs: string[]): Promise<void> {
  for (const d of dirs) {
    await fs.ensureDir(join(dir, d));
    await fs.writeFile(join(dir, d, '.gitkeep'), '');
  }
}

function collectFiles(config: ProjectConfig): FileMap {
  const files = new Map<string, string>();
  const { projectType, stateManagement, dataFetching } = config;

  // ── Base config ───────────────────────────────────────────────────────────
  files.set('.nvmrc', nvmrc());
  files.set('.npmrc', npmrc(config.packageManager));
  files.set('.gitignore', gitignore());
  files.set('.env.example', envExample(config));
  files.set('package.json', JSON.stringify(generatePackageJson(config), null, 2));
  files.set('tsconfig.json', tsconfig());
  files.set('postcss.config.mjs', postcssConfig());
  files.set('eslint.config.mjs', eslintConfig());
  files.set('.prettierrc', prettierrc());
  files.set('next.config.ts', nextConfig(config));
  files.set('.husky/pre-commit', huskyPreCommit());

  // ── App shell ─────────────────────────────────────────────────────────────
  files.set('app/globals.css', globalsCss(config));
  files.set('app/layout.tsx', rootLayout(config));
  files.set('app/page.tsx', rootPage());
  files.set('app/not-found.tsx', notFound());

  // ── Config ────────────────────────────────────────────────────────────────
  files.set('config/env.ts', envConfig(config));
  files.set('config/site.ts', siteConfig(config));

  // ── Lib ───────────────────────────────────────────────────────────────────
  files.set('lib/utils.ts', libUtils());

  // ── Types ─────────────────────────────────────────────────────────────────
  files.set('types/index.ts', typesIndex());
  files.set('types/api.types.ts', apiTypes());
  files.set('types/ui.types.ts', uiTypes());

  // ── shadcn ────────────────────────────────────────────────────────────────
  if (config.shadcn) {
    files.set('components.json', componentsJson());
  }

  // ── Auth.js ───────────────────────────────────────────────────────────────
  if (projectType === 'auth-js') {
    files.set('auth.ts', authConfig(config));
    files.set('app/api/auth/[...nextauth]/route.ts', authRoute());
    files.set('middleware.ts', middleware());
    files.set('app/(auth)/login/page.tsx', loginPage(config));
    files.set('app/(auth)/layout.tsx', authLayout());
    files.set('app/(dashboard)/layout.tsx', dashboardLayoutWithAuth());
    files.set('app/(dashboard)/dashboard/page.tsx', dashboardPage());
    files.set('types/next-auth.d.ts', nextAuthDts());

    if (config.authProviders.includes('credentials')) {
      files.set('lib/auth/password.ts', passwordUtils());
    }
  }

  // ── External backend ──────────────────────────────────────────────────────
  if (projectType === 'external-backend') {
    if (config.externalAuthStrategy === 'jwt-tokens') {
      files.set('lib/api.ts', apiClient(config));
      files.set('lib/services/auth.service.ts', authService(config));
      files.set('store/auth.store.ts', authStore());
      files.set('middleware.ts', tokenMiddleware());
      files.set('app/(auth)/login/page.tsx', loginPageExternal());
      files.set('app/(auth)/layout.tsx', authLayout());
      files.set('app/(dashboard)/layout.tsx', dashboardLayout());
      files.set('app/(dashboard)/dashboard/page.tsx', dashboardPage());
      files.set('components/layout/auth-guard.tsx', authGuard());
    } else if (config.externalAuthStrategy === 'api-key') {
      files.set('lib/api.ts', apiKeyClient(config));
      files.set('app/(dashboard)/layout.tsx', dashboardLayout());
      files.set('app/(dashboard)/dashboard/page.tsx', dashboardPage());
    } else {
      files.set('lib/api.ts', baseFetchClient());
      files.set('app/(dashboard)/layout.tsx', dashboardLayout());
      files.set('app/(dashboard)/dashboard/page.tsx', dashboardPage());
    }
  }

  // ── Fullstack ─────────────────────────────────────────────────────────────
  if (projectType === 'fullstack') {
    files.set('drizzle.config.ts', drizzleConfig(config));
    files.set('lib/db/index.ts', dbClient(config));
    files.set('lib/db/schema/users.ts', usersSchema(config));
    files.set('lib/db/schema/index.ts', schemaIndex(config));
    files.set('auth.ts', authConfig(config));
    files.set('app/api/auth/[...nextauth]/route.ts', authRoute());
    files.set('middleware.ts', middleware());
    files.set('app/(auth)/login/page.tsx', loginPage(config));
    files.set('app/(auth)/layout.tsx', authLayout());
    files.set('app/(dashboard)/layout.tsx', dashboardLayoutWithAuth());
    files.set('app/(dashboard)/dashboard/page.tsx', dashboardPage());
    files.set('types/next-auth.d.ts', nextAuthDts());

    if (config.authProviders?.includes('credentials')) {
      files.set('lib/auth/password.ts', passwordUtils());
    }
  }

  // ── Static: just a dashboard stub ────────────────────────────────────────
  if (projectType === 'static') {
    files.set('app/(dashboard)/layout.tsx', dashboardLayout());
    files.set('app/(dashboard)/dashboard/page.tsx', dashboardPage());
  }

  // ── Data fetching providers ───────────────────────────────────────────────
  if (dataFetching === 'swr') {
    files.set('components/providers/swr-provider.tsx', swrConfig());
    files.set('hooks/use-user.ts', swrHookExample());
  } else if (dataFetching === 'tanstack-query') {
    files.set('components/providers/query-provider.tsx', queryProvider());
    files.set('hooks/use-user.ts', queryHookExample());
  }

  // ── State management ──────────────────────────────────────────────────────
  if (stateManagement === 'zustand') {
    files.set('store/ui.store.ts', uiStore());
    const hasAuthStore =
      projectType === 'external-backend' && config.externalAuthStrategy === 'jwt-tokens';
    files.set('store/index.ts', storeIndex(hasAuthStore));
  }

  return files;
}

export async function scaffold(config: ProjectConfig): Promise<void> {
  const cwd = process.cwd();
  const projectDir = join(cwd, config.name);

  // ── Directory ─────────────────────────────────────────────────────────────
  if (await fs.pathExists(projectDir)) {
    logger.error(`Directory ${pc.cyan(config.name)} already exists.`);
    process.exit(1);
  }
  await fs.ensureDir(projectDir);

  const s = p.spinner();

  // ── Write files ───────────────────────────────────────────────────────────
  s.start('Scaffolding project files...');
  const files = collectFiles(config);
  await writeFiles(projectDir, files);

  // Ensure stub directories
  const stubDirs = [
    'public/fonts',
    'public/images',
    'components/ui',
    'components/layout',
    'components/features',
    'hooks',
  ];
  if (config.stateManagement !== 'none' && !files.has('store/index.ts')) {
    stubDirs.push('store');
  }
  await ensureDirs(projectDir, stubDirs);
  s.stop('Project files created');

  // ── Install dependencies ──────────────────────────────────────────────────
  s.start(`Installing dependencies with ${config.packageManager}...`);
  const [installCmd, installArgs] = getInstallCmd(config.packageManager);
  try {
    await run(installCmd, installArgs, projectDir);
  } catch (err) {
    // pnpm exits with code 1 on ERR_PNPM_IGNORED_BUILDS warnings even when
    // install succeeds. Treat as success if node_modules exists.
    const hasModules = await fs.pathExists(join(projectDir, 'node_modules'));
    if (!hasModules) throw err;
  }
  s.stop('Dependencies installed');

  // ── Husky ─────────────────────────────────────────────────────────────────
  s.start('Setting up Husky hooks...');
  await run(config.packageManager, ['run', 'prepare'], projectDir);
  // Make pre-commit executable
  await run('chmod', ['+x', '.husky/pre-commit'], projectDir);
  s.stop('Git hooks configured');

  // ── shadcn/ui ─────────────────────────────────────────────────────────────
  if (config.shadcn) {
    s.start('Initializing shadcn/ui...');
    const pmRunner = getPmRunner(config.packageManager);
    // shadcn init with --yes to skip interactive prompts (uses components.json we already wrote)
    await run(pmRunner, ['shadcn@latest', 'add', '--yes', '--overwrite'], projectDir, true).catch(
      () => {
        // shadcn init may exit with non-zero even on success, ignore
      },
    );

    const components = getComponentsForPreset(config.shadcnPreset);
    if (components.length > 0) {
      s.message(`Adding ${components.length} shadcn components...`);
      await run(
        pmRunner,
        ['shadcn@latest', 'add', '--yes', '--overwrite', ...components],
        projectDir,
        true,
      ).catch(() => {
        logger.warn('shadcn component install failed — run manually after setup');
      });
    }
    s.stop('shadcn/ui configured');
  }

  // ── Git ───────────────────────────────────────────────────────────────────
  if (config.initGit) {
    s.start('Initializing git repository...');
    await run('git', ['init'], projectDir);
    await run('git', ['add', '-A'], projectDir);
    await run(
      'git',
      ['commit', '-m', 'chore: initial scaffold via next-op-cli', '--no-gpg-sign'],
      projectDir,
    );
    s.stop('Git repository initialized');
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  p.outro(
    [
      pc.green('✓') + ' ' + pc.bold(`${config.name}`) + ' is ready!',
      '',
      pc.dim('Next steps:'),
      pc.dim(`  cd ${config.name}`),
      ...(config.projectType !== 'static'
        ? [pc.dim('  cp .env.example .env.local  # then fill in values')]
        : []),
      pc.dim(`  ${config.packageManager} dev`),
    ].join('\n'),
  );
}
