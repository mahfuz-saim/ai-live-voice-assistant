// webrtc.js - WebRTC Screen Capture Module
// This module handles screen capture using WebRTC and frame extraction

const { desktopCapturer } = require("electron");

/**
 * WebRTC Manager Class
 * Handles screen sharing, frame capture, and stream management
 */
class WebRTCManager {
  constructor() {
    this.stream = null;
    this.videoElement = document.getElementById("screenPreview");
    this.canvas = document.getElementById("captureCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.isCapturing = false;
    this.isPaused = false;
    this.captureInterval = null;
    this.frameCallback = null;
  }

  /**
   * Get available screen sources using Electron's desktopCapturer
   */
  async getScreenSources() {
    try {
      console.log("Fetching screen sources from desktopCapturer...");

      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 150, height: 150 },
        fetchWindowIcons: false,
      });

      console.log(`Found ${sources.length} screen sources`);

      // Also try to get windows if no screens found
      if (sources.length === 0) {
        console.log("No screens found, trying to get windows...");
        const windowSources = await desktopCapturer.getSources({
          types: ["window"],
          thumbnailSize: { width: 150, height: 150 },
          fetchWindowIcons: false,
        });
        console.log(`Found ${windowSources.length} window sources`);
        return windowSources;
      }

      return sources;
    } catch (error) {
      console.error("Error getting screen sources:", error);
      console.error("Error details:", error.message, error.stack);
      return [];
    }
  }

  /**
   * Start screen capture using Electron's desktopCapturer
   */
  async startCaptureWithElectron() {
    console.log("Starting screen capture with Electron desktopCapturer...");

    const sources = await this.getScreenSources();

    if (sources.length === 0) {
      throw new Error("No screen sources available from desktopCapturer");
    }

    // Log all available sources for debugging
    sources.forEach((source, index) => {
      console.log(
        `Source ${index}: ${source.name} (ID: ${source.id.substring(0, 20)}...)`
      );
    });

    // Use the first screen source (usually the primary screen)
    const primarySource = sources[0];
    console.log(
      "Selected screen source:",
      primarySource.name,
      "ID:",
      primarySource.id
    );

    // Request screen capture using navigator.mediaDevices with the source ID
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: primarySource.id,
        },
      },
    };

    console.log("Requesting media stream with constraints...");
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Media stream obtained successfully");
    return stream;
  }

  /**
   * Start screen capture using direct screen ID (alternative method)
   */
  async startCaptureWithDirectScreenId() {
    console.log("Starting screen capture with direct screen ID...");

    // Try different screen ID formats that Electron might use
    const screenIds = [
      "screen:0:0", // Primary screen format 1
      "screen:1:0", // Primary screen format 2
      "window:0:0", // Window format fallback
    ];

    for (const screenId of screenIds) {
      try {
        console.log(`Trying screen ID: ${screenId}`);
        const constraints = {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: screenId,
            },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log(`Success with screen ID: ${screenId}`);
        return stream;
      } catch (error) {
        console.warn(`Failed with screen ID ${screenId}:`, error.message);
      }
    }

    throw new Error("All direct screen ID attempts failed");
  }

  /**
   * Start screen capture
   * Requests permission and starts capturing the screen
   * Tries multiple methods until one succeeds
   */
  async startCapture() {
    try {
      console.log("Starting screen capture...");

      // Try method 1: Electron's desktopCapturer
      try {
        this.stream = await this.startCaptureWithElectron();
        console.log("✓ Screen capture started with Electron desktopCapturer");
      } catch (electronError) {
        console.warn(
          "✗ Electron desktopCapturer failed:",
          electronError.message
        );

        // Try method 2: Direct screen ID
        try {
          console.log("Trying direct screen ID method...");
          this.stream = await this.startCaptureWithDirectScreenId();
          console.log("✓ Screen capture started with direct screen ID");
        } catch (directError) {
          console.warn("✗ Direct screen ID failed:", directError.message);

          // All methods failed
          throw new Error(
            "All screen capture methods failed. Please ensure screen capture permissions are granted to the application."
          );
        }
      }

      // Attach stream to video element for preview
      this.videoElement.srcObject = this.stream;
      this.videoElement.classList.add("active");

      // Hide placeholder
      const placeholder = document.getElementById("previewPlaceholder");
      if (placeholder) {
        placeholder.classList.add("hidden");
      }

      // Start capturing frames
      this.isCapturing = true;
      this.isPaused = false;
      this.startFrameCapture();

      // Handle stream end (user stops sharing)
      this.stream.getVideoTracks()[0].addEventListener("ended", () => {
        console.log("Screen sharing ended by user");
        this.stopCapture();
      });

      console.log("Screen capture started successfully");
      return true;
    } catch (error) {
      console.error("Error starting screen capture:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      let errorMessage = "Failed to start screen capture. ";

      if (error.message.includes("No screen sources available")) {
        errorMessage += "No screen sources detected.";
      } else if (error.name === "NotAllowedError") {
        errorMessage += "Permission denied. Please allow screen capture.";
      } else if (error.name === "NotFoundError") {
        errorMessage += "No screen capture device found.";
      } else {
        errorMessage += `Error: ${error.message}`;
      }

      alert(errorMessage);
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
    console.log("Frame capture paused");
  }

  /**
   * Resume frame capture
   */
  resumeCapture() {
    if (this.isCapturing && this.isPaused) {
      this.isPaused = false;
      this.startFrameCapture();
      console.log("Frame capture resumed");
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
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Clear video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.classList.remove("active");
    }

    // Show placeholder again
    const placeholder = document.getElementById("previewPlaceholder");
    if (placeholder) {
      placeholder.classList.remove("hidden");
    }

    this.isCapturing = false;
    this.isPaused = false;

    console.log("Screen capture stopped");
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
      const frameData = this.canvas.toDataURL("image/jpeg", 0.8); // 80% quality

      // Remove data URL prefix to get pure base64
      const base64Data = frameData.split(",")[1];

      // Call the registered callback with frame data
      if (this.frameCallback) {
        this.frameCallback(base64Data);
      }

      return base64Data;
    } catch (error) {
      console.error("Error capturing frame:", error);
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
    if (!this.isCapturing) return "stopped";
    if (this.isPaused) return "paused";
    return "active";
  }
}

// Create global instance
window.webrtcManager = new WebRTCManager();

console.log("WebRTC Manager initialized");
