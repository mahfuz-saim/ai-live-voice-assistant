// chat.js - Chat Interface and Text-to-Speech Module
// This module handles chat UI, message display, and TTS functionality

/**
 * Chat Manager Class
 * Manages chat interface, messages, and text-to-speech
 */
class ChatManager {
  constructor() {
    this.chatMessages = document.getElementById("chatMessages");
    this.chatInput = document.getElementById("chatInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.messageHistory = [];
    this.ttsEnabled = true;
    this.synthesis = window.speechSynthesis;

    // Initialize local storage for session
    this.initializeSession();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize session from local storage
   */
  initializeSession() {
    try {
      const savedSession = localStorage.getItem("aiAssistantSession");
      if (savedSession) {
        const session = JSON.parse(savedSession);
        this.messageHistory = session.messages || [];

        // Restore messages to UI (optional)
        console.log("Session restored from local storage");
      } else {
        this.messageHistory = [];
      }
    } catch (error) {
      console.error("Error loading session from local storage:", error);
      this.messageHistory = [];
    }
  }

  /**
   * Save session to local storage
   */
  saveSessionToLocalStorage() {
    try {
      const session = {
        messages: this.messageHistory,
        timestamp: new Date().toISOString(),
        goal: "AI Assistant Session",
        progress: this.messageHistory.length,
      };

      localStorage.setItem("aiAssistantSession", JSON.stringify(session));
      console.log("Session saved to local storage");
    } catch (error) {
      console.error("Error saving session to local storage:", error);
    }
  }

  /**
   * Set up event listeners for chat interface
   */
  setupEventListeners() {
    // Send button click
    this.sendBtn.addEventListener("click", () => {
      this.sendMessage();
    });

    // Enter key to send message
    this.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  /**
   * Send a chat message
   */
  sendMessage() {
    const message = this.chatInput.value.trim();

    if (!message) {
      return;
    }

    // Display user message
    this.addMessage(message, "user");

    // Send to backend via WebSocket
    window.websocketManager.sendChatMessage(message);

    // Clear input
    this.chatInput.value = "";

    // Save to session
    this.saveSessionToLocalStorage();
  }

  /**
   * Add a message to the chat interface
   * @param {String} text - Message text
   * @param {String} type - Message type: 'user', 'ai', or 'system'
   */
  addMessage(text, type = "ai") {
    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;

    const messageParagraph = document.createElement("p");
    messageParagraph.textContent = text;
    messageDiv.appendChild(messageParagraph);

    // Add to chat container
    this.chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Add to history
    this.messageHistory.push({
      text: text,
      type: type,
      timestamp: new Date().toISOString(),
    });

    // If AI message, speak it using TTS
    if (type === "ai" && this.ttsEnabled) {
      this.speak(text);
    }

    // Save session after adding message
    this.saveSessionToLocalStorage();
  }

  /**
   * Handle incoming AI response
   * @param {String} message - AI response message
   */
  handleAIResponse(message) {
    this.addMessage(message, "ai");
  }

  /**
   * Speak text using Text-to-Speech
   * @param {String} text - Text to speak
   */
  speak(text) {
    try {
      // Cancel any ongoing speech
      this.synthesis.cancel();

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice settings
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume

      // Try to select a good voice (prefer English voices)
      const voices = this.synthesis.getVoices();
      const englishVoice =
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") && voice.name.includes("Female")
        ) ||
        voices.find((voice) => voice.lang.startsWith("en")) ||
        voices[0];

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      // Event listeners for speech
      utterance.onstart = () => {
        console.log("TTS started");
      };

      utterance.onend = () => {
        console.log("TTS finished");
      };

      utterance.onerror = (event) => {
        console.error("TTS error:", event);
      };

      // Speak the text
      this.synthesis.speak(utterance);
    } catch (error) {
      console.error("Error with text-to-speech:", error);
    }
  }

  /**
   * Stop current speech
   */
  stopSpeaking() {
    this.synthesis.cancel();
  }

  /**
   * Toggle TTS on/off
   */
  toggleTTS() {
    this.ttsEnabled = !this.ttsEnabled;
    console.log("TTS enabled:", this.ttsEnabled);
    return this.ttsEnabled;
  }

  /**
   * Clear all chat messages
   */
  clearChat() {
    // Remove all messages except system messages
    const messages = this.chatMessages.querySelectorAll(
      ".message:not(.system-message)"
    );
    messages.forEach((msg) => msg.remove());

    // Clear history
    this.messageHistory = [];

    // Save empty session
    this.saveSessionToLocalStorage();

    console.log("Chat cleared");
  }

  /**
   * Get current session data for saving to backend
   */
  getSessionData() {
    return {
      messages: this.messageHistory,
      timestamp: new Date().toISOString(),
      goal: "AI Assistant Session",
      progress: this.messageHistory.length,
      sessionDuration: this.calculateSessionDuration(),
    };
  }

  /**
   * Calculate session duration based on first and last message
   */
  calculateSessionDuration() {
    if (this.messageHistory.length === 0) {
      return 0;
    }

    const firstMessage = this.messageHistory[0];
    const lastMessage = this.messageHistory[this.messageHistory.length - 1];

    const start = new Date(firstMessage.timestamp);
    const end = new Date(lastMessage.timestamp);

    return Math.floor((end - start) / 1000); // Duration in seconds
  }

  /**
   * Add system notification message
   */
  addSystemMessage(text) {
    this.addMessage(text, "system");
  }
}

// Create global instance
window.chatManager = new ChatManager();

console.log("Chat Manager initialized");
