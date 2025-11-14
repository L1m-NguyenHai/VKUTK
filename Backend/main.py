from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sys
import json
import subprocess
import shutil
from pathlib import Path
from typing import Optional, List, Dict, Any

# Add ManualScrape path
sys.path.insert(0, str(Path(__file__).parent / "ManualScrape" / "VKU_scraper"))

from scraper import vku_scraper_manager
from Supabase import sinh_vien_repo, diem_repo

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

@app.get("/")
async def root():
    return {"message": "VKU Session Capture API", "status": "running"}

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

# ==================== SCRAPER ENDPOINTS ====================

@app.post("/api/scrape-and-sync", response_model=ScrapeDataResponse)
async def scrape_and_sync():
    """
    Scrape dữ liệu từ VKU và đồng bộ vào Supabase
    """
    try:
        result = vku_scraper_manager.scrape_and_sync()
        
        return ScrapeDataResponse(
            success=result.get("success", False),
            message=result.get("message", ""),
            data=result.get("data", {})
        )
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== STUDENT ENDPOINTS ====================

@app.get("/api/students", response_model=AllStudentsResponse)
async def get_all_students():
    """
    Lấy tất cả sinh viên từ database
    """
    try:
        students = sinh_vien_repo.get_all_students()
        return AllStudentsResponse(
            count=len(students),
            students=students
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str):
    """
    Lấy thông tin một sinh viên
    """
    try:
        student = sinh_vien_repo.get_student_by_id(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return StudentResponse(**student)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/students/{student_id}/grades", response_model=List[GradeResponse])
async def get_student_grades(student_id: str):
    """
    Lấy danh sách điểm của sinh viên
    """
    try:
        grades = diem_repo.get_grades_by_student(student_id)
        return [GradeResponse(**grade) for grade in grades]
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
