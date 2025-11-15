from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sys
import json
import subprocess
import shutil
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional, List, Dict, Any

# Add ManualScrape path
sys.path.insert(0, str(Path(__file__).parent / "ManualScrape" / "VKU_scraper"))

from scraper import VKUScraperManager
from Supabase import sinh_vien_repo, diem_repo, auth_repo, tien_do_hoc_tap_repo
from auth_utils import get_current_user_id

app = FastAPI(title="VKU Toolkit API")

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

# Configuration - Save session to Frontend/Sessions folder
SESSIONS_DIR = Path(__file__).parent.parent / "Frontend" / "Sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
SESSION_FILE = SESSIONS_DIR / "session.json"

# Path to session_get.py script
SESSION_GET_SCRIPT = Path(__file__).parent / "ManualScrape" / "VKU_scraper" / "session_get.py"

class SessionResponse(BaseModel):
    success: bool
    message: str
    session_path: Optional[str] = None

class SessionCheckResponse(BaseModel):
    exists: bool
    path: str
    size: Optional[int] = None

# ==================== SCRAPER RESPONSE MODELS ====================

class ScrapeDataResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class StudentResponse(BaseModel):
    StudentID: str
    ho_va_ten: str
    lop: str
    khoa: str
    chuyen_nganh: Optional[str] = None
    khoa_hoc: Optional[str] = None

class GradeResponse(BaseModel):
    id: Optional[int] = None
    StudentID: str
    TenHocPhan: str
    SoTC: int
    DiemT10: Optional[float] = None
    HocKy: str

class AllStudentsResponse(BaseModel):
    count: int
    students: List[Dict[str, Any]]

# ==================== AUTH REQUEST/RESPONSE MODELS ====================

class SignUpRequest(BaseModel):
    email: str
    password: str
    metadata: Optional[Dict[str, Any]] = None

class SignInRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict[str, Any]] = None
    session: Optional[Dict[str, Any]] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ResetPasswordRequest(BaseModel):
    email: str

class UpdateUserRequest(BaseModel):
    access_token: str
    updates: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "VKU Toolkit API", "status": "running", "version": "1.0.0"}

