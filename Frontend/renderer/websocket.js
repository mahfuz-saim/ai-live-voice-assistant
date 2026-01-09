class WebSocketManager {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.reconnectTimeout = null;
    this.messageCallbacks = [];
    this.statusCallback = null;
  }

  connect() {
    const wsURL = window.Config.getWebSocketURL();
    console.log("Connecting to WebSocket:", wsURL);

    try {
      this.ws = new WebSocket(wsURL);

      this.ws.addEventListener("open", () => {
        console.log("WebSocket connected successfully");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.updateStatus("connected");

        this.send({
          type: "connection",
          message: "Client connected",
          timestamp: new Date().toISOString(),
        });
      });

      this.ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message from server:", data);

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

      this.ws.addEventListener("close", (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        this.isConnected = false;
        this.updateStatus("disconnected");

        this.attemptReconnect();
      });

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

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log("Reconnecting...");
      this.connect();
    }, delay);
  }

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

  sendFrame(base64Frame) {
    return this.send({
      type: "frame",
      data: base64Frame,
      timestamp: new Date().toISOString(),
    });
  }

  sendChatMessage(message, frameData = null) {
    const payload = {
      type: "chat",
      message: message,
      timestamp: new Date().toISOString(),
    };

    // Include frame data if provided
    if (frameData) {
      payload.frameData = frameData;
      console.log("Sending message with screen frame (frameData included)");
    } else {
      console.log("Sending message without screen frame");
    }

    return this.send(payload);
  }

  sendSessionData(sessionData) {
    const backendURL = window.Config.getBackendURL();

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

  onMessage(callback) {
    this.messageCallbacks.push(callback);
  }

  onStatusChange(callback) {
    this.statusCallback = callback;
  }

  updateStatus(status) {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

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

if (typeof module !== 'undefined') {
  module.exports = { WebSocketManager };
} else {
  window.websocketManager = new WebSocketManager();
  console.log("WebSocket Manager initialized");
}
