import httpx
import os
import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import Optional
from .base_cog import BaseCog, CogMetadata

class TopCVCog(BaseCog):
    def __init__(self, app):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="TopCV",
            description="Upload CV to find jobs",
            version="1.0.0",
            author="AI4LIFE"
        )
        self.setup()

    def setup(self):
        @self.router.post("/api/topcv")
        async def upload_cv(
            file: UploadFile = File(...),
            auth_userid: str = Form(...)
        ):
            # Use the production URL by default, or switch to test if needed
            # User screenshot showed webhook-test, but text said webhook.
            # We'll use the one from the text request first.
            webhook_url = "https://n8n-group5.len-handmade.top/webhook/upload-cv"
            
            try:
                # Read file content
                content = await file.read()
                
                # Prepare files for httpx
                files = {'file': (file.filename, content, file.content_type)}
                
                async with httpx.AsyncClient() as client:
                    # Increase timeout for file uploads/processing to 1 hour
                    response = await client.post(webhook_url, files=files, timeout=3600.0)
                    
                    if response.status_code != 200:
                        print(f"n8n returned status {response.status_code}: {response.text}")
                        
                        # Check for Nginx/Proxy Timeout HTML
                        if "Request Timeout" in response.text or "504 Gateway Time-out" in response.text:
                            detail_msg = "Server n8n phản hồi quá lâu (Timeout) nên kết nối bị ngắt bởi Proxy/Nginx. Dù n8n có thể đã chạy xong, nhưng kết quả không thể gửi về App."
                        else:
                            detail_msg = f"n8n Error {response.status_code}: {response.text[:200]}"
                            
                        raise HTTPException(status_code=response.status_code, detail=detail_msg)
                    
                    # n8n returns text like:
                    # 0:https://...
                    # 1:https://...
                    # OR a JSON list: ["https://...", "https://..."]
                    result_text = response.text
                    
                    # Parse the text into a structured list
                    links = []
                    
                    try:
                        # Try parsing as JSON first
                        json_data = json.loads(result_text)
                        raw_links = []

                        if isinstance(json_data, list):
                            # Check if it's a list of strings or list of objects containing links
                            if len(json_data) > 0:
                                if isinstance(json_data[0], str):
                                    # Case: ["url1", "url2"]
                                    raw_links = json_data
                                elif isinstance(json_data[0], dict) and "links" in json_data[0]:
                                    # Case: [{"links": ["url1", "url2"]}]
                                    raw_links = json_data[0]["links"]
                        elif isinstance(json_data, dict):
                             # Case: {"links": ["url1", "url2"]}
                             if "links" in json_data:
                                 raw_links = json_data["links"]
                        
                        # Process the extracted links
                        for idx, url in enumerate(raw_links):
                            if isinstance(url, str):
                                links.append({
                                    "id": str(idx + 1),
                                    "url": url.strip()
                                })

                    except json.JSONDecodeError:
                        # Fallback to text parsing
                        pass

                    if not links:
                        # Try line-based parsing if JSON parsing didn't yield results
                        lines = result_text.strip().split('\n')
                        for line in lines:
                            line = line.strip()
                            if not line: continue
                            
                            if ':' in line and not line.startswith('http'):
                                # Format: "ID: URL"
                                parts = line.split(':', 1)
                                if len(parts) == 2:
                                    links.append({
                                        "id": parts[0].strip(),
                                        "url": parts[1].strip()
                                    })
                            elif line.startswith('http'):
                                # Format: "URL" (one per line)
                                links.append({
                                    "id": str(len(links) + 1),
                                    "url": line
                                })
                    
                    return {
                        "success": True,
                        "message": "CV processed successfully",
                        "webhook_response": {
                            "type": "topcv_result",
                            "links": links,
                            "raw_text": result_text
                        }
                    }
            
            except HTTPException as he:
                raise he
            except Exception as e:
                print(f"Error processing TopCV request: {str(e)}")
                raise HTTPException(status_code=500, detail=str(e))

        # Manually include the router to register the path
        self.app.include_router(self.router)

def setup(app):
    return TopCVCog(app)
