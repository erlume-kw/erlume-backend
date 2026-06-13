/**
 * Migrate all collections from local MongoDB → Atlas
 * Run: node scripts/migrate-to-atlas.js
 *
 * Safe to run multiple times — uses upsert so existing docs are updated, not duplicated.
 */

const { MongoClient } = require("mongodb");

const LOCAL_URI  = "mongodb://localhost:27017/erlumedb";
const ATLAS_URI  = "mongodb+srv://erlumekw:jOsWWqasnL3pT93H@erlume.fuwodvo.mongodb.net/erlumedb?appName=erlume";

async function main() {
  console.log("Connecting to local MongoDB…");
  const local = new MongoClient(LOCAL_URI);
  await local.connect();

  console.log("Connecting to Atlas…");
  const atlas = new MongoClient(ATLAS_URI);
  await atlas.connect();

  const localDb = local.db("erlumedb");
  const atlasDb = atlas.db("erlumedb");

  const collections = await localDb.listCollections().toArray();
  console.log(`\nFound ${collections.length} collections: ${collections.map(c => c.name).join(", ")}\n`);

  for (const { name } of collections) {
    const docs = await localDb.collection(name).find({}).toArray();
    if (docs.length === 0) {
      console.log(`  ${name}: empty — skipping`);
      continue;
    }

    // Upsert each document by _id so re-runs are safe
    const ops = docs.map(doc => ({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    }));

    const result = await atlasDb.collection(name).bulkWrite(ops, { ordered: false });
    console.log(`  ✓ ${name}: ${docs.length} docs → ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
  }

  console.log("\nMigration complete!");
  await local.close();
  await atlas.close();
}

main().catch(err => {
  console.error("\nError:", err.message);
  process.exit(1);
});
