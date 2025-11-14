"""
Backward Compatibility Module
File này giữ cho code cũ có thể chạy
"""

from .client import supabase_client
from .SinhVien import sinh_vien_repo
from .Diem import diem_repo
from .TienDoHocTap import tien_do_hoc_tap_repo

class SupabaseDB:
    """Backward compatible class - dùng repository thực tế"""
    
    def __init__(self):
        self.client = supabase_client.get_client()
        self.sinh_vien = sinh_vien_repo
        self.diem = diem_repo
        self.tien_do = tien_do_hoc_tap_repo
    
    # ==================== SINH VIEN ====================
    
    def get_all_students(self):
        return self.sinh_vien.get_all_students()
    
    def get_student_by_id(self, student_id: str):
        return self.sinh_vien.get_student_by_id(student_id)
    
    def create_student(self, student_data):
        return self.sinh_vien.create_student(student_data)
    
    def update_student(self, student_id: str, update_data):
        return self.sinh_vien.update_student(student_id, update_data)
    
    def delete_student(self, student_id: str):
        return self.sinh_vien.delete_student(student_id)
    
    def search_student_by_name(self, name: str):
        return self.sinh_vien.search_student_by_name(name)
    
    def get_students_by_class(self, lop: str):
        return self.sinh_vien.get_students_by_class(lop)
    
    def get_students_by_major(self, major: str):
        return self.sinh_vien.get_students_by_major(major)
    
    def get_students_by_faculty(self, khoa: str):
        return self.sinh_vien.get_students_by_faculty(khoa)
    
    def bulk_insert_students(self, students_list):
        return self.sinh_vien.bulk_insert_students(students_list)
    
    def student_exists(self, student_id: str):
        return self.sinh_vien.student_exists(student_id)
    
    def get_total_students_count(self):
        return self.sinh_vien.get_total_students_count()
    
    def get_distinct_faculties(self):
        return self.sinh_vien.get_distinct_faculties()
    
    def get_distinct_majors(self):
        return self.sinh_vien.get_distinct_majors()
    
    # ==================== DIEM ====================
    
    def get_grades_by_student(self, student_id: str):
        return self.diem.get_grades_by_student(student_id)
    
    def create_grade(self, grade_data):
        return self.diem.create_grade(grade_data)
    
    def bulk_insert_grades(self, grades_list):
        return self.diem.bulk_insert_grades(grades_list)
    
    def insert_grades_batch(self, grades_data):
        return self.diem.bulk_insert_grades(grades_data)
    
    def upsert_grades_batch(self, grades_data):
        """Upsert nhiều môn học"""
        try:
            response = self.client.table("Diem").upsert(grades_data).execute()
            print(f"✅ Đã upsert {len(grades_data)} môn học vào Supabase")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi upsert vào Supabase: {e}")
            return False
    
    def delete_all_grades(self):
        return self.diem.delete_all_grades()
    
    # ==================== TIEN DO HOC TAP ====================
    
    def get_academic_progress(self, student_id: str):
        return self.tien_do.get_academic_progress(student_id)
    
    def create_academic_progress(self, progress_data):
        return self.tien_do.create_academic_progress(progress_data)
    
    def bulk_insert_academic_progress(self, progress_list):
        return self.tien_do.bulk_insert_academic_progress(progress_list)

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