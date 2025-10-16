// Database connection setup using Drizzle ORM
// This file establishes the connection to PostgreSQL database

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";
import * as schema from "./schema.js";

// Load environment variables
dotenv.config();

const { Pool } = pg;

/**
 * Create PostgreSQL connection pool
 * The pool manages multiple database connections for better performance
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Test database connection
 */
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

/**
 * Initialize Drizzle ORM with the connection pool and schema
 */
export const db = drizzle(pool, { schema });

/**
 * Export pool for custom queries if needed
 */
export { pool };
