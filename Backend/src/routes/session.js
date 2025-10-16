// Session API routes
// Handles saving and retrieving session data from PostgreSQL

import express from "express";
import { db } from "../db/index.js";
import { users, sessions, sessionHistory } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateSessionTitle } from "../utils/gemini.js";

const router = express.Router();

/**
 * POST /save-session
 * Save session data (steps, goal, conversation) to database
 *
 * Request body:
 * {
 *   userId: number (required) - User ID
 *   title: string (optional) - Session title (auto-generated if not provided)
 *   messages: array (required) - Conversation messages
 *   screenSteps: array (optional) - Screen analysis steps
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   sessionId: number - Created session ID
 *   message: string
 * }
 */
router.post("/save-session", async (req, res) => {
  try {
    const { userId, title, messages, screenSteps = [] } = req.body;

    // Validate required fields
    if (!userId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: "userId and messages array are required",
      });
    }

    // Generate title if not provided
    let sessionTitle = title;
    if (!sessionTitle && messages.length > 0) {
      try {
        sessionTitle = await generateSessionTitle(messages);
      } catch (error) {
        console.error("Failed to generate title:", error);
        sessionTitle = `Session ${new Date().toLocaleDateString()}`;
      }
    } else if (!sessionTitle) {
      sessionTitle = `Session ${new Date().toLocaleDateString()}`;
    }

    // Create new session
    const [newSession] = await db
      .insert(sessions)
      .values({
        userId,
        title: sessionTitle,
      })
      .returning();

    // Save session history
    await db.insert(sessionHistory).values({
      sessionId: newSession.id,
      messages: messages,
      screenSteps: screenSteps,
    });

    res.json({
      success: true,
      sessionId: newSession.id,
      title: sessionTitle,
      message: "Session saved successfully",
    });
  } catch (error) {
    console.error("Error saving session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save session",
      message: error.message,
    });
  }
});

/**
 * GET /sessions/:id
 * Retrieve saved session by ID
 *
 * Response:
 * {
 *   success: boolean
 *   session: object - Session data with history
 * }
 */
router.get("/sessions/:id", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session ID",
      });
    }

    // Fetch session data
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    // Fetch session history
    const [history] = await db
      .select()
      .from(sessionHistory)
      .where(eq(sessionHistory.sessionId, sessionId))
      .orderBy(sessionHistory.updatedAt);

    res.json({
      success: true,
      session: {
        ...session,
        history: history || null,
      },
    });
  } catch (error) {
    console.error("Error retrieving session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve session",
      message: error.message,
    });
  }
});

/**
 * GET /sessions/user/:userId
 * Get all sessions for a specific user
 *
 * Response:
 * {
 *   success: boolean
 *   sessions: array - List of user sessions
 * }
 */
router.get("/sessions/user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    // Fetch all sessions for user
    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(sessions.createdAt);

    res.json({
      success: true,
      sessions: userSessions,
      count: userSessions.length,
    });
  } catch (error) {
    console.error("Error retrieving user sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve sessions",
      message: error.message,
    });
  }
});

/**
 * PUT /sessions/:id
 * Update session data
 *
 * Request body:
 * {
 *   title: string (optional)
 *   messages: array (optional)
 *   screenSteps: array (optional)
 * }
 */
router.put("/sessions/:id", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { title, messages, screenSteps } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session ID",
      });
    }

    // Update session title if provided
    if (title) {
      await db
        .update(sessions)
        .set({ title })
        .where(eq(sessions.id, sessionId));
    }

    // Update session history if messages or screenSteps provided
    if (messages || screenSteps) {
      const updateData = {};
      if (messages) updateData.messages = messages;
      if (screenSteps) updateData.screenSteps = screenSteps;
      updateData.updatedAt = new Date();

      await db
        .update(sessionHistory)
        .set(updateData)
        .where(eq(sessionHistory.sessionId, sessionId));
    }

    res.json({
      success: true,
      message: "Session updated successfully",
    });
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update session",
      message: error.message,
    });
  }
});

/**
 * DELETE /sessions/:id
 * Delete a session
 */
router.delete("/sessions/:id", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session ID",
      });
    }

    // Delete session history first (foreign key constraint)
    await db
      .delete(sessionHistory)
      .where(eq(sessionHistory.sessionId, sessionId));

    // Delete session
    await db.delete(sessions).where(eq(sessions.id, sessionId));

    res.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete session",
      message: error.message,
    });
  }
});

/**
 * POST /users
 * Create a new user
 *
 * Request body:
 * {
 *   name: string (required)
 *   email: string (required)
 * }
 */
router.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required",
      });
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
      })
      .returning();

    res.json({
      success: true,
      user: newUser,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create user",
      message: error.message,
    });
  }
});

/**
 * GET /users/:id
 * Get user by ID
 */
router.get("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve user",
      message: error.message,
    });
  }
});

export default router;
