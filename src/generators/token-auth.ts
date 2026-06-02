import type { ProjectConfig } from '../types.js';

// External backend with JWT access + refresh token auth
// Pattern: access token in memory (Zustand), refresh token in localStorage
// API client auto-refreshes on 401

export function apiClient(config: ProjectConfig): string {
  return `import { useAuthStore } from '@/store/auth.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(\`\${API_BASE}/auth/token/refresh/\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) {
    useAuthStore.getState().clearAuth();
    throw new Error('Refresh failed');
  }

  const data = (await res.json()) as { access: string; refresh?: string };
  useAuthStore.getState().setAccessToken(data.access);
  if (data.refresh) {
    localStorage.setItem('refresh_token', data.refresh);
  }
  return data.access;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const makeRequest = async (token: string | null): Promise<Response> => {
    return fetch(\`\${API_BASE}\${path}\`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
        ...(init.headers as Record<string, string> ?? {}),
      },
    });
  };

  let res = await makeRequest(accessToken);

  if (res.status === 401) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: async (newToken: string) => {
            const retried = await makeRequest(newToken);
            resolve(retried.json() as T);
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      res = await makeRequest(newToken);
    } catch (err) {
      processQueue(err, null);
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; detail?: string };
    throw new Error(body.error ?? body.detail ?? \`HTTP \${res.status}\`);
  }

  return res.json() as Promise<T>;
}
`;
}

export function authStore(): string {
  return `import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  accessToken: null,
  isAuthenticated: false,
  setAccessToken: token => set({ accessToken: token, isAuthenticated: true }),
  clearAuth: () => {
    localStorage.removeItem('refresh_token');
    set({ accessToken: null, isAuthenticated: false });
  },
}));
`;
}

export function authService(config: ProjectConfig): string {
  return `import { useAuthStore } from '@/store/auth.store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export async function login(credentials: LoginCredentials): Promise<void> {
  const res = await fetch(\`\${API_BASE}/auth/token/\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(body.detail ?? 'Login failed');
  }

  const data = (await res.json()) as LoginResponse;
  useAuthStore.getState().setAccessToken(data.access);
  localStorage.setItem('refresh_token', data.refresh);
}

export async function logout(): Promise<void> {
  const { accessToken, clearAuth } = useAuthStore.getState();
  const refreshToken = localStorage.getItem('refresh_token');

  if (refreshToken && accessToken) {
    await fetch(\`\${API_BASE}/auth/token/blacklist/\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${accessToken}\`,
      },
      body: JSON.stringify({ refresh: refreshToken }),
    }).catch(() => {
      // silently ignore — still clear local state
    });
  }

  clearAuth();
}

export async function initAuth(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return;

  try {
    const res = await fetch(\`\${API_BASE}/auth/token/refresh/\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem('refresh_token');
      return;
    }

    const data = (await res.json()) as { access: string; refresh?: string };
    useAuthStore.getState().setAccessToken(data.access);
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh);
    }
  } catch {
    localStorage.removeItem('refresh_token');
  }
}
`;
}

export function tokenMiddleware(): string {
  return `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register'];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.includes(path) || path.startsWith('/api');

  if (isPublic) return NextResponse.next();

  // Token auth is handled client-side via Zustand + initAuth().
  // For SSR-protected routes, check a cookie set after login if needed.
  // For now, dashboard protection is client-side via AuthGuard component.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
`;
}

export function authGuard(): string {
  return `'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { initAuth } from '@/lib/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initAuth().then(() => {
      const { isAuthenticated: authed } = useAuthStore.getState();
      if (!authed) {
        router.replace('/login');
      }
    });
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
`;
}

export function loginPageExternal(): string {
  return `'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { login } from '@/lib/services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      await login({
        email: String(formData.get('email')),
        password: String(formData.get('password')),
      });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials</p>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
        </form>
      </div>
    </div>
  );
}
`;
}

export function apiKeyClient(_config: ProjectConfig): string {
  return `const API_BASE = process.env.NEXT_PUBLIC_API_URL!;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY!;

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(\`\${API_BASE}\${path}\`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...(init.headers as Record<string, string> ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? \`HTTP \${res.status}\`);
  }

  return res.json() as Promise<T>;
}
`;
}

export function baseFetchClient(): string {
  return `const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(\`\${API_BASE}\${path}\`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? \`HTTP \${res.status}\`);
  }

  return res.json() as Promise<T>;
}
`;
}
