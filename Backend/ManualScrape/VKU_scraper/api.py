#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import io
import json
import os
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Set UTF-8 encoding for stdout
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Set environment variables for UTF-8
os.environ['PYTHONIOENCODING'] = 'utf-8'

app = FastAPI(title="VKU Session API", version="1.0.0")

# Enable CORS for Tauri
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class CaptureSessionRequest(BaseModel):
    python_script_path: str
    session_path: str

class FetchStudentInfoRequest(BaseModel):
    python_script_path: str
    session_path: str

class CheckSessionRequest(BaseModel):
    session_path: str

# Routes
@app.post("/api/capture-session")
async def capture_session(request: CaptureSessionRequest):
    """Capture VKU session by running the Python script"""
    try:
        # Check if script exists
        if not os.path.exists(request.python_script_path):
            raise HTTPException(
                status_code=400,
                detail=f"Python script not found at: {request.python_script_path}"
            )
        
        # Run the Python script with UTF-8 encoding
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        result = subprocess.run(
            ["python", request.python_script_path, request.session_path],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            env=env,
            timeout=600  # 10 minutes timeout
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": result.stdout.strip() or "Session captured successfully!"
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Python script error: {result.stderr.strip() or 'Unknown error'}"
            )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Session capture timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/fetch-student-info")
async def fetch_student_info(request: FetchStudentInfoRequest):
    """Fetch student information using the Python script"""
    try:
        # Check if script exists
        if not os.path.exists(request.python_script_path):
            raise HTTPException(
                status_code=400,
                detail=f"Python script not found at: {request.python_script_path}"
            )
        
        # Run the Python script with UTF-8 encoding
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        result = subprocess.run(
            ["python", request.python_script_path, request.session_path],
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',
            env=env,
            timeout=120  # 2 minutes timeout
        )
        
        if result.returncode == 0:
            try:
                student_info = json.loads(result.stdout)
                return {
                    "success": True,
                    "data": student_info
                }
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail="Failed to parse student info as JSON"
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Python script error: {result.stderr.strip() or 'Unknown error'}"
            )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Student info fetch timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/check-session")
async def check_session(request: CheckSessionRequest):
    """Check if session file exists"""
    try:
        exists = os.path.exists(request.session_path)
        return {
            "success": True,
            "exists": exists,
            "path": request.session_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "VKU Session API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
