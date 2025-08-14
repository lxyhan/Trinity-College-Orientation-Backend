#!/bin/bash

# Trinity College Orientation Leaders API - Startup Script

echo "🚀 Starting Trinity College Orientation Leaders API..."

# Check if virtual environment exists
if [ ! -d "backend-venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv backend-venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source backend-venv/bin/activate

# Install/upgrade dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if data files exist
if [ ! -f "../orientation_assignments_event_staffing.csv" ]; then
    echo "❌ Error: Data files not found in parent directory"
    echo "   Make sure you're running this from the backend/ directory"
    exit 1
fi

echo "✅ Dependencies installed"
echo "🌐 Starting server on http://localhost:8000"
echo "📚 API documentation: http://localhost:8000/docs"
echo "🔄 Press Ctrl+C to stop the server"
echo ""

# Start the server
python main.py
