# Real-Time AI Voice Assistant

A desktop application that enables real-time AI-powered voice assistance with screen sharing capabilities. The application captures your screen at low frame rates (1-2 FPS), sends the frames to an AI backend powered by Google's Gemini API, and provides intelligent voice guidance for technical tasks.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Workflow](#core-workflow)
- [Key Components](#key-components)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Technologies Used](#technologies-used)

---

## 🎯 Overview

This application consists of two main parts:

1. **Frontend (Electron Desktop App)**: Captures screen frames, manages WebSocket connections, handles chat interface, and provides text-to-speech functionality.
2. **Backend (Node.js Server)**: Processes screen frames using Gemini AI, manages WebSocket connections, stores session data in PostgreSQL, and provides REST APIs.

### Key Features

- 🖥️ **Screen Sharing**: WebRTC-based screen capture with configurable frame rates (1-2 FPS)
- 💬 **Real-time Chat**: WebSocket-based bidirectional communication
- 🎙️ **Voice Responses**: Browser-based text-to-speech for AI responses
- 🧠 **AI Analysis**: Gemini-powered screen frame analysis and contextual responses
- 💾 **Session Management**: Persistent storage of chat history and session data
- 🔄 **Auto-reconnection**: Automatic WebSocket reconnection with exponential backoff
- 🎨 **Modern UI**: Clean and responsive Electron-based interface

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Electron)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   WebRTC     │  │  WebSocket   │  │     Chat     │          │
│  │   Manager    │  │   Manager    │  │   Manager    │          │
│  │              │  │              │  │              │          │
│  │ - Screen     │  │ - Connect    │  │ - Messages   │          │
│  │   Capture    │  │ - Send       │  │ - TTS        │          │
│  │ - Frame      │  │   Frames     │  │ - History    │          │
│  │   Encoding   │  │ - Reconnect  │  │ - UI         │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
│         └─────────────────┴──────────────────┘                  │
│                           │                                     │
│                      app.js (Main Controller)                   │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                    WebSocket (ws://)
                    HTTP (REST APIs)
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                      BACKEND (Node.js)                          │
│                           │                                     │
│                    server.js (Entry Point)                      │
│                           │                                     │
│         ┌─────────────────┴─────────────────┐                  │
│         │                                   │                  │
│  ┌──────▼────────┐                  ┌───────▼──────┐          │
│  │  WebSocket    │                  │  REST APIs   │          │
│  │   Handler     │                  │              │          │
│  │               │                  │ - /chat      │          │
│  │ - Frame       │                  │ - /sessions  │          │
│  │   Analysis    │                  │ - /users     │          │
│  │ - Chat        │                  │              │          │
│  │   Processing  │                  └───────┬──────┘          │
│  │ - Session     │                          │                  │
│  │   Management  │                          │                  │
│  └───────┬───────┘                          │                  │
│          │                                  │                  │
│          └──────────────┬───────────────────┘                  │
│                         │                                      │
│              ┌──────────┴──────────┐                           │
│              │                     │                           │
│       ┌──────▼──────┐      ┌──────▼──────┐                    │
│       │   Gemini    │      │  Database   │                    │
│       │    Utils    │      │  (Drizzle)  │                    │
│       │             │      │             │                    │
│       │ - Screen    │      │ - Sessions  │                    │
│       │   Analysis  │      │ - Users     │                    │
│       │ - Context   │      │ - Messages  │                    │
│       │   Response  │      │             │                    │
│       └─────────────┘      └──────┬──────┘                    │
│                                   │                            │
└───────────────────────────────────┼────────────────────────────┘
                                    │
                            PostgreSQL Database
```

---

## 🔄 Core Workflow

### 1. Application Startup

```
User launches app → Electron creates window → Loads HTML/CSS/JS
                                                      ↓
                                    Initializes 3 Managers:
                                    - WebSocketManager
                                    - WebRTCManager
                                    - ChatManager
                                                      ↓
                                    WebSocket connects to backend
                                                      ↓
                                    Backend creates session & stores in memory
```

### 2. Screen Sharing Flow

```
User clicks "Start Sharing" → WebRTCManager.startCapture()
                                           ↓
                              Electron's desktopCapturer gets screen sources
                                           ↓
                              User selects screen/window to share
                                           ↓
                              MediaStream created from selected source
                                           ↓
                              Stream displayed in video preview
                                           ↓
                              Frames captured on-demand (not continuous)
```

### 3. Chat Message Flow (with Screen Context)

```
User types message → ChatManager.sendMessage()
                              ↓
                    WebRTCManager.captureFrame()
                              ↓
                    Canvas captures current video frame
                              ↓
                    Frame encoded to base64 JPEG
                              ↓
                    WebSocketManager.sendChatMessage(message, frameData)
                              ↓
                    Message + Frame sent to backend via WebSocket
                              ↓
                    ┌─────────────────────────────────────┐
                    │         BACKEND PROCESSING          │
                    ├─────────────────────────────────────┤
                    │ wsHandler.handleChatMessage()       │
                    │         ↓                           │
                    │ Frame decoded from base64           │
                    │         ↓                           │
                    │ gemini.analyzeScreenFrame()         │
                    │         ↓                           │
                    │ Gemini API analyzes frame           │
                    │         ↓                           │
                    │ gemini.getContextualResponse()      │
                    │         ↓                           │
                    │ Gemini generates response with      │
                    │ screen context + chat history       │
                    │         ↓                           │
                    │ Response sent back via WebSocket    │
                    └─────────────────────────────────────┘
                              ↓
                    Frontend receives response
                              ↓
                    ChatManager.handleAIResponse()
                              ↓
                    Message displayed in chat UI
                              ↓
                    ChatManager.speak() - TTS reads response
```

### 4. Frame Analysis Flow (Automatic)

```
Screen sharing active → Backend receives frames periodically
                                    ↓
                        wsHandler.handleScreenFrame()
                                    ↓
                        shouldAnalyzeFrame() checks:
                        - Time since last analysis (1 second)
                        - Frame difference (pixelmatch)
                                    ↓
                        If significant change detected:
                                    ↓
                        gemini.analyzeScreenFrame()
                                    ↓
                        Gemini analyzes what's on screen
                                    ↓
                        Proactive guidance sent to frontend
                                    ↓
                        Displayed in chat + spoken via TTS
```

### 5. Session Persistence Flow

```
User clicks "Save Session" → ChatManager.getSessionData()
                                        ↓
                            Collects: messages, timestamp, duration
                                        ↓
                            WebSocketManager.sendSessionData()
                                        ↓
                            HTTP POST to /save-session
                                        ↓
                            Backend stores in PostgreSQL
                                        ↓
                            Also saved to localStorage (frontend)
```

---

## 🔑 Key Components

### Frontend Files

#### **`main.js`** - Electron Main Process
- **Purpose**: Entry point for Electron application
- **Responsibilities**:
  - Creates the main browser window
  - Configures window properties (size, web preferences)
  - Enables Node.js integration for renderer process
  - Handles application lifecycle events

#### **`renderer/app.js`** - Main Application Controller
- **Purpose**: Orchestrates all frontend components
- **Key Functions**:
  - `initializeApp()`: Initializes all managers and sets up event listeners
  - `setupButtonListeners()`: Handles UI button clicks (start, pause, stop, save)
  - `handleWebSocketMessage()`: Routes incoming WebSocket messages to appropriate handlers
  - `handleConnectionStatus()`: Updates UI based on WebSocket connection state
  - `updateUIForScreenSharing()`: Manages UI state during screen sharing
- **Manages**:
  - Application state (isScreenSharing, isConnected, isPaused)
  - Communication between WebRTC, WebSocket, and Chat managers
  - UI updates and user interactions

#### **`renderer/websocket.js`** - WebSocket Manager
- **Purpose**: Manages WebSocket connection to backend
- **Key Functions**:
  - `connect()`: Establishes WebSocket connection
  - `attemptReconnect()`: Handles reconnection with exponential backoff
  - `send()`: Sends JSON messages to backend
  - `sendFrame()`: Sends screen frames
  - `sendChatMessage()`: Sends chat messages with optional frame data
  - `sendSessionData()`: Saves session via HTTP POST
- **Features**:
  - Auto-reconnection (up to 10 attempts)
  - Connection status callbacks
  - Message routing to registered callbacks

#### **`renderer/webrtc.js`** - WebRTC Manager
- **Purpose**: Handles screen capture and frame encoding
- **Key Functions**:
  - `startCapture()`: Initiates screen sharing using Electron's desktopCapturer
  - `captureFrame()`: Captures current frame from video stream and encodes to base64
  - `pauseCapture()`: Pauses frame capture without stopping stream
  - `resumeCapture()`: Resumes frame capture
  - `stopCapture()`: Stops screen sharing and releases resources
- **Features**:
  - Screen source selection
  - Canvas-based frame capture
  - JPEG encoding with configurable quality
  - Capture state management

#### **`renderer/chat.js`** - Chat Manager
- **Purpose**: Manages chat interface and text-to-speech
- **Key Functions**:
  - `sendMessage()`: Sends user message with screen frame
  - `addMessage()`: Adds message to chat UI
  - `handleAIResponse()`: Processes AI responses
  - `speak()`: Converts text to speech using Web Speech API
  - `getSessionData()`: Collects session data for saving
  - `saveSessionToLocalStorage()`: Persists session locally
- **Features**:
  - Message history tracking
  - TTS with voice selection
  - Session persistence (localStorage)
  - Auto-start screen capture when sending messages

#### **`renderer/config.js`** - Configuration
- **Purpose**: Centralized configuration management
- **Contains**:
  - Backend URL
  - WebSocket URL
  - Frame rate settings
  - Other configurable parameters

#### **`renderer/index.html`** - Main UI
- **Purpose**: Application user interface
- **Contains**:
  - Screen preview area
  - Chat interface
  - Control buttons (Start, Pause, Stop, Save)
  - Connection status indicator

#### **`renderer/styles.css`** - Styling
- **Purpose**: Application styling
- **Features**:
  - Modern, clean design
  - Responsive layout
  - Message styling (user vs AI)
  - Button states and animations

---

### Backend Files

#### **`src/server.js`** - Server Entry Point
- **Purpose**: Main server initialization and configuration
- **Responsibilities**:
  - Creates Express app
  - Configures middleware (CORS, JSON parsing)
  - Sets up HTTP server
  - Initializes WebSocket server
  - Registers API routes
  - Handles graceful shutdown
- **Endpoints**:
  - `GET /`: Health check and API documentation
  - `GET /status`: Active WebSocket connections status
  - Mounts chat and session routers

#### **`src/wsHandler.js`** - WebSocket Handler
- **Purpose**: Core WebSocket logic and AI processing
- **Key Functions**:
  - `initializeWebSocket()`: Sets up WebSocket server event handlers
  - `handleWebSocketMessage()`: Routes incoming messages by type
  - `handleScreenFrame()`: Processes screen frames with AI analysis
  - `handleChatMessage()`: Processes chat messages with contextual AI responses
  - `shouldAnalyzeFrame()`: Determines if frame should be analyzed (time + similarity check)
  - `compareFrames()`: Uses pixelmatch to detect frame changes
- **Features**:
  - Session management (in-memory storage)
  - Frame deduplication (avoids analyzing identical frames)
  - Conversation history tracking
  - Proactive AI guidance based on screen changes
  - Error handling and logging

#### **`src/utils/gemini.js`** - Gemini AI Integration
- **Purpose**: Interface with Google's Gemini API
- **Key Functions**:
  - `analyzeScreenFrame()`: Sends frame to Gemini for analysis
  - `getContextualResponse()`: Gets AI response with chat history and screen context
- **Features**:
  - Image encoding for Gemini API
  - Prompt engineering for screen analysis
  - Context-aware responses
  - Error handling for API calls

#### **`src/routes/chat.js`** - Chat API Routes
- **Purpose**: REST API for chat functionality
- **Endpoints**:
  - `POST /chat`: Send chat message and receive AI response (alternative to WebSocket)
- **Features**:
  - Standalone chat without WebSocket
  - Direct Gemini API integration

#### **`src/routes/session.js`** - Session API Routes
- **Purpose**: REST API for session management
- **Endpoints**:
  - `POST /save-session`: Save session to database
  - `GET /sessions/:id`: Retrieve session by ID
  - `GET /sessions/user/:userId`: Get all sessions for a user
  - `POST /users`: Create new user
  - `GET /users/:id`: Get user by ID
- **Features**:
  - PostgreSQL persistence via Drizzle ORM
  - User management
  - Session history retrieval

#### **`src/db/index.js`** - Database Connection
- **Purpose**: PostgreSQL connection setup
- **Responsibilities**:
  - Creates database connection using Drizzle ORM
  - Exports db instance for use in routes

#### **`src/db/schema.js`** - Database Schema
- **Purpose**: Defines database tables using Drizzle ORM
- **Tables**:
  - `users`: User information
  - `sessions`: Session metadata (goal, progress, duration)
  - `messages`: Chat messages linked to sessions
- **Features**:
  - Relational schema with foreign keys
  - Timestamps for tracking
  - JSON storage for message arrays

#### **`src/db/migrate.js`** - Database Migration
- **Purpose**: Runs database migrations
- **Usage**: Creates/updates database schema

---

## 🔧 Installation & Setup

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** database
- **Gemini API Key** from Google AI Studio

### Backend Setup

1. Navigate to backend directory:
   ```powershell
   cd backend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Create `.env` file:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:password@localhost:5432/aiassistant
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Set up database:
   ```powershell
   npm run db:push
   ```

5. Start backend server:
   ```powershell
   npm run dev
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Create `.env` file:
   ```env
   BACKEND_URL=http://localhost:5000
   ```

4. Start Electron app:
   ```powershell
   npm run dev
   ```

---

## 🚀 Usage

### Starting the Application

1. **Start Backend**: Run `npm run dev` in backend directory
2. **Start Frontend**: Run `npm run dev` in frontend directory
3. **Wait for Connection**: Frontend will automatically connect to backend

### Using the Application

1. **Start Screen Sharing**:
   - Click "▶️ Start Sharing" button
   - Select screen/window to share
   - Screen preview will appear

2. **Chat with AI**:
   - Type message in chat input
   - Press Enter or click "Send"
   - AI will analyze your screen and respond
   - Response will be displayed and spoken aloud

3. **Control Screen Sharing**:
   - **Pause**: Temporarily stop sending frames
   - **Resume**: Continue sending frames
   - **Stop**: End screen sharing completely

4. **Save Session**:
   - Click "💾 Save Session" to persist chat history to database
   - Sessions are also auto-saved to localStorage

### How It Works

- **Automatic Frame Capture**: When you send a message, the app automatically captures your current screen frame
- **AI Analysis**: Gemini analyzes the frame along with your message and chat history
- **Contextual Responses**: AI provides responses based on what's visible on your screen
- **Proactive Guidance**: Backend continuously monitors screen changes and provides proactive suggestions
- **Voice Feedback**: All AI responses are spoken using text-to-speech

---

## 🛠️ Technologies Used

### Frontend
- **Electron.js**: Desktop application framework
- **WebRTC**: Screen capture API
- **WebSocket**: Real-time communication
- **Web Speech API**: Text-to-speech
- **HTML/CSS/JavaScript**: UI and logic

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **WebSocket (ws)**: Real-time communication
- **PostgreSQL**: Database
- **Drizzle ORM**: Database ORM
- **Google Gemini API**: AI model for analysis and responses
- **Sharp**: Image processing
- **Pixelmatch**: Frame comparison

---

## 📊 Data Flow Summary

```
User Action → Frontend Capture → WebSocket Send → Backend Process → Gemini AI → Response → Frontend Display → TTS
```

### Message Types

**Frontend → Backend:**
- `connection`: Initial connection message
- `frame`: Screen frame data (base64 JPEG)
- `chat`: Chat message with optional frame data

**Backend → Frontend:**
- `chat`/`response`: AI response message
- `error`: Error message

---

## 🔒 Security Notes

- Never commit `.env` files with sensitive credentials
- Use HTTPS/WSS in production environments
- Validate all incoming data from backend
- Sanitize user inputs before sending
- Implement rate limiting for API calls
- Use environment variables for all sensitive configuration

---

## 📝 Development Notes

### Frame Rate Configuration
- Default: 1 FPS (configurable in `renderer/config.js`)
- Lower frame rates reduce bandwidth and API costs
- Frames are captured on-demand, not continuously

### Frame Comparison
- Backend uses pixelmatch to detect frame changes
- Only analyzes frames with significant differences
- Configurable threshold and minimum pixel difference

### Session Management
- In-memory session storage on backend
- PostgreSQL for persistent storage
- localStorage for frontend caching

---

## 🐛 Troubleshooting

### WebSocket Connection Failed
- Verify backend is running on correct port
- Check `.env` file has correct `BACKEND_URL`
- Ensure no firewall is blocking connection

### Screen Capture Not Working
- Grant screen capture permissions when prompted
- Try restarting the application
- Check Electron permissions

### TTS Not Working
- Verify system audio settings
- Check browser speech synthesis API availability
- Try different voice in code

### Database Connection Failed
- Verify PostgreSQL is running
- Check `DATABASE_URL` in backend `.env`
- Run `npm run db:push` to create tables

---

## 📄 License

MIT License - Feel free to use and modify as needed.

---

## 👥 Support

For issues or questions:
1. Check console logs (DevTools in frontend)
2. Check backend server logs
3. Review Network tab for WebSocket/HTTP requests
4. Verify environment variables are set correctly

---

**Built with ❤️ using Electron, Node.js, and Google Gemini AI by Mahfuz Saim**
