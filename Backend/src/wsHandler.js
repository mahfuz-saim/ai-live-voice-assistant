// WebSocket handler for real-time communication
// Handles screen frame streaming and live AI guidance

import { analyzeScreenFrame, getContextualResponse } from "./utils/gemini.js";

// Store active WebSocket clients and their session data
const activeSessions = new Map();

/**
 * Initialize WebSocket server
 * @param {WebSocketServer} wss - WebSocket server instance
 */
export function initializeWebSocket(wss) {
  console.log("✅ WebSocket server initialized");

  wss.on("connection", (ws, req) => {
    // Generate unique session ID for this connection
    const sessionId = generateSessionId();
    console.log(`🔌 New WebSocket connection: ${sessionId}`);

    // Initialize session data for this client
    activeSessions.set(sessionId, {
      ws,
      conversationHistory: [],
      screenHistory: [],
      userGoal: "",
      metadata: {},
      connectedAt: new Date(),
    });

    // Send connection acknowledgment
    ws.send(
      JSON.stringify({
        type: "connected",
        sessionId,
        message: "Connected to AI Voice Assistant",
      })
    );

    // Handle incoming messages
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(
          `📨 Received message type: ${message.type} from ${sessionId}`
        );
        await handleWebSocketMessage(sessionId, message);
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
        console.error("Message data:", data.toString().substring(0, 200));
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Failed to process message",
            error: error.message,
          })
        );
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      console.log(`🔌 WebSocket disconnected: ${sessionId}`);
      activeSessions.delete(sessionId);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error(`❌ WebSocket error for ${sessionId}:`, error);
    });
  });
}

/**
 * Handle different types of WebSocket messages
 * @param {string} sessionId - Client session ID
 * @param {Object} message - Parsed message object
 */
