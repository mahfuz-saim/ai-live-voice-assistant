# Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)

   - Download from: https://nodejs.org/

2. **PostgreSQL** (v12 or higher)

   - Download from: https://www.postgresql.org/download/
   - Make sure PostgreSQL service is running

3. **Gemini API Key**
   - Get from: https://makersuite.google.com/app/apikey

---

## Step 1: Install Dependencies

Navigate to the backend folder and install npm packages:

```bash
cd Backend
npm install
```

This will install:

- express (Web framework)
- ws (WebSocket library)
- drizzle-orm (Database ORM)
- pg (PostgreSQL client)
- @google/generative-ai (Gemini API)
- cors (CORS middleware)
- dotenv (Environment variables)

---

## Step 2: Configure Environment Variables

1. Open the `.env` file in the Backend folder
2. Update the following variables:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/aiassistant
GEMINI_API_KEY=your_actual_gemini_api_key
```

**Important:**

- Replace `YOUR_PASSWORD` with your PostgreSQL password
- Replace `your_actual_gemini_api_key` with your real Gemini API key
- Make sure the database name is `aiassistant` (or create it in PostgreSQL)

---

## Step 3: Create PostgreSQL Database

Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE aiassistant;
```

Or using command line:

```bash
# Windows (PowerShell)
psql -U postgres -c "CREATE DATABASE aiassistant;"

# macOS/Linux
sudo -u postgres psql -c "CREATE DATABASE aiassistant;"
```

---

## Step 4: Push Database Schema

Run Drizzle ORM to create the database tables:

```bash
npm run db:push
```

This will create the following tables:

- `users` - Store user information
- `sessions` - Store session metadata
- `session_history` - Store conversation and screen analysis history

---

## Step 5: Start the Server

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

You should see:

```
✅ HTTP Server running on: http://localhost:5000
✅ WebSocket Server running on: ws://localhost:5000/ws
```

---

## Step 6: Test the Server

### Test HTTP Endpoint

Open your browser and navigate to:

```
http://localhost:5000
```

You should see a JSON response with API information.

### Test with cURL (PowerShell)

```powershell
# Test health endpoint
Invoke-RestMethod -Uri http://localhost:5000 -Method Get

# Create a user
$body = @{
    name = "Test User"
    email = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/users -Method Post -Body $body -ContentType "application/json"

# Send a chat message
$chatBody = @{
    message = "Hello, AI assistant!"
    userId = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/chat -Method Post -Body $chatBody -ContentType "application/json"
```

---

## Step 7: Connect Frontend

In your Electron frontend, set the backend URL:

```javascript
const BACKEND_URL = "http://localhost:5000";
const WS_URL = "ws://localhost:5000/ws";
```

---

## Troubleshooting

### Issue: "Cannot connect to PostgreSQL"

**Solution:**

1. Check if PostgreSQL service is running
2. Verify credentials in `.env` file
3. Ensure database `aiassistant` exists
4. Check firewall settings

### Issue: "Gemini API error"

**Solution:**

1. Verify your Gemini API key is correct
2. Check if you have API quota remaining
3. Ensure internet connection is active

### Issue: "Port 5000 already in use"

**Solution:**
Change the PORT in `.env` file:

```env
PORT=5001
```

### Issue: "Module not found"

**Solution:**
Delete node_modules and reinstall:

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## Project Structure

```
Backend/
├── src/
│   ├── db/
│   │   ├── index.js          # Database connection
│   │   ├── schema.js         # Table schemas
│   │   └── migrate.js        # Migration script
│   ├── routes/
│   │   ├── chat.js           # Chat API endpoints
│   │   └── session.js        # Session management endpoints
│   ├── utils/
│   │   └── gemini.js         # Gemini AI integration
│   ├── server.js             # Main server file
│   └── wsHandler.js          # WebSocket handler
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies and scripts
├── drizzle.config.js        # Drizzle ORM configuration
├── README.md                # Project overview
├── API_DOCS.md              # API documentation
└── SETUP.md                 # This file
```

---

## Available Scripts

- `npm run dev` - Start server with auto-reload (development)
- `npm start` - Start server (production)
- `npm run db:generate` - Generate migration files
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Create database
4. ✅ Push schema
5. ✅ Start server
6. ✅ Test endpoints
7. 🎯 Connect your Electron frontend!

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review API_DOCS.md for endpoint documentation
3. Check server logs for error messages
4. Verify all environment variables are set correctly

---

## Security Notes

- Never commit `.env` file to version control
- Keep your Gemini API key private
- Use strong PostgreSQL passwords
- Consider adding authentication for production use
- Implement rate limiting for API endpoints in production

---

Happy coding! 🚀
