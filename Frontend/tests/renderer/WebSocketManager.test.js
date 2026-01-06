
const { WebSocketManager } = require('../../renderer/websocket.js');

describe('WebSocketManager', () => {
    let wsManager;

    beforeEach(() => {
        // Clear previous instances
        jest.clearAllMocks();
        // Reset window.Config mock if needed
        wsManager = new WebSocketManager();
        window.websocketManager = wsManager;
    });

    test('should initialize with default state', () => {
        expect(wsManager.isConnected).toBe(false);
        expect(wsManager.messageCallbacks).toEqual([]);
    });

    test('connect() should create WebSocket connection', () => {
        wsManager.connect();
        expect(wsManager.ws).toBeDefined();
        // Check if event listeners are attached
        expect(wsManager.ws.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
    });

    test('send() should send data if connected', () => {
        wsManager.connect();
        wsManager.isConnected = true; 
        
        const data = { type: 'test' };
        wsManager.send(data);
        
        expect(wsManager.ws.send).toHaveBeenCalledWith(JSON.stringify(data));
    });

    test('updateStatus() should trigger callback', () => {
        const callback = jest.fn();
        wsManager.onStatusChange(callback);
        wsManager.updateStatus('connected');
        expect(callback).toHaveBeenCalledWith('connected');
    });
});
