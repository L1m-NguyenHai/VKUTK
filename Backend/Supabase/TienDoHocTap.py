from typing import List, Dict, Optional, Any
from base import BaseRepository

class TienDoHocTapRepository(BaseRepository):
    """Repository cho bảng TienDoHocTap"""
    
    def __init__(self):
        super().__init__("TienDoHocTap")
    
    def get_academic_progress(self, student_id: str) -> List[Dict[str, Any]]:
        """Lấy tiến độ học tập của sinh viên"""
        return self.filter_by("StudentID", student_id)
    
    def create_academic_progress(self, progress_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Tạo mới bản ghi tiến độ học tập
        
        Args:
            progress_data: {
                "StudentID": "...",
                "TenHocPhan": "...",
                "HocKy": ...,
                "BatBuoc": bool,
                "DiemT4": "...",
                "DiemChu": "...",
                "SoTC": ...
            }
        """
        return self.insert_one(progress_data)
    
    def bulk_insert_academic_progress(self, progress_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Thêm nhiều bản ghi tiến độ học tập"""
        return self.insert_many(progress_list)
    
    def update_academic_progress(self, progress_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cập nhật bản ghi tiến độ học tập"""
        return self.update("id", str(progress_id), update_data)
    
    def delete_academic_progress(self, progress_id: int) -> bool:
        """Xóa bản ghi tiến độ học tập"""
        return self.delete("id", str(progress_id))
    
    def get_progress_by_subject(self, subject_name: str) -> List[Dict[str, Any]]:
        """Lấy tiến độ theo tên môn học"""
        return self.filter_by("TenHocPhan", subject_name)
    
    def get_progress_by_semester(self, semester: int) -> List[Dict[str, Any]]:
        """Lấy tiến độ theo học kỳ"""
        return self.filter_by("HocKy", str(semester))
    
    def get_progress_by_student_and_semester(self, student_id: str, semester: int) -> List[Dict[str, Any]]:
        """Lấy tiến độ của sinh viên theo học kỳ"""
        try:
            response = self.client.table(self.table_name).select("*").eq("StudentID", student_id).eq("HocKy", semester).execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Lỗi khi lấy tiến độ: {e}")
            return []
    
    def get_mandatory_courses(self, student_id: str) -> List[Dict[str, Any]]:
        """Lấy các môn học bắt buộc của sinh viên"""
        try:
            response = self.client.table(self.table_name).select("*").eq("StudentID", student_id).eq("BatBuoc", True).execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Lỗi khi lấy các môn bắt buộc: {e}")
            return []
    
    def get_elective_courses(self, student_id: str) -> List[Dict[str, Any]]:
        """Lấy các môn học tự chọn của sinh viên"""
        try:
            response = self.client.table(self.table_name).select("*").eq("StudentID", student_id).eq("BatBuoc", False).execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Lỗi khi lấy các môn tự chọn: {e}")
            return []
    
    def get_total_credits(self, student_id: str) -> int:
        """Lấy tổng số tín chỉ của sinh viên"""
        try:
            progress = self.get_academic_progress(student_id)
            total = sum([p.get("SoTC", 0) for p in progress if p.get("SoTC")])
            return total
        except Exception as e:
            print(f"❌ Lỗi khi tính tổng tín chỉ: {e}")
            return 0
    
    def get_completed_credits(self, student_id: str) -> int:
        """Lấy tổng số tín chỉ đã hoàn thành (DiemChu != 'F')"""
        try:
            progress = self.get_academic_progress(student_id)
            completed = sum([p.get("SoTC", 0) for p in progress if p.get("DiemChu") != "F"])
            return completed
        except Exception as e:
            print(f"❌ Lỗi khi tính tín chỉ hoàn thành: {e}")
            return 0

# Singleton instance
tien_do_hoc_tap_repo = TienDoHocTapRepository()