@app.post("/api/capture-session", response_model=SessionResponse)
async def capture_session():
    """
    Call session_get.py to launch browser and capture session
    """
    try:
        # Check if session_get.py exists
        if not SESSION_GET_SCRIPT.exists():
            raise FileNotFoundError(f"session_get.py not found at {SESSION_GET_SCRIPT}")
        
        print(f"Running session capture script: {SESSION_GET_SCRIPT}")
        
        # Run session_get.py as subprocess
        # Note: We need to modify session_get.py to save to the correct location
        result = subprocess.run(
            ["python", str(SESSION_GET_SCRIPT)],
            cwd=str(SESSION_GET_SCRIPT.parent),
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        print(f"Script output: {result.stdout}")
        if result.stderr:
            print(f"Script errors: {result.stderr}")
        
        if result.returncode != 0:
            return SessionResponse(
                success=False,
                message=f"Session capture failed: {result.stderr}"
            )
        
        # Check if session.json was created in Frontend/Sessions folder
        if SESSION_FILE.exists():
            return SessionResponse(
                success=True,
                message="Session captured successfully",
                session_path=str(SESSION_FILE)
            )
        else:
            return SessionResponse(
                success=False,
                message="Session file was not created"
            )
            
    except FileNotFoundError as e:
        print(f"File not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except subprocess.TimeoutExpired:
        print("Session capture timeout")
        raise HTTPException(status_code=408, detail="Session capture timeout (5 minutes)")
    except Exception as e:
        import traceback
        error_detail = f"Failed to capture session: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
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

# ==================== AUTH ENDPOINTS ====================

@app.post("/api/auth/signup", response_model=AuthResponse)
async def sign_up(request: SignUpRequest):
    """
    Register a new user
    """
    try:
        result = auth_repo.sign_up(
            email=request.email,
            password=request.password,
            metadata=request.metadata
        )
        
        if result.get("success"):
            return AuthResponse(**result)
        else:
            raise HTTPException(status_code=400, detail=result.get("message"))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/signin", response_model=AuthResponse)
async def sign_in(request: SignInRequest):
    """
    Sign in existing user
    """
    try:
        result = auth_repo.sign_in(
            email=request.email,
            password=request.password
        )
        
        if result.get("success"):
            return AuthResponse(**result)
        else:
            raise HTTPException(status_code=401, detail=result.get("message"))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/signout")
async def sign_out(access_token: str):
    """
    Sign out user
    """
    try:
        result = auth_repo.sign_out(access_token)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/auth/user")
async def get_user(access_token: str):
    """
    Get current user from access token
    """
    try:
        result = auth_repo.get_user(access_token)
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=401, detail=result.get("message"))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/refresh")
async def refresh_session(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    """
    try:
        result = auth_repo.refresh_session(request.refresh_token)
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=401, detail=result.get("message"))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Send password reset email
    """
    try:
        result = auth_repo.reset_password_email(request.email)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/auth/user")
async def update_user(request: UpdateUserRequest):
    """
    Update user information
    """
    try:
        result = auth_repo.update_user(
            access_token=request.access_token,
            updates=request.updates
        )
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("message"))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SCRAPER ENDPOINTS ====================

@app.post("/api/scrape-and-sync", response_model=ScrapeDataResponse)
async def scrape_and_sync(authorization: str = Header(None)):
    """
    Scrape dữ liệu từ VKU và đồng bộ vào Supabase (theo user hiện tại)
    Requires: Authorization header với Bearer token
    """
    try:
        # Get current user ID from token
        user_id = get_current_user_id(authorization)
        
        # Check if session exists
        if not SESSION_FILE.exists():
            raise HTTPException(
                status_code=400, 
                detail="Session file not found. Please capture session first."
            )
        
        # Initialize scraper manager with session path and user_id
        scraper_manager = VKUScraperManager(
            session_path=str(SESSION_FILE),
            headless=True,
            user_id=user_id  # Pass user_id to scraper
        )
        
        # Run synchronous scraper in thread executor to avoid blocking async loop
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            result = await loop.run_in_executor(executor, scraper_manager.scrape_and_sync)
        
        return ScrapeDataResponse(
            success=result.get("success", False),
            message=result.get("message", ""),
            data=result.get("data", {})
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Failed to scrape and sync: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scrape-status")
async def get_scrape_status():
    """
    Get scraping prerequisites status
    """
    session_exists = SESSION_FILE.exists()
    
    return {
        "session_exists": session_exists,
        "ready": session_exists,
        "message": "Ready to scrape" if session_exists else "Session required",
    }

# ==================== STUDENT ENDPOINTS ====================

@app.get("/api/students", response_model=AllStudentsResponse)
async def get_all_students(authorization: str = Header(None)):
    """
    Lấy tất cả sinh viên của user hiện tại từ database
    Requires: Authorization header với Bearer token
    """
    try:
        # Get current user ID from token
        user_id = get_current_user_id(authorization)
        
        # Get students của user này
        students = sinh_vien_repo.get_students_by_user(user_id)
        return AllStudentsResponse(
            count=len(students),
            students=students
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str, authorization: str = Header(None)):
    """
    Lấy thông tin một sinh viên (của user hiện tại)
    Requires: Authorization header với Bearer token
    """
    try:
        # Get current user ID from token
        user_id = get_current_user_id(authorization)
        
        student = sinh_vien_repo.get_student_by_id_and_user(student_id, user_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return StudentResponse(**student)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}/grades", response_model=List[GradeResponse])
async def get_student_grades(student_id: str, authorization: str = Header(None)):
    """
    Lấy danh sách điểm của sinh viên (của user hiện tại)
    Requires: Authorization header với Bearer token
    """
    try:
        # Get current user ID from token
        user_id = get_current_user_id(authorization)
        
        grades = diem_repo.get_grades_by_student_and_user(student_id, user_id)
        return [GradeResponse(**grade) for grade in grades]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}/tien-do-hoc-tap")
async def get_student_academic_progress(student_id: str, authorization: str = Header(None)):
    """
    Lấy tiến độ học tập của sinh viên (của user hiện tại)
    Requires: Authorization header với Bearer token
    """
    try:
        # Get current user ID from token
        user_id = get_current_user_id(authorization)
        
        progress = tien_do_hoc_tap_repo.get_academic_progress_by_user(student_id, user_id)
        return progress
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    """
    Lấy thống kê dữ liệu
    """
    try:
        total_students = sinh_vien_repo.get_total_students_count()
        faculties = sinh_vien_repo.get_distinct_faculties()
        majors = sinh_vien_repo.get_distinct_majors()
        
        return {
            "total_students": total_students,
            "total_faculties": len(faculties),
            "total_majors": len(majors),
            "faculties": faculties,
            "majors": majors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Alias for uvicorn (allows both `uvicorn main:app` and `uvicorn main:main`)
main = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
