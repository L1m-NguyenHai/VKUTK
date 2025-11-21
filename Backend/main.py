from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from contextlib import asynccontextmanager
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
from Supabase import sinh_vien_repo, diem_repo, auth_repo, tien_do_hoc_tap_repo, course_schedule_repo
from auth_utils import get_current_user_id
from cog_loader import CogLoader

# Initialize cog loader (will be set in lifespan)
cog_loader = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    global cog_loader
    # Startup: Load all cogs
    cog_loader = CogLoader(app)
    cog_loader.load_all_cogs()
    print("[Startup] All cogs loaded")
    
    yield
    
    # Shutdown: Cleanup all cogs
    if cog_loader:
        for cog_name in list(cog_loader.loaded_cogs.keys()):
            cog_loader.unload_cog(cog_name)
    print("[Shutdown] All cogs unloaded")

app = FastAPI(
    title="VKU Toolkit API",
    lifespan=lifespan,
    swagger_ui_parameters={"persistAuthorization": True}
)

# Add security scheme to OpenAPI schema
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your Supabase access token"
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

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
    MaHocPhan: Optional[str] = None
    TenHocPhan: str
    SoTC: int
    DiemTK: Optional[float] = None
    DiemThi: Optional[float] = None
    DiemT10: Optional[float] = None
    DiemTongKet: Optional[float] = None
    XepLoai: Optional[str] = None
    HocKy: str  # Database has this as text, not int
    user_id: Optional[str] = None
    created_at: Optional[str] = None

class AllStudentsResponse(BaseModel):
    count: int
    students: List[Dict[str, Any]]

# ==================== COURSE RECOMMENDATION MODELS ====================

class RemainingCourseResponse(BaseModel):
    TenHocPhan: str
    SoTC: int
    HocKy: int
    BatBuoc: bool
    status: str  # "not_started" or "failed" (DiemChu == "F")

class CourseScheduleResponse(BaseModel):
    stt_id: int
    course_name: str
    lecturer_name: Optional[str] = None
    day_and_time: Optional[str] = None
    classroom: Optional[str] = None
    study_weeks: Optional[str] = None
    capacity: Optional[int] = None

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
        
        # Run session_get.py as subprocess using uv to ensure correct environment
        result = subprocess.run(
            ["uv", "run", "python", str(SESSION_GET_SCRIPT)],
            cwd=str(SESSION_GET_SCRIPT.parent.parent.parent),  # Run from Backend folder
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

@app.get("/api/me/student-id")
async def get_my_student_id(authorization: str = Header(None)):
    """
    Lấy StudentID của user hiện tại
    Requires: Authorization header với Bearer token
    Returns: {"student_id": "2157010001"} hoặc {"student_id": null}
    """
    try:
        # Get current user ID from token
        user_id = get_current_user_id(authorization)
        
        # Get student info for this user
        students = sinh_vien_repo.get_students_by_user(user_id)
        if students and len(students) > 0:
            return {"student_id": students[0]["StudentID"]}
        return {"student_id": None}
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

# ==================== COURSE RECOMMENDATION ROUTES ====================

@app.get("/api/students/{student_id}/courses/remaining", response_model=List[RemainingCourseResponse])
async def get_remaining_courses(student_id: str, authorization: str = Header(None)):
    """
    Lấy danh sách các môn học chưa hoàn thành của sinh viên
    - Môn chưa học (không có trong TienDoHocTap)
    - Môn bị F (DiemChu = 'F' hoặc DiemT4 < 1.0)
    Requires: Authorization header với Bearer token
    """
    try:
        # Get current user ID from token
        user_id = get_current_user_id(authorization)
        
        # Get all academic progress of student
        all_progress = tien_do_hoc_tap_repo.get_academic_progress_by_user(student_id, user_id)
        
        if not all_progress:
            raise HTTPException(status_code=404, detail="No academic progress found for this student")
        
        # Find courses that are not completed (DiemChu == "F" or DiemT4 < 1.0 or grade is None/empty)
        remaining_courses = []
        for course in all_progress:
            diem_chu = course.get("DiemChu", "").strip()
            diem_t4 = course.get("DiemT4", "")
            
            # Check if course is failed or not completed
            is_failed = False
            if diem_chu == "F":
                is_failed = True
            elif diem_t4:
                try:
                    # DiemT4 might be string, convert to float
                    if isinstance(diem_t4, str):
                        diem_t4 = float(diem_t4)
                    if diem_t4 < 1.0:
                        is_failed = True
                except (ValueError, TypeError):
                    pass
            
            # Check if not graded yet (no DiemChu or empty)
            is_not_started = not diem_chu or diem_chu == ""
            
            if is_failed or is_not_started:
                remaining_courses.append(RemainingCourseResponse(
                    TenHocPhan=course.get("TenHocPhan", ""),
                    SoTC=course.get("SoTC", 0),
                    HocKy=course.get("HocKy", 0),
                    BatBuoc=course.get("BatBuoc", False),
                    status="failed" if is_failed else "not_started"
                ))
        
        return remaining_courses
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/courses/schedule", response_model=List[CourseScheduleResponse])
async def get_course_schedules(
    course_names: Optional[str] = None,  # Comma-separated course names
    lecturer: Optional[str] = None,
    day: Optional[str] = None
):
    """
    Lấy danh sách lớp học phần có sẵn
    - course_names: Danh sách tên môn học (phân cách bằng dấu phẩy)
    - lecturer: Tên giảng viên (tìm kiếm gần đúng)
    - day: Ngày trong tuần (ví dụ: "Thứ 2", "Thứ 3")
    """
    try:
        courses = []
        
        if course_names:
            # Search by multiple course names
            names_list = [name.strip() for name in course_names.split(",")]
            courses = course_schedule_repo.search_courses(names_list)
        elif lecturer:
            # Search by lecturer
            courses = course_schedule_repo.get_courses_by_lecturer(lecturer)
        elif day:
            # Search by day
            courses = course_schedule_repo.get_courses_by_day(day)
        else:
            # Get all courses
            courses = course_schedule_repo.get_all_courses()
        
        return [CourseScheduleResponse(**course) for course in courses]
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

# ==================== PLUGIN MANAGEMENT ====================

@app.get("/api/plugins")
async def get_plugins():
    """Get list of all loaded plugins"""
    return {
        "success": True,
        "plugins": cog_loader.get_loaded_cogs()
    }

@app.get("/api/plugins/commands")
async def get_available_commands():
    """Get all available slash commands from enabled cogs"""
    commands = []
    for cog_instance in cog_loader.loaded_cogs.values():
        if cog_instance.is_enabled():
            for cmd in cog_instance.metadata.commands:
                commands.append({
                    "cog_id": cog_instance.get_cog_id(),
                    "cog_name": cog_instance.metadata.name,
                    "icon": cog_instance.metadata.icon,
                    "color": cog_instance.metadata.color,
                    **cmd.model_dump()
                })
    return {
        "success": True,
        "commands": commands
    }

@app.post("/api/plugins/{cog_name}/enable")
async def enable_plugin(cog_name: str):
    """Enable a specific plugin"""
    success = cog_loader.enable_cog(cog_name)
    return {
        "success": success,
        "message": f"Plugin {cog_name} {'enabled' if success else 'failed to enable'}"
    }

@app.post("/api/plugins/{cog_name}/disable")
async def disable_plugin(cog_name: str):
    """Disable a specific plugin"""
    success = cog_loader.disable_cog(cog_name)
    return {
        "success": success,
        "message": f"Plugin {cog_name} {'disabled' if success else 'failed to disable'}"
    }

@app.post("/api/plugins/{cog_name}/reload")
async def reload_plugin(cog_name: str):
    """Reload a specific plugin"""
    success = cog_loader.reload_cog(cog_name)
    return {
        "success": success,
        "message": f"Plugin {cog_name} {'reloaded' if success else 'failed to reload'}"
    }

# Alias for uvicorn (allows both `uvicorn main:app` and `uvicorn main:main`)
main = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
