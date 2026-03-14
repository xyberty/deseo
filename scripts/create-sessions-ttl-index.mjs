/**
 * One-time migration script: creates a TTL index on the sessions collection
 * so MongoDB automatically purges expired session documents.
 *
 * Run with:
 *   MONGODB_URI=<uri> MONGODB_DB=deseo node scripts/create-sessions-ttl-index.mjs
 *
 * Safe to run multiple times — createIndex is idempotent.
 */

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'deseo';

if (!uri) {
  console.error('Error: MONGODB_URI environment variable is required.');
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(dbName);

  const indexName = await db.collection('sessions').createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'sessions_ttl' }
  );

  console.log(`TTL index "${indexName}" created on sessions.expiresAt`);
  console.log(`MongoDB will auto-purge expired session documents.`);
} catch (err) {
  console.error('Failed to create TTL index:', err);
  process.exit(1);
} finally {
  await client.close();
}
