const { desktopCapturer } = require("electron");

class WebRTCManager {
  constructor() {
    this.stream = null;
    this.videoElement = document.getElementById("screenPreview");
    this.canvas = document.getElementById("captureCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.isCapturing = false;
    this.isPaused = false;
    this.captureInterval = null;
    this.frameCallback = null;
  }

  async getScreenSources() {
    try {
      console.log("Fetching screen sources from desktopCapturer...");

      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 150, height: 150 },
        fetchWindowIcons: false,
      });

      console.log(`Found ${sources.length} screen sources`);

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

  async startCaptureWithElectron() {
    console.log("Starting screen capture with Electron desktopCapturer...");

    const sources = await this.getScreenSources();

    if (sources.length === 0) {
      throw new Error("No screen sources available from desktopCapturer");
    }

    sources.forEach((source, index) => {
      console.log(
        `Source ${index}: ${source.name} (ID: ${source.id.substring(0, 20)}...)`
      );
    });

    const primarySource = sources[0];
    console.log(
      "Selected screen source:",
      primarySource.name,
      "ID:",
      primarySource.id
    );

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

  async startCaptureWithDirectScreenId() {
    console.log("Starting screen capture with direct screen ID...");

    const screenIds = ["screen:0:0", "screen:1:0", "window:0:0"];

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

  async startCapture() {
    try {
      console.log("Starting screen capture...");

      try {
        this.stream = await this.startCaptureWithElectron();
        console.log("✓ Screen capture started with Electron desktopCapturer");
      } catch (electronError) {
        console.warn(
          "✗ Electron desktopCapturer failed:",
          electronError.message
        );

        try {
          console.log("Trying direct screen ID method...");
          this.stream = await this.startCaptureWithDirectScreenId();
          console.log("✓ Screen capture started with direct screen ID");
        } catch (directError) {
          console.warn("✗ Direct screen ID failed:", directError.message);

          throw new Error(
            "All screen capture methods failed. Please ensure screen capture permissions are granted to the application."
          );
        }
      }

      this.videoElement.srcObject = this.stream;
      this.videoElement.classList.add("active");

      const placeholder = document.getElementById("previewPlaceholder");
      if (placeholder) {
        placeholder.classList.add("hidden");
      }

      this.isCapturing = true;
      this.isPaused = false;
      // Removed automatic frame capture - frames will be captured on-demand when sending messages

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

  pauseCapture() {
    this.isPaused = true;
    // No longer stopping intervals since we don't have automatic capture
    console.log("Screen capture paused");
  }

  resumeCapture() {
    if (this.isCapturing && this.isPaused) {
      this.isPaused = false;
      // No longer starting intervals since we don't have automatic capture
      console.log("Screen capture resumed");
    }
  }

  stopCapture() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.classList.remove("active");
    }

    const placeholder = document.getElementById("previewPlaceholder");
    if (placeholder) {
      placeholder.classList.remove("hidden");
    }

    this.isCapturing = false;
    this.isPaused = false;

    console.log("Screen capture stopped");
  }

  // Removed automatic frame capture - frames are now captured on-demand
  // startFrameCapture() method is no longer needed

  captureFrame() {
    if (!this.videoElement || !this.videoElement.videoWidth) {
      return null;
    }

    try {
      // Temporarily hide floating overlay to exclude it from capture
      const floatingOverlay = document.getElementById("floatingOverlay");
      const wasVisible =
        floatingOverlay && !floatingOverlay.classList.contains("hidden");

      if (wasVisible) {
        floatingOverlay.style.display = "none";
      }

      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;

      this.ctx.drawImage(
        this.videoElement,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      const frameData = this.canvas.toDataURL("image/jpeg", 0.8);

      const base64Data = frameData.split(",")[1];

      // Restore floating overlay visibility
      if (wasVisible) {
        floatingOverlay.style.display = "";
      }

      // No longer triggering automatic callback - frames are captured on-demand
      // if (this.frameCallback) {
      //   this.frameCallback(base64Data);
      // }

      return base64Data;
    } catch (error) {
      console.error("Error capturing frame:", error);
      return null;
    }
  }

  // Removed onFrameCaptured method as automatic frame capture is no longer used

  isCaptureActive() {
    return this.isCapturing && !this.isPaused;
  }

  getCaptureState() {
    if (!this.isCapturing) return "stopped";
    if (this.isPaused) return "paused";
    return "active";
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { WebRTCManager };
} else {
  // Only auto-instantiate in browser
  window.webrtcManager = new WebRTCManager();
  console.log("WebRTC Manager initialized");
}
