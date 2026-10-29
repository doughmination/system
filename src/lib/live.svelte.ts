/* src/lib/live.svelte.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.0 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { invalidate } from "$app/navigation";
import { client } from "./api.ts";

// The API's socket: fronters and mental state changes, and admin "reload everyone"
const PING_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
const MAX_BACKOFF_MS = 30_000;

class Live {
  status = $state<"connecting" | "open" | "reconnecting" | "closed">("connecting");

  private socket: WebSocket | null = null;
  private attempts = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (this.socket || typeof WebSocket === "undefined") return;

    const socket = new WebSocket(client.socketUrl);
    this.socket = socket;
    this.status = this.attempts > 0 ? "reconnecting" : "connecting";

    socket.onopen = () => {
      this.attempts = 0;
      this.status = "open";
      this.keepAlive();
    };
    socket.onmessage = (event) => this.receive(event.data);
    socket.onclose = () => {
      this.stopKeepAlive();
      this.socket = null;
      this.retry();
    };
  }

  private receive(raw: unknown) {
    if (typeof raw !== "string") return;
    if (raw === "pong") {
      if (this.pongTimer) clearTimeout(this.pongTimer);
      this.pongTimer = null;
      return;
    }

    let event: { type?: string };
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    if (event.type === "force_refresh") location.reload();
    if (event.type === "fronters_update" || event.type === "mental_state_update") {
      // Pages that show public data depend on this key
      void invalidate("api:public");
    }
  }

  private keepAlive() {
    this.stopKeepAlive();
    this.pingTimer = setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) return;
      this.socket.send("ping");
      this.pongTimer ??= setTimeout(() => this.socket?.close(), PONG_TIMEOUT_MS);
    }, PING_MS);
  }

  private stopKeepAlive() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.pongTimer) clearTimeout(this.pongTimer);
    this.pingTimer = null;
    this.pongTimer = null;
  }

  // Jittered exponential backoff, as the package's own socket does
  private retry() {
    this.status = "reconnecting";
    const ceiling = Math.min(1000 * 2 ** this.attempts, MAX_BACKOFF_MS);
    this.attempts += 1;
    setTimeout(() => this.connect(), Math.random() * ceiling);
  }
}

export const live = new Live();
