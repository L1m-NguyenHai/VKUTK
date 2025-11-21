from typing import List, Dict, Optional, Any
from .base import BaseRepository

class DanhSachLopHPRepository(BaseRepository):
    """Repository cho bảng DanhSachLopHP (Danh sách lớp học phần)"""
    
    def __init__(self):
        super().__init__("DanhSachLopHP")
    
    def get_all_classes(self) -> List[Dict[str, Any]]:
        """Lấy tất cả lớp học phần"""
        return self.select_all()
    
    def get_class_by_id(self, class_id: int) -> Optional[Dict[str, Any]]:
        """Lấy thông tin lớp học phần theo ID"""
        return self.select_by_id("id", class_id)
    
    def get_classes_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """Lấy tất cả lớp học phần của một user"""
        return self.filter_by("user_id", user_id)
    
    def get_classes_by_semester(self, hoc_ky: str, user_id: str = None) -> List[Dict[str, Any]]:
        """Lấy lớp học phần theo học kỳ"""
        if user_id:
            try:
                response = self.client.table(self.table_name).select("*").eq("HocKy", hoc_ky).eq("user_id", user_id).execute()
                return response.data if response.data else []
            except Exception as e:
                print(f"❌ Error: {e}")
                return []
        return self.filter_by("HocKy", hoc_ky)
    
    def create_class(self, class_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Tạo mới lớp học phần
        
        Args:
            class_data: {
                "HocKy": "...",
                "NamHoc": "...",
                "TenLopHocPhan": "...",
                "GiangVien": "...",
                "ThoiKhoaBieu": "...",
                "PhongHoc": "...",
                "TuanHoc": "...",
                "SiSo": int,
                "user_id": "..."
            }
        """
        return self.insert_one(class_data)
    
    def bulk_insert_classes(self, classes_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Thêm nhiều lớp học phần một lúc"""
        return self.insert_many(classes_list)
    
    def update_class(self, class_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cập nhật thông tin lớp học phần"""
        return self.update("id", class_id, update_data)
    
    def delete_class(self, class_id: int) -> bool:
        """Xóa lớp học phần"""
        return self.delete("id", class_id)
    
    def search_class_by_name(self, name: str, user_id: str = None) -> List[Dict[str, Any]]:
        """Tìm kiếm lớp học phần theo tên"""
        if user_id:
            try:
                response = self.client.table(self.table_name).select("*").ilike("TenLopHocPhan", f"%{name}%").eq("user_id", user_id).execute()
                return response.data if response.data else []
            except Exception as e:
                print(f"❌ Error: {e}")
                return []
        return self.search("TenLopHocPhan", name)
    
    def get_classes_by_teacher(self, teacher_name: str, user_id: str = None) -> List[Dict[str, Any]]:
        """Lấy lớp học phần theo giảng viên"""
        if user_id:
            try:
                response = self.client.table(self.table_name).select("*").ilike("GiangVien", f"%{teacher_name}%").eq("user_id", user_id).execute()
                return response.data if response.data else []
            except Exception as e:
                print(f"❌ Error: {e}")
                return []
        return self.search("GiangVien", teacher_name)

# Singleton instance
danh_sach_lop_hp_repo = DanhSachLopHPRepository()
