# Real-Time AI Voice Assistant Backend

Backend server for a real-time AI voice assistant that processes screen frames and chat messages using Gemini API.

## Features

- Real-time WebSocket communication for screen frame analysis
- REST APIs for chat and session management
- PostgreSQL database with Drizzle ORM
- Gemini AI integration for intelligent responses
- Session memory and history tracking

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Gemini API key

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:123@localhost:5432/aiassistant
GEMINI_API_KEY=your_api_key
```

3. Set up the database:

```bash
npm run db:push
```

## Running the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### REST APIs

- **POST /chat** - Send chat messages and receive AI responses
- **POST /save-session** - Save session data to database
- **GET /sessions/:id** - Retrieve saved session by ID

### WebSocket

- **WS /ws** - Real-time screen frame streaming and AI guidance

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── index.js       # Database connection
│   │   └── schema.js      # Drizzle schema definitions
│   ├── routes/
│   │   ├── chat.js        # Chat API routes
│   │   └── session.js     # Session API routes
│   ├── utils/
│   │   └── gemini.js      # Gemini AI helper functions
│   ├── server.js          # Main server entry point
│   └── wsHandler.js       # WebSocket handler
├── .env                   # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **WebSocket (ws)** - Real-time communication
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM
- **Gemini API** - AI model integration
