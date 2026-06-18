import { db } from '../config/database.js';
import { apiKeys } from '../config/schema.js';

async function deleteAllApiKeys() {
  console.log('Deleting all API keys...');

  const result = await db.delete(apiKeys).returning({ id: apiKeys.id, mask: apiKeys.mask });

  console.log(`Deleted ${result.length} API key(s).`);
  if (result.length > 0) {
    console.log('Deleted keys:', result.map((k) => k.mask).join(', '));
  }

  process.exit(0);
}

deleteAllApiKeys().catch((err) => {
  console.error('Failed to delete API keys:', err);
  process.exit(1);
});
