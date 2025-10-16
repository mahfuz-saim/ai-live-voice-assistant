// Main server entry point
// Initializes Express server with REST APIs and WebSocket support

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import http from "http";
import { initializeWebSocket, getAllActiveSessions } from "./wsHandler.js";
import chatRouter from "./routes/chat.js";
import sessionRouter from "./routes/session.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: "50mb" })); // Parse JSON bodies (increased limit for base64 images)
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Parse URL-encoded bodies

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Real-Time AI Voice Assistant Backend",
    status: "running",
    version: "1.0.0",
    endpoints: {
      chat: "/chat",
      saveSession: "/save-session",
      getSession: "/sessions/:id",
      getUserSessions: "/sessions/user/:userId",
      createUser: "/users",
      getUser: "/users/:id",
      websocket: "ws://localhost:" + PORT + "/ws",
    },
  });
});

// API Routes
app.use("/chat", chatRouter);
app.use("/", sessionRouter); // Session routes are at root level

// Status endpoint to check active WebSocket connections
app.get("/status", (req, res) => {
  const activeSessions = getAllActiveSessions();
  res.json({
    success: true,
    server: "running",
    activeWebSocketConnections: activeSessions.length,
    sessions: activeSessions,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server on the same HTTP server
const wss = new WebSocketServer({
  server,
  path: "/ws",
});

// Initialize WebSocket handlers
initializeWebSocket(wss);

// Start server
server.listen(PORT, () => {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                                                          ║");
  console.log("║   🤖 Real-Time AI Voice Assistant Backend               ║");
  console.log("║                                                          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`✅ HTTP Server running on: http://localhost:${PORT}`);
  console.log(`✅ WebSocket Server running on: ws://localhost:${PORT}/ws`);
  console.log("");
  console.log("📡 Available Endpoints:");
  console.log(`   - GET    /                      - API information`);
  console.log(`   - GET    /status                - Server status`);
  console.log(`   - POST   /chat                  - Send chat message`);
  console.log(`   - POST   /chat/analyze          - Analyze content`);
  console.log(`   - POST   /save-session          - Save session`);
  console.log(`   - GET    /sessions/:id          - Get session by ID`);
  console.log(`   - GET    /sessions/user/:userId - Get user sessions`);
  console.log(`   - PUT    /sessions/:id          - Update session`);
  console.log(`   - DELETE /sessions/:id          - Delete session`);
  console.log(`   - POST   /users                 - Create user`);
  console.log(`   - GET    /users/:id             - Get user by ID`);
  console.log("");
  console.log("🌐 WebSocket Messages:");
  console.log("   - screen_frame    - Send screen for analysis");
  console.log("   - chat_message    - Send chat message");
  console.log("   - set_goal        - Set user goal");
  console.log("   - update_metadata - Update session metadata");
  console.log("   - get_history     - Get conversation history");
  console.log("   - ping            - Keep connection alive");
  console.log("");
  console.log("💡 Press Ctrl+C to stop the server");
  console.log("");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received. Closing server gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

export default app;
