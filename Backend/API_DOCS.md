# API Documentation

## Real-Time AI Voice Assistant Backend API

Base URL: `http://localhost:5000`

---

## WebSocket Connection

### Connect to WebSocket

```
ws://localhost:5000/ws
```

### WebSocket Message Types

#### 1. Client → Server Messages

##### Send Screen Frame

```json
{
  "type": "screen_frame",
  "frame": "base64_encoded_image_data"
}
```

##### Send Chat Message

```json
{
  "type": "chat_message",
  "content": "Your message here",
  "includeScreen": false,
  "screenFrame": "base64_image_optional"
}
```

##### Set User Goal

```json
{
  "type": "set_goal",
  "goal": "Learn how to use Excel formulas"
}
```

##### Update Metadata

```json
{
  "type": "update_metadata",
  "metadata": {
    "mousePosition": { "x": 100, "y": 200 },
    "currentStep": 3,
    "detectedElements": "Button, Textbox, Menu"
  }
}
```

##### Get History

```json
{
  "type": "get_history"
}
```

##### Ping (Keep-Alive)

```json
{
  "type": "ping"
}
```

#### 2. Server → Client Messages

##### Connection Acknowledged

```json
{
  "type": "connected",
  "sessionId": "session_1234567890_abc123",
  "message": "Connected to AI Voice Assistant"
}
```

##### Screen Guidance Response

```json
{
  "type": "screen_guidance",
  "guidance": "Click on the File menu in the top-left corner...",
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

##### Chat Response

```json
{
  "type": "chat_response",
  "message": "I can help you with that. First, let's...",
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

##### Processing Status

```json
{
  "type": "processing",
  "message": "Processing your message..."
}
```

##### Analyzing Status

```json
{
  "type": "analyzing",
  "message": "Analyzing screen..."
}
```

##### History Response

```json
{
  "type": "history",
  "conversationHistory": [
    {
      "role": "user",
      "content": "How do I create a chart?",
      "timestamp": "2025-10-16T10:25:00.000Z"
    }
  ],
  "screenHistory": [
    {
      "timestamp": "2025-10-16T10:26:00.000Z",
      "guidance": "Select your data range first...",
      "metadata": {}
    }
  ]
}
```

##### Error

```json
{
  "type": "error",
  "message": "Failed to process message",
  "error": "Error details"
}
```

---

## REST API Endpoints

### Health Check

#### GET `/`

Get API information and available endpoints.

**Response:**

```json
{
  "message": "Real-Time AI Voice Assistant Backend",
  "status": "running",
  "version": "1.0.0",
  "endpoints": {
    "chat": "/chat",
    "saveSession": "/save-session",
    "getSession": "/sessions/:id",
    "websocket": "ws://localhost:5000/ws"
  }
}
```

---

### Chat Endpoints

#### POST `/chat`

Send a chat message and receive AI response.

**Request Body:**

```json
{
  "message": "How do I create a pivot table?",
  "sessionId": "optional_session_id",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    }
  ],
  "userGoal": "Learn Excel",
  "includeScreen": false,
  "screenFrame": "base64_image_optional"
}
```

**Response:**

```json
{
  "success": true,
  "response": "To create a pivot table, follow these steps...",
  "sessionId": "session_123",
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

#### POST `/chat/analyze`

Analyze content with AI.

**Request Body:**

```json
{
  "content": "Content to analyze",
  "analysisType": "general"
}
```

**Response:**

```json
{
  "success": true,
  "analysis": "Analysis results...",
  "analysisType": "general",
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

---

### Session Endpoints

#### POST `/save-session`

Save session data to database.

**Request Body:**

```json
{
  "userId": 1,
  "title": "Excel Tutorial Session",
  "messages": [
    {
      "role": "user",
      "content": "How do I use VLOOKUP?",
      "timestamp": "2025-10-16T10:00:00.000Z"
    }
  ],
  "screenSteps": [
    {
      "timestamp": "2025-10-16T10:01:00.000Z",
      "guidance": "Select cell B2...",
      "metadata": {}
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "sessionId": 1,
  "title": "Excel Tutorial Session",
  "message": "Session saved successfully"
}
```

#### GET `/sessions/:id`

Retrieve saved session by ID.

**Response:**

```json
{
  "success": true,
  "session": {
    "id": 1,
    "userId": 1,
    "title": "Excel Tutorial Session",
    "createdAt": "2025-10-16T10:00:00.000Z",
    "history": {
      "id": 1,
      "sessionId": 1,
      "messages": [...],
      "screenSteps": [...],
      "updatedAt": "2025-10-16T10:30:00.000Z"
    }
  }
}
```

#### GET `/sessions/user/:userId`

Get all sessions for a specific user.

**Response:**

```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "userId": 1,
      "title": "Excel Tutorial Session",
      "createdAt": "2025-10-16T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### PUT `/sessions/:id`

Update session data.

**Request Body:**

```json
{
  "title": "Updated Title",
  "messages": [...],
  "screenSteps": [...]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Session updated successfully"
}
```

#### DELETE `/sessions/:id`

Delete a session.

**Response:**

```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

---

### User Endpoints

#### POST `/users`

Create a new user.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-10-16T10:00:00.000Z"
  },
  "message": "User created successfully"
}
```

#### GET `/users/:id`

Get user by ID.

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-10-16T10:00:00.000Z"
  }
}
```

---

### Status Endpoint

#### GET `/status`

Check server status and active WebSocket connections.

**Response:**

```json
{
  "success": true,
  "server": "running",
  "activeWebSocketConnections": 2,
  "sessions": [
    {
      "sessionId": "session_1234567890_abc123",
      "connectedAt": "2025-10-16T10:00:00.000Z",
      "messageCount": 5,
      "screenFrameCount": 3,
      "userGoal": "Learn Excel"
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP Status Codes:

- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error

---

## Environment Variables

Required environment variables in `.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:123@localhost:5432/aiassistant
GEMINI_API_KEY=your_api_key
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Sessions Table

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Session History Table

```sql
CREATE TABLE session_history (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  messages JSONB NOT NULL,
  screen_steps JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);
```
