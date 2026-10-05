#!/bin/sh
# Preview the site locally: ./serve.sh  then open http://localhost:8000
cd "$(dirname "$0")" && echo "Lineage preview → http://localhost:8000  (Ctrl+C to stop)" && python3 -m http.server 8000
