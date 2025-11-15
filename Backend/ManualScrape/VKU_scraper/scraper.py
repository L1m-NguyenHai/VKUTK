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
from Supabase import sinh_vien_repo, diem_repo, tien_do_hoc_tap_repo


class VKUScraperManager:
    """
    Manager class để scrape dữ liệu VKU và lưu vào Supabase
    """
    
    def __init__(self, session_path: str = None, headless: bool = True, user_id: str = None):
        """
        Args:
            session_path: Đường dẫn đến file session.json (nếu có thì sử dụng, nếu không thì đăng nhập mới)
            headless: Có ẩn browser không (default True)
            user_id: UUID của user (từ Supabase Auth) - để link data với user
        """
        self.session_path = session_path
        self.headless = headless
        self.user_id = user_id
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
                    "grades_failed": 0,
                    "tien_do_inserted": 0,
                    "tien_do_failed": 0
                }
            }
        """
        result = {
            "success": False,
            "message": "",
            "data": {
                "student_info": {},
                "grades_inserted": 0,
                "grades_failed": 0,
                "tien_do_inserted": 0,
                "tien_do_failed": 0
            },
            "error": None
        }
        
        try:
            # Step 1: Scrape dữ liệu
            print("\n" + "=" * 60)
            print("📡 BƯỚC 1: Scrape dữ liệu từ VKU")
            print("=" * 60)
            
            scraped_data = scrape_vku_data(
                headless=self.headless,
                session_file=self.session_path
            )
            
            if not scraped_data.get("success"):
                result["message"] = "❌ Lỗi khi scrape dữ liệu"
                result["error"] = scraped_data.get("error")
                return result
            
            self.last_scraped_data = scraped_data
            
            student_info = scraped_data.get("student_info", {})
            grades = scraped_data.get("grades", [])
            tien_do = scraped_data.get("tien_do", [])
            
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
            
            # Step 5: Insert tiến độ học tập
            print("\n" + "=" * 60)
            print("💾 BƯỚC 5: Lưu dữ liệu tiến độ học tập")
            print("=" * 60)
            
            tien_do_result = self._insert_tien_do_hoc_tap(student_id, tien_do)
            result["data"]["tien_do_inserted"] = tien_do_result.get("inserted", 0)
            result["data"]["tien_do_failed"] = tien_do_result.get("failed", 0)
            
            # Final result
            result["success"] = True
            result["message"] = "✅ Đồng bộ dữ liệu thành công!"
            
            print("\n" + "=" * 60)
            print("🎉 ĐỒNG BỘ THÀNH CÔNG!")
            print(f"  - StudentID: {student_id}")
            print(f"  - Grades: {result['data']['grades_inserted']}/{len(grades)} inserted")
            print(f"  - TienDo: {result['data']['tien_do_inserted']}/{len(tien_do)} inserted")
            print("=" * 60)
            
            return result
            
        except Exception as e:
            print(f"\n❌ Lỗi: {e}")
            result["message"] = f"❌ Lỗi: {str(e)}"
            return result
    
    def _delete_old_data(self, student_id: str) -> bool:
        """Delete old data for student before re-scraping"""
        try:
            if not self.user_id:
                return True
            
            print(f"🗑️ Xóa dữ liệu cũ của sinh viên {student_id}...")
            
            # Delete old grades (cascade will handle it, but explicit is better)
            # Since we have ON DELETE CASCADE on StudentID, deleting student will auto-delete grades
            # But we can also check if student exists first
            existing = sinh_vien_repo.get_student_by_id_and_user(student_id, self.user_id)
            
            if existing:
                # Delete will cascade to Diem and TienDoHocTap
                success = sinh_vien_repo.delete_student(student_id)
                if success:
                    print(f"✅ Đã xóa dữ liệu cũ")
                    return True
                else:
                    print(f"⚠️ Không thể xóa dữ liệu cũ, sẽ thử cập nhật")
                    return False
            else:
                print(f"ℹ️ Không có dữ liệu cũ")
                return True
                
        except Exception as e:
            print(f"❌ Lỗi khi xóa dữ liệu cũ: {e}")
            return False
    
    def _insert_student(self, student_info: Dict[str, str]) -> bool:
        """Insert sinh viên vào Supabase (với user_id)"""
        try:
            student_id = student_info.get("StudentID")
            
            # Thêm user_id vào student_info
            if self.user_id:
                student_info["user_id"] = self.user_id
            
            # Delete old data first (if re-scraping)
            self._delete_old_data(student_id)
            
            # Insert new student data
            print(f"➕ Thêm dữ liệu mới: {student_id}")
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
        """Insert điểm vào Supabase (với user_id)"""
        result = {"inserted": 0, "failed": 0}
        
        try:
            # Thêm StudentID và user_id vào mỗi bản ghi
            grades_data = []
            for grade in grades:
                grade_copy = grade.copy()
                grade_copy["StudentID"] = student_id
                if self.user_id:
                    grade_copy["user_id"] = self.user_id
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
    
    def _insert_tien_do_hoc_tap(self, student_id: str, tien_do: List[Dict[str, Any]]) -> Dict[str, int]:
        """Insert tiến độ học tập vào Supabase (với user_id)"""
        result = {"inserted": 0, "failed": 0}
        
        try:
            if not tien_do:
                print("⚠️ Không có dữ liệu tiến độ học tập")
                return result
            
            # Thêm StudentID và user_id vào mỗi bản ghi + validate data types
            tien_do_data = []
            for item in tien_do:
                try:
                    item_copy = item.copy()
                    item_copy["StudentID"] = student_id
                    if self.user_id:
                        item_copy["user_id"] = self.user_id
                    
                    # Validate and convert HocKy to int
                    if "HocKy" in item_copy:
                        hoc_ky = item_copy["HocKy"]
                        if isinstance(hoc_ky, str):
                            # Extract number from string
                            import re
                            match = re.search(r'(\d+)', hoc_ky)
                            item_copy["HocKy"] = int(match.group(1)) if match else None
                        elif not isinstance(hoc_ky, int):
                            item_copy["HocKy"] = int(hoc_ky) if hoc_ky else None
                    
                    # Validate and convert SoTC to int
                    if "SoTC" in item_copy:
                        so_tc = item_copy["SoTC"]
                        if isinstance(so_tc, str):
                            import re
                            match = re.search(r'(\d+)', so_tc)
                            item_copy["SoTC"] = int(match.group(1)) if match else 0
                        elif not isinstance(so_tc, int):
                            item_copy["SoTC"] = int(so_tc) if so_tc else 0
                    
                    # Skip if missing required fields
                    if not item_copy.get("HocKy") or not item_copy.get("TenHocPhan"):
                        continue
                        
                    tien_do_data.append(item_copy)
                except Exception as e:
                    print(f"⚠️ Skip invalid record: {e}")
                    continue
            
            # Insert batch
            inserted = tien_do_hoc_tap_repo.bulk_insert_academic_progress(tien_do_data)
            result["inserted"] = len(inserted)
            result["failed"] = len(tien_do_data) - len(inserted)
            
            if result["inserted"] > 0:
                print(f"✅ Insert {result['inserted']} tiến độ thành công")
            if result["failed"] > 0:
                print(f"⚠️ {result['failed']} tiến độ lỗi")
            
            return result
            
        except Exception as e:
            print(f"❌ Lỗi khi insert tiến độ: {e}")
            result["failed"] = len(tien_do)
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
