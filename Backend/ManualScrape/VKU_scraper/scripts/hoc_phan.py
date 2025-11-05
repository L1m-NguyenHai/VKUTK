from playwright.sync_api import sync_playwright
import csv
import time
import json
import os
import psycopg2

# ---------- Cấu hình ----------
session_file = "session.json"
target_url = "https://daotao.vku.udn.vn/sv/diem"
CSV_FILE = "ten_hoc_phan.csv"

# ---------- Session ----------
def save_session(context):
    cookies = context.cookies()
    with open(session_file, "w", encoding="utf-8") as f:
        json.dump(cookies, f, ensure_ascii=False, indent=2)
    print("✅ Session saved to", session_file)

def load_session(context):
    if os.path.exists(session_file):
        with open(session_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        cookies = data["cookies"] if isinstance(data, dict) and "cookies" in data else data
        context.add_cookies(cookies)
        print("✅ Session loaded from", session_file)
        return True
    return False

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
# ---------- Main ----------
def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        if not load_session(context):
            page = context.new_page()
            page.goto(target_url)
            print("⚠️ Hãy đăng nhập bằng Google và nhấn Enter sau khi hoàn tất...")
            input("👉 Sau khi đăng nhập thành công, nhấn Enter để lưu session...")
            save_session(context)
        else:
            page = context.new_page()
            page.goto(target_url)

        page.wait_for_selector("table", timeout=20000)
        time.sleep(3)

        data = crawl_diem(page)
        save_to_csv(data)

        browser.close()

if __name__ == "__main__":
    main()
