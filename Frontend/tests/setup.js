
// @jest-environment jsdom
// Setup global mocks

// Rely on global 'jest' provided by the test runner
// const { jest } = require('@jest/globals');

// Mock Config
window.Config = {
    getWebSocketURL: () => 'ws://localhost:5000/ws',
    getBackendURL: () => 'http://localhost:5000'
};

// Mock Electron
jest.mock('electron', () => ({
    desktopCapturer: {
        getSources: jest.fn()
    }
}), { virtual: true });

// Setup global mocks
global.WebSocket = class {
    constructor(url) {
        this.url = url;
        this.readyState = 1; // OPEN
        this.send = jest.fn();
        this.close = jest.fn();
        this.addEventListener = jest.fn((event, cb) => {
            this[`on${event}`] = cb;
        });
    }
};
global.WebSocket.CONNECTING = 0;
global.WebSocket.OPEN = 1;
global.WebSocket.CLOSING = 2;
global.WebSocket.CLOSED = 3;

window.speechSynthesis = {
    getVoices: jest.fn(() => []),
    speak: jest.fn(),
    cancel: jest.fn()
};

window.SpeechSynthesisUtterance = class {
    constructor(text) {
        this.text = text;
    }
};

// Mock the Managers since classes use window.managerInstance
// We will assign them in tests when needed
