import { pgTable, text, integer, timestamp, boolean, serial } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
    clerk_id: text('clerk_id').primaryKey(),
    email: text('email').notNull().unique(),
    subscription_status: text('subscription_status').default('inactive'),
    razorpay_subscription_id: text('razorpay_subscription_id'),
    timezone: text('timezone').default('UTC'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
export const apiKeys = pgTable('api_keys', {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.clerk_id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    hashed_key: text('hashed_key').notNull().unique(),
    mask: text('mask').notNull(),
    is_free: boolean('is_free').default(false),
    status: text('status').default('active'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
export const keyUsage = pgTable('key_usage', {
    key_id: text('key_id').primaryKey().references(() => apiKeys.id, { onDelete: 'cascade' }),
    daily_count: integer('daily_count').default(0),
    daily_limit: integer('daily_limit').default(2),
    last_reset: timestamp('last_reset', { withTimezone: true }).defaultNow(),
    total_requests: integer('total_requests').default(0),
});
export const subscriptions = pgTable('subscriptions', {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull().references(() => users.clerk_id, { onDelete: 'cascade' }),
    razorpay_plan_id: text('razorpay_plan_id').notNull(),
    status: text('status').default('created'),
    current_period_start: integer('current_period_start'),
    current_period_end: integer('current_period_end'),
    short_url: text('short_url'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
export const plans = pgTable('plans', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    price: integer('price').notNull(),
    currency: text('currency').default('INR'),
    interval: text('interval').default('monthly'),
    description: text('description'),
});
export const requestLogs = pgTable('request_logs', {
    id: serial('id').primaryKey(),
    key_id: text('key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
    endpoint: text('endpoint').notNull(),
    method: text('method').notNull(),
    status_code: integer('status_code'),
    latency_ms: integer('latency_ms'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
//# sourceMappingURL=schema.js.map