"""
Simple VKU login using requests library (no browser needed)
This is faster and more reliable than Selenium for basic cookie injection
"""

import csv
import time
from pathlib import Path
import requests
from urllib.parse import urljoin

# Add delays
DELAY_BETWEEN_REQUESTS = 1


def load_cookies_from_csv(csv_path):
    """Load cookies from CSV file and return as dict for requests library"""
    cookies = {}
    with open(csv_path, newline='', encoding='utf-8') as f:
        # Skip empty lines
        lines = [line.strip() for line in f if line.strip()]
        reader = csv.DictReader(lines)
        for row in reader:
            if not row or not row.get('name'):
                continue
            name = row['name'].strip()
            value = row['value'].strip() if row.get('value') else ''
            cookies[name] = value
    return cookies


def login_with_requests():
    """Login using requests library (no browser)"""
    script_dir = Path(__file__).parent
    csv_path = script_dir / 'cookies.csv'
    
    if not csv_path.exists():
        print(f"❌ Error: {csv_path} not found!")
        return False
    
    print(f"📂 Loading cookies from: {csv_path}")
    cookies = load_cookies_from_csv(csv_path)
    print(f"✅ Loaded {len(cookies)} cookies\n")
    
    # VKU URL
    vku_url = 'https://daotao.vku.udn.vn/sv'
    
    # Create session with cookies
    session = requests.Session()
    session.cookies.update(cookies)
    
    # Add realistic headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    session.headers.update(headers)
    
    try:
        print(f"🔗 Accessing: {vku_url}")
        time.sleep(DELAY_BETWEEN_REQUESTS)
        
        response = session.get(vku_url, timeout=10, verify=True, allow_redirects=True)
        
        print(f"\n📊 Response Details:")
        print(f"  Status Code: {response.status_code}")
        print(f"  URL: {response.url}")
        print(f"  Content Length: {len(response.content)} bytes")
        
        # Check if login was successful
        if response.status_code == 200:
            print("\n✅ Successfully connected to VKU portal!")
            
            # Look for success indicators
            content = response.text.lower()
            
            indicators = [
                ('logged in', 'đăng nhập thành công' in content or 'dashboard' in content),
                ('student info', 'sinh viên' in content or 'student' in content),
                ('schedule', 'lịch học' in content or 'schedule' in content),
            ]
            
            print("\n🔍 Checking page content:")
            for indicator_name, found in indicators:
                status = "✅ Found" if found else "⚠️  Not found"
                print(f"  {indicator_name}: {status}")
            
            # Save response to file for inspection
            output_file = script_dir / 'vku_response.html'
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(response.text)
            print(f"\n📄 Full response saved to: {output_file}")
            
            # Print first 1000 chars
            print(f"\n📋 Response preview (first 1000 chars):")
            print("=" * 60)
            print(response.text[:1000])
            print("=" * 60)
            
            # Print active cookies
            print(f"\n🍪 Active Cookies in Session:")
            for name, value in session.cookies.items():
                print(f"  {name}: {value[:30]}..." if len(value) > 30 else f"  {name}: {value}")
            
            return True
        else:
            print(f"\n❌ Unexpected status code: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Error: Request timeout - VKU site took too long to respond")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Error: Connection failed - {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == '__main__':
    print("🚀 VKU Login via Requests (No Browser)\n")
    print("="*60)
    
    success = login_with_requests()
    
    print("\n" + "="*60)
    if success:
        print("✅ Test completed successfully!")
    else:
        print("❌ Test failed!")
