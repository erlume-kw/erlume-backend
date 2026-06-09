/**
 * Insert Notion subscription expenses (May 2025 – June 2026)
 * Run: node scripts/insert-notion-expenses.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/erlumedb";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected:", MONGODB_URI.includes("localhost") ? "local" : "Atlas");

  const col = mongoose.connection.db.collection("expenses");

  // Build records: May 2025 (month index 4) → June 2026 (month index 5)
  const schedule = [
    { year: 2025, monthIndexes: [4, 5, 6, 7, 8, 9, 10, 11] }, // May–Dec 2025
    { year: 2026, monthIndexes: [0, 1, 2, 3, 4, 5] },          // Jan–Jun 2026
  ];

  const records = [];
  for (const { year, monthIndexes } of schedule) {
    for (const m of monthIndexes) {
      records.push({
        name: "Notion",
        cost: "20",
        currency: "USD",
        type: ["subscriptions"],
        month: new Date(year, m, 1),
        notes: "Notion workspace subscription",
        isRecurring: true,
        paidBy: "erlume",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  console.log(`Inserting ${records.length} Notion records…`);
  const result = await col.insertMany(records);
  console.log(`Done — inserted ${result.insertedCount} records`);

  // Preview
  records.forEach((r) => {
    console.log(`  ${r.month.toISOString().slice(0, 7)}  $${r.cost}`);
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
