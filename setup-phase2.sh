#!/usr/bin/env bash
# BrightSync phase 2 dependencies
# Author: Priyanshu Pandey | Enrollment: 0801e1241068
set -euo pipefail
cd brightsync/client
npm i -D vite-plugin-pwa workbox-precaching workbox-routing workbox-strategies workbox-expiration
cd ../server
# Node 18+ has global fetch, so no extra Gemini SDK is needed
grep -q GEMINI_API_KEY .env || echo "GEMINI_API_KEY=your-key-here" >> .env
echo "Done. Author: Priyanshu Pandey | 0801e1241068"
