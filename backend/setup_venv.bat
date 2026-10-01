@echo off
REM Run from inside the backend/ folder: setup_venv.bat
python -m venv venv
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
echo.
echo Backend venv ready. Activate it anytime with: venv\Scripts\activate
echo Next: copy .env.example to .env and fill in your MongoDB URI.
