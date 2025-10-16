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
    case "screen_frame":
      // Handle screen frame analysis
      await handleScreenFrame(sessionId, message);
      break;

    case "chat_message":
      // Handle text chat message
      await handleChatMessage(sessionId, message);
      break;

    case "set_goal":
      // Update user's current goal
      session.userGoal = message.goal;
      ws.send(
        JSON.stringify({
          type: "goal_updated",
          goal: message.goal,
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
        })
      );
      break;

    case "ping":
      // Respond to ping to keep connection alive
      ws.send(JSON.stringify({ type: "pong" }));
      break;

    default:
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Unknown message type: ${message.type}`,
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
    // Validate that frame data exists
    if (!message.frame) {
      console.error("No frame data received");
      ws.send(
        JSON.stringify({
          type: "error",
          message: "No frame data provided",
          error: "Frame field is required",
        })
      );
      return;
    }

    // Notify client that analysis has started
    ws.send(
      JSON.stringify({
        type: "analyzing",
        message: "Analyzing screen...",
      })
    );

    // Extract base64 image (remove data:image/png;base64, prefix if present)
    let base64Image = message.frame;
    if (base64Image.includes("base64,")) {
      base64Image = base64Image.split("base64,")[1];
    }

    // Validate base64 image is not empty
    if (!base64Image || base64Image.trim() === "") {
      console.error("Empty base64 image data");
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid frame data",
          error: "Base64 image data is empty",
        })
      );
      return;
    }

    // Log frame info for debugging
    console.log(
      `📸 Processing frame: ${Math.round(base64Image.length / 1024)}KB`
    );
    console.log(`🎯 User goal: ${userGoal || "Not set"}`);

    // Analyze the screen frame with Gemini
    const guidance = await analyzeScreenFrame(
      base64Image,
      userGoal || "Assist user with their current task",
      metadata
    );

    // Store screen step in history
    const screenStep = {
      timestamp: new Date().toISOString(),
      frame: base64Image.substring(0, 100) + "...", // Store truncated version
      guidance,
      metadata: { ...metadata },
    };
    screenHistory.push(screenStep);

    // Send AI guidance back to client
    ws.send(
      JSON.stringify({
        type: "screen_guidance",
        guidance,
        timestamp: screenStep.timestamp,
      })
    );

    console.log(`✅ Screen frame analyzed successfully for ${sessionId}`);
  } catch (error) {
    console.error("❌ Error analyzing screen frame:", error);
    console.error("Error details:", error.stack);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to analyze screen",
        error: error.message,
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
    // Validate that content exists
    if (!message.content) {
      console.error("No content in chat message");
      ws.send(
        JSON.stringify({
          type: "error",
          message: "No content provided",
          error: "Content field is required for chat messages",
        })
      );
      return;
    }

    // Add user message to conversation history
    const userMessage = {
      role: "user",
      content: message.content,
      timestamp: new Date().toISOString(),
    };
    conversationHistory.push(userMessage);

    // Notify client that we're processing
    ws.send(
      JSON.stringify({
        type: "processing",
        message: "Processing your message...",
      })
    );

    // Get AI response with full context
    const responseText = await getContextualResponse({
      message: message.content,
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

    // Send response to client
    ws.send(
      JSON.stringify({
        type: "chat_response",
        message: responseText,
        timestamp: aiMessage.timestamp,
      })
    );
  } catch (error) {
    console.error("Error handling chat message:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to get AI response",
        error: error.message,
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
