#!/bin/bash
# Simple startup script for the backend server
# Run without --reload to avoid macOS fork safety issues

# Load environment variables from .env file
set -a
source .env
set +a

export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
uvicorn main:app --host 0.0.0.0 --port 8000
