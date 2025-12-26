from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from browser_use import Agent, Browser, ChatOpenAI
from dotenv import load_dotenv
import asyncio
import os
import uvicorn

load_dotenv()

os.environ["ANONYMIZED_TELEMETRY"] = "false"

app = FastAPI()

# user_data_dir = os.path.join(os.getcwd(), "chrome_profile")
# if not os.path.exists(user_data_dir):
#     os.makedirs(user_data_dir)

# browser = Browser(
#     executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
#     # user_data_dir=user_data_dir,
#     # profile_directory='Default',
# )

class TaskRequest(BaseModel):
    task: str

class TaskResponse(BaseModel):
    result: str

@app.post("/execute", response_model=TaskResponse)
async def execute_task(request: TaskRequest):
    browser = None
    try:
        # Initialize browser for each request to avoid CDP/Connection issues
        browser = Browser(
            executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        )
        
        agent = Agent(
            task=request.task,
            browser=browser,
            llm = ChatOpenAI(
                model="o3",
            )
        )
        
        history = await agent.run()
        
        # Get the final result from history
        result = history.final_result() if hasattr(history, 'final_result') else str(history)
        
        # Ensure result is a string
        if result is None:
            result = "Task completed but no specific text result was returned."
            
        return TaskResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Ensure browser is closed after request
        if browser:
            await browser.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)