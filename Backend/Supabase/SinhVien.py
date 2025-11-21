from typing import List, Dict, Optional, Any
from .base import BaseRepository

class SinhVienRepository(BaseRepository):
    """Repository cho bảng SinhVien"""
    
    def __init__(self):
        super().__init__("SinhVien")
    
    def get_all_students(self) -> List[Dict[str, Any]]:
        """Lấy tất cả sinh viên"""
        return self.select_all()
    
    def get_student_by_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin sinh viên theo StudentID"""
        return self.select_by_id("StudentID", student_id)
    
    def create_student(self, student_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Tạo mới sinh viên
        
        Args:
            student_data: {
                "StudentID": "...",
                "ho_va_ten": "...",
                "lop": "...",
                "khoa": "...",
                "chuyen_nganh": "...",
                "khoa_hoc": "..."
            }
        """
        return self.insert_one(student_data)
    
    def update_student(self, student_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cập nhật thông tin sinh viên"""
        return self.update("StudentID", student_id, update_data)
    
    def delete_student(self, student_id: str) -> bool:
        """Xóa sinh viên"""
        return self.delete("StudentID", student_id)
    
    def search_student_by_name(self, name: str) -> List[Dict[str, Any]]:
        """Tìm kiếm sinh viên theo tên"""
        return self.search("ho_va_ten", name)
    
    def get_students_by_class(self, lop: str) -> List[Dict[str, Any]]:
        """Lấy sinh viên theo lớp"""
        return self.filter_by("lop", lop)
    
    def get_students_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Lấy tất cả sinh viên của một user"""
        return self.filter_by("user_id", user_id)
    
    def get_student_by_id_and_user(self, student_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin sinh viên theo StudentID và user_id"""
        try:
            response = self.client.table(self.table_name).select("*").eq("StudentID", student_id).eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def get_students_by_major(self, major: str) -> List[Dict[str, Any]]:
        """Lấy sinh viên theo chuyên ngành"""
        return self.filter_by("chuyen_nganh", major)
    
    def get_students_by_faculty(self, khoa: str) -> List[Dict[str, Any]]:
        """Lấy sinh viên theo khoa"""
        return self.filter_by("khoa", khoa)
    
    def bulk_insert_students(self, students_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Thêm nhiều sinh viên một lúc"""
        return self.insert_many(students_list)
    
    def student_exists(self, student_id: str) -> bool:
        """Kiểm tra sinh viên có tồn tại không"""
        return self.get_student_by_id(student_id) is not None
    
    def get_total_students_count(self) -> int:
        """Lấy tổng số sinh viên"""
        return self.get_count()
    
    def get_distinct_faculties(self) -> List[str]:
        """Lấy danh sách khoa"""
        students = self.select_all()
        faculties = list(set([s["khoa"] for s in students if s.get("khoa")]))
        return sorted(faculties)
    
    def get_distinct_majors(self) -> List[str]:
        """Lấy danh sách chuyên ngành"""
        students = self.select_all()
        majors = list(set([s["chuyen_nganh"] for s in students if s.get("chuyen_nganh")]))
        return sorted(majors)
    
    def get_distinct_classes(self) -> List[str]:
        """Lấy danh sách lớp"""
        students = self.select_all()
        classes = list(set([s["lop"] for s in students if s.get("lop")]))
        return sorted(classes)

# Singleton instance
sinh_vien_repo = SinhVienRepository()
