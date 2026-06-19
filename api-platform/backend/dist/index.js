import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { seedPlans } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
dotenv.config();
const app = express();
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Timezone'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
}));
// Explicitly handle OPTIONS preflight for all routes
app.options('*', cors());
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});
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
//# sourceMappingURL=index.js.map