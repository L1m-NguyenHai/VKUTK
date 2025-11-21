from typing import List, Dict, Optional, Any
from .base import BaseRepository

class CourseScheduleRepository(BaseRepository):
    """Repository cho bảng course_schedule"""
    
    def __init__(self):
        super().__init__("course_schedule")
    
    def get_all_courses(self) -> List[Dict[str, Any]]:
        """Lấy tất cả lớp học phần"""
        try:
            response = self.client.table(self.table_name).select("*").execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Error getting all courses: {e}")
            return []
    
    def get_course_by_name(self, course_name: str) -> List[Dict[str, Any]]:
        """Lấy các lớp theo tên môn học"""
        try:
            response = self.client.table(self.table_name).select("*").eq("course_name", course_name).execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Error getting course by name: {e}")
            return []
    
    def search_courses(self, course_names: List[str]) -> List[Dict[str, Any]]:
        """Tìm các lớp học theo danh sách tên môn học"""
        try:
            response = self.client.table(self.table_name).select("*").in_("course_name", course_names).execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Error searching courses: {e}")
            return []
    
    def get_courses_by_lecturer(self, lecturer_name: str) -> List[Dict[str, Any]]:
        """Lấy các lớp theo tên giảng viên"""
        try:
            response = self.client.table(self.table_name).select("*").ilike("lecturer_name", f"%{lecturer_name}%").execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Error getting courses by lecturer: {e}")
            return []
    
    def get_courses_by_day(self, day_keyword: str) -> List[Dict[str, Any]]:
        """Lấy các lớp theo ngày học (Thứ 2, Thứ 3, ...)"""
        try:
            response = self.client.table(self.table_name).select("*").ilike("day_and_time", f"%{day_keyword}%").execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Error getting courses by day: {e}")
            return []

# Khởi tạo repository instance
course_schedule_repo = CourseScheduleRepository()
