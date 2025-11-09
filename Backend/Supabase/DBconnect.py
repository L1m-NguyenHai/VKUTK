import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, List, Dict, Any

load_dotenv()

class SupabaseDB:
    """Supabase Database Manager"""
    
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("❌ SUPABASE_URL và SUPABASE_KEY phải được set trong .env")
        
        self.client: Client = create_client(self.url, self.key)
        print(f"✅ Supabase client initialized: {self.url}")
    
    def get_all_students(self) -> List[Dict[str, Any]]:
        """Lấy tất cả sinh viên"""
        response = self.client.table("SinhVien").select("*").execute()
        return response.data
    
    def get_student_by_id(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin sinh viên theo ID"""
        response = (
            self.client.table("SinhVien")
            .select("*")
            .eq("id", student_id)
            .execute()
        )
        return response.data[0] if response.data else None
    
    def insert_grades_batch(self, grades_data: List[Dict[str, Any]]) -> bool:
        """
        Insert nhiều môn học cùng lúc
        
        Args:
            grades_data: List of dicts with keys: ten_hoc_phan, so_tc, diem_t10, hoc_ky, student_id
        
        Returns:
            True if success, False otherwise
        """
        try:
            response = self.client.table("hoc_phan").insert(grades_data).execute()
            print(f"✅ Đã insert {len(grades_data)} môn học vào Supabase")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi insert vào Supabase: {e}")
            return False
    
    def upsert_grades_batch(self, grades_data: List[Dict[str, Any]]) -> bool:
        """
        Upsert nhiều môn học (insert hoặc update nếu đã tồn tại)
        
        Args:
            grades_data: List of dicts with keys: ten_hoc_phan, so_tc, diem_t10, hoc_ky, student_id
        
        Returns:
            True if success, False otherwise
        """
        try:
            response = self.client.table("hoc_phan").upsert(grades_data).execute()
            print(f"✅ Đã upsert {len(grades_data)} môn học vào Supabase")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi upsert vào Supabase: {e}")
            return False
    
    def get_grades_by_student(self, student_id: str) -> List[Dict[str, Any]]:
        """Lấy điểm số của sinh viên"""
        response = (
            self.client.table("hoc_phan")
            .select("*")
            .eq("student_id", student_id)
            .order("hoc_ky", desc=True)
            .execute()
        )
        return response.data
    
    def delete_all_grades(self) -> bool:
        """Xóa tất cả điểm (cẩn thận!)"""
        try:
            # Supabase không support DELETE *, phải dùng RPC hoặc xóa theo điều kiện
            response = self.client.table("hoc_phan").delete().neq("id", 0).execute()
            print(f"✅ Đã xóa tất cả điểm")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi xóa: {e}")
            return False

# Singleton instance
supabase_db = SupabaseDB()

# Test connection
if __name__ == "__main__":
    try:
        students = supabase_db.get_all_students()
        print(f"📊 Số lượng sinh viên: {len(students)}")
        print(f"📝 Dữ liệu mẫu: {students[:2] if students else 'Không có dữ liệu'}")
    except Exception as e:
        print(f"❌ Lỗi: {e}")