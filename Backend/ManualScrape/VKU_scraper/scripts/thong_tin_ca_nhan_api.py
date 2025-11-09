#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import io
import json
import os
import time
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
        with open(session_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        cookies = data["cookies"] if isinstance(data, dict) and "cookies" in data else data
        context.add_cookies(cookies)
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
        print(f"Error fetching info: {e}", file=sys.stderr)
    return info

# ---------- Main ----------
def main():
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()

            if not load_session(context):
                print("Session file not found", file=sys.stderr)
                sys.exit(1)

            page = context.new_page()
            page.goto(profile_url)
            page.wait_for_selector("div.profile-usertitle", timeout=20000)
            time.sleep(2)

            info = crawl_thong_tin(page)
            browser.close()
            
            # Output as JSON to stdout
            print(json.dumps(info, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
