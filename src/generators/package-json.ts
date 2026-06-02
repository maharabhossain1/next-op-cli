import type { ProjectConfig } from '../types.js';

interface PackageJson {
  name: string;
  version: string;
  private: boolean;
  engines: Record<string, string>;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  'lint-staged': Record<string, string[]>;
  pnpm?: { onlyBuiltDependencies: string[] };
}

export function generatePackageJson(config: ProjectConfig): PackageJson {
  const { name, projectType, dataFetching, stateManagement, analytics, pwa, packageManager } =
    config;

  // ── Scripts ───────────────────────────────────────────────────────────────
  const scripts: Record<string, string> = {
    dev: 'next dev --turbopack',
    build: 'next build',
    start: 'next start',
    lint: 'eslint',
    'lint:fix': 'eslint --fix',
    format: 'prettier --write .',
    'format:check': 'prettier --check .',
    'type-check': 'tsc --noEmit',
    prepare: 'husky',
  };

  if (projectType === 'fullstack') {
    scripts['db:generate'] = 'drizzle-kit generate';
    scripts['db:migrate'] = 'drizzle-kit migrate';
    scripts['db:studio'] = 'drizzle-kit studio';
    scripts['db:push'] = 'drizzle-kit push';
  }

  if (analytics === 'vercel') {
    scripts['analyze'] = 'ANALYZE=true next build';
  }

  // ── Core deps ─────────────────────────────────────────────────────────────
  const dependencies: Record<string, string> = {
    next: '16.2.4',
    react: '19.2.4',
    'react-dom': '19.2.4',
    'class-variance-authority': '^0.7.1',
    clsx: '^2.1.1',
    'lucide-react': '^1.11.0',
    'tailwind-merge': '^3.5.0',
    zod: '^3.25.0',
  };

  const devDependencies: Record<string, string> = {
    '@eslint/js': '^9.39.4',
    '@next/bundle-analyzer': '^16.2.4',
    '@tailwindcss/postcss': '^4',
    '@types/node': '^20',
    '@types/react': '^19',
    '@types/react-dom': '^19',
    'babel-plugin-react-compiler': '^1.0.0',
    eslint: '^9',
    'eslint-config-next': '16.2.4',
    'eslint-config-prettier': '^10.1.8',
    'eslint-plugin-import-x': '^4.16.2',
    'eslint-plugin-no-relative-import-paths': '^1.6.1',
    'eslint-plugin-prettier': '^5.5.5',
    'eslint-plugin-react': '^7.37.5',
    'eslint-plugin-react-hooks': '^7.1.1',
    'eslint-plugin-unicorn': '^64.0.0',
    husky: '^9.1.7',
    'lint-staged': '^16.4.0',
    prettier: '^3.8.3',
    tailwindcss: '^4',
    typescript: '^5',
    'typescript-eslint': '^8.59.0',
  };

  // ── Auth.js ───────────────────────────────────────────────────────────────
  if (projectType === 'auth-js') {
    dependencies['next-auth'] = '^5.0.0-beta.28';
    if (config.authProviders.includes('credentials')) {
      dependencies['bcryptjs'] = '^2.4.3';
      devDependencies['@types/bcryptjs'] = '^2.4.6';
    }
  }

  // ── Fullstack / DB ────────────────────────────────────────────────────────
  if (projectType === 'fullstack') {
    dependencies['drizzle-orm'] = '^0.36.4';
    devDependencies['drizzle-kit'] = '^0.27.2';
    if (config.database === 'postgres') {
      dependencies['postgres'] = '^3.4.5';
    } else {
      dependencies['better-sqlite3'] = '^11.7.0';
      devDependencies['@types/better-sqlite3'] = '^7.6.12';
      devDependencies['drizzle-orm'] = undefined as unknown as string;
      dependencies['drizzle-orm'] = '^0.36.4';
    }
    // Auth.js + DB adapter
    if (config.authProviders?.length) {
      dependencies['@auth/drizzle-adapter'] = '^1.7.4';
    }
  }

  // ── Data fetching ─────────────────────────────────────────────────────────
  if (dataFetching === 'swr') {
    dependencies['swr'] = '^2.3.3';
  } else if (dataFetching === 'tanstack-query') {
    dependencies['@tanstack/react-query'] = '^5.80.7';
    devDependencies['@tanstack/react-query-devtools'] = '^5.80.7';
  }

  // ── State management ──────────────────────────────────────────────────────
  if (stateManagement === 'zustand') {
    dependencies['zustand'] = '^5.0.5';
  } else if (stateManagement === 'jotai') {
    dependencies['jotai'] = '^2.12.5';
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  if (analytics === 'vercel') {
    dependencies['@vercel/analytics'] = '^1.5.0';
  } else if (analytics === 'posthog') {
    dependencies['posthog-js'] = '^1.248.1';
  }

  // ── PWA ───────────────────────────────────────────────────────────────────
  if (pwa) {
    dependencies['next-pwa'] = '^5.6.0';
    devDependencies['webpack'] = '^5.97.1';
  }

  // ── External backend ──────────────────────────────────────────────────────
  if (projectType === 'external-backend' && config.externalAuthStrategy === 'jwt-tokens') {
    dependencies['zustand'] = '^5.0.5';
    if (stateManagement !== 'zustand') {
      // force zustand for token store even if they didn't choose it
    }
  }

  // clean up undefined entries from deps
  for (const key of Object.keys(devDependencies)) {
    if (devDependencies[key] === undefined) {
      delete devDependencies[key];
    }
  }

  const pmEngineKey = packageManager === 'pnpm' ? 'pnpm' : packageManager === 'bun' ? 'bun' : 'npm';

  const result: PackageJson = {
    name,
    version: '0.1.0',
    private: true,
    engines: {
      node: '>=24.0.0',
      [pmEngineKey]: '>=10',
    },
    scripts,
    dependencies,
    devDependencies,
    'lint-staged': {
      '**/*.{js,mjs,ts,tsx,md,mdx}': ['eslint --fix', 'prettier --write'],
      '**/*.css': ['prettier --write'],
      '**/*.{json,yml}': ['prettier --write'],
    },
  };

  if (packageManager === 'pnpm') {
    result.pnpm = {
      onlyBuiltDependencies: [
        'sharp',
        '@img/sharp-darwin-arm64',
        '@img/sharp-darwin-x64',
        '@img/sharp-libvips-darwin-arm64',
        '@img/sharp-libvips-darwin-x64',
        '@img/sharp-linux-arm64',
        '@img/sharp-linux-x64',
        '@img/sharp-libvips-linux-arm64',
        '@img/sharp-libvips-linux-x64',
        'unrs-resolver',
        'esbuild',
      ],
    };
  }

  return result;
}
