class ChatManager {
  constructor() {
    this.chatMessages = document.getElementById("chatMessages");
    this.chatInput = document.getElementById("chatInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.messageHistory = [];
    this.ttsEnabled = true;
    this.synthesis = window.speechSynthesis;

    this.initializeSession();

    this.setupEventListeners();
  }

  initializeSession() {
    try {
      const savedSession = localStorage.getItem("aiAssistantSession");
      if (savedSession) {
        const session = JSON.parse(savedSession);
        this.messageHistory = session.messages || [];

        console.log("Session restored from local storage");
      } else {
        this.messageHistory = [];
      }
    } catch (error) {
      console.error("Error loading session from local storage:", error);
      this.messageHistory = [];
    }
  }

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

  setupEventListeners() {
    this.sendBtn.addEventListener("click", () => {
      this.sendMessage();
    });

    this.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  sendMessage() {
    const message = this.chatInput.value.trim();

    if (!message) {
      return;
    }

    this.addMessage(message, "user");

    window.websocketManager.sendChatMessage(message);

    this.chatInput.value = "";

    this.saveSessionToLocalStorage();
  }

  addMessage(text, type = "ai") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;

    const messageParagraph = document.createElement("p");
    messageParagraph.textContent = text;
    messageDiv.appendChild(messageParagraph);

    this.chatMessages.appendChild(messageDiv);

    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    this.messageHistory.push({
      text: text,
      type: type,
      timestamp: new Date().toISOString(),
    });

    if (type === "ai" && this.ttsEnabled) {
      this.speak(text);
    }

    this.saveSessionToLocalStorage();
  }

  handleAIResponse(message) {
    this.addMessage(message, "ai");
  }

  speak(text) {
    try {
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

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

      utterance.onstart = () => {
        console.log("TTS started");
      };

      utterance.onend = () => {
        console.log("TTS finished");
      };

      utterance.onerror = (event) => {
        console.error("TTS error:", event);
      };

      this.synthesis.speak(utterance);
    } catch (error) {
      console.error("Error with text-to-speech:", error);
    }
  }

  stopSpeaking() {
    this.synthesis.cancel();
  }

  toggleTTS() {
    this.ttsEnabled = !this.ttsEnabled;
    console.log("TTS enabled:", this.ttsEnabled);
    return this.ttsEnabled;
  }

  clearChat() {
    const messages = this.chatMessages.querySelectorAll(
      ".message:not(.system-message)"
    );
    messages.forEach((msg) => msg.remove());

    this.messageHistory = [];

    this.saveSessionToLocalStorage();

    console.log("Chat cleared");
  }

  getSessionData() {
    return {
      messages: this.messageHistory,
      timestamp: new Date().toISOString(),
      goal: "AI Assistant Session",
      progress: this.messageHistory.length,
      sessionDuration: this.calculateSessionDuration(),
    };
  }

  calculateSessionDuration() {
    if (this.messageHistory.length === 0) {
      return 0;
    }

    const firstMessage = this.messageHistory[0];
    const lastMessage = this.messageHistory[this.messageHistory.length - 1];

    const start = new Date(firstMessage.timestamp);
    const end = new Date(lastMessage.timestamp);

    return Math.floor((end - start) / 1000);
  }

  addSystemMessage(text) {
    this.addMessage(text, "system");
  }
}

window.chatManager = new ChatManager();

console.log("Chat Manager initialized");
