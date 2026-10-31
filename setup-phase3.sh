#!/usr/bin/env bash
# BrightSync phase 3: seeder, benchmark, rate limiting
# Author: Priyanshu Pandey | Enrollment: 0801e1241068
set -euo pipefail
cd brightsync/server
npm i express-rate-limit@7
npm pkg set scripts.seed="node seed.js" scripts.bench="node benchmark.js"
echo "Next: make sure MongoDB is running and .env has MONGO_URI, then:  npm run seed && npm run bench"
echo "Architect: Priyanshu Pandey | 0801e1241068"
