# WebSocket Frame Handling - Debugging Guide

## 🔧 Issues Fixed

### Problem: Backend sending error when receiving frames from frontend

### Root Cause:

The WebSocket handler was not properly validating incoming messages before processing them, leading to errors when:

1. Frame data was missing or undefined
2. Base64 data was empty or invalid
3. Message format was incorrect

### Solutions Implemented:

#### 1. ✅ Added Frame Data Validation

```javascript
// Validates that frame field exists
if (!message.frame) {
  // Send clear error message to frontend
  return;
}
```

#### 2. ✅ Added Base64 Validation

```javascript
// Validates base64 data is not empty
if (!base64Image || base64Image.trim() === "") {
  // Send clear error message
  return;
}
```

#### 3. ✅ Enhanced Logging

```javascript
// Logs every message received
console.log(`📨 Received message type: ${message.type}`);

// Logs frame processing details
console.log(`📸 Processing frame: ${size}KB`);

// Logs success/failure
console.log(`✅ Screen frame analyzed successfully`);
```

#### 4. ✅ Added Message Type Validation

```javascript
// Validates all messages have a type field
if (!message.type) {
  // Send error
  return;
}
```

#### 5. ✅ Better Error Messages

Now errors include:

- Clear description of what went wrong
- Specific field that caused the error
- Guidance on how to fix it

---

## 📡 Correct WebSocket Message Format

### Sending Screen Frames from Frontend

```javascript
// Correct format
ws.send(
  JSON.stringify({
    type: "screen_frame",
    frame: "base64_encoded_image_data_here", // Required!
  })
);

// Alternative with data URI
ws.send(
  JSON.stringify({
    type: "screen_frame",
    frame: "data:image/png;base64,iVBORw0KG...", // Also works
  })
);
```

### Important Notes:

- ✅ `type` field is **required**
- ✅ `frame` field is **required** for screen_frame messages
- ✅ Frame should contain valid base64 image data
- ✅ Data URI prefix (data:image/png;base64,) is optional - backend handles both

---

## 🐛 How to Debug WebSocket Issues

### Step 1: Check Backend Logs

The backend now logs detailed information:

```
📨 Received message type: screen_frame from session_xxx
📸 Processing frame: 250KB
🎯 User goal: Learn Excel
✅ Screen frame analyzed successfully for session_xxx
```

### Step 2: Look for Error Messages

If there's an issue, you'll see:

```
❌ Error analyzing screen frame: [error details]
Error details: [stack trace]
```

### Step 3: Check Frontend Message Format

Verify your frontend sends messages like this:

```javascript
// Capture screen
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
// ... draw to canvas ...
const base64 = canvas.toDataURL("image/png");

// Send via WebSocket
ws.send(
  JSON.stringify({
    type: "screen_frame",
    frame: base64, // or base64.split(',')[1] for raw base64
  })
);
```

### Step 4: Test WebSocket Connection

```javascript
// In your frontend
const ws = new WebSocket("ws://localhost:5000/ws");

ws.onopen = () => {
  console.log("✅ Connected to backend");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);

  if (data.type === "error") {
    console.error("❌ Backend error:", data.message, data.error);
  }
};

ws.onerror = (error) => {
  console.error("❌ WebSocket error:", error);
};
```

---

## 🧪 Testing WebSocket Messages

### Test 1: Send Test Frame

```javascript
// Create a small test image
const testCanvas = document.createElement("canvas");
testCanvas.width = 100;
testCanvas.height = 100;
const ctx = testCanvas.getContext("2d");
ctx.fillStyle = "red";
ctx.fillRect(0, 0, 100, 100);

const testFrame = testCanvas.toDataURL("image/png");

ws.send(
  JSON.stringify({
    type: "screen_frame",
    frame: testFrame,
  })
);
```

