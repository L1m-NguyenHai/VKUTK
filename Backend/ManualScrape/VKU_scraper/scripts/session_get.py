#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import io
import time
import os
from playwright.sync_api import sync_playwright

# Set UTF-8 encoding for stdout
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Get session file path from command line argument or use default
session_file = sys.argv[1] if len(sys.argv) > 1 else "session.json"

# Ensure directory exists
session_dir = os.path.dirname(session_file)
if session_dir and not os.path.exists(session_dir):
    os.makedirs(session_dir, exist_ok=True)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()

        # Mở trang đăng nhập VKU
        page = context.new_page()
        page.goto("https://daotao.vku.udn.vn/sv")

        print("Vui lòng đăng nhập vào tài khoản VKU...")
        print("Đang chờ đăng nhập (timeout: 5 phút)...")
        
        # Wait for URL change (indicates successful login and redirect)
        # The login page URL will change after successful authentication
        # Timeout after 5 minutes (300 seconds)
        try:
            page.wait_for_url("**/sv/**", timeout=300000)
            print("Đăng nhập thành công!")
        except:
            # If URL doesn't change, wait a bit more for page to load
            print("Chờ trang tải...")
            try:
                page.wait_for_load_state("networkidle", timeout=30000)
            except:
                pass

        # Lưu session (cookies + localStorage)
        context.storage_state(path=session_file)
        print(f"Đã lưu session vào {session_file}")

        browser.close()
        print("Hoàn tất!")
        
except Exception as e:
    print(f"Lỗi: {str(e)}", file=sys.stderr)
    sys.exit(1)
