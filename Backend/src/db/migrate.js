// Database migration script
// Run this to create tables in PostgreSQL

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.js";

async function runMigration() {

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await pool.end();
  }
}

runMigration();
