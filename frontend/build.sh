#!/usr/bin/env bash
set -e

echo "==> Installing dependencies..."
npm install

echo "==> Compiling TypeScript..."
npm exec tsc

echo "==> Building with Vite..."
npm exec vite build

echo "==> Build complete!"
