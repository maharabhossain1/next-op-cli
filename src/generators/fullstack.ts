import type { ProjectConfig } from '../types.js';

export function drizzleConfig(config: ProjectConfig): string {
  const dialect = config.database === 'postgres' ? 'postgresql' : 'sqlite';
  const out = config.database === 'postgres' ? 'pg-core' : 'sqlite-core';

  return `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: '${dialect}',
  schema: './lib/db/schema',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
`;
}

export function dbClient(config: ProjectConfig): string {
  if (config.database === 'postgres') {
    return `import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
`;
  }

  return `import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schema';

const sqlite = new Database(process.env.DATABASE_URL!);
export const db = drizzle(sqlite, { schema });
`;
}

export function usersSchema(config: ProjectConfig): string {
  const hasAuth =
    config.projectType === 'fullstack' && (config.authProviders?.length ?? 0) > 0;
  const hasCredentials = config.authProviders?.includes('credentials');

  if (config.database === 'postgres') {
    return `import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  ${hasAuth ? `emailVerified: timestamp('email_verified', { withTimezone: true }),` : ''}
  ${hasCredentials ? `passwordHash: text('password_hash'),` : ''}
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`;
  }

  return `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  ${hasCredentials ? `passwordHash: text('password_hash'),` : ''}
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql\`(unixepoch())\`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql\`(unixepoch())\`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`;
}

export function schemaIndex(config: ProjectConfig): string {
  const hasAuth = (config.authProviders?.length ?? 0) > 0;
  const lines = [`export * from './users';`];

  if (hasAuth && config.database === 'postgres') {
    lines.push(`// If using Auth.js DrizzleAdapter, run: pnpm dlx @auth/drizzle-adapter to see required tables`);
  }

  return lines.join('\n') + '\n';
}
