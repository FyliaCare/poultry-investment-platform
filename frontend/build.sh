#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci --include=dev || npm install

echo "Building TypeScript..."
./node_modules/.bin/tsc

echo "Building with Vite..."
./node_modules/.bin/vite build

echo "Build complete!"
