# 🚀 Quick Start Guide

Get your AI Voice Assistant backend running in 5 minutes!

---

## Prerequisites Check

- [ ] Node.js installed (v18+)
- [ ] PostgreSQL installed and running
- [ ] Gemini API key obtained
- [ ] Terminal/PowerShell access

---

## 🎯 Option 1: Automated Setup (Recommended)

### Windows PowerShell:

```powershell
.\setup.ps1
```

This script will:

1. ✅ Check Node.js installation
2. ✅ Install all npm dependencies
3. ✅ Verify environment configuration
4. ✅ Set up database schema
5. ✅ Offer to start the server

---

## 🎯 Option 2: Manual Setup (5 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

Edit `.env` file:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/aiassistant
GEMINI_API_KEY=your_actual_gemini_api_key
```

### Step 3: Create Database

```bash
# Windows PowerShell
psql -U postgres -c "CREATE DATABASE aiassistant;"
```

### Step 4: Setup Database Schema

```bash
npm run db:push
```

### Step 5: Start Server

```bash
npm run dev
```

---

## ✅ Verify Installation

### Test 1: Check Server Status

Open browser: http://localhost:5000

You should see:

```json
{
  "message": "Real-Time AI Voice Assistant Backend",
  "status": "running"
}
```

### Test 2: Run Automated Tests

```bash
npm test
```

You should see all tests passing ✅

---

## 🎉 Success!

Your server is now running at:

- **HTTP API:** http://localhost:5000
- **WebSocket:** ws://localhost:5000/ws

---

## 📖 Next Steps

1. **Read Documentation:**

   - `API_DOCS.md` - All API endpoints
   - `README.md` - Project overview
   - `SETUP.md` - Detailed setup

2. **Test Endpoints:**

   ```bash
   npm test
   ```

3. **Connect Frontend:**
   ```javascript
   const BACKEND_URL = "http://localhost:5000";
   const WS_URL = "ws://localhost:5000/ws";
   ```

---

## 🆘 Troubleshooting

### Problem: "Cannot connect to PostgreSQL"

**Solution:** Check if PostgreSQL is running and credentials in `.env` are correct

### Problem: "Port 5000 in use"

**Solution:** Change PORT in `.env` to 5001 or another available port

### Problem: "Gemini API error"

**Solution:** Verify GEMINI_API_KEY in `.env` is correct

### Problem: "npm install fails"

**Solution:**

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📞 Need Help?

- Check `SETUP.md` for detailed troubleshooting
- Review `API_DOCS.md` for API usage
- Check console logs for error messages

---

## 🎊 You're Ready!

Backend is running and ready to receive requests from your Electron frontend!

Start building amazing AI features! 🚀
