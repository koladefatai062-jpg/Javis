#!/bin/bash
# set-keys.sh
# Usage: bash set-keys.sh YOUR_GROQ_KEY YOUR_GEMINI_KEY
# Writes both keys straight into src/config.ts — no manual file editing,
# and the key only ever lives in your own terminal history / this file.

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: bash set-keys.sh <GROQ_API_KEY> <GEMINI_API_KEY>"
  exit 1
fi

sed -i "s|your-groq-api-key|$1|" src/config.ts
sed -i "s|your-gemini-api-key|$2|" src/config.ts

echo "Keys set in src/config.ts"
