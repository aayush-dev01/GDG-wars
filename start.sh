#!/bin/bash
# LegalEase AI – Start Both Servers
# Usage: bash start.sh

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        LegalEase AI – India          ║"
echo "║   Full Stack: Python + React         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install from https://python.org"
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

# Check API key
if grep -q "YOUR_GEMINI_API_KEY_HERE" backend/.env; then
    echo "⚠️  WARNING: You haven't set your Gemini API key in backend/.env"
    echo "   Get a free key at: https://aistudio.google.com/apikey"
    echo ""
fi

# Setup Python venv if needed
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# Activate venv
source backend/venv/bin/activate

# Install Python deps
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt -q

# Install Node deps
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install -q && cd ..
fi

# Create reports directory
mkdir -p backend/generated_reports

echo ""
echo "🚀 Starting backend on http://localhost:8000"
echo "🚀 Starting frontend on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Start backend in background
cd backend
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 2

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait and handle Ctrl+C
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

wait $BACKEND_PID $FRONTEND_PID
