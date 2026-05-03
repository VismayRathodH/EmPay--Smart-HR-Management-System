#!/bin/bash
# Script to seed the database with sample data

echo "================================"
echo "EmPay Database Seeding Script"
echo "================================"
echo ""

# Check if running from correct directory
if [ ! -f "EmPay--Smart-HR-Management-System/EmPay--Smart-HR-Management-System/server/seed_db.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "Expected to find: EmPay--Smart-HR-Management-System/EmPay--Smart-HR-Management-System/server/seed_db.py"
    exit 1
fi

# Check Python
if ! command -v python &> /dev/null; then
    echo "❌ Error: Python is not installed"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install requirements if needed
echo "📥 Installing dependencies..."
pip install -q -r EmPay--Smart-HR-Management-System/EmPay--Smart-HR-Management-System/server/requirements.txt

# Navigate to nested directory and run the seed script
echo ""
echo "🌱 Seeding database with sample data..."
cd EmPay--Smart-HR-Management-System/EmPay--Smart-HR-Management-System
python -m server.seed_db
SEED_RESULT=$?
cd ../../

if [ $SEED_RESULT -eq 0 ]; then
    echo ""
    echo "✅ Database seeding completed successfully!"
    echo ""
    echo "You can now login with:"
    echo "  Email: admin@empay.com"
    echo "  Password: admin123"
    echo ""
    echo "Or test with any employee:"
    echo "  Email: emp1@empay.com"
    echo "  Password: password123"
else
    echo ""
    echo "❌ Database seeding failed!"
    exit 1
fi
