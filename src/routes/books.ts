import { Hono } from "hono";
import { sValidator } from "@hono/standard-validator";
import { eq } from "drizzle-orm";
import z from "zod";
import { withDb } from "../db";
import * as schema from "../db/schema";
import { authMiddleware, type AuthEnv } from "../middleware/auth";

const books = new Hono<AuthEnv>();

const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
});

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
});

// GET /books?author=Patel  (query param example)
books.get("/", async (c) => {
  const author = c.req.query("author");

  const allBooks = await withDb((db) => {
    if (author) {
      return db.query.books.findMany({
        where: eq(schema.books.author, author),
      });
    }
    return db.query.books.findMany();
  });

  return c.json(allBooks);
});

// GET /books/:id  (path param example)
books.get("/:id", async (c) => {
  const id = c.req.param("id");

  const book = await withDb((db) =>
    db.query.books.findFirst({ where: eq(schema.books.id, id) }),
  );

  if (!book) {
    return c.json({ error: "Book not found" }, 404);
  }

  return c.json(book);
});

// POST /books  (protected + validation)
books.post("/", authMiddleware, sValidator("json", createBookSchema), async (c) => {
  const { title, author } = c.req.valid("json");
  // Example: logged-in user from middleware
  // const user = c.get("user")

  const [book] = await withDb((db) =>
    db.insert(schema.books).values({ title, author }).returning(),
  );

  return c.json(book, 201);
});

// PUT /books/:id  (protected)
books.put("/:id", authMiddleware, sValidator("json", updateBookSchema), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [book] = await withDb((db) =>
    db.update(schema.books).set(body).where(eq(schema.books.id, id)).returning(),
  );

  if (!book) {
    return c.json({ error: "Book not found" }, 404);
  }

  return c.json(book);
});

// DELETE /books/:id  (protected)
books.delete("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const [book] = await withDb((db) =>
    db.delete(schema.books).where(eq(schema.books.id, id)).returning(),
  );

  if (!book) {
    return c.json({ error: "Book not found" }, 404);
  }

  return c.json({ message: "Book deleted", book });
});

export default books;
