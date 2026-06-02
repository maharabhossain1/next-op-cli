import type { ProjectConfig } from '../types.js';

export function nvmrc(): string {
  return '24.14.1\n';
}

export function pnpmWorkspace(): string {
  return `# Allow build scripts for native packages required by Next.js
onlyBuiltDependencies:
  - sharp
  - '@img/sharp-darwin-arm64'
  - '@img/sharp-darwin-x64'
  - '@img/sharp-linux-arm64'
  - '@img/sharp-linux-x64'
  - '@img/sharp-libvips-darwin-arm64'
  - '@img/sharp-libvips-darwin-x64'
  - '@img/sharp-libvips-linux-arm64'
  - '@img/sharp-libvips-linux-x64'
  - unrs-resolver
  - esbuild
`;
}

export function npmrc(pm: string): string {
  const lines = ['engine-strict=true', ''];
  if (pm === 'pnpm') {
    lines.push('shamefully-hoist=false');
    lines.push('strict-peer-dependencies=false');
    lines.push('');
  }
  return lines.join('\n');
}

export function gitignore(): string {
  return `# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
/.next/
/out/
/build/
/dist/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.DS_Store
*.pem
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Editor
.vscode/settings.json
.idea/

# Testing
/coverage/
`;
}

export function envExample(config: ProjectConfig): string {
  const lines = ['# Copy this file to .env.local and fill in the values', ''];

  if (config.projectType === 'external-backend') {
    lines.push('# Backend API URL');
    lines.push('NEXT_PUBLIC_API_URL=http://localhost:8000/api');
    lines.push('');
  }

  if (config.projectType === 'auth-js') {
    lines.push('# Auth.js');
    lines.push('AUTH_SECRET=generate-with-openssl-rand-base64-32');
    lines.push('NEXTAUTH_URL=http://localhost:3000');
    lines.push('');
    if (config.authProviders.includes('google')) {
      lines.push('AUTH_GOOGLE_ID=');
      lines.push('AUTH_GOOGLE_SECRET=');
      lines.push('');
    }
    if (config.authProviders.includes('github')) {
      lines.push('AUTH_GITHUB_ID=');
      lines.push('AUTH_GITHUB_SECRET=');
      lines.push('');
    }
  }

  if (config.projectType === 'fullstack') {
    lines.push('# Database');
    if (config.database === 'postgres') {
      lines.push('DATABASE_URL=postgresql://user:password@localhost:5432/mydb');
    } else {
      lines.push('DATABASE_URL=./local.db');
    }
    lines.push('');
    lines.push('# Auth.js');
    lines.push('AUTH_SECRET=generate-with-openssl-rand-base64-32');
    lines.push('NEXTAUTH_URL=http://localhost:3000');
    lines.push('');
  }

  if (config.analytics === 'posthog') {
    lines.push('# PostHog');
    lines.push('NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here');
    lines.push('NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com');
    lines.push('');
  }

  return lines.join('\n');
}

export function tsconfig(): string {
  return `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
`;
}

export function postcssConfig(): string {
  return `export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
`;
}

export function prettierrc(): string {
  return JSON.stringify(
    {
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'all',
      printWidth: 100,
      bracketSpacing: true,
      arrowParens: 'avoid',
      endOfLine: 'lf',
      plugins: [],
    },
    null,
    2,
  );
}

export function eslintConfig(): string {
  return `import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unicornPlugin from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import-x';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'coverage/**',
    'next-env.d.ts',
  ]),

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      unicorn: unicornPlugin,
      'import-x': importPlugin,
      'no-relative-import-paths': noRelativeImportPaths,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'prefer-const': 'error',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['sibling', 'parent'], 'index', 'unknown'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'no-relative-import-paths/no-relative-import-paths': [
        'warn',
        { allowSameFolder: true, prefix: '@' },
      ],
      'prettier/prettier': 'error',
    },
  },
  prettierConfig,
]);

export default eslintConfig;
`;
}

export function nextConfig(config: ProjectConfig): string {
  const radixImports = [
    '@radix-ui/react-accordion',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-popover',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-scroll-area',
    '@radix-ui/react-select',
    '@radix-ui/react-separator',
    '@radix-ui/react-slider',
    '@radix-ui/react-slot',
    '@radix-ui/react-switch',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toast',
  ];

  const optimizeImports = config.shadcn
    ? `['tailwindcss', ${radixImports.map(x => `'${x}'`).join(', ')}]`
    : `['tailwindcss']`;

  const pwaSetup = config.pwa
    ? `import withPWA from 'next-pwa';\n`
    : '';

  const pwaWrapper = config.pwa
    ? `withPWA({ dest: 'public', disable: process.env.NODE_ENV === 'development' })`
    : `withBundleAnalyzer(nextConfig)`;

  const analyzerLine = `const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });`;

  return `import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
${pwaSetup}
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

${analyzerLine}

const isDev = process.env.NODE_ENV !== 'production';
const isRunningDevCommand = process.argv.some(arg => arg.includes('dev'));
const shouldSkipCaching = isDev || isRunningDevCommand;

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    const headers = shouldSkipCaching
      ? []
      : [
          {
            source: '/:path*',
            headers: [
              ...securityHeaders,
              { key: 'Cache-Control', value: 'public, max-age=3600, must-revalidate' },
            ],
          },
          {
            source: '/fonts/:font*',
            headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
          },
          {
            source: '/images/:image*',
            headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
          },
          {
            source: '/_next/static/:path*',
            headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
          },
        ];

    headers.push({
      source: '/api/auth/:path*',
      headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }],
    });

    return headers;
  },
  experimental: {
    serverMinification: true,
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    optimizePackageImports: ${optimizeImports},
  },
};

export default ${pwaWrapper};
`;
}

export function huskyPreCommit(): string {
  return `# lint and format staged files
npx lint-staged

# verify typescript
npx tsc --noEmit
`;
}
