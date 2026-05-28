import dotenv from 'dotenv';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import { seedPlans } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

seedPlans();

app.use(clerkMiddleware());

app.use('/v1/webhooks', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use(routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
