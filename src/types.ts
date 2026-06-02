export type ProjectType = 'static' | 'auth-js' | 'external-backend' | 'fullstack';

export type AuthProvider = 'google' | 'github' | 'credentials';

export type ExternalAuthStrategy = 'jwt-tokens' | 'api-key' | 'none';

export type DataFetching = 'swr' | 'tanstack-query' | 'none';

export type StateManagement = 'zustand' | 'jotai' | 'none';

export type ShadcnPreset = 'minimal' | 'extended' | 'init-only';

export type Analytics = 'none' | 'vercel' | 'posthog';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export type Database = 'postgres' | 'sqlite';

export interface ProjectConfig {
  name: string;
  projectType: ProjectType;

  // auth-js
  authProviders: AuthProvider[];

  // external-backend
  externalAuthStrategy: ExternalAuthStrategy;

  // fullstack
  database: Database;

  // shared optional
  dataFetching: DataFetching;
  stateManagement: StateManagement;
  shadcn: boolean;
  shadcnPreset: ShadcnPreset;
  analytics: Analytics;
  pwa: boolean;
  packageManager: PackageManager;
  initGit: boolean;
  inPlace: boolean;
}
