import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { booksRoutes } from './routes/books';
import { exportRoutes } from './routes/exports';
import { recipeRoutes } from './routes/recipes';
import { searchRoutes } from './routes/search';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api/books', booksRoutes);
app.route('/api/recipes', recipeRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/export', exportRoutes);

export default app;
