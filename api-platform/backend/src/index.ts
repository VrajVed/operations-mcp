import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { seedPlans } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Timezone'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

seedPlans().catch((err) => {
  console.error('Database seeding failed. Check DATABASE_URL in your .env file.');
  process.exit(1);
});

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
