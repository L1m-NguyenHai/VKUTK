from browser_use import Agent, ChatGoogle
from dotenv import load_dotenv
import asyncio

load_dotenv()

async def main():
    llm = ChatGoogle(model="gemini-flash-latest")
    task = 
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())