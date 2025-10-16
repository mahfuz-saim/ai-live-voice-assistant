// websocket.js - WebSocket Connection Module
// This module handles WebSocket connection to backend for sending frames and receiving responses

/**
 * WebSocket Manager Class
 * Handles connection, reconnection, and message sending/receiving
 */
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000; // 3 seconds
    this.reconnectTimeout = null;
    this.messageCallbacks = [];
    this.statusCallback = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    const wsURL = window.Config.getWebSocketURL();
    console.log("Connecting to WebSocket:", wsURL);

    try {
      this.ws = new WebSocket(wsURL);

      // Connection opened
      this.ws.addEventListener("open", () => {
        console.log("WebSocket connected successfully");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateStatus("connected");

        // Send initial connection message
        this.send({
          type: "connection",
          message: "Client connected",
          timestamp: new Date().toISOString(),
        });
      });

      // Listen for messages from server
      this.ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message from server:", data);

          // Notify all registered callbacks
          this.messageCallbacks.forEach((callback) => {
            try {
              callback(data);
            } catch (error) {
              console.error("Error in message callback:", error);
            }
          });
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });

      // Connection closed
      this.ws.addEventListener("close", (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        this.isConnected = false;
        this.updateStatus("disconnected");

        // Attempt to reconnect
        this.attemptReconnect();
      });

      // Connection error
      this.ws.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
        this.isConnected = false;
        this.updateStatus("error");
      });
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        "Max reconnection attempts reached. Please refresh the page."
      );
      this.updateStatus("failed");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );
    this.updateStatus("reconnecting");

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Schedule reconnection
    this.reconnectTimeout = setTimeout(() => {
      console.log("Reconnecting...");
      this.connect();
    }, delay);
  }

  /**
   * Send message to server
   * @param {Object} data - Data to send
   */
  send(data) {
    if (
      !this.isConnected ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      console.warn("WebSocket is not connected. Message not sent:", data);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
      return false;
    }
  }

  /**
   * Send screen frame to server
   * @param {String} base64Frame - Base64 encoded frame data
   */
  sendFrame(base64Frame) {
    return this.send({
      type: "frame",
      data: base64Frame,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send chat message to server
   * @param {String} message - Chat message text
   */
  sendChatMessage(message) {
    return this.send({
      type: "chat",
      message: message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send session data to server for saving
   * @param {Object} sessionData - Session data to save
   */
  sendSessionData(sessionData) {
    const backendURL = window.Config.getBackendURL();

    // Use fetch for HTTP POST to /save-session endpoint
    return fetch(`${backendURL}/save-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Session saved successfully:", data);
        return data;
      })
      .catch((error) => {
        console.error("Error saving session:", error);
        throw error;
      });
  }

  /**
   * Register callback for incoming messages
   * @param {Function} callback - Callback function to handle messages
   */
  onMessage(callback) {
    this.messageCallbacks.push(callback);
  }

  /**
   * Register callback for connection status changes
   * @param {Function} callback - Callback function to handle status changes
   */
  onStatusChange(callback) {
    this.statusCallback = callback;
  }

  /**
   * Update connection status
   * @param {String} status - New status (connected, disconnected, reconnecting, error, failed)
   */
  updateStatus(status) {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.updateStatus("disconnected");
    console.log("WebSocket disconnected");
  }

  /**
   * Get current connection status
   */
  getStatus() {
    if (!this.ws) return "disconnected";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "disconnected";
      default:
        return "unknown";
    }
  }
}

// Create global instance
window.websocketManager = new WebSocketManager();

console.log("WebSocket Manager initialized");
