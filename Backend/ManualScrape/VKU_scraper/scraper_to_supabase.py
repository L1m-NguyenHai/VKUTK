"""
VKU Scraper to Supabase
Lấy dữ liệu từ VKU và lưu trực tiếp vào Supabase
"""

from playwright.sync_api import sync_playwright
import json
import os
import time
import sys
from pathlib import Path

# Add Supabase path
sys.path.append(str(Path(__file__).parent.parent.parent / "Supabase"))

from Supabase import sinh_vien_repo, diem_repo

# ---------- Cấu hình ----------
session_file = "session.json"
profile_url = "https://daotao.vku.udn.vn/sv/hoso"
diem_url = "https://daotao.vku.udn.vn/sv/diem"

# ---------- Session ----------
def save_session(context):
    """Lưu session cookies"""
    cookies = context.cookies()
    with open(session_file, "w", encoding="utf-8") as f:
        json.dump(cookies, f, ensure_ascii=False, indent=2)
    print("✅ Session saved to", session_file)

def load_session(context):
    """Load session cookies"""
    if os.path.exists(session_file):
        with open(session_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        cookies = data["cookies"] if isinstance(data, dict) and "cookies" in data else data
        context.add_cookies(cookies)
        print("✅ Session loaded from", session_file)
        return True
    return False

# ---------- Crawl Thông tin cá nhân ----------
def crawl_thong_tin(page):
    """Lấy thông tin cá nhân sinh viên"""
    info = {}
    try:
        info["ho_va_ten"] = page.query_selector("div.profile-usertitle-name").inner_text().strip()
        info["StudentID"] = page.query_selector("div.profile-usertitle-job").inner_text().replace("MÃ SV:", "").strip()
        info["lop"] = page.query_selector("div.profile-usertitle-job + div").inner_text().replace("LỚP:", "").strip()
        info["khoa_hoc"] = page.query_selector("div.profile-usertitle-job + div + div").inner_text().replace("KHÓA:", "").strip()
        info["chuyen_nganh"] = page.query_selector("div.profile-usertitle-job + div + div + div").inner_text().strip()
        info["khoa"] = page.query_selector("div.profile-usertitle-job + div + div + div + div").inner_text().strip()
        print(f"✅ Lấy thông tin SV: {info['StudentID']} - {info['ho_va_ten']}")
    except Exception as e:
        print(f"❌ Lỗi khi lấy thông tin: {e}")
    return info

# ---------- Crawl Điểm ----------
def crawl_diem(page):
    """Lấy danh sách điểm"""
    print("🔍 Đang trích xuất dữ liệu điểm...")
    rows = page.locator("table tr.even.pointer")
    data = []
    hoc_ky = ""

    for i in range(rows.count()):
        row = rows.nth(i)
        cols = row.locator("td")
        if cols.count() >= 10:
            try:
                ten_hp = cols.nth(1).inner_text().strip()
                if "Học kỳ" in ten_hp:
                    hoc_ky = ten_hp
                    continue

                so_tc = cols.nth(2).inner_text().strip()
                diem_t10 = cols.nth(8).inner_text().strip()

                # Quy đổi nếu là Học kỳ riêng
                if "Học kỳ riêng - Quy đổi" in hoc_ky:
                    diem_t10 = "10"

                # Nếu rỗng thì ghi "chưa có"
                if not diem_t10:
                    diem_t10 = "chưa có"

                data.append({
                    "TenHocPhan": ten_hp,
                    "SoTC": int(so_tc) if so_tc.isdigit() else 0,
                    "DiemT10": float(diem_t10) if diem_t10 not in ["chưa có", ""] else None,
                    "HocKy": hoc_ky
                })
            except Exception as e:
                print(f"⚠️ Lỗi khi đọc dòng: {e}")

    print(f"✅ Đã lấy {len(data)} môn học.")
    return data

# ---------- Insert to Supabase ----------
def insert_student_to_supabase(student_info):
    """Insert sinh viên vào Supabase"""
    try:
        # Kiểm tra nếu SV đã tồn tại
        existing = sinh_vien_repo.get_student_by_id(student_info["StudentID"])
        if existing:
            print(f"⚠️ SV {student_info['StudentID']} đã tồn tại, cập nhật...")
            result = sinh_vien_repo.update_student(student_info["StudentID"], student_info)
        else:
            print(f"➕ Thêm SV mới: {student_info['StudentID']}")
            result = sinh_vien_repo.create_student(student_info)
        
        return result is not None
    except Exception as e:
        print(f"❌ Lỗi khi insert SV: {e}")
        return False

def insert_grades_to_supabase(student_id: str, grades: list):
    """Insert điểm vào Supabase"""
    try:
        # Thêm StudentID vào mỗi bản ghi
        grades_data = []
        for grade in grades:
            grade["StudentID"] = student_id
            grades_data.append(grade)
        
        result = diem_repo.bulk_insert_grades(grades_data)
        print(f"✅ Đã insert {len(result)} môn học vào Supabase")
        return len(result) > 0
    except Exception as e:
        print(f"❌ Lỗi khi insert điểm: {e}")
        return False

# ---------- Main ----------
def main():
    """Main function"""
    print("=" * 60)
    print("🚀 VKU SCRAPER TO SUPABASE")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # headless=False để nhìn được
        context = browser.new_context()

        # Load hoặc tạo session mới
        if not load_session(context):
            page = context.new_page()
            page.goto(profile_url)
            print("\n⚠️ Hãy đăng nhập bằng Google...")
            print("👉 Sau khi đăng nhập thành công, nhấn Enter để tiếp tục...")
            input()
            save_session(context)
        
        # Crawl thông tin cá nhân
        print("\n📋 Đang lấy thông tin cá nhân...")
        page = context.new_page()
        page.goto(profile_url)
        page.wait_for_selector("div.profile-usertitle", timeout=20000)
        time.sleep(2)
        student_info = crawl_thong_tin(page)
        
        if not student_info:
            print("❌ Không lấy được thông tin sinh viên!")
            browser.close()
            return
        
        # Insert thông tin SV vào Supabase
        print("\n💾 Lưu thông tin sinh viên vào Supabase...")
        if insert_student_to_supabase(student_info):
            print("✅ Sinh viên đã được lưu thành công!")
        else:
            print("❌ Lỗi khi lưu sinh viên!")
        
        # Crawl điểm
        print("\n📊 Đang lấy dữ liệu điểm...")
        page.goto(diem_url)
        page.wait_for_selector("table", timeout=20000)
        time.sleep(3)
        grades = crawl_diem(page)
        
        if not grades:
            print("⚠️ Không lấy được điểm!")
            browser.close()
            return
        
        # Insert điểm vào Supabase
        print("\n💾 Lưu điểm vào Supabase...")
        if insert_grades_to_supabase(student_info["StudentID"], grades):
            print("✅ Điểm đã được lưu thành công!")
        else:
            print("❌ Lỗi khi lưu điểm!")
        
        print("\n" + "=" * 60)
        print("✅ SCRAPE HOÀN TẤT!")
        print("=" * 60)
        
        browser.close()

if __name__ == "__main__":
    main()
