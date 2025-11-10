from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.async_api import async_playwright
import os
import json
from pathlib import Path
from typing import Optional

app = FastAPI(title="VKU Session Capture API")

# Configure CORS for Tauri and development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",      # Tauri production
        "http://localhost:5173",       # Vite dev server (Tauri dev mode)
        "tauri://localhost",           # Tauri protocol
        "http://tauri.localhost",      # Tauri localhost
        "http://127.0.0.1:5173",      # Alternative localhost
        "http://127.0.0.1:1420",      # Alternative Tauri
        "*",                           # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

# Configuration
SESSION_FILE = Path(__file__).parent / "ManualScrape" / "VKU_scraper" / "session.json"

class SessionResponse(BaseModel):
    success: bool
    message: str
    session_path: Optional[str] = None

class SessionCheckResponse(BaseModel):
    exists: bool
    path: str
    size: Optional[int] = None

@app.get("/")
async def root():
    return {"message": "VKU Session Capture API", "status": "running"}

@app.post("/api/capture-session", response_model=SessionResponse)
async def capture_session():
    """
    Launch browser for user to login and capture session
    """
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context()
            
            # Open VKU login page
            page = await context.new_page()
            await page.goto("https://daotao.vku.udn.vn/sv")
            
            # Wait for user to login (30 seconds timeout)
            print("Waiting for user to login...")
            try:
                # Wait for navigation or specific element that indicates successful login
                await page.wait_for_url("**/sv/**", timeout=60000)  # 60 seconds
                await page.wait_for_timeout(2000)  # Additional 2 seconds for stability
            except Exception as e:
                await browser.close()
                return SessionResponse(
                    success=False,
                    message=f"Login timeout or failed: {str(e)}"
                )
            
            # Save session
            SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
            await context.storage_state(path=str(SESSION_FILE))
            
            await browser.close()
            
            return SessionResponse(
                success=True,
                message="Session captured successfully",
                session_path=str(SESSION_FILE)
            )
            
    except Exception as e:
        import traceback
        error_detail = f"Failed to capture session: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console
        raise HTTPException(status_code=500, detail=f"Failed to capture session: {str(e)}")

@app.get("/api/check-session", response_model=SessionCheckResponse)
async def check_session():
    """
    Check if session file exists
    """
    exists = SESSION_FILE.exists()
    size = SESSION_FILE.stat().st_size if exists else None
    
    return SessionCheckResponse(
        exists=exists,
        path=str(SESSION_FILE),
        size=size
    )

@app.get("/api/session-content")
async def get_session_content():
    """
    Get session file content (for debugging)
    """
    if not SESSION_FILE.exists():
        raise HTTPException(status_code=404, detail="Session file not found")
    
    try:
        with open(SESSION_FILE, 'r', encoding='utf-8') as f:
            content = json.load(f)
        return content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read session: {str(e)}")

@app.delete("/api/session")
async def delete_session():
    """
    Delete session file
    """
    if SESSION_FILE.exists():
        SESSION_FILE.unlink()
        return {"success": True, "message": "Session deleted"}
    return {"success": False, "message": "Session file not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
