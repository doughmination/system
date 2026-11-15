/* src/lib/server/plural/routes/metrics.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { createRoute, z } from "@hono/zod-openapi";

import { router, ok, signedIn } from "../openapi";
import { requireAuth } from "../middleware/auth";
import { FrontingTimeSchema, SwitchFrequencySchema } from "../schemas";
import { getFrontingTimeMetrics, getSwitchFrequencyMetrics } from "../services/metrics";

export const metricsRoutes = router();

const DaysQuery = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

metricsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/metrics/fronting-time",
    tags: ["Metrics"],
    summary: "Time each member spent fronting",
    security: signedIn,
    middleware: [requireAuth] as const,
    request: {
      query: DaysQuery,
    },
    responses: ok(FrontingTimeSchema),
  }),
  async (c) => {
    const metrics = await getFrontingTimeMetrics(c.req.valid("query").days);
    return c.json(metrics as z.infer<typeof FrontingTimeSchema>, 200);
  },
);

metricsRoutes.openapi(
  createRoute({
    method: "get",
    path: "/metrics/switch-frequency",
    tags: ["Metrics"],
    summary: "How often the system switched",
    security: signedIn,
    middleware: [requireAuth] as const,
    request: {
      query: DaysQuery,
    },
    responses: ok(SwitchFrequencySchema),
  }),
  async (c) => {
    const metrics = await getSwitchFrequencyMetrics(c.req.valid("query").days);
    return c.json(metrics as z.infer<typeof SwitchFrequencySchema>, 200);
  },
);
