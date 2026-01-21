"""
FocusGuard API - Server Runner

Run the FastAPI server programmatically without module reload issues.
"""

import sys
import os
from pathlib import Path

# Add serv directory to Python path
serv_dir = Path(__file__).parent
sys.path.insert(0, str(serv_dir))

# Change to serv directory so .env can be found
os.chdir(serv_dir)

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting FocusGuard API server...")
    print(f"📂 Working directory: {serv_dir}")
    print(f"📂 Current directory: {os.getcwd()}")
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,  # Disable reload for now
        log_level="info"
    )
