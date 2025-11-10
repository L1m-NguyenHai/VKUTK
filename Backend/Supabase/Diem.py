from typing import List, Dict, Optional, Any
from base import BaseRepository

class DiemRepository(BaseRepository):
    """Repository cho bảng Diem"""
    
    def __init__(self):
        super().__init__("Diem")
    
    def get_grades_by_student(self, student_id: str) -> List[Dict[str, Any]]:
        """Lấy điểm của sinh viên"""
        return self.filter_by("StudentID", student_id)
    
    def create_grade(self, grade_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Tạo mới bản ghi điểm
        
        Args:
            grade_data: {
                "StudentID": "...",
                "TenHocPhan": "...",
                "SoTC": ...,
                "DiemT10": ...,
                "HocKy": "..."
            }
        """
        return self.insert_one(grade_data)
    
    def bulk_insert_grades(self, grades_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Thêm nhiều bản ghi điểm"""
        return self.insert_many(grades_list)
    
    def update_grade(self, grade_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cập nhật bản ghi điểm"""
        return self.update("id", str(grade_id), update_data)
    
    def delete_grade(self, grade_id: int) -> bool:
        """Xóa bản ghi điểm"""
        return self.delete("id", str(grade_id))
    
    def get_grades_by_subject(self, subject_name: str) -> List[Dict[str, Any]]:
        """Lấy điểm theo tên môn học"""
        return self.filter_by("TenHocPhan", subject_name)
    
    def get_grades_by_semester(self, semester: str) -> List[Dict[str, Any]]:
        """Lấy điểm theo học kỳ"""
        return self.filter_by("HocKy", semester)
    
    def get_grades_by_student_and_semester(self, student_id: str, semester: str) -> List[Dict[str, Any]]:
        """Lấy điểm của sinh viên theo học kỳ"""
        try:
            response = self.client.table(self.table_name).select("*").eq("StudentID", student_id).eq("HocKy", semester).execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Lỗi khi lấy điểm: {e}")
            return []
    
    def delete_all_grades(self) -> bool:
        """Xóa tất cả điểm (cẩn thận!)"""
        try:
            self.client.table(self.table_name).delete().neq("id", 0).execute()
            print(f"✅ Đã xóa tất cả điểm")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi xóa: {e}")
            return False
    
    def get_average_gpa(self, student_id: str) -> Optional[float]:
        """Lấy điểm trung bình của sinh viên"""
        try:
            grades = self.get_grades_by_student(student_id)
            if not grades:
                return None
            
            total_diem = sum([g.get("DiemT10", 0) for g in grades])
            avg = total_diem / len(grades)
            return round(avg, 2)
        except Exception as e:
            print(f"❌ Lỗi khi tính GPA: {e}")
            return None

# Singleton instance
diem_repo = DiemRepository()
