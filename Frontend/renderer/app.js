// app.js - Main Application Logic
// This file coordinates all modules and handles UI interactions

/**
 * Application State
 */
const AppState = {
  isScreenSharing: false,
  isConnected: false,
  isPaused: false,
};

/**
 * UI Elements
 */
const UI = {
  startBtn: document.getElementById("startBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  stopBtn: document.getElementById("stopBtn"),
  saveSessionBtn: document.getElementById("saveSessionBtn"),
  clearChatBtn: document.getElementById("clearChatBtn"),
  statusIndicator: document.getElementById("statusIndicator"),
  statusText: document.getElementById("statusText"),
  connectionStatus: document.getElementById("connectionStatus"),
  frameRate: document.getElementById("frameRate"),
};

/**
 * Initialize application
 */
function initializeApp() {
  console.log("Initializing AI Voice Assistant...");

  // Set up button event listeners
  setupButtonListeners();

  // Connect to WebSocket
  window.websocketManager.connect();

  // Set up WebSocket message handler
  window.websocketManager.onMessage(handleWebSocketMessage);

  // Set up WebSocket status handler
  window.websocketManager.onStatusChange(handleConnectionStatus);

  // Set up WebRTC frame capture callback
  window.webrtcManager.onFrameCaptured(handleFrameCaptured);

  // Load voices for TTS (may need time to load)
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log("TTS voices loaded");
    };
  }

  console.log("Application initialized successfully");
}

/**
 * Set up button event listeners
 */
function setupButtonListeners() {
  // Start button
  UI.startBtn.addEventListener("click", async () => {
    console.log("Start button clicked");

    const success = await window.webrtcManager.startCapture();

    if (success) {
      AppState.isScreenSharing = true;
      updateUIForScreenSharing(true);
      window.chatManager.addSystemMessage(
        "Screen sharing started. AI assistant is now watching."
      );
    }
  });

  // Pause button
  UI.pauseBtn.addEventListener("click", () => {
    console.log("Pause button clicked");

    if (AppState.isPaused) {
      // Resume
      window.webrtcManager.resumeCapture();
      AppState.isPaused = false;
      UI.pauseBtn.textContent = "⏸️ Pause";
      window.chatManager.addSystemMessage("Screen sharing resumed.");
    } else {
      // Pause
      window.webrtcManager.pauseCapture();
      AppState.isPaused = true;
      UI.pauseBtn.textContent = "▶️ Resume";
      window.chatManager.addSystemMessage("Screen sharing paused.");
    }
  });

  // Stop button
  UI.stopBtn.addEventListener("click", () => {
    console.log("Stop button clicked");

    window.webrtcManager.stopCapture();
    AppState.isScreenSharing = false;
    AppState.isPaused = false;
    updateUIForScreenSharing(false);
    window.chatManager.addSystemMessage("Screen sharing stopped.");
  });

  // Save Session button
  UI.saveSessionBtn.addEventListener("click", async () => {
    console.log("Save Session button clicked");

    try {
      const sessionData = window.chatManager.getSessionData();
      await window.websocketManager.sendSessionData(sessionData);

      window.chatManager.addSystemMessage("✅ Session saved successfully!");
      alert("Session saved successfully!");
    } catch (error) {
      console.error("Failed to save session:", error);
      window.chatManager.addSystemMessage(
        "❌ Failed to save session. Please try again."
      );
      alert(
        "Failed to save session. Please check your connection to the backend."
      );
    }
  });

  // Clear Chat button
  UI.clearChatBtn.addEventListener("click", () => {
    console.log("Clear Chat button clicked");

    if (confirm("Are you sure you want to clear all chat messages?")) {
      window.chatManager.clearChat();
      window.chatManager.addSystemMessage(
        "Chat cleared. Start a new conversation!"
      );
    }
  });
}

/**
 * Update UI based on screen sharing state
 */
function updateUIForScreenSharing(isSharing) {
  if (isSharing) {
    UI.startBtn.disabled = true;
    UI.pauseBtn.disabled = false;
    UI.stopBtn.disabled = false;
    UI.statusIndicator.className = "status-dot status-active";
    UI.statusText.textContent = "Screen Sharing Active";
  } else {
    UI.startBtn.disabled = false;
    UI.pauseBtn.disabled = true;
    UI.stopBtn.disabled = true;
    UI.pauseBtn.textContent = "⏸️ Pause";
    UI.statusIndicator.className = "status-dot status-inactive";
    UI.statusText.textContent = "Not Sharing";
  }
}

/**
 * Handle captured frames from WebRTC
 */
function handleFrameCaptured(base64Frame) {
  // Send frame to backend via WebSocket
  if (AppState.isConnected) {
    window.websocketManager.sendFrame(base64Frame);
  }
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(data) {
  console.log("Received message:", data);

  switch (data.type) {
    case "chat":
    case "response":
      // AI response message
      if (data.message) {
        window.chatManager.handleAIResponse(data.message);
      }
      break;

    case "frame":
      // Frame data - ignore (we're sending these, not receiving)
      console.log("Frame message received (ignoring)");
      break;

    case "frame_received":
    case "frame_acknowledged":
      // Frame acknowledgment (optional)
      console.log("Frame received by backend");
      break;

    case "error":
      // Error message
      console.error("Backend error:", data.message);
      window.chatManager.addSystemMessage(`⚠️ Error: ${data.message}`);
      break;

    case "status":
      // Status update
      console.log("Backend status:", data.message);
      break;

    case "connection":
      // Connection acknowledgment
      console.log("Connection acknowledged by backend");
      break;

    default:
      // Unknown message type - log to console only, don't show in chat
      console.warn("Unknown message type:", data.type, data);
      break;
  }
}

/**
 * Handle WebSocket connection status changes
 */
function handleConnectionStatus(status) {
  console.log("Connection status changed:", status);

  AppState.isConnected = status === "connected";

  switch (status) {
    case "connected":
      UI.connectionStatus.textContent = "Connected ✓";
      UI.connectionStatus.style.color = "#28a745";
      UI.statusIndicator.className = "status-dot status-active";
      break;

    case "connecting":
    case "reconnecting":
      UI.connectionStatus.textContent = "Connecting...";
      UI.connectionStatus.style.color = "#ffc107";
      UI.statusIndicator.className = "status-dot status-connecting";
      break;

    case "disconnected":
      UI.connectionStatus.textContent = "Disconnected";
      UI.connectionStatus.style.color = "#dc3545";
      UI.statusIndicator.className = "status-dot status-inactive";
      break;

    case "error":
      UI.connectionStatus.textContent = "Connection Error";
      UI.connectionStatus.style.color = "#dc3545";
      break;

    case "failed":
      UI.connectionStatus.textContent = "Connection Failed";
      UI.connectionStatus.style.color = "#dc3545";
      window.chatManager.addSystemMessage(
        "⚠️ Connection failed. Please refresh the page."
      );
      break;
  }
}

/**
 * Handle application cleanup on window close
 */
window.addEventListener("beforeunload", () => {
  console.log("Application closing, cleaning up...");

  // Stop screen capture
  if (AppState.isScreenSharing) {
    window.webrtcManager.stopCapture();
  }

  // Stop TTS
  window.chatManager.stopSpeaking();

  // Disconnect WebSocket
  window.websocketManager.disconnect();
});

// Initialize app when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

console.log("App.js loaded");
