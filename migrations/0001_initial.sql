-- migrations/0001_initial.sql
-- Copyright (c) 2026 Clove Nytrix Doughmination Twilight
-- Licensed under the DASL-1.2 Licence.
-- See LICENCE.md in the project root for full licence information.

-- JSON blobs carried over from the old Durable Object store:
-- users, member_tags, member_status, member_pride, member_relationships,
-- mental_state, and short-lived oidc_state / app_code / sso_session entries
CREATE TABLE kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE systems (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT,
  description TEXT,
  tag TEXT,
  pronouns TEXT,
  avatar_url TEXT,
  banner TEXT,
  color TEXT,
  timezone TEXT,
  created TEXT NOT NULL,
  privacy TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE members (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL UNIQUE,
  system_id TEXT NOT NULL REFERENCES systems(id),
  name TEXT NOT NULL,
  display_name TEXT,
  color TEXT,
  birthday TEXT,
  pronouns TEXT,
  avatar_url TEXT,
  webhook_avatar_url TEXT,
  banner TEXT,
  description TEXT,
  created TEXT NOT NULL,
  -- Kept for the future proxy bot: [{ "prefix": "c:", "suffix": null }]
  proxy_tags TEXT NOT NULL DEFAULT '[]',
  keep_proxy INTEGER NOT NULL DEFAULT 0,
  autoproxy_enabled INTEGER,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_timestamp TEXT,
  privacy TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX members_system ON members (system_id);

CREATE TABLE switches (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(id),
  timestamp TEXT NOT NULL,
  -- JSON array of member ids, in front order
  members TEXT NOT NULL
);

CREATE INDEX switches_system_time ON switches (system_id, timestamp DESC);
