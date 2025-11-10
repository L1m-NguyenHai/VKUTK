#!/usr/bin/env python
# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright
from pathlib import Path
import sys
import time

# Set UTF-8 encoding for output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Save session to Frontend/Sessions folder
sessions_dir = Path(__file__).parent.parent.parent.parent / "Frontend" / "Sessions"
sessions_dir.mkdir(parents=True, exist_ok=True)
session_file = sessions_dir / "session.json"

print(f"Session will be saved to: {session_file}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context()

    # Open VKU login page
    page = context.new_page()
    page.goto("https://daotao.vku.udn.vn/sv")

    print("Waiting for login...")
    
    try:
        # Wait for successful login - detect by URL change or page load
        # After login, the page should redirect to dashboard
        page.wait_for_url("**/sv/**", timeout=300000)  # 5 minutes timeout
        
        # Wait a bit more for page to fully load
        time.sleep(2)
        
        # Save session (cookies + localStorage)
        context.storage_state(path=str(session_file))
        print(f"Login successful! Session saved to {session_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        browser.close()
