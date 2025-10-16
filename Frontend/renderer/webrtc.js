// webrtc.js - WebRTC Screen Capture Module
// This module handles screen capture using WebRTC and frame extraction

/**
 * WebRTC Manager Class
 * Handles screen sharing, frame capture, and stream management
 */
class WebRTCManager {
  constructor() {
    this.stream = null;
    this.videoElement = document.getElementById('screenPreview');
    this.canvas = document.getElementById('captureCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.isCapturing = false;
    this.isPaused = false;
    this.captureInterval = null;
    this.frameCallback = null;
  }

  /**
   * Start screen capture
   * Requests permission and starts capturing the screen
   */
  async startCapture() {
    try {
      // Request screen capture permission
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always', // Include cursor in capture
          displaySurface: 'monitor' // Prefer full screen
        },
        audio: false // No audio needed for screen sharing
      });

      // Attach stream to video element for preview
      this.videoElement.srcObject = this.stream;
      this.videoElement.classList.add('active');
      
      // Hide placeholder
      const placeholder = document.getElementById('previewPlaceholder');
      if (placeholder) {
        placeholder.classList.add('hidden');
      }

      // Start capturing frames
      this.isCapturing = true;
      this.isPaused = false;
      this.startFrameCapture();

      // Handle stream end (user stops sharing)
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Screen sharing ended by user');
        this.stopCapture();
      });

      console.log('Screen capture started successfully');
      return true;
    } catch (error) {
      console.error('Error starting screen capture:', error);
      alert('Failed to start screen capture. Please grant permission to share your screen.');
      return false;
    }
  }

  /**
   * Pause frame capture (keeps stream active)
   */
  pauseCapture() {
    this.isPaused = true;
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    console.log('Frame capture paused');
  }

  /**
   * Resume frame capture
   */
  resumeCapture() {
    if (this.isCapturing && this.isPaused) {
      this.isPaused = false;
      this.startFrameCapture();
      console.log('Frame capture resumed');
    }
  }

  /**
   * Stop screen capture completely
   */
  stopCapture() {
    // Stop capturing frames
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    // Stop all tracks in the stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Clear video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.classList.remove('active');
    }

    // Show placeholder again
    const placeholder = document.getElementById('previewPlaceholder');
    if (placeholder) {
      placeholder.classList.remove('hidden');
    }

    this.isCapturing = false;
    this.isPaused = false;

    console.log('Screen capture stopped');
  }

  /**
   * Start periodic frame capture
   * Captures frames at specified interval (1-2 FPS)
   */
  startFrameCapture() {
    const frameRate = window.Config.getFrameRate();
    const interval = 1000 / frameRate; // Convert FPS to milliseconds

    this.captureInterval = setInterval(() => {
      if (!this.isPaused && this.isCapturing) {
        this.captureFrame();
      }
    }, interval);
  }

  /**
   * Capture a single frame from the video stream
   * Converts it to base64 JPEG format
   */
  captureFrame() {
    if (!this.videoElement || !this.videoElement.videoWidth) {
      return null;
    }

    try {
      // Set canvas dimensions to match video
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;

      // Draw current video frame to canvas
      this.ctx.drawImage(
        this.videoElement,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      // Convert canvas to base64 JPEG
      const frameData = this.canvas.toDataURL('image/jpeg', 0.8); // 80% quality
      
      // Remove data URL prefix to get pure base64
      const base64Data = frameData.split(',')[1];

      // Call the registered callback with frame data
      if (this.frameCallback) {
        this.frameCallback(base64Data);
      }

      return base64Data;
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  }

  /**
   * Register callback for frame capture
   * This callback will be called each time a frame is captured
   */
  onFrameCaptured(callback) {
    this.frameCallback = callback;
  }

  /**
   * Check if currently capturing
   */
  isCaptureActive() {
    return this.isCapturing && !this.isPaused;
  }

  /**
   * Get current capture state
   */
  getCaptureState() {
    if (!this.isCapturing) return 'stopped';
    if (this.isPaused) return 'paused';
    return 'active';
  }
}

// Create global instance
window.webrtcManager = new WebRTCManager();

console.log('WebRTC Manager initialized');
