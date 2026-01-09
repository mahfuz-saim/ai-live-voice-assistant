const { ChatManager } = require("../../renderer/chat.js");

// Mock dependencies locally for this test suite
window.speechSynthesis = {
  cancel: jest.fn(),
  speak: jest.fn(),
  getVoices: jest.fn(() => []),
};

// Mock localStorage with proper jest mocks
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  writable: true,
});

describe("ChatManager", () => {
  let chatManager;
  let mockWebSocketManager;
  let mockWebrtcManager;

  beforeEach(() => {
    // Setup DOM elements required by ChatManager
    document.body.innerHTML = `
            <div id="chatMessages"></div>
            <input id="chatInput" />
            <button id="sendBtn"></button>
        `;

    // Mock scroll properties
    const messagesDiv = document.getElementById("chatMessages");
    Object.defineProperty(messagesDiv, "scrollHeight", {
      value: 100,
      writable: true,
    });
    Object.defineProperty(messagesDiv, "scrollTop", {
      value: 0,
      writable: true,
    });

    // Mock dependencies
    mockWebSocketManager = {
      sendChatMessage: jest.fn(),
    };
    window.websocketManager = mockWebSocketManager;

    mockWebrtcManager = {
      isCaptureActive: jest.fn(() => false),
      startCapture: jest.fn().mockResolvedValue(true),
      captureFrame: jest.fn(),
    };
    window.webrtcManager = mockWebrtcManager;

    chatManager = new ChatManager();
  });

  test("should initialize and load session", () => {
    expect(chatManager.chatMessages).toBeDefined();
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      "aiAssistantSession"
    );
  });

  test("addMessage() should update UI and history", () => {
    chatManager.addMessage("Hello World", "user");

    const messages = document.getElementById("chatMessages");
    expect(messages.children.length).toBe(1);
    expect(messages.textContent).toContain("Hello World");
    expect(chatManager.messageHistory.length).toBe(1);
  });

  test("sendMessage() should send to websocket", async () => {
    chatManager.chatInput.value = "Test Message";
    await chatManager.sendMessage();

    expect(mockWebSocketManager.sendChatMessage).toHaveBeenCalledWith(
      "Test Message",
      null
    );
    expect(chatManager.chatInput.value).toBe("");
  });

  test("handleAIResponse() should add AI message", () => {
    chatManager.handleAIResponse("AI Reply");
    const messages = document.getElementById("chatMessages");
    expect(messages.textContent).toContain("AI Reply");
  });

  test("clearChat() should remove messages", () => {
    chatManager.addMessage("Test", "user");
    chatManager.clearChat();
    expect(chatManager.messageHistory.length).toBe(0);
    // Note: clearChat selector might be specific (.message:not(.system-message))
    // Our mock DOM doesn't add classes perfectly unless we used the real addMessage logic (which we did)
    const messages = document.getElementById("chatMessages");
    expect(messages.children.length).toBe(0);
  });
});
