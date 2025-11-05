from browser_use import Agent, Browser, ChatGoogle
from dotenv import load_dotenv
import asyncio
import os

load_dotenv()


os.environ["ANONYMIZED_TELEMETRY"] = "false"

browser = Browser(
    executable_path='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    user_data_dir='%LOCALAPPDATA%\\Google\\Chrome\\User Data',
    profile_directory='Default',
)

agent = Agent(
    task="""1. Truy cập https://daotao.vku.udn.vn/sv và đăng nhập bằng tài khoản hainhn.22it@vku.udn.vn
2. Sau khi đăng nhập thành công, truy cập trang hồ sơ: https://daotao.vku.udn.vn/sv/hoso
3. Lấy thông tin sinh viên bao gồm: tên, mã sinh viên, lớp và khóa học""",
    browser=browser,
    llm=ChatGoogle(model="gemini-flash-latest")
)

async def main():
	await agent.run()

if __name__ == "__main__":
	asyncio.run(main())