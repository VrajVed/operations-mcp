require('dotenv').config();

const express = require('express');
const { clerkMiddleware } = require('@clerk/express');
const { initSchema, seedPlans } = require('./db/database');

const solverRouter = require('./routes/solver');
const keysRouter = require('./routes/keys');
const subscriptionsRouter = require('./routes/subscriptions');
const webhooksRouter = require('./routes/webhooks');

const app = express();

// Initialize database
initSchema();
seedPlans();

// Middleware
app.use(clerkMiddleware());

// Webhooks need raw body for signature verification
app.use('/v1/webhooks', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
app.use(express.json());

// Routes
app.use(solverRouter);
app.use('/v1/keys', keysRouter);
app.use('/v1', subscriptionsRouter);
app.use('/v1/webhooks', webhooksRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
