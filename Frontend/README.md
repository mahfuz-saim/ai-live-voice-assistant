# AI Voice Assistant - Frontend

A real-time AI voice assistant desktop application built with Electron.js. This application enables users to share their screen at low frame rates (1-2 FPS) while receiving AI-powered voice guidance for technical tasks.

## 🚀 Features

- **Screen Sharing**: WebRTC-based screen capture with adjustable frame rates (1-2 FPS)
- **Real-time Communication**: WebSocket connection for sending screen frames and chat messages
- **Chat Interface**: Simple and intuitive chat interface to communicate with the AI assistant
- **Text-to-Speech**: Browser-based TTS to convert AI responses into voice
- **Session Management**: Local storage for temporary session state and backend integration for persistent storage
- **Auto-reconnection**: Automatic WebSocket reconnection with exponential backoff
- **Modern UI**: Clean and responsive interface with visual feedback

## 📁 Project Structure

```
frontend/
├── main.js                 # Electron main process (window creation)
├── renderer/
│   ├── index.html         # Main UI layout
│   ├── styles.css         # Application styles
│   ├── config.js          # Configuration management
│   ├── webrtc.js          # Screen capture and WebRTC handling
│   ├── websocket.js       # WebSocket connection management
│   ├── chat.js            # Chat interface and TTS
│   └── app.js             # Main application logic
├── package.json           # Project dependencies
├── .env                   # Environment variables (backend URL)
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🛠️ Installation

1. **Install Node.js** (if not already installed)

   - Download from [nodejs.org](https://nodejs.org/)
   - Recommended version: 18.x or higher

2. **Install Dependencies**

   ```powershell
   npm install
   ```

3. **Configure Backend URL**
   - Edit the `.env` file
   - Set `BACKEND_URL` to your backend server URL
   ```
   BACKEND_URL=http://localhost:5000
   ```

## 🏃 Running the Application

### Development Mode

```powershell
npm run dev
```

This will open the application with DevTools enabled.

### Production Mode

```powershell
npm start
```

## 🔧 Configuration

### Environment Variables

Edit the `.env` file to configure:

```env
BACKEND_URL=http://localhost:5000
```

### Frame Rate

The default frame rate is 1 FPS. You can modify this in `renderer/config.js`:

```javascript
const Config = {
  FRAME_RATE: 1, // Change to 2 for 2 FPS
  // ...
};
```

## 🎮 Usage

1. **Start the Application**

   - Run `npm start` or `npm run dev`

2. **Connect to Backend**

   - The app automatically connects to the backend WebSocket server

3. **Start Screen Sharing**

   - Click the "▶️ Start Sharing" button
   - Grant screen capture permissions when prompted
   - Select the screen/window you want to share

4. **Chat with AI**

   - Type your message in the chat input box
   - Press Enter or click "Send"
   - AI responses will appear in the chat and be spoken aloud

5. **Control Screen Sharing**

   - **Pause**: Temporarily stop sending frames (keeps stream active)
   - **Resume**: Continue sending frames
   - **Stop**: Completely stop screen sharing

6. **Save Session**
   - Click "💾 Save Session" to save chat history to backend
   - Session data is also automatically saved to local storage

## 📡 Backend Integration

### WebSocket Endpoint

The frontend connects to: `ws://BACKEND_URL/ws`

**Outgoing Messages:**

```json
// Frame data
{
  "type": "frame",
  "data": "base64_encoded_jpeg",
  "timestamp": "2025-10-16T12:00:00.000Z"
}

// Chat message
{
  "type": "chat",
  "message": "User message text",
  "timestamp": "2025-10-16T12:00:00.000Z"
}
```

**Incoming Messages:**

```json
// AI response
{
  "type": "chat" | "response",
  "message": "AI response text"
}

// Error
{
  "type": "error",
  "message": "Error description"
}
```

### HTTP Endpoint

**Save Session**: `POST /save-session`

Request body:

```json
{
  "messages": [...],
  "timestamp": "2025-10-16T12:00:00.000Z",
  "goal": "Session description",
  "progress": 10,
  "sessionDuration": 300
}
```

## 🎨 Customization

### UI Styling

Edit `renderer/styles.css` to customize:

- Colors and themes
- Layout and spacing
- Button styles
- Chat message appearance

### Frame Quality

Modify frame quality in `renderer/webrtc.js`:

```javascript
const frameData = this.canvas.toDataURL("image/jpeg", 0.8); // 0.1 to 1.0
```

### TTS Voice

The app automatically selects an English voice. To customize, edit `renderer/chat.js`:

```javascript
const englishVoice = voices.find(
  (voice) => voice.lang.startsWith("en") && voice.name.includes("Male") // Change to Male
);
```

## 🐛 Troubleshooting

### Screen Capture Not Working

- Ensure you grant screen capture permissions
- Check browser/Electron permissions
- Try restarting the application

### WebSocket Connection Failed

- Verify backend server is running
- Check `.env` file has correct `BACKEND_URL`
- Ensure no firewall is blocking the connection

### TTS Not Working

- Check browser/system audio settings
- Verify speech synthesis API is available
- Try a different voice in settings

### Frames Not Sending

- Check WebSocket connection status
- Verify screen sharing is active (not paused)
- Open DevTools to check for errors

## 📦 Building for Distribution

To create a distributable package:

1. Install electron-builder:

   ```powershell
   npm install --save-dev electron-builder
   ```

2. Add build scripts to `package.json`:

   ```json
   "scripts": {
     "build": "electron-builder"
   }
   ```

3. Run build:
   ```powershell
   npm run build
   ```

## 🔐 Security Notes

- Never commit `.env` files with sensitive credentials
- Use HTTPS/WSS in production environments
- Validate all incoming data from backend
- Sanitize user inputs before sending

## 📝 License

MIT License - Feel free to use and modify as needed.

## 🤝 Support

For issues or questions, please check:

- Console logs (DevTools)
- Backend server logs
- Network tab for WebSocket/HTTP requests

---

**Note**: This application requires a compatible backend server to function properly. Ensure your backend implements the WebSocket and HTTP endpoints as documented above.
