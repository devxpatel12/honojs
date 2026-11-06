import { sValidator } from '@hono/standard-validator';
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import z from 'zod';


// const app = new Hono()


// HTTP Methods
// app.get('/', (c) => c.text('GET /'))
// app.post('/', (c) => c.text('POST /'))
// app.put('/', (c) => c.text('PUT /'))
// app.delete('/', (c) => c.text('DELETE /'))
// app.query('/', (c) => c.text('QUERY /'))

// Wildcard
// app.get('/wild/*/card', (c) => {
//   return c.text('GET /wild/*/card')
// })

// Any HTTP methods
// app.all('/hello', (c) => c.text('Any Method /hello'))

// Custom HTTP method
// app.on('PURGE', '/cache', (c) => c.text('PURGE Method /cache'))

// Multiple Method
// app.on(['PUT', 'DELETE'], '/post', (c) =>
//   c.text('PUT or DELETE /post')
// )

// Multiple Paths
// app.on('GET', ['/hello', '/ja/hello', '/en/hello'], (c) =>
//   c.text('Hello')
// )

// PATH PARAMETERS
// app.get('/user/:name', async (c) => {
//   const name = c.req.param('name')
// })
// app.get('/posts/:id/comment/:comment_id', async (c) => {
//   const { id, comment_id } = c.req.param()
// })
// optional path parameters
// Will match `/api/animal` and `/api/animal/:type`
// app.get('/api/animal/:type?', (c) => c.text('Animal!'))


// CHAINED ROUTE
// app
//   .get('/endpoint', (c) => {
//     return c.text('GET /endpoint')
//   })
//   .post((c) => {
//     return c.text('POST /endpoint')
//   })
//   .delete((c) => {
//     return c.text('DELETE /endpoint')
//   })



// GROUPING

// const book = new Hono()

// book.get('/', (c) => c.text('List Books')) // GET /book
// book.get('/:id', (c) => {
//   // GET /book/:id
//   const id = c.req.param('id')
//   return c.text('Get Book: ' + id)
// })
// book.post('/', (c) => c.text('Create Book')) // POST /book
// app.route('/book', book)


// const book = new Hono()
// book.get('/book', (c) => c.text('List Books')) // GET /book
// book.post('/book', (c) => c.text('Create Book')) // POST /book

// const user = new Hono().basePath('/user')
// user.get('/', (c) => c.text('List Users')) // GET /user
// user.post('/', (c) => c.text('Create User')) // POST /user

// app.route('/', book) // Handle /book
// app.route('/', user) // Handle /user


// BASE PATH (you can specify a base path)
// const api = new Hono().basePath('/api')
// api.get('/book', (c) => c.text('List Books')) // GET /api/book



// ROUTING PRIORITY
// app.get('/book/:slug', (c) => c.text('common')) // common, below this will be ignored
// app.get('/book/a', (c) => c.text('a')) // a
// app.get('/book/:slug', (c) => c.text('common')) // common

// app.get('*', (c) => c.text('common')) // common
// app.get('/foo', (c) => c.text('foo')) // foo, foo will not be dispatched


// app.use(logger())
// app.get('/foo', (c) => c.text('foo'))


const books = [
  {
    id: "1",
    title: "Book 1",
    author: "Author 1",
  },
  {
    id: "2",
    title: "Book 2",
    author: "Author 2",
  },
  {
    id: "3",
    title: "Book 3",
    author: "Author 3",
  },
]

const app = new Hono();

const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1).max(100),
})

app.get("/", (c) => {
  return c.json(books);
})

// Get a book by id
app.get("/book/:id", (c) => {
  const id = c.req.param('id');
  const book = books.find((book) => book.id === id);
  if (!book) {
    return c.json({ error: "Book not found" }, 404);
  }
  return c.json(book);
})

// Create a new book
app.post("/book", sValidator('json', createBookSchema), async (c) => {
  const { title, author } = await c.req.json();
  const book = {
    id: (books.length + 1).toString(),
    title,
    author
  }
  books.push(book);
  return c.json(book, 201);
})

// Update a book
app.put("book/:id", async (c) => {
  const id = c.req.param('id');
  const {title, author} = await c.req.json();
  const book = books.find(book => book.id === id);
  if(!book){
    return c.json({error: "Book not found"}, 404);
  }
  book.title = title;
  book.author = author;
  return c.json({message: "Book updated successfully", book}, 200);
})

app.delete("book/:id", (c) => {
  const id =  c.req.param('id');
  const book = books.find(book => book.id === id);
  if(!book){
    return c.json({error: "Book not found"}, 404);
  }
  books.splice(books.indexOf(book), 1);
  return c.json({message: "Book deleted successfully", books}, 200);
})


export default app
