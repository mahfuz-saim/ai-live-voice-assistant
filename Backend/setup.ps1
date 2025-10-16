# Quick Setup Script for Windows PowerShell
# Run this script to quickly set up the backend

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "║   🤖 AI Voice Assistant Backend - Quick Setup           ║" -ForegroundColor Cyan
Write-Host "║                                                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Step 2: Install Dependencies
Write-Host ""
Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 3: Check .env file
Write-Host ""
Write-Host "🔧 Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please update your .env file with:" -ForegroundColor Yellow
    Write-Host "   1. Your PostgreSQL password" -ForegroundColor Yellow
    Write-Host "   2. Your Gemini API key" -ForegroundColor Yellow
    Write-Host ""
    $updateEnv = Read-Host "Have you updated the .env file? (y/n)"
    if ($updateEnv -ne "y") {
        Write-Host "⏸️  Please update .env file and run this script again" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

# Step 4: Check PostgreSQL
Write-Host ""
Write-Host "🔍 Checking PostgreSQL connection..." -ForegroundColor Yellow
$createDb = Read-Host "Have you created the 'aiassistant' database in PostgreSQL? (y/n)"
if ($createDb -ne "y") {
    Write-Host ""
    Write-Host "📝 Please create the database using this command in psql:" -ForegroundColor Yellow
    Write-Host '   psql -U postgres -c "CREATE DATABASE aiassistant;"' -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Press Enter after creating the database, or 'n' to exit"
    if ($continue -eq "n") {
        exit 0
    }
}

# Step 5: Push Database Schema
Write-Host ""
Write-Host "🗄️  Setting up database schema..." -ForegroundColor Yellow
npm run db:push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database schema created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create database schema" -ForegroundColor Red
    Write-Host "   Please check your DATABASE_URL in .env file" -ForegroundColor Yellow
    exit 1
}

# Step 6: Ready to Start
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "║   ✅ Setup Complete! Ready to Start Server              ║" -ForegroundColor Green
Write-Host "║                                                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the server, run:" -ForegroundColor Cyan
Write-Host "   npm run dev    (development mode with auto-reload)" -ForegroundColor White
Write-Host "   npm start      (production mode)" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   README.md      - Project overview" -ForegroundColor White
Write-Host "   API_DOCS.md    - API documentation" -ForegroundColor White
Write-Host "   SETUP.md       - Detailed setup guide" -ForegroundColor White
Write-Host ""

# Ask if user wants to start server now
$startNow = Read-Host "Would you like to start the server now? (y/n)"
if ($startNow -eq "y") {
    Write-Host ""
    Write-Host "🚀 Starting server in development mode..." -ForegroundColor Green
    Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}
