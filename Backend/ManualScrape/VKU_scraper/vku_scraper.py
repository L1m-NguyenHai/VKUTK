"""
VKU Scraper Module - Pure Functions
Chứa tất cả logic scrape, không có dependency vào main
"""

from playwright.sync_api import sync_playwright, Page, BrowserContext
import json
import os
import time
from typing import Dict, List, Optional, Any

# ---------- Session Management ----------

def save_session(context: BrowserContext, session_file: str = "session.json") -> None:
    """Lưu session cookies vào file"""
    try:
        cookies = context.cookies()
        with open(session_file, "w", encoding="utf-8") as f:
            json.dump(cookies, f, ensure_ascii=False, indent=2)
        print(f"✅ Session saved to {session_file}")
    except Exception as e:
        print(f"❌ Lỗi khi lưu session: {e}")

def load_session(context: BrowserContext, session_file: str = "session.json") -> bool:
    """Load session cookies từ file"""
    try:
        if not os.path.exists(session_file):
            print(f"⚠️ Session file không tồn tại: {session_file}")
            return False
        
        with open(session_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Handle cả 2 format: direct array hoặc object với "cookies" key
        cookies = data["cookies"] if isinstance(data, dict) and "cookies" in data else data
        context.add_cookies(cookies)
        print(f"✅ Session loaded from {session_file}")
        return True
    except Exception as e:
        print(f"❌ Lỗi khi load session: {e}")
        return False

# ---------- Login & Auth ----------

def login_with_browser(profile_url: str = "https://daotao.vku.udn.vn/sv/hoso") -> None:
    """Mở browser để user đăng nhập Google"""
    print("\n🔐 Vui lòng đăng nhập bằng Google...")
    print("👉 Sau khi đăng nhập thành công, nhấn Enter để tiếp tục...")
    input()

# ---------- Crawl Thông tin cá nhân ----------

def crawl_student_info(page: Page) -> Dict[str, str]:
    """
    Lấy thông tin cá nhân sinh viên từ profile page
    
    Returns:
        {
            "StudentID": "...",
            "ho_va_ten": "...",
            "lop": "...",
            "khoa_hoc": "...",
            "chuyen_nganh": "...",
            "khoa": "..."
        }
    """
    info = {}
    try:
        # Wait for page load
        page.wait_for_selector("div.profile-usertitle", timeout=20000)
        time.sleep(2)
        
        # Extract info
        info["ho_va_ten"] = page.query_selector("div.profile-usertitle-name").inner_text().strip()
        info["StudentID"] = page.query_selector("div.profile-usertitle-job").inner_text().replace("MÃ SV:", "").strip()
        info["lop"] = page.query_selector("div.profile-usertitle-job + div").inner_text().replace("LỚP:", "").strip()
        info["khoa_hoc"] = page.query_selector("div.profile-usertitle-job + div + div").inner_text().replace("KHÓA:", "").strip()
        info["chuyen_nganh"] = page.query_selector("div.profile-usertitle-job + div + div + div").inner_text().strip()
        info["khoa"] = page.query_selector("div.profile-usertitle-job + div + div + div + div").inner_text().strip()
        
        print(f"✅ Lấy thông tin SV: {info['StudentID']} - {info['ho_va_ten']}")
        return info
    except Exception as e:
        print(f"❌ Lỗi khi lấy thông tin: {e}")
        return {}

# ---------- Crawl Điểm ----------

def crawl_student_grades(page: Page) -> List[Dict[str, Any]]:
    """
    Lấy danh sách điểm từ trang điểm
    
    Returns:
        [
            {
                "TenHocPhan": "...",
                "SoTC": 3,
                "DiemT10": 8.5,
                "HocKy": "Học kỳ 1"
            },
            ...
        ]
    """
    print("🔍 Đang trích xuất dữ liệu điểm...")
    
    try:
        page.wait_for_selector("table", timeout=20000)
        time.sleep(3)
        
        rows = page.locator("table tr.even.pointer")
        data = []
        hoc_ky = ""
        
        for i in range(rows.count()):
            row = rows.nth(i)
            cols = row.locator("td")
            
            if cols.count() >= 10:
                try:
                    ten_hp = cols.nth(1).inner_text().strip()
                    
                    # Nếu là dòng học kỳ, cập nhật hoc_ky
                    if "Học kỳ" in ten_hp:
                        hoc_ky = ten_hp
                        continue
                    
                    so_tc_str = cols.nth(2).inner_text().strip()
                    diem_t10_str = cols.nth(8).inner_text().strip()
                    
                    # Parse số TC
                    try:
                        so_tc = int(so_tc_str) if so_tc_str.isdigit() else 0
                    except:
                        so_tc = 0
                    
                    # Parse điểm T10
                    try:
                        if diem_t10_str and diem_t10_str != "chưa có" and diem_t10_str != "":
                            diem_t10 = float(diem_t10_str)
                        else:
                            diem_t10 = None
                    except:
                        diem_t10 = None
                    
                    # Quy đổi nếu là Học kỳ riêng
                    if "Học kỳ riêng - Quy đổi" in hoc_ky and diem_t10 is None:
                        diem_t10 = 10.0
                    
                    data.append({
                        "TenHocPhan": ten_hp,
                        "SoTC": so_tc,
                        "DiemT10": diem_t10,
                        "HocKy": hoc_ky
                    })
                except Exception as e:
                    print(f"⚠️ Lỗi khi đọc dòng {i}: {e}")
        
        print(f"✅ Đã lấy {len(data)} môn học.")
        return data
    except Exception as e:
        print(f"❌ Lỗi khi lấy điểm: {e}")
        return []

# ---------- Crawl Điểm Tổng kết ----------

def crawl_grades_summary(page: Page) -> List[Dict[str, Any]]:
    """
    Lấy bảng tổng kết điểm theo học kỳ (future use)
    
    Returns:
        [
            {
                "HocKy": "Học kỳ 1",
                "DiemT4": 3.5,
                "DiemT10": 8.75,
                "XepLoai": "Giỏi",
                "SoTC": 20
            },
            ...
        ]
    """
    print("🔍 Đang trích xuất dữ liệu tổng kết...")
    
    try:
        page.wait_for_selector("table", timeout=20000)
        time.sleep(3)
        
        rows = page.locator("table tr.even.pointer")
        data = []
        
        for i in range(rows.count()):
            row = rows.nth(i)
            cols = row.locator("td")
            
            if cols.count() >= 12:
                try:
                    hoc_ky = cols.nth(1).inner_text().strip()
                    
                    # Skip nếu không phải dòng học kỳ
                    if not hoc_ky.startswith("Học kỳ"):
                        continue
                    
                    diem_4 = cols.nth(4).inner_text().strip()
                    diem_10 = cols.nth(5).inner_text().strip()
                    xep_loai = cols.nth(8).inner_text().strip()
                    tc_tich_luy = cols.nth(11).inner_text().strip()
                    
                    data.append({
                        "HocKy": hoc_ky,
                        "DiemT4": float(diem_4) if diem_4 else None,
                        "DiemT10": float(diem_10) if diem_10 else None,
                        "XepLoai": xep_loai,
                        "SoTC": int(tc_tich_luy) if tc_tich_luy.isdigit() else 0
                    })
                except Exception as e:
                    print(f"⚠️ Lỗi khi đọc dòng {i}: {e}")
        
        print(f"✅ Đã lấy {len(data)} học kỳ tổng kết.")
        return data
    except Exception as e:
        print(f"❌ Lỗi khi lấy tổng kết: {e}")
        return []

# ---------- Main Scraper Function ----------

def scrape_vku_data(
    headless: bool = False,
    session_file: str = "session.json"
) -> Optional[Dict[str, Any]]:
    """
    Main function - Scrape tất cả dữ liệu từ VKU
    
    Args:
        headless: Nếu True, chạy ẩn browser
        session_file: Path đến file session
    
    Returns:
        {
            "student_info": {...},
            "grades": [...],
            "summary": [...],
            "success": True
        }
    """
    print("=" * 60)
    print("🚀 VKU SCRAPER - LẤY DỮ LIỆU")
    print("=" * 60)
    
    profile_url = "https://daotao.vku.udn.vn/sv/hoso"
    diem_url = "https://daotao.vku.udn.vn/sv/diem"
    
    result = {
        "student_info": {},
        "grades": [],
        "summary": [],
        "success": False
    }
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context()
            
            # Load hoặc tạo session mới
            if not load_session(context, session_file):
                print("\n⚠️ Session mới - Yêu cầu đăng nhập")
                page = context.new_page()
                page.goto(profile_url)
                login_with_browser(profile_url)
                save_session(context, session_file)
            
            # Crawl thông tin cá nhân
            print("\n📋 Đang lấy thông tin cá nhân...")
            page = context.new_page()
            page.goto(profile_url)
            student_info = crawl_student_info(page)
            
            if not student_info:
                print("❌ Không lấy được thông tin sinh viên!")
                browser.close()
                return result
            
            result["student_info"] = student_info
            
            # Crawl điểm
            print("\n📊 Đang lấy dữ liệu điểm...")
            page.goto(diem_url)
            grades = crawl_student_grades(page)
            result["grades"] = grades
            
            # Crawl tổng kết
            print("\n📈 Đang lấy dữ liệu tổng kết...")
            summary = crawl_grades_summary(page)
            result["summary"] = summary
            
            result["success"] = True
            
            print("\n" + "=" * 60)
            print("✅ SCRAPE THÀNH CÔNG!")
            print(f"  - Student: {student_info.get('StudentID')}")
            print(f"  - Grades: {len(grades)} môn")
            print(f"  - Summary: {len(summary)} học kỳ")
            print("=" * 60)
            
            browser.close()
            
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
    
    return result

# ---------- Utility Functions ----------

def validate_student_info(info: Dict[str, str]) -> bool:
    """Kiểm tra thông tin sinh viên hợp lệ"""
    required_fields = ["StudentID", "ho_va_ten", "lop", "khoa"]
    for field in required_fields:
        if not info.get(field):
            print(f"❌ Thiếu field: {field}")
            return False
    return True

def validate_grades(grades: List[Dict[str, Any]]) -> bool:
    """Kiểm tra dữ liệu điểm hợp lệ"""
    if not grades:
        print("⚠️ Không có dữ liệu điểm")
        return False
    
    for grade in grades:
        if not grade.get("TenHocPhan") or not grade.get("HocKy"):
            print(f"❌ Dữ liệu điểm không hợp lệ: {grade}")
            return False
    
    return True
