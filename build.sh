#!/usr/bin/env bash
# Build script for Render or Linux server environments
set -o errexit

echo "==> [1/3] Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

echo "==> [2/3] Building frontend assets..."
if command -v npm &> /dev/null; then
  cd frontend
  npm install
  npm run build
  cd ..
  echo "Frontend build succeeded."
else
  echo "Node/npm not detected in native environment. Ensure frontend/dist is built or deploy using Docker."
fi

echo "==> [3/3] Build finished successfully."
