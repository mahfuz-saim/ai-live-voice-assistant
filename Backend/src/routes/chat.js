// Chat API routes
// Handles REST API endpoints for chat functionality

import express from "express";
import { sendChatMessage, getContextualResponse } from "../utils/gemini.js";

const router = express.Router();

/**
 * POST /chat
 * Send a chat message and receive AI response
 *
 * Request body:
 * {
 *   message: string (required) - The user's message
 *   sessionId: string (optional) - Session identifier for context
 *   conversationHistory: array (optional) - Previous messages for context
 *   userGoal: string (optional) - User's current goal
 *   includeScreen: boolean (optional) - Whether to include screen context
 *   screenFrame: string (optional) - Base64 encoded screen image
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   response: string - AI response text
 *   timestamp: string
 * }
 */
router.post("/", async (req, res) => {
  try {
    const {
      message,
      sessionId,
      conversationHistory = [],
      userGoal,
      includeScreen = false,
      screenFrame,
    } = req.body;

    // Validate required fields
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a string",
      });
    }

    // Get AI response based on whether screen context is included
    let responseText;

    if (includeScreen && screenFrame) {
      // Get contextual response with screen image
      let base64Image = screenFrame;
      if (base64Image.includes("base64,")) {
        base64Image = base64Image.split("base64,")[1];
      }

      responseText = await getContextualResponse({
        message,
        base64Image,
        conversationHistory,
        userGoal,
      });
    } else {
      // Get text-only response
      responseText = await sendChatMessage(message, conversationHistory);
    }

    // Send successful response
    res.json({
      success: true,
      response: responseText,
      sessionId: sessionId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /chat endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process chat message",
      message: error.message,
    });
  }
});

/**
 * POST /chat/analyze
 * Analyze text or content with AI
 *
 * Request body:
 * {
 *   content: string (required) - Content to analyze
 *   analysisType: string (optional) - Type of analysis requested
 * }
 */
router.post("/analyze", async (req, res) => {
  try {
    const { content, analysisType = "general" } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required for analysis",
      });
    }

    const prompt = `Analyze the following content and provide insights (${analysisType} analysis):\n\n${content}`;
    const analysis = await sendChatMessage(prompt);

    res.json({
      success: true,
      analysis,
      analysisType,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /chat/analyze endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze content",
      message: error.message,
    });
  }
});

export default router;
