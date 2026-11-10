import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sign } from "hono/jwt";
import z from "zod";
import { withDb } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthEnv } from "../middleware/auth";

const auth = new Hono<AuthEnv>();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// Helper: create JWT for a user
async function createToken(user: { id: string; name: string; email: string }) {
  return sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 1 day
    },
    process.env.JWT_SECRET!,
    "HS256",
  );
}

// POST /auth/register
auth.post("/register", sValidator("json", registerSchema), async (c) => {
  const { name, email, password } = c.req.valid("json");

  const existing = await withDb((db) =>
    db.query.users.findFirst({ where: eq(schema.users.email, email) }),
  );

  if (existing) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await withDb((db) =>
    db
      .insert(schema.users)
      .values({ name, email, passwordHash })
      .returning({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
      }),
  );

  const token = await createToken(user);
  return c.json({ user, token }, 201);
});

// POST /auth/login
auth.post("/login", sValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await withDb((db) =>
    db.query.users.findFirst({ where: eq(schema.users.email, email) }),
  );

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  const token = await createToken(publicUser);
  return c.json({ user: publicUser, token });
});

// GET /auth/me  (protected)
auth.get("/me", authMiddleware, (c) => {
  return c.json({ user: c.get("user") });
});

export default auth;
