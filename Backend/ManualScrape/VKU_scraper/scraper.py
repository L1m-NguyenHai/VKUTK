"""
VKU Scraper Manager - Quản lý scrape + insert Supabase
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional, Any

# Add paths
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))
sys.path.insert(0, str(backend_path / "Supabase"))
sys.path.insert(0, str(backend_path / "ManualScrape" / "VKU_scraper"))

from vku_scraper import (
    scrape_vku_data,
    validate_student_info,
    validate_grades
)
from Supabase import sinh_vien_repo, diem_repo


class VKUScraperManager:
    """
    Manager class để scrape dữ liệu VKU và lưu vào Supabase
    """
    
    def __init__(self, headless: bool = False, session_file: str = "session.json"):
        self.headless = headless
        self.session_file = session_file
        self.last_scraped_data = None
    
    def scrape_and_sync(self) -> Dict[str, Any]:
        """
        Scrape dữ liệu từ VKU và đồng bộ vào Supabase
        
        Returns:
            {
                "success": True/False,
                "message": "...",
                "data": {
                    "student_info": {...},
                    "grades_inserted": 0,
                    "grades_failed": 0
                }
            }
        """
        result = {
            "success": False,
            "message": "",
            "data": {
                "student_info": {},
                "grades_inserted": 0,
                "grades_failed": 0
            }
        }
        
        try:
            # Step 1: Scrape dữ liệu
            print("\n" + "=" * 60)
            print("📡 BƯỚC 1: Scrape dữ liệu từ VKU")
            print("=" * 60)
            
            scraped_data = scrape_vku_data(
                headless=self.headless,
                session_file=self.session_file
            )
            
            if not scraped_data.get("success"):
                result["message"] = "❌ Lỗi khi scrape dữ liệu"
                return result
            
            self.last_scraped_data = scraped_data
            
            student_info = scraped_data.get("student_info", {})
            grades = scraped_data.get("grades", [])
            
            # Step 2: Validate dữ liệu
            print("\n" + "=" * 60)
            print("✓ BƯỚC 2: Kiểm tra dữ liệu")
            print("=" * 60)
            
            if not validate_student_info(student_info):
                result["message"] = "❌ Thông tin sinh viên không hợp lệ"
                return result
            
            if not validate_grades(grades):
                result["message"] = "❌ Dữ liệu điểm không hợp lệ"
                return result
            
            # Step 3: Insert sinh viên
            print("\n" + "=" * 60)
            print("💾 BƯỚC 3: Lưu thông tin sinh viên")
            print("=" * 60)
            
            student_result = self._insert_student(student_info)
            if not student_result:
                result["message"] = "❌ Lỗi khi lưu sinh viên"
                return result
            
            result["data"]["student_info"] = student_info
            
            # Step 4: Insert điểm
            print("\n" + "=" * 60)
            print("💾 BƯỚC 4: Lưu dữ liệu điểm")
            print("=" * 60)
            
            student_id = student_info.get("StudentID")
            grades_result = self._insert_grades(student_id, grades)
            result["data"]["grades_inserted"] = grades_result.get("inserted", 0)
            result["data"]["grades_failed"] = grades_result.get("failed", 0)
            
            # Final result
            result["success"] = True
            result["message"] = "✅ Đồng bộ dữ liệu thành công!"
            
            print("\n" + "=" * 60)
            print("🎉 ĐỒNG BỘ THÀNH CÔNG!")
            print(f"  - StudentID: {student_id}")
            print(f"  - Grades: {result['data']['grades_inserted']}/{len(grades)} inserted")
            print("=" * 60)
            
            return result
            
        except Exception as e:
            print(f"\n❌ Lỗi: {e}")
            result["message"] = f"❌ Lỗi: {str(e)}"
            return result
    
    def _insert_student(self, student_info: Dict[str, str]) -> bool:
        """Insert sinh viên vào Supabase"""
        try:
            student_id = student_info.get("StudentID")
            
            # Kiểm tra nếu SV đã tồn tại
            existing = sinh_vien_repo.get_student_by_id(student_id)
            
            if existing:
                print(f"⚠️ SV {student_id} đã tồn tại, cập nhật...")
                result = sinh_vien_repo.update_student(student_id, student_info)
                if result:
                    print(f"✅ Cập nhật SV thành công: {student_id}")
                    return True
                else:
                    print(f"❌ Lỗi cập nhật SV")
                    return False
            else:
                print(f"➕ Thêm SV mới: {student_id}")
                result = sinh_vien_repo.create_student(student_info)
                if result:
                    print(f"✅ Thêm SV thành công: {student_id}")
                    return True
                else:
                    print(f"❌ Lỗi thêm SV")
                    return False
                    
        except Exception as e:
            print(f"❌ Lỗi khi insert SV: {e}")
            return False
    
    def _insert_grades(self, student_id: str, grades: List[Dict[str, Any]]) -> Dict[str, int]:
        """Insert điểm vào Supabase"""
        result = {"inserted": 0, "failed": 0}
        
        try:
            # Thêm StudentID vào mỗi bản ghi
            grades_data = []
            for grade in grades:
                grade_copy = grade.copy()
                grade_copy["StudentID"] = student_id
                grades_data.append(grade_copy)
            
            # Insert batch
            inserted = diem_repo.bulk_insert_grades(grades_data)
            result["inserted"] = len(inserted)
            result["failed"] = len(grades_data) - len(inserted)
            
            if result["inserted"] > 0:
                print(f"✅ Insert {result['inserted']} điểm thành công")
            if result["failed"] > 0:
                print(f"⚠️ {result['failed']} điểm lỗi")
            
            return result
            
        except Exception as e:
            print(f"❌ Lỗi khi insert điểm: {e}")
            result["failed"] = len(grades)
            return result
    
    def get_student_from_db(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin SV từ DB"""
        try:
            return sinh_vien_repo.get_student_by_id(student_id)
        except Exception as e:
            print(f"❌ Lỗi: {e}")
            return None
    
    def get_grades_from_db(self, student_id: str) -> List[Dict[str, Any]]:
        """Lấy điểm của SV từ DB"""
        try:
            return diem_repo.get_grades_by_student(student_id)
        except Exception as e:
            print(f"❌ Lỗi: {e}")
            return []
    
    def get_all_students(self) -> List[Dict[str, Any]]:
        """Lấy tất cả SV từ DB"""
        try:
            return sinh_vien_repo.get_all_students()
        except Exception as e:
            print(f"❌ Lỗi: {e}")
            return []
    
    def get_last_scraped_data(self) -> Optional[Dict[str, Any]]:
        """Lấy dữ liệu scrape gần nhất"""
        return self.last_scraped_data


# Singleton instance
vku_scraper_manager = VKUScraperManager()


# Test function
if __name__ == "__main__":
    manager = VKUScraperManager(headless=False)
    result = manager.scrape_and_sync()
    print(f"\nResult: {result}")
