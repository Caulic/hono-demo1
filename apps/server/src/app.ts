import { createContext } from "@hono-demo1/api/context";
import { appRouter } from "@hono-demo1/api/routers/index";
import { db, githubUser } from "@hono-demo1/db";
import { env } from "@hono-demo1/env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

app.post("/api/add_user", async (c) => {
  const body = await c.req.json<{ token: string }>();
  const { token } = body;

  if (!token) {
    return c.json({ error: "token is required" }, 400);
  }

  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    return c.json({ error: "invalid token or GitHub API error" }, 400);
  }

  const user = await res.json() as {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    company: string | null;
    blog: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
  };

  await db
    .insert(githubUser)
    .values({
      id: user.id,
      login: user.login,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      location: user.location,
      company: user.company,
      blog: user.blog,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      githubCreatedAt: user.created_at,
    })
    .onConflictDoUpdate({
      target: githubUser.id,
      set: {
        login: user.login,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        location: user.location,
        company: user.company,
        blog: user.blog,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        githubCreatedAt: user.created_at,
        updatedAt: new Date(),
      },
    });

  return c.json({ ok: true, login: user.login, id: user.id });
});

app.delete("/api/delete_user", async (c) => {
  const body = await c.req.json<{ token: string }>();
  const { token } = body;

  if (!token) {
    return c.json({ error: "token is required" }, 400);
  }

  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    return c.json({ error: "invalid token or GitHub API error" }, 400);
  }

  const user = await res.json() as { id: number; login: string };

  const deleted = await db
    .delete(githubUser)
    .where(eq(githubUser.id, user.id))
    .returning({ id: githubUser.id, login: githubUser.login });

  if (deleted.length === 0) {
    return c.json({ error: "user not found in database" }, 404);
  }

  return c.json({ ok: true, login: deleted[0].login, id: deleted[0].id });
});

app.get("/api/users", async (c) => {
  const users = await db.select().from(githubUser);
  return c.json({ ok: true, users });
});

export { app };
