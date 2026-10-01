#!/bin/bash
# Run from inside the backend/ folder: bash setup_venv.sh
set -e
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo ""
echo "Backend venv ready. Activate it anytime with: source venv/bin/activate"
echo "Next: copy .env.example to .env and fill in your MongoDB URI."
