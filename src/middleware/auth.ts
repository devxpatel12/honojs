import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

// Shared type so routes can use c.get("user")
export type AuthEnv = {
  Variables: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
};

// Protect routes: check Authorization: Bearer <token>
export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = header.slice(7); // remove "Bearer "

  try {
    const payload = await verify(token, process.env.JWT_SECRET!, "HS256");

    // Save user on context → available in next handlers via c.get("user")
    c.set("user", {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
    });

    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
