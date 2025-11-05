from playwright.sync_api import sync_playwright

session_file = "session.json"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    context = browser.new_context()

    # Mở trang đăng nhập VKU
    page = context.new_page()
    page.goto("https://daotao.vku.udn.vn/sv")

    print("Vui lòng đăng nhập vào tài khoản VKU...")
    input("Nhấn Enter sau khi đã đăng nhập xong: ")

    # Lưu session (cookies + localStorage)
    context.storage_state(path=session_file)
    print(f"Đã lưu session vào {session_file}")

    browser.close()
