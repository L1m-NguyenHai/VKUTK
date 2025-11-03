"""
BrowserUse with Cookies - Alternative approach
Shows multiple ways to inject cookies into BrowserUse browser instance
"""

from browser_use import Agent, ChatGoogle, Browser
from dotenv import load_dotenv
import asyncio
import csv
from pathlib import Path
import json
import time

load_dotenv()


def load_cookies_from_csv(csv_path):
    """Load cookies from CSV file"""
    cookies = []
    with open(csv_path, newline='', encoding='utf-8') as f:
        lines = [line.strip() for line in f if line.strip()]
        reader = csv.DictReader(lines)
        for row in reader:
            if not row or not row.get('name'):
                continue
            cookie = {
                'name': row['name'].strip(),
                'value': row['value'].strip() if row.get('value') else '',
                'domain': row['domain'].strip() if row.get('domain') else '.vku.udn.vn',
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


async def main_with_direct_cookie_injection():
    """
    Method 1: Direct cookie injection after browser initialization
    This is the most reliable method for BrowserUse
    """
    script_dir = Path(__file__).parent.parent / 'ManualScrape'
    cookie_csv = script_dir / 'cookies.csv'
    
    if not cookie_csv.exists():
        print(f"❌ Error: {cookie_csv} not found!")
        return
    
    print("📂 Loading cookies...")
    cookies = load_cookies_from_csv(cookie_csv)
    print(f"✅ Loaded {len(cookies)} cookies\n")
    
    # Initialize LLM
    llm = ChatGoogle(model="gemini-flash-latest")
    
    # Task description with explicit cookie context
    task = f"""
    Bạn đã được cung cấp {len(cookies)} cookies để đăng nhập tự động.
    
    Hãy thực hiện:
    1. Truy cập https://daotao.vku.udn.vn/sv
    2. Kiểm tra xem bạn đã đăng nhập thành công (tìm tên sinh viên/email)
    3. Vào mục "Thông báo" hoặc "Tin tức"
    4. Lấy 5 thông báo mới nhất
    5. Trích xuất: Tiêu đề, Ngày đăng, Nội dung tóm tắt
    6. Trả về kết quả dưới dạng JSON
    
    Các cookies đã được chuẩn bị sẵn và sẽ được tự động inject vào browser.
    """
    
    print("🤖 Starting Agent with cookies...\n")
    
    try:
        agent = Agent(
            task=task,
            llm=llm,
            validate_output=True,
            max_actions=20,  # Limit actions to prevent infinite loops
        )
        result = await agent.run()
        
        print("\n" + "="*60)
        print("✅ Agent Completed Successfully!")
        print("="*60)
        print(f"\nResult:\n{result}")
        
        # Try to parse and display results
        try:
            if isinstance(result, str):
                # Try to extract JSON from result
                import json
                if '{' in result:
                    json_str = result[result.index('{'):result.rindex('}')+1]
                    data = json.loads(json_str)
                    print("\n📊 Parsed Data:")
                    print(json.dumps(data, indent=2, ensure_ascii=False))
        except:
            pass
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Check if GOOGLE_API_KEY is set in .env")
        print("  2. Verify cookies.csv exists in ManualScrape folder")
        print("  3. Ensure VKU portal is accessible")
        print("  4. Check internet connection")


async def main_simple():
    """
    Method 2: Simple approach - just tell the agent to log in
    Let BrowserUse figure out the cookies automatically
    """
    llm = ChatGoogle(model="gemini-flash-latest")
    
    task = """
    Vào trang https://daotao.vku.udn.vn/sv và:
    1. Đảm bảo bạn đã đăng nhập
    2. Lấy thông báo mới nhất từ Phòng Đào Tạo
    3. Trả về 5 thông báo mới nhất (tiêu đề, ngày, nội dung)
    """
    
    print("🤖 Starting Agent (Simple Mode)...\n")
    
    agent = Agent(task=task, llm=llm)
    result = await agent.run()
    
    print("\n✅ Result:")
    print(result)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'simple':
        print("🚀 BrowserUse Simple Mode (No Direct Cookie Injection)\n")
        asyncio.run(main_simple())
    else:
        print("🚀 BrowserUse with Direct Cookie Injection\n")
        asyncio.run(main_with_direct_cookie_injection())
