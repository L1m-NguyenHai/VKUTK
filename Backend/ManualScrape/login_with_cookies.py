"""
Login to VKU site using Selenium + cookies from CSV
Reads cookies.csv, launches a browser, injects cookies, then navigates to the VKU site.
"""

import csv
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager

# Delay constants (in seconds)
DELAY_BEFORE_NAVIGATION = 1
DELAY_AFTER_NAVIGATION = 3
DELAY_BETWEEN_COOKIES = 0.5
DELAY_BEFORE_REFRESH = 2
DELAY_AFTER_REFRESH = 3
DELAY_BEFORE_CLOSE = 10


def load_cookies_from_csv(csv_path):
    """Load cookies from CSV file."""
    cookies = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        # Skip empty lines
        lines = [line.strip() for line in f if line.strip()]
        reader = csv.DictReader(lines)
        for row in reader:
            if not row or not row.get('name'):
                continue
            cookie = {
                'name': row['name'].strip(),
                'value': row['value'].strip() if row.get('value') else '',
                'domain': row['domain'].strip() if row.get('domain') else '',
                'path': row['path'].strip() if row.get('path') else '/',
            }
            # Optional fields
            if row.get('secure') and row['secure'].strip():
                cookie['secure'] = True
            if row.get('httpOnly') and row['httpOnly'].strip():
                cookie['httpOnly'] = True
            if row.get('sameSite') and row['sameSite'].strip():
                cookie['sameSite'] = row['sameSite'].strip()
            cookies.append(cookie)
    return cookies


