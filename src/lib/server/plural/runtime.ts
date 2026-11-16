/* src/lib/server/plural/runtime.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { LIVE_HUB_NAME } from "./config";
import type { PluralEnv } from "./types";

// JSON blob store over the D1 `kv` table, the same shape the old DO store had
export interface Store {
  get<T>(key: string, fallback: T): Promise<T>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  // Read and delete in one statement, so a one-time value can only be used once
  take<T>(key: string): Promise<T | null>;
  // Replace only if the stored value is still `expected`. False when another request won
  swap(key: string, expected: unknown, next: unknown): Promise<boolean>;
}

export interface PluralRuntime {
  env: PluralEnv;
  db: D1Database;
  store: Store;
  broadcast(data: unknown): Promise<void>;
}

function d1Store(db: D1Database): Store {
  return {
    async get<T>(key: string, fallback: T): Promise<T> {
      const row = await db
        .prepare("SELECT value FROM kv WHERE key = ?")
        .bind(key)
        .first<{ value: string }>();
      return row ? (JSON.parse(row.value) as T) : fallback;
    },

    async put(key: string, value: unknown): Promise<void> {
      await db
        .prepare("INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
        .bind(key, JSON.stringify(value))
        .run();
    },

    async delete(key: string): Promise<void> {
      await db.prepare("DELETE FROM kv WHERE key = ?").bind(key).run();
    },

    async take<T>(key: string): Promise<T | null> {
      const row = await db
        .prepare("DELETE FROM kv WHERE key = ? RETURNING value")
        .bind(key)
        .first<{ value: string }>();
      return row ? (JSON.parse(row.value) as T) : null;
    },

    async swap(key: string, expected: unknown, next: unknown): Promise<boolean> {
      const result = await db
        .prepare("UPDATE kv SET value = ? WHERE key = ? AND value = ?")
        .bind(JSON.stringify(next), key, JSON.stringify(expected))
        .run();
      return result.meta.changes === 1;
    },
  };
}

let current: PluralRuntime | null = null;

// Env is fixed for the life of an isolate, so building this once per isolate is safe
export function setRuntime(env: PluralEnv): void {
  if (current?.env === env) return;
  current = {
    env,
    db: env.DB,
    store: d1Store(env.DB),
    broadcast: async (data) => {
      try {
        await env.LIVE.get(env.LIVE.idFromName(LIVE_HUB_NAME)).broadcast(data);
      } catch (err) {
        // A dropped live update must never fail the write that caused it
        console.error(`Realtime broadcast failed: ${String(err)}`);
      }
    },
  };
}

export function rt(): PluralRuntime {
  if (!current) throw new Error("plural runtime not initialised");
  return current;
}
