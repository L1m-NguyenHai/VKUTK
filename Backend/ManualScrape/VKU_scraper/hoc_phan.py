from playwright.sync_api import sync_playwright
import csv
import time
import json
import os
import sys

# Import Supabase DB từ module DBconnect
sys.path.append(os.path.join(os.path.dirname(__file__), '../../Supabase'))
from DBconnect import supabase_db

# ---------- Cấu hình ----------
session_file = "session.json"
target_url = "https://daotao.vku.udn.vn/sv/diem"
CSV_FILE = "ten_hoc_phan.csv"

# ---------- Session ----------
def create_new_session():
    """Tạo session mới bằng cách đăng nhập thủ công"""
    print("\n🔐 KHỞI TẠO SESSION MỚI")
    print("=" * 50)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://daotao.vku.udn.vn/sv")
        
        print("👉 Vui lòng đăng nhập vào tài khoản VKU của bạn...")
        input("⏸️  Nhấn Enter sau khi đã đăng nhập xong: ")
        
        # Lưu session (cookies + localStorage)
        context.storage_state(path=session_file)
        print(f"✅ Đã lưu session vào {session_file}")
        print("=" * 50 + "\n")
        
        browser.close()

def load_session(context):
    """Load session từ file nếu tồn tại"""
    if os.path.exists(session_file):
        try:
            context = context.browser.new_context(storage_state=session_file)
            print("✅ Session loaded from", session_file)
            return context, True
        except Exception as e:
            print(f"⚠️ Không thể load session: {e}")
            return context, False
    return context, False

# ---------- Crawl ----------
def crawl_diem(page):
    print("🔍 Đang trích xuất dữ liệu...")
    rows = page.locator("table tr.even.pointer")
    data = []
    stt = 1
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
                    "STT": stt,
                    "Tên học phần": ten_hp,
                    "Số TC": so_tc,
                    "Điểm T10": diem_t10,
                    "Học kỳ": hoc_ky
                })
                stt += 1
            except Exception as e:
                print("⚠️ Lỗi khi đọc dòng:", e)

    print(f"✅ Đã lấy {len(data)} môn học.")
    return data

def save_to_csv(data, filename=CSV_FILE):
    keys = ["STT", "Tên học phần", "Số TC", "Điểm T10", "Học kỳ"]
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)
    print(f"💾 Đã lưu {len(data)} môn học vào {filename}")

# ---------- Chèn vào Supabase ----------
def insert_csv_to_db(csv_file=CSV_FILE, student_id: str = None):
    """
    Chèn dữ liệu từ CSV vào Supabase sử dụng Supabase client
    
    Args:
        csv_file: Đường dẫn file CSV
        student_id: ID sinh viên (optional)
    """
    grades_data = []
    
    with open(csv_file, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            diem_t10 = None
            try:
                diem_t10 = float(row["Điểm T10"]) if row["Điểm T10"] != "chưa có" else None
            except:
                diem_t10 = None
            
            grade_record = {
                "ten_hoc_phan": row["Tên học phần"],
                "so_tc": int(row["Số TC"]),
                "diem_t10": diem_t10,
                "hoc_ky": row["Học kỳ"]
            }
            
            # Thêm student_id nếu có
            if student_id:
                grade_record["student_id"] = student_id
            
            grades_data.append(grade_record)
    
    # Sử dụng Supabase client để insert batch
    if grades_data:
        supabase_db.insert_grades_batch(grades_data)
    else:
        print("⚠️ Không có dữ liệu để chèn")

# ---------- Main ----------
def main(force_login=False, student_id=None):
    """
    Main function để crawl điểm và lưu vào Supabase
    
    Args:
        force_login: Bắt buộc đăng nhập lại (tạo session mới)
        student_id: ID sinh viên để lưu vào database
    """
    print("\n🚀 BẮT ĐẦU CRAWL ĐIỂM VKU")
    print("=" * 50)
    
    # Kiểm tra session
    if force_login or not os.path.exists(session_file):
        create_new_session()
    
    # Bắt đầu crawl
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # Load session từ file
        if os.path.exists(session_file):
            context = browser.new_context(storage_state=session_file)
            print("✅ Đã load session")
        else:
            print("❌ Không tìm thấy session file!")
            browser.close()
            return
        
        page = context.new_page()
        page.goto(target_url)
        
        try:
            page.wait_for_selector("table", timeout=20000)
            time.sleep(3)
            
            print("\n📊 ĐANG CRAWL DỮ LIỆU...")
            data = crawl_diem(page)
            
            if data:
                save_to_csv(data)
                insert_csv_to_db(CSV_FILE, student_id=student_id)
                print("\n✅ HOÀN TẤT!")
                print(f"📝 Đã lưu {len(data)} môn học")
            else:
                print("⚠️ Không có dữ liệu để lưu")
                
        except Exception as e:
            print(f"❌ Lỗi khi crawl: {e}")
            print("💡 Thử chạy lại với --force-login để tạo session mới")
        finally:
            browser.close()
    
    print("=" * 50 + "\n")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="VKU Grade Scraper - All in one")
    parser.add_argument("--force-login", action="store_true", 
                       help="Bắt buộc đăng nhập lại (tạo session mới)")
    parser.add_argument("--student-id", type=str, 
                       help="ID sinh viên để lưu vào database")
    
    args = parser.parse_args()
    
    main(force_login=args.force_login, student_id=args.student_id)
