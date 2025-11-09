#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import io
import json
import os
import time
import csv
from playwright.sync_api import sync_playwright

# Set UTF-8 encoding for stdout
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Get session file path from command line argument or use default
session_file = sys.argv[1] if len(sys.argv) > 1 else "session.json"

# ---------- Configuration ----------
profile_url = "https://daotao.vku.udn.vn/sv/hoso"

# ---------- Session ----------
def load_session(context):
    if os.path.exists(session_file):
        try:
            with open(session_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            cookies = data["cookies"] if isinstance(data, dict) and "cookies" in data else data
            context.add_cookies(cookies)
            return True
        except Exception as e:
            print(f"Error loading session: {e}", file=sys.stderr)
            return False
    return False

# ---------- Crawl ----------
def crawl_thong_tin(page):
    info = {
        "Họ và tên": "Chưa cập nhật",
        "Mã SV": "Chưa cập nhật",
        "Lớp": "Chưa cập nhật",
        "Khóa": "Chưa cập nhật",
        "Chuyên ngành": "Chưa cập nhật",
        "Khoa": "Chưa cập nhật"
    }
    try:
        name_elem = page.query_selector("div.profile-usertitle-name")
        if name_elem:
            info["Họ và tên"] = name_elem.inner_text().strip()
        
        job_elem = page.query_selector("div.profile-usertitle-job")
        if job_elem:
            info["Mã SV"] = job_elem.inner_text().replace("MÃ SV:", "").strip()
        
        class_elem = page.query_selector("div.profile-usertitle-job + div")
        if class_elem:
            info["Lớp"] = class_elem.inner_text().replace("LỚP:", "").strip()
        
        khoa_elem = page.query_selector("div.profile-usertitle-job + div + div")
        if khoa_elem:
            info["Khóa"] = khoa_elem.inner_text().replace("KHÓA:", "").strip()
        
        nganh_elem = page.query_selector("div.profile-usertitle-job + div + div + div")
        if nganh_elem:
            info["Chuyên ngành"] = nganh_elem.inner_text().strip()
        
        faculty_elem = page.query_selector("div.profile-usertitle-job + div + div + div + div")
        if faculty_elem:
            info["Khoa"] = faculty_elem.inner_text().strip()
    except Exception as e:
        print(f"Error fetching info: {e}", file=sys.stderr)
    return info

def save_profile_to_csv(info):
    try:
        with open('profile.csv', 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ["Họ và tên", "Mã SV", "Lớp", "Khóa", "Chuyên ngành", "Khoa"]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerow(info)
    except Exception as e:
        print(f"Error saving CSV: {e}", file=sys.stderr)

# ---------- Main ----------
def main():
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()

            if not load_session(context):
                print("Error: Session file not found", file=sys.stderr)
                sys.exit(1)
            
            page = context.new_page()
            page.goto(profile_url)

            try:
                page.wait_for_selector("div.profile-usertitle", timeout=20000)
            except:
                pass  # Continue even if selector not found
            
            time.sleep(2)

            info = crawl_thong_tin(page)
            
            # Output as JSON to stdout for API (MUST be first output)
            print(json.dumps(info, ensure_ascii=False, indent=2))
            
            # Also save to CSV for backward compatibility
            save_profile_to_csv(info)
            browser.close()
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
