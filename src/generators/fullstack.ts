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
  ${hasAuth ? `emailVerified: integer('email_verified', { mode: 'timestamp_ms' }),` : ''}
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

  if (hasAuth) {
    lines.push(`export * from './auth';`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Auth.js DrizzleAdapter tables (accounts, sessions, verificationTokens).
 * Column property names match what @auth/drizzle-adapter expects.
 */
export function authSchema(config: ProjectConfig): string {
  if (config.database === 'postgres') {
    return `import { pgTable, text, timestamp, integer, primaryKey, uuid } from 'drizzle-orm/pg-core';

import { users } from './users';

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  account => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  }),
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  vt => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
`;
  }

  return `import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

import { users } from './users';

export const accounts = sqliteTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  account => ({
    compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  }),
);

export const sessions = sqliteTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
  },
  vt => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
`;
}
