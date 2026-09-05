import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
import { plans } from './schema.js';
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment');
}
try {
    const url = new URL(connectionString);
    console.log(`Connecting to database host: ${url.hostname}:${url.port || '5432'}`);
}
catch {
    throw new Error('DATABASE_URL is not a valid connection string');
}
const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });
export async function seedPlans() {
    try {
        const existing = await db.select().from(plans);
        if (existing.length > 0) {
            console.log('Plans already seeded');
            return;
        }
        await db.insert(plans).values([
            { id: 'plan_starter_monthly', name: 'Starter', price: 39900, currency: 'INR', interval: 'monthly', description: 'Unlimited keys and usage' },
            { id: 'plan_pro_monthly', name: 'Pro', price: 99900, currency: 'INR', interval: 'monthly', description: 'Priority support + unlimited access' },
            { id: 'plan_enterprise_monthly', name: 'Enterprise', price: 199900, currency: 'INR', interval: 'monthly', description: 'Dedicated infrastructure + SLA' }
        ]);
        console.log('Plans seeded');
    }
    catch (err) {
        console.error('Failed to seed plans:', err);
        throw err;
    }
}
//# sourceMappingURL=database.js.map