import { eq, asc } from 'drizzle-orm';
import { db } from '../config/database.js';
import { plans } from '../config/schema.js';

export async function getAllPlans() {
  return db.select().from(plans).orderBy(asc(plans.price));
}

export async function getPlanById(planId: string) {
  const result = await db.select().from(plans).where(eq(plans.id, planId));
  return result[0] ?? null;
}
