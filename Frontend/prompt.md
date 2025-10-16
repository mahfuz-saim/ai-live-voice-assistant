You are building the frontend for a Real-Time AI Voice Assistant desktop app.

🧩 Project Overview:
The app helps users perform technical tasks (e.g., fixing Linux errors, deploying servers, using software) by allowing them to share their screen in low FPS (1–2), while an AI assistant provides real-time voice guidance.

🎯 Requirements:

1. Build the frontend using **Electron.js with JavaScript** (not TypeScript).
2. The project folder name should be **frontend**.
3. Create a `.env` file to store the backend base URL (e.g., BACKEND_URL=http://localhost:5000).
4. The frontend should:
   - Establish a **WebRTC** connection to share the screen (low frame rate: 1–2 FPS).
   - Use a **WebSocket** connection (ws://BACKEND_URL/ws) to send screen frame data to the backend.
   - Allow users to start, pause, and stop screen sharing from the UI.
   - Capture frames as images (JPEG/PNG) and send base64-encoded data to the backend.
   - Provide a **chat interface** (simple textbox + send button) to talk to the AI assistant.
   - Display AI responses in a chat window.
   - Convert AI text responses into voice using **browser/Electron text-to-speech**.
   - Maintain temporary session state (goal, progress, etc.) in local storage.
   - Include a button to “Save Session” → sends data to backend endpoint `/save-session`.
5. Keep UI clean with simple HTML/CSS or minimal framework (you can use Tailwind if needed).
6. Organize code as:
   - `/main.js` — Electron main process (window creation)
   - `/renderer/` — UI logic
   - `/renderer/webrtc.js` — handles screen capture + WebRTC streaming
   - `/renderer/websocket.js` — handles WS connection
   - `/renderer/chat.js` — handles chat + TTS
   - `.env` — stores BACKEND_URL
7. The WebSocket should automatically reconnect if disconnected.
8. Include comments describing every main part of the code (for readability).

💡 Output:

- Complete Electron project scaffold.
- All code in **JavaScript**.
- Must send screen frames and chat messages to backend using the BACKEND_URL from `.env`.
