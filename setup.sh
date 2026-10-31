#!/usr/bin/env bash
# BrightSync workspace bootstrap
# Author: Priyanshu Pandey | Enrollment: 0801e1241068
set -euo pipefail
mkdir -p brightsync && cd brightsync

# ---------- SERVER ----------
mkdir -p server/src/models server/src/routes server/src/middleware server/src/services && cd server
npm init -y >/dev/null
npm pkg set type=module scripts.dev="node --watch src/index.js" scripts.start="node src/index.js"
npm i express mongoose bcryptjs jsonwebtoken node-cron cors helmet dotenv
cd ..

# ---------- CLIENT ----------
# Pinned to React 18 + Tailwind v3: Tremor v3 and the shadcn v2.3.0 CLI both target this combo.
# Tailwind v4 / React 19 builds of shadcn will fight Tremor's config.
npm create vite@latest client -- --template react
cd client
npm i react@18.3.1 react-dom@18.3.1
npm i -D tailwindcss@3.4.17 postcss autoprefixer @tailwindcss/forms
npm i @tremor/react@3.18.7 @headlessui/react@2.2.0 @headlessui/tailwindcss tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react
npx tailwindcss init -p
# Copy client-overrides/ over client/ (tailwind.config.js, Dashboard.jsx), then:
npx shadcn@2.3.0 init      # Default style, Slate, CSS variables = yes
npx shadcn@2.3.0 add button card input
cd ..
echo "Author: Priyanshu Pandey | Enrollment: 0801e1241068"
