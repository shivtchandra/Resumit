#!/bin/bash

# Start Backend API
echo "🚀 Starting Backend API on port 8000..."
cd backend
source .venv/bin/activate
python main.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend Dev Server
echo "🎭 Starting Frontend on port 5174..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services Started:"
echo "   Backend API: http://localhost:8000"
echo "   Frontend:    http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
