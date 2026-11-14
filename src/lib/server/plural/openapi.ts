/* src/lib/server/plural/openapi.ts
 * Copyright (c) 2026 Clove Nytrix Doughmination Twilight
 * Licensed under the DASL-1.2 Licence.
 * See LICENCE.md in the project root for full licence information.
 */

import { OpenAPIHono, type z } from "@hono/zod-openapi";

import type { Env } from "./hono";
import { ErrorSchema } from "./schemas";

const errorBody = {
  content: {
    "application/json": {
      schema: ErrorSchema,
    },
  },
};

export const errorResponses = {
  400: { ...errorBody, description: "Bad request" },
  401: { ...errorBody, description: "Not signed in, or the token is invalid" },
  403: { ...errorBody, description: "Signed in, but missing the required role" },
  404: { ...errorBody, description: "Not found" },
  422: { ...errorBody, description: "The body or query failed validation" },
} as const;

// A 200 JSON response plus the shared error responses
export function ok<T extends z.ZodType>(schema: T, description = "OK") {
  return {
    200: {
      content: {
        "application/json": {
          schema,
        },
      },
      description,
    },
    ...errorResponses,
  };
}

export function jsonBody<T extends z.ZodType>(schema: T) {
  return {
    body: {
      required: true,
      content: {
        "application/json": {
          schema,
        },
      },
    },
  };
}

export const signedIn = [{ bearerAuth: [] }];
export const botAuth = [{ botAuth: [] }];

function issuesText(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>): string {
  return issues
    .map((issue) => (issue.path.length ? `${issue.path.map(String).join(".")}: ${issue.message}` : issue.message))
    .join("; ");
}

// Every route group uses this, so validation failures all come back as 422 { detail }
export function router() {
  return new OpenAPIHono<Env>({
    defaultHook: (result, c) => {
      if (!result.success) return c.json({ detail: issuesText(result.error.issues) }, 422);
    },
  });
}
