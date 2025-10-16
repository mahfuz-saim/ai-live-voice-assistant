// Database schema definitions using Drizzle ORM
// This file defines the structure of our PostgreSQL database tables

import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Users table
 * Stores user information
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Sessions table
 * Stores AI assistant session metadata
 */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Session History table
 * Stores detailed conversation history and screen steps for each session
 * Uses JSONB for flexible storage of messages and screen analysis data
 */
export const sessionHistory = pgTable("session_history", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => sessions.id)
    .notNull(),
  // Store array of message objects with role, content, timestamp
  messages: jsonb("messages").notNull(),
  // Store array of screen analysis steps with frame data, AI guidance, timestamp
  screenSteps: jsonb("screen_steps"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