### Test 2: Verify Response

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "analyzing":
      console.log("🔄 Backend is analyzing...");
      break;
    case "screen_guidance":
      console.log("✅ Received guidance:", data.guidance);
      break;
    case "error":
      console.error("❌ Error:", data.message);
      break;
  }
};
```

---

## 📊 Expected Message Flow

### Screen Frame Analysis Flow:

1. **Frontend → Backend:**

```json
{
  "type": "screen_frame",
  "frame": "base64_data..."
}
```

2. **Backend → Frontend (Acknowledgment):**

```json
{
  "type": "analyzing",
  "message": "Analyzing screen..."
}
```

3. **Backend → Frontend (Result):**

```json
{
  "type": "screen_guidance",
  "guidance": "Click on the File menu...",
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

4. **Backend → Frontend (If Error):**

```json
{
  "type": "error",
  "message": "Failed to analyze screen",
  "error": "Detailed error message"
}
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "No frame data provided"

**Cause:** Message missing `frame` field
**Solution:**

```javascript
// ❌ Wrong
ws.send(JSON.stringify({ type: "screen_frame" }));

// ✅ Correct
ws.send(
  JSON.stringify({
    type: "screen_frame",
    frame: base64Data,
  })
);
```

### Issue 2: "Base64 image data is empty"

**Cause:** Frame field is empty string or null
**Solution:** Verify canvas.toDataURL() returns valid data

### Issue 3: "Message must have a 'type' field"

**Cause:** Message missing type field
**Solution:**

```javascript
// ❌ Wrong
ws.send(JSON.stringify({ frame: base64Data }));

// ✅ Correct
ws.send(
  JSON.stringify({
    type: "screen_frame",
    frame: base64Data,
  })
);
```

### Issue 4: "Failed to analyze screen"

**Cause:** Gemini API error or invalid image format
**Solution:**

- Check GEMINI_API_KEY is valid
- Verify image is PNG format
- Check backend logs for detailed error

---

## 🔍 Monitoring Tools

### Backend Console Logs:

- `📨` - Message received
- `📸` - Processing frame
- `🎯` - User goal
- `✅` - Success
- `❌` - Error

### Enable Verbose Logging (Optional):

Add this to your frontend:

```javascript
ws.onmessage = (event) => {
  console.log("📩 Raw message:", event.data);
  const data = JSON.parse(event.data);
  console.log("📦 Parsed data:", data);
};
```

---

## 📝 Updated WebSocket Handler Features

### Validations Added:

- ✅ Message type validation
- ✅ Frame data presence validation
- ✅ Base64 data emptiness check
- ✅ Chat content validation

### Logging Added:

- ✅ Message type logging
- ✅ Frame size logging
- ✅ Success/failure logging
- ✅ Error stack traces

### Error Responses:

- ✅ Clear error messages
- ✅ Specific error causes
- ✅ Actionable guidance

---

## 🎯 Best Practices

1. **Always include required fields:**

   - `type` (required for all messages)
   - `frame` (required for screen_frame)
   - `content` (required for chat_message)

2. **Handle errors gracefully:**

   ```javascript
   if (data.type === "error") {
     // Show user-friendly message
     // Log details for debugging
   }
   ```

3. **Validate data before sending:**

   ```javascript
   if (base64Data && base64Data.length > 0) {
     ws.send(JSON.stringify({...}));
   }
   ```

4. **Monitor backend logs:**
   - Watch for error patterns
   - Check frame sizes
   - Verify message flow

---

## ✅ Changes Summary

**Files Modified:**

- `src/wsHandler.js` - Enhanced validation and logging

**Changes Made:**

- Added frame data validation
- Added message type validation
- Added content validation for chat
- Enhanced error messages
- Added detailed logging
- Added frame size logging
- Added success/failure logs

**Result:**

- ✅ Clear error messages when data is missing
- ✅ Better debugging with detailed logs
- ✅ Prevents crashes from invalid data
- ✅ Helps identify frontend issues quickly

---

Your backend is now more robust and easier to debug! 🚀
