/* src/lib/server/plural/hub.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { DurableObject } from "cloudflare:workers";

export class LiveHub extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Keepalive answered without waking the object from hibernation
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    this.ctx.acceptWebSocket(server);
    server.send(
      JSON.stringify({
        type: "connection_established",
        timestamp: new Date().toISOString(),
      }),
    );

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // RPC from the plural API: fan a { type, data } event out to every socket
  async broadcast(data: unknown): Promise<void> {
    const payload = JSON.stringify(data);

    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(payload);
      } catch {
        // A socket that died mid-send is cleaned up by the runtime
      }
    }
  }
}