def login_with_cookies(browser_type='chrome', headless=False):
    """
    Launch a browser, inject cookies, and access VKU site.
    
    Args:
        browser_type: 'chrome' or 'firefox'
        headless: if True, run in headless mode (no GUI)
    """
    # Get script directory to locate cookies.csv
    script_dir = Path(__file__).parent
    csv_path = script_dir / 'cookies.csv'
    
    if not csv_path.exists():
        print(f"❌ Error: {csv_path} not found!")
        return False
    
    print(f"📂 Loading cookies from: {csv_path}")
    cookies = load_cookies_from_csv(csv_path)
    print(f"✅ Loaded {len(cookies)} cookies")
    
    # Initialize browser
    driver = None
    try:
        if browser_type.lower() == 'chrome':
            options = ChromeOptions()
            if headless:
                options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            service = ChromeService(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            print("🌐 Chrome browser launched")
        elif browser_type.lower() == 'brave':
            options = ChromeOptions()
            # Find Brave executable path (common locations)
            brave_path = None
            for path in [
                r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
                r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
                r"C:\Users\{}\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe".format(
                    Path.home().name
                ),
            ]:
                expanded_path = Path(path).expanduser()
                if expanded_path.exists():
                    brave_path = str(expanded_path)
                    break
            
            if not brave_path:
                print("❌ Brave browser not found! Please install Brave or specify its path.")
                return False
            
            options.binary_location = brave_path
            if headless:
                options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-blink-features=AutomationControlled')
            
            # Get Brave version and download matching ChromeDriver
            print("🔍 Detecting Brave version and downloading compatible ChromeDriver...")
            try:
                from webdriver_manager.core.utils import ChromeType
                service = ChromeService(ChromeDriverManager(chrome_type=ChromeType.BRAVE).install())
            except Exception as e:
                print(f"⚠️  Could not auto-detect Brave version: {e}")
                print("   Trying standard ChromeDriver...")
                service = ChromeService(ChromeDriverManager().install())
            
            driver = webdriver.Chrome(service=service, options=options)
            print(f"🌐 Brave browser launched from: {brave_path}")
        elif browser_type.lower() == 'edge':
            options = EdgeOptions()
            if headless:
                options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            service = EdgeService(EdgeChromiumDriverManager().install())
            driver = webdriver.Edge(service=service, options=options)
            print("🌐 Edge browser launched")
        elif browser_type.lower() == 'firefox':
            options = FirefoxOptions()
            if headless:
                options.add_argument('--headless')
            service = FirefoxService(GeckoDriverManager().install())
            driver = webdriver.Firefox(service=service, options=options)
            print("🌐 Firefox browser launched")
        else:
            print(f"❌ Unsupported browser: {browser_type}")
            print("   Supported: chrome, brave, edge, firefox")
            return False
        
        # First, navigate to cloudflare domain to set cloudflare cookies
        print("\n🔗 Navigating to cloudflare.com to inject Cloudflare cookies...")
        time.sleep(DELAY_BEFORE_NAVIGATION)
        try:
            driver.get('https://www.cloudflare.com')
            time.sleep(DELAY_AFTER_NAVIGATION)
        except Exception as e:
            print(f"⚠️  Could not reach cloudflare.com: {e}")
            print("   Skipping Cloudflare cookie injection (site may be offline)")
        
        # Inject cloudflare cookies
        cf_cookies = [c for c in cookies if '.cloudflare.com' in c['domain']]
        for cookie in cf_cookies:
            try:
                driver.add_cookie(cookie)
                print(f"  ✅ Added: {cookie['name']}")
                time.sleep(DELAY_BETWEEN_COOKIES)
            except Exception as e:
                print(f"  ⚠️  Failed to add {cookie['name']}: {e}")
        
        # Navigate to VKU site
        vku_url = 'https://daotao.vku.udn.vn/sv'
        print(f"\n🔗 Navigating to {vku_url}...")
        time.sleep(DELAY_BEFORE_NAVIGATION)
        try:
            driver.get(vku_url)
            time.sleep(DELAY_AFTER_NAVIGATION)
        except Exception as e:
            print(f"❌ Error: Could not reach VKU site: {e}")
            print("   Check your internet connection or the VKU site status")
            return False
        
        # Inject VKU cookies
        vku_cookies = [c for c in cookies if '.vku.udn.vn' in c['domain']]
        for cookie in vku_cookies:
            try:
                driver.add_cookie(cookie)
                print(f"  ✅ Added: {cookie['name']}")
                time.sleep(DELAY_BETWEEN_COOKIES)
            except Exception as e:
                print(f"  ⚠️  Failed to add {cookie['name']}: {e}")
        
        # Refresh page to apply cookies
        print("\n🔄 Refreshing page to apply cookies...")
        time.sleep(DELAY_BEFORE_REFRESH)
        driver.refresh()
        time.sleep(DELAY_AFTER_REFRESH)
        
        # Check if logged in by looking for user profile or other indicators
        print("\n🔍 Checking login status...")
        try:
            # Wait for page to load (adjust selector based on actual page structure)
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, 'body'))
            )
            
            # Get page title and URL
            page_title = driver.title
            current_url = driver.current_url
            
            print(f"✅ Page Title: {page_title}")
            print(f"✅ Current URL: {current_url}")
            
            # Take a screenshot for verification
            screenshot_path = script_dir / 'login_screenshot.png'
            driver.save_screenshot(str(screenshot_path))
            print(f"📸 Screenshot saved to: {screenshot_path}")
            
            # Print page source snippet (first 500 chars)
            print("\n📄 Page content preview (first 500 chars):")
            page_source = driver.page_source[:500]
            print(page_source)
            
            print("\n✅ Script completed successfully!")
            print("ℹ️  Browser will close in 10 seconds. Check the screenshot to verify login status.")
            time.sleep(DELAY_BEFORE_CLOSE)
            
        except Exception as e:
            print(f"❌ Error checking page: {e}")
            time.sleep(5)
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if driver:
            driver.quit()
            print("🔒 Browser closed")


if __name__ == '__main__':
    import sys
    
    # Parse arguments: login_with_cookies.py [chrome|brave|edge|firefox] [--headless]
    browser = 'edge'  # Default to Edge
    headless = False
    
    if len(sys.argv) > 1:
        browser = sys.argv[1]
    if '--headless' in sys.argv:
        headless = True
    
    print(f"🚀 Starting VKU login script...")
    print(f"   Browser: {browser}")
    print(f"   Headless: {headless}")
    print(f"   Available: chrome, brave, edge, firefox\n")
    
    login_with_cookies(browser_type=browser, headless=headless)