async function handleWebSocketMessage(sessionId, message) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    console.error(`Session ${sessionId} not found`);
    return;
  }

  const { ws, conversationHistory, screenHistory } = session;

  // Validate message has a type field
  if (!message.type) {
    console.error("Message missing 'type' field");
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Invalid message format",
        error: "Message must have a 'type' field",
      })
    );
    return;
  }

  switch (message.type) {
    case "connection":
      // Handle client connection message - just acknowledge
      console.log(`🤝 Client connection acknowledged for ${sessionId}`);
      // Don't send response to avoid cluttering the frontend
      break;

    case "frame":
      // Handle screen frame from frontend (uses 'data' field)
      await handleScreenFrame(sessionId, message);
      break;

    case "screen_frame":
      // Handle screen frame (legacy format with 'frame' field)
      await handleScreenFrame(sessionId, message);
      break;

    case "chat":
      // Handle chat message from frontend
      await handleChatMessage(sessionId, message);
      break;

    case "chat_message":
      // Handle chat message (legacy format)
      await handleChatMessage(sessionId, message);
      break;

    case "set_goal":
      // Update user's current goal
      session.userGoal = message.goal;
      ws.send(
        JSON.stringify({
          type: "status",
          message: "Goal updated",
          goal: message.goal,
          timestamp: new Date().toISOString(),
        })
      );
      break;

    case "update_metadata":
      // Update session metadata (mouse position, detected elements, etc.)
      session.metadata = { ...session.metadata, ...message.metadata };
      break;

    case "get_history":
      // Send conversation and screen history
      ws.send(
        JSON.stringify({
          type: "history",
          conversationHistory,
          screenHistory,
          timestamp: new Date().toISOString(),
        })
      );
      break;

    case "ping":
      // Respond to ping to keep connection alive
      ws.send(
        JSON.stringify({
          type: "pong",
          timestamp: new Date().toISOString(),
        })
      );
      break;

    default:
      console.warn(`⚠️ Unknown message type: ${message.type}`);
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Unknown message type: ${message.type}`,
          timestamp: new Date().toISOString(),
        })
      );
  }
}

/**
 * Handle screen frame analysis
 * @param {string} sessionId - Session ID
 * @param {Object} message - Message containing base64 image
 */
async function handleScreenFrame(sessionId, message) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  const { ws, userGoal, metadata, screenHistory } = session;

  try {
    // Handle both 'data' field (frontend format) and 'frame' field (legacy format)
    const frameData = message.data || message.frame;

    // Validate that frame data exists
    if (!frameData) {
      console.error("No frame data received");
      ws.send(
        JSON.stringify({
          type: "error",
          message: "No frame data provided",
          error: "Frame data field is required",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // Don't send "analyzing" message for frame messages to avoid cluttering frontend
    // Frontend sends frames at 1-2 FPS, so we want minimal response

    // Extract base64 image (remove data:image/jpeg;base64, or data:image/png;base64, prefix if present)
    let base64Image = frameData;
    if (base64Image.includes("base64,")) {
      base64Image = base64Image.split("base64,")[1];
    }

    // Validate base64 image is not empty
    if (!base64Image || base64Image.trim() === "") {
      console.error("❌ Empty base64 image data");
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid frame data",
          error: "Base64 image data is empty",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // Validate base64 format (basic check)
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    const sampleSize = Math.min(100, base64Image.length);
    const sample = base64Image.substring(0, sampleSize);

    if (!base64Regex.test(sample)) {
      console.error("❌ Invalid base64 format detected");
      console.error("Sample:", sample);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid frame data format",
          error: "Base64 data appears to be corrupted or invalid",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // Log frame info for debugging
    const frameSizeKB = Math.round(base64Image.length / 1024);
    console.log(`📸 Processing frame: ${frameSizeKB}KB`);
    console.log(`📏 Base64 length: ${base64Image.length} characters`);
    console.log(`🎯 User goal: ${userGoal || "Not set"}`);

    // Detect image format from base64 header or assume JPEG
    let imageFormat = "jpeg"; // Default to JPEG as frontend sends JPEG
    if (frameData.includes("data:image/")) {
      if (frameData.includes("image/png")) imageFormat = "png";
      else if (
        frameData.includes("image/jpeg") ||
        frameData.includes("image/jpg")
      )
        imageFormat = "jpeg";
    }
    console.log(`🖼️ Image format detected: ${imageFormat}`);

    // Analyze the screen frame with Gemini
    console.log(`🤖 Sending frame to Gemini AI for analysis...`);
    const guidance = await analyzeScreenFrame(
      base64Image,
      userGoal || "Assist user with their current task",
      metadata,
      imageFormat // Pass the image format
    );

    // Store screen step in history
    const screenStep = {
      timestamp: new Date().toISOString(),
      frame: base64Image.substring(0, 100) + "...", // Store truncated version
      guidance,
      metadata: { ...metadata },
    };
    screenHistory.push(screenStep);

    // Send AI guidance back to client using frontend's expected format
    ws.send(
      JSON.stringify({
        type: "response",
        message: guidance,
        timestamp: screenStep.timestamp,
      })
    );

    console.log(`✅ Screen frame analyzed successfully for ${sessionId}`);
  } catch (error) {
    console.error("❌ Error analyzing screen frame:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Log additional debugging info
    console.error(
      "Frame data length:",
      message.data?.length || message.frame?.length || 0
    );
    console.error("Session ID:", sessionId);
    console.error("User goal:", userGoal);

    // Check if it's a specific error type
    let errorMessage = "Failed to analyze screen";
    let errorDetails = error.message;

    if (error.message.includes("API key")) {
      errorMessage = "AI API authentication failed";
      errorDetails = "Please check GEMINI_API_KEY in .env file";
    } else if (
      error.message.includes("quota") ||
      error.message.includes("rate limit")
    ) {
      errorMessage = "AI API rate limit exceeded";
      errorDetails = "Too many requests, please wait a moment";
    } else if (
      error.message.includes("invalid") ||
      error.message.includes("decode")
    ) {
      errorMessage = "Invalid image data";
      errorDetails = "Failed to decode base64 image";
    } else if (error.message.includes("timeout")) {
      errorMessage = "AI API request timeout";
      errorDetails = "Request took too long, please try again";
    }

    ws.send(
      JSON.stringify({
        type: "error",
        message: errorMessage,
        error: errorDetails,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

/**
 * Handle chat message
 * @param {string} sessionId - Session ID
 * @param {Object} message - Message object with text content
 */
async function handleChatMessage(sessionId, message) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  const { ws, conversationHistory, userGoal, metadata } = session;

  try {
    // Handle both 'message' field (frontend format) and 'content' field (legacy format)
    const chatContent = message.message || message.content;

    // Validate that content exists
    if (!chatContent) {
      console.error("No content in chat message");
      ws.send(
        JSON.stringify({
          type: "error",
          message: "No content provided",
          error: "Message field is required for chat messages",
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // Add user message to conversation history
    const userMessage = {
      role: "user",
      content: chatContent,
      timestamp: new Date().toISOString(),
    };
    conversationHistory.push(userMessage);

    // Send status update
    ws.send(
      JSON.stringify({
        type: "status",
        message: "Processing your message...",
        timestamp: new Date().toISOString(),
      })
    );

    // Get AI response with full context
    const responseText = await getContextualResponse({
      message: chatContent,
      base64Image: message.includeScreen ? message.screenFrame : null,
      conversationHistory,
      userGoal,
    });

    // Add AI response to conversation history
    const aiMessage = {
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
    };
    conversationHistory.push(aiMessage);

    // Send response to client using frontend's expected format
    ws.send(
      JSON.stringify({
        type: "response",
        message: responseText,
        timestamp: aiMessage.timestamp,
      })
    );

    console.log(`✅ Chat message processed successfully for ${sessionId}`);
  } catch (error) {
    console.error("❌ Error handling chat message:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to get AI response",
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

/**
 * Generate a unique session ID
 * @returns {string} - Unique session identifier
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get active session data by session ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - Session data or null if not found
 */
export function getSessionData(sessionId) {
  return activeSessions.get(sessionId);
}

/**
 * Get all active sessions (for monitoring/debugging)
 * @returns {Array} - Array of session objects
 */
export function getAllActiveSessions() {
  return Array.from(activeSessions.entries()).map(([id, data]) => ({
    sessionId: id,
    connectedAt: data.connectedAt,
    messageCount: data.conversationHistory.length,
    screenFrameCount: data.screenHistory.length,
    userGoal: data.userGoal,
  }));
}
