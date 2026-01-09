const AppState = {
  isScreenSharing: false,
  isConnected: false,
  isPaused: false,
  isFloatingMode: false,
};

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
  container: document.querySelector(".container"),
  floatingOverlay: document.getElementById("floatingOverlay"),
  floatingChatInput: document.getElementById("floatingChatInput"),
  floatingSendBtn: document.getElementById("floatingSendBtn"),
  floatingStopBtn: document.getElementById("floatingStopBtn"),
  countdownTimer: document.getElementById("countdownTimer"),
};

function initializeApp() {
  setupButtonListeners();

  window.websocketManager.connect();

  window.websocketManager.onMessage(handleWebSocketMessage);

  window.websocketManager.onStatusChange(handleConnectionStatus);

  // Listen for messages from floating window
  if (typeof require !== "undefined") {
    const { ipcRenderer } = require("electron");

    ipcRenderer.on("floating-message", (event, data) => {
      handleFloatingMessage(data);
    });

    ipcRenderer.on("floating-stop", () => {
      stopScreenSharing();
    });
  }

  // Removed automatic frame capture handler - frames will be captured on-demand when sending messages

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      // TTS voices loaded
    };
  }
}

function setupButtonListeners() {
  UI.startBtn.addEventListener("click", async () => {
    const success = await window.webrtcManager.startCapture();

    if (success) {
      AppState.isScreenSharing = true;
      updateUIForScreenSharing(true);

      // Create floating window and minimize main window after a brief delay
      setTimeout(() => {
        enterFloatingMode();
      }, 500);
    }
  });

  UI.pauseBtn.addEventListener("click", () => {
    if (AppState.isPaused) {
      window.webrtcManager.resumeCapture();
      AppState.isPaused = false;
      UI.pauseBtn.textContent = "⏸️ Pause";
      window.chatManager.addSystemMessage("Screen sharing resumed.");
    } else {
      window.webrtcManager.pauseCapture();
      AppState.isPaused = true;
      UI.pauseBtn.textContent = "▶️ Resume";
      window.chatManager.addSystemMessage("Screen sharing paused.");
    }
  });

  UI.stopBtn.addEventListener("click", () => {
    stopScreenSharing();
  });

  UI.saveSessionBtn.addEventListener("click", async () => {
    try {
      const sessionData = window.chatManager.getSessionData();
      await window.websocketManager.sendSessionData(sessionData);

      window.chatManager.addSystemMessage("✅ Session saved successfully!");
      alert("Session saved successfully!");
    } catch (error) {
      window.chatManager.addSystemMessage(
        "❌ Failed to save session. Please try again."
      );
      alert(
        "Failed to save session. Please check your connection to the backend."
      );
    }
  });

  UI.clearChatBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all chat messages?")) {
      window.chatManager.clearChat();
      window.chatManager.addSystemMessage(
        "Chat cleared. Start a new conversation!"
      );
    }
  });
}

function enterFloatingMode() {
  AppState.isFloatingMode = true;

  if (typeof require !== "undefined") {
    const { ipcRenderer } = require("electron");

    // Create the floating window
    ipcRenderer.send("create-floating-window");

    // Minimize the main window
    ipcRenderer.send("minimize-main-window");
  }
}

function exitFloatingMode() {
  AppState.isFloatingMode = false;

  if (typeof require !== "undefined") {
    const { ipcRenderer } = require("electron");

    // Close the floating window
    ipcRenderer.send("close-floating-window");

    // Restore the main window
    ipcRenderer.send("restore-main-window");
  }
}

async function handleFloatingMessage(data) {
  const message = data.message;

  // Ensure screen capture is active - auto-start if needed
  if (!window.webrtcManager.isCaptureActive()) {
    console.log("Screen capture not active in floating mode, starting automatically...");
    await window.webrtcManager.startCapture();
  }

  // Capture the current screen frame
  let frameData = null;
  if (window.webrtcManager && window.webrtcManager.isCaptureActive()) {
    frameData = window.webrtcManager.captureFrame();
  }

  // Send message with frame data
  if (message && message !== "Analyze this screen") {
    window.chatManager.addMessage(message, "user");
  } else {
    window.chatManager.addSystemMessage("📸 Screen captured and sent to AI");
  }

  window.websocketManager.sendChatMessage(message, frameData);
}

function stopScreenSharing() {
  window.webrtcManager.stopCapture();
  AppState.isScreenSharing = false;
  AppState.isPaused = false;

  // Exit floating mode if active
  if (AppState.isFloatingMode) {
    exitFloatingMode();
  }

  updateUIForScreenSharing(false);
  window.chatManager.addSystemMessage("Screen sharing stopped.");
}

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

// Removed handleFrameCaptured function - frames are now captured on-demand

function handleWebSocketMessage(data) {
  switch (data.type) {
    case "chat":
    case "response":
      if (data.message) {
        window.chatManager.handleAIResponse(data.message);
      }
      break;

    case "frame":
      break;

    case "frame_received":
    case "frame_acknowledged":
      break;

    case "error":
      window.chatManager.addSystemMessage(`⚠️ Error: ${data.message}`);
      // Restore button state on error
      window.chatManager.setButtonThinking(false);
      break;

    case "status":
      break;

    case "connection":
      break;

    default:
      break;
  }
}

function handleConnectionStatus(status) {
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

window.addEventListener("beforeunload", () => {
  if (AppState.isScreenSharing) {
    window.webrtcManager.stopCapture();
  }

  window.chatManager.stopSpeaking();

  window.websocketManager.disconnect();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
