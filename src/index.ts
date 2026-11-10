import "dotenv/config";
import { Hono } from "hono";
import { logger } from "hono/logger";
import auth from "./routes/auth";
import books from "./routes/books";

const app = new Hono();

// Global middleware
app.use("*", logger());

// Simple route
app.get("/", (c) => {
  return c.json({
    message: "Hono API",
    routes: {
      health: "GET /health",
      auth: ["POST /auth/register", "POST /auth/login", "GET /auth/me"],
      books: [
        "GET /books",
        "GET /books/:id",
        "POST /books",
        "PUT /books/:id",
        "DELETE /books/:id",
      ],
    },
  });
});

app.get("/health", (c) => c.json({ ok: true }));

// Route groups
app.route("/auth", auth);
app.route("/books", books);

export default app;
