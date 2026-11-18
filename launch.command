#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"
echo "Starting Srinoos PG Operating System (Vite Dev Server)..."
echo "Opening in browser at http://localhost:3000 ..."
sleep 1 && open "http://localhost:3000" &
npm run dev
