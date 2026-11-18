#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/production-app" 2>/dev/null || cd "$DIR"
echo "Launching exact production copy of https://mangement-pg.vercel.app/ ..."
echo "Opening http://localhost:5000 in your browser ..."
sleep 1 && open "http://localhost:5000" &
/usr/bin/python3 -m http.server 5000

