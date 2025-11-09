from playwright.sync_api import sync_playwright
import csv
import json
import os
import time

# ---------- Cấu hình ----------
session_file = "session.json"
target_url = "https://daotao.vku.udn.vn/sv/diem"
CSV_FILE = "diem_tong_ket.csv"

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

# ---------- Crawl điểm tổng kết ----------
def crawl_diem_tong_ket(page):
    print("🔍 Đang trích xuất điểm tổng kết...")
    rows = page.locator("table tr.even.pointer")
    data = []

    for i in range(rows.count()):
        row = rows.nth(i)
        cols = row.locator("td")
        if cols.count() == 12:
            try:
                stt = cols.nth(0).inner_text().strip()
                hoc_ky = cols.nth(1).inner_text().strip()
                so_tc_dk = cols.nth(2).inner_text().strip()
                so_tc_dk_moi = cols.nth(3).inner_text().strip()
                diem_4 = cols.nth(4).inner_text().strip()
                diem_10 = cols.nth(5).inner_text().strip()
                diem_hb = cols.nth(6).inner_text().strip()
                tc_tl_hk = cols.nth(7).inner_text().strip()
                xep_loai = cols.nth(8).inner_text().strip()
                diem_4_tl = cols.nth(9).inner_text().strip()
                diem_10_tl = cols.nth(10).inner_text().strip()
                tc_tich_luy = cols.nth(11).inner_text().strip()

                # Bỏ qua dòng nếu không có "Học kỳ"
                if not hoc_ky.startswith("Học kỳ"):
                    continue

                data.append({
                    "STT": stt,
                    "Học kỳ": hoc_ky,
                    "Số TC-ĐK": so_tc_dk,
                    "Số TC-ĐK Mới": so_tc_dk_moi,
                    "Điểm 4": diem_4,
                    "Điểm 10": diem_10,
                    "Điểm HB": diem_hb,
                    "TC TL HK": tc_tl_hk,
                    "Xếp loại": xep_loai,
                    "Điểm 4 TL": diem_4_tl,
                    "Điểm 10 TL": diem_10_tl,
                    "TC Tích lũy": tc_tich_luy
                })
            except Exception as e:
                print(f"⚠️ Lỗi khi đọc dòng {i}: {e}")

    print(f"✅ Đã lấy {len(data)} học kỳ tổng kết.")
    return data

# ---------- Save CSV ----------
def save_to_csv(data, filename=CSV_FILE):
    keys = ["STT","Học kỳ","Số TC-ĐK","Số TC-ĐK Mới","Điểm 4","Điểm 10","Điểm HB","TC TL HK","Xếp loại","Điểm 4 TL","Điểm 10 TL","TC Tích lũy"]
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)
    print(f"💾 Đã lưu {len(data)} học kỳ vào {filename}")

# ---------- Main ----------
def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Load hoặc login session
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

        data = crawl_diem_tong_ket(page)
        save_to_csv(data)
        browser.close()

if __name__ == "__main__":
    main()
