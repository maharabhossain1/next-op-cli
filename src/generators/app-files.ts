import type { ProjectConfig } from '../types.js';

export function globalsCss(config: ProjectConfig): string {
  const shadcnVars = config.shadcn
    ? `
/* ── shadcn/ui compatibility ─────────────────────────────────── */
:root {
  --background: oklch(0.97 0.01 250);
  --foreground: oklch(0.15 0.01 250);
  --primary: oklch(0.55 0.18 250);
  --primary-foreground: oklch(0.98 0.005 250);
  --secondary: oklch(0.94 0.01 250);
  --secondary-foreground: oklch(0.25 0.01 250);
  --muted: oklch(0.94 0.01 250);
  --muted-foreground: oklch(0.5 0.01 250);
  --accent: oklch(0.94 0.01 250);
  --accent-foreground: oklch(0.25 0.01 250);
  --destructive: oklch(0.6 0.22 27);
  --border: oklch(0.88 0.01 250);
  --input: oklch(0.88 0.01 250);
  --ring: oklch(0.55 0.18 250);
  --radius: 8px;
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0.01 250);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0.01 250);
}
`
    : '';

  return `@import 'tailwindcss';
${shadcnVars}
/* ── Base reset ─────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  height: 100%;
}

body {
  min-height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;
}

export function rootLayout(config: ProjectConfig): string {
  const analyticsImport =
    config.analytics === 'vercel'
      ? `import { Analytics } from '@vercel/analytics/react';\n`
      : config.analytics === 'posthog'
        ? `import { PostHogProvider } from '@/components/providers/posthog-provider';\n`
        : '';

  const queryProviderImport =
    config.dataFetching === 'tanstack-query'
      ? `import { QueryProvider } from '@/components/providers/query-provider';\n`
      : '';

  const analyticsComponent =
    config.analytics === 'vercel'
      ? '\n        <Analytics />'
      : config.analytics === 'posthog'
        ? `\n        <PostHogProvider>`
        : '';

  const analyticsClose =
    config.analytics === 'posthog' ? '\n        </PostHogProvider>' : '';

  const queryWrapper =
    config.dataFetching === 'tanstack-query'
      ? '        <QueryProvider>\n          {children}\n        </QueryProvider>'
      : '        {children}';

  return `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
${analyticsImport}${queryProviderImport}
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '${config.name}',
    template: \`%s | ${config.name}\`,
  },
  description: '${config.name} — built with next-op-cli',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`\${inter.variable} h-full\`}>
      <body className="min-h-full">
${queryWrapper}${analyticsComponent}${analyticsClose}
      </body>
    </html>
  );
}
`;
}

export function rootPage(): string {
  return `import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Welcome</h1>
        <p className="text-muted-foreground mb-8">Your new Next.js app is ready.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
`;
}

export function notFound(): string {
  return `import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-semibold mb-3">404 — Page not found</h2>
      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
        Go home
      </Link>
    </main>
  );
}
`;
}

export function envConfig(config: ProjectConfig): string {
  const fields: string[] = [];

  if (config.projectType === 'external-backend') {
    fields.push(`  NEXT_PUBLIC_API_URL: z.string().url(),`);
  }

  if (config.projectType === 'auth-js' || config.projectType === 'fullstack') {
    fields.push(`  AUTH_SECRET: z.string().min(32),`);
    fields.push(`  NEXTAUTH_URL: z.string().url().optional(),`);
    if (config.authProviders?.includes('google')) {
      fields.push(`  AUTH_GOOGLE_ID: z.string().min(1),`);
      fields.push(`  AUTH_GOOGLE_SECRET: z.string().min(1),`);
    }
    if (config.authProviders?.includes('github')) {
      fields.push(`  AUTH_GITHUB_ID: z.string().min(1),`);
      fields.push(`  AUTH_GITHUB_SECRET: z.string().min(1),`);
    }
  }

  if (config.projectType === 'fullstack') {
    fields.push(`  DATABASE_URL: z.string().min(1),`);
  }

  if (config.analytics === 'posthog') {
    fields.push(`  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),`);
    fields.push(`  NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),`);
  }

  fields.push(`  NODE_ENV: z.enum(['development', 'test', 'production']),`);

  return `import { z } from 'zod';

const envSchema = z.object({
${fields.join('\n')}
});

export const env = envSchema.parse(process.env);
`;
}

export function siteConfig(config: ProjectConfig): string {
  return `export const siteConfig = {
  name: '${config.name}',
  description: '${config.name} — built with next-op-cli',
  url: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  nav: [
    { title: 'Dashboard', href: '/dashboard' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
`;
}

export function libUtils(): string {
  return `import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
`;
}

export function typesIndex(): string {
  return `export type * from './api.types';
export type * from './ui.types';
`;
}

export function apiTypes(): string {
  return `export type ApiError = {
  error: string;
  code: string;
};

export type ApiResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: string };
`;
}

export function uiTypes(): string {
  return `export type NavItem = {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export type BreadcrumbItem = {
  title: string;
  href?: string;
};
`;
}

export function dashboardLayout(): string {
  return `export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* TODO: add sidebar / topbar */}
      <main className="p-6">{children}</main>
    </div>
  );
}
`;
}

export function dashboardPage(): string {
  return `export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <p className="text-muted-foreground">Welcome to your dashboard.</p>
    </div>
  );
}
`;
}
