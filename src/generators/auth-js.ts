import type { ProjectConfig } from '../types.js';

export function authConfig(config: ProjectConfig): string {
  const imports: string[] = [`import NextAuth from 'next-auth';`];
  const providerImports: string[] = [];
  const providers: string[] = [];

  if (config.authProviders.includes('google')) {
    providerImports.push(`import Google from 'next-auth/providers/google';`);
    providers.push(
      `    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),`,
    );
  }

  if (config.authProviders.includes('github')) {
    providerImports.push(`import GitHub from 'next-auth/providers/github';`);
    providers.push(
      `    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),`,
    );
  }

  if (config.authProviders.includes('credentials')) {
    providerImports.push(
      `import Credentials from 'next-auth/providers/credentials';`,
      `import { z } from 'zod';`,
    );
    if (config.projectType === 'fullstack') {
      providerImports.push(
        `import { db } from '@/lib/db';`,
        `import { users } from '@/lib/db/schema/users';`,
        `import { eq } from 'drizzle-orm';`,
        `import { comparePasswords } from '@/lib/auth/password';`,
      );
    }

    const credentialsBody =
      config.projectType === 'fullstack'
        ? `      const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(credentials);
      if (!parsed.success) return null;

      const user = await db.query.users.findFirst({
        where: eq(users.email, parsed.data.email),
      });
      if (!user?.passwordHash) return null;

      const isValid = await comparePasswords(parsed.data.password, user.passwordHash);
      if (!isValid) return null;

      return { id: user.id, email: user.email, name: user.name };`
        : `      const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(credentials);
      if (!parsed.success) return null;

      // TODO: validate against your backend
      // const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/auth/login\`, { ... })
      return null;`;

    providers.push(
      `    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
${credentialsBody}
      },
    }),`,
    );
  }

  imports.push(...providerImports);

  const drizzleAdapter =
    config.projectType === 'fullstack'
      ? `import { DrizzleAdapter } from '@auth/drizzle-adapter';\nimport { db } from '@/lib/db';\n`
      : '';

  const adapterLine =
    config.projectType === 'fullstack' ? `\n  adapter: DrizzleAdapter(db),` : '';

  return `${imports.join('\n')}
${drizzleAdapter}
export const { handlers, auth, signIn, signOut } = NextAuth({${adapterLine}
  providers: [
${providers.join('\n')}
  ],
  session: { strategy: '${config.projectType === 'fullstack' ? 'database' : 'jwt'}' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
`;
}

export function authRoute(): string {
  return `import { handlers } from '@/auth';

export const { GET, POST } = handlers;
`;
}

export function middleware(): string {
  return `import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth(function middleware(req: NextRequest & { auth: unknown }) {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register');
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
`;
}

export function loginPage(config: ProjectConfig): string {
  const hasCredentials = config.authProviders.includes('credentials');
  const hasGoogle = config.authProviders.includes('google');
  const hasGitHub = config.authProviders.includes('github');

  return `'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSocialLogin(provider: string) {
    setIsLoading(true);
    await signIn(provider, { callbackUrl: '/dashboard' });
  }

  ${
    hasCredentials
      ? `async function handleCredentialsLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      callbackUrl: '/dashboard',
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setIsLoading(false);
    }
  }`
      : ''
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back</p>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}

        ${
          hasCredentials
            ? `<form onSubmit={handleCredentialsLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>`
            : ''
        }

        ${
          (hasGoogle || hasGitHub) && hasCredentials
            ? `<div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or continue with</span>
          </div>
        </div>`
            : ''
        }

        <div className="space-y-2">
          ${
            hasGoogle
              ? `<button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
          >
            Google
          </button>`
              : ''
          }
          ${
            hasGitHub
              ? `<button
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
          >
            GitHub
          </button>`
              : ''
          }
        </div>
      </div>
    </div>
  );
}
`;
}

export function authLayout(): string {
  return `export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      {children}
    </div>
  );
}
`;
}

export function nextAuthDts(): string {
  return `import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
`;
}

export function dashboardLayoutWithAuth(): string {
  return `import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen">
      {/* TODO: add sidebar / topbar with session */}
      <main className="p-6">{children}</main>
    </div>
  );
}
`;
}

export function passwordUtils(): string {
  return `import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
`;
}
