
const { WebRTCManager } = require('../../renderer/webrtc.js');

describe('WebRTCManager', () => {
    let webrtcManager;

    beforeEach(() => {
        document.body.innerHTML = `
            <video id="screenPreview"></video>
            <canvas id="captureCanvas"></canvas>
            <div id="previewPlaceholder"></div>
            <div id="floatingOverlay"></div>
        `;

        // Mock navigator.mediaDevices
        global.navigator.mediaDevices = {
            getUserMedia: jest.fn().mockResolvedValue({
                getVideoTracks: () => [{
                    addEventListener: jest.fn(),
                    stop: jest.fn()
                }],
                getTracks: () => [{ stop: jest.fn() }]
            })
        };

        webrtcManager = new WebRTCManager();
    });

    test('should initialize with default state', () => {
        expect(webrtcManager.isCapturing).toBe(false);
        expect(webrtcManager.isPaused).toBe(false);
    });

    test('isCaptureActive() should return correct state', () => {
        expect(webrtcManager.isCaptureActive()).toBe(false);
        
        webrtcManager.isCapturing = true;
        expect(webrtcManager.isCaptureActive()).toBe(true);

        webrtcManager.isPaused = true;
        expect(webrtcManager.isCaptureActive()).toBe(false);
    });
});
