from playwright.sync_api import sync_playwright
import json
import os
import time
import csv

# ---------- Cấu hình ----------
session_file = "session.json"
profile_url = "https://daotao.vku.udn.vn/sv/hoso"
PROFILE_FILE = "thong_tin_ca_nhan.csv"

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
def crawl_thong_tin(page):
    info = {}
    try:
        info["Họ và tên"] = page.query_selector("div.profile-usertitle-name").inner_text().strip()
        info["Mã SV"] = page.query_selector("div.profile-usertitle-job").inner_text().replace("MÃ SV:", "").strip()
        info["Lớp"] = page.query_selector("div.profile-usertitle-job + div").inner_text().replace("LỚP:", "").strip()
        info["Khóa"] = page.query_selector("div.profile-usertitle-job + div + div").inner_text().replace("KHÓA:", "").strip()
        info["Chuyên ngành"] = page.query_selector("div.profile-usertitle-job + div + div + div").inner_text().strip()
        info["Khoa"] = page.query_selector("div.profile-usertitle-job + div + div + div + div").inner_text().strip()
    except Exception as e:
        print(f"❌ Lỗi khi lấy thông tin: {e}")
    return info

# ---------- Lưu CSV ----------
def save_profile_to_csv(info, filename=PROFILE_FILE):
    fieldnames = ["Họ và tên", "Mã SV", "Lớp", "Khóa", "Chuyên ngành", "Khoa"]
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerow(info)
    print(f"💾 Đã lưu thông tin cá nhân vào {filename}")

# ---------- Main ----------
def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        if not load_session(context):
            page = context.new_page()
            page.goto(profile_url)
            print("⚠️ Hãy đăng nhập bằng Google và nhấn Enter sau khi hoàn tất...")
            input("👉 Sau khi đăng nhập thành công, nhấn Enter để lưu session...")
            save_session(context)
        else:
            page = context.new_page()
            page.goto(profile_url)

        page.wait_for_selector("div.profile-usertitle", timeout=20000)
        time.sleep(2)

        info = crawl_thong_tin(page)
        save_profile_to_csv(info)
        browser.close()

if __name__ == "__main__":
    main()
