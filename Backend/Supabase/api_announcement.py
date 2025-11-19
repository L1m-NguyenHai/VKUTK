from fastapi import FastAPI, HTTPException
from typing import List
from pydantic import BaseModel
from Announcement import supabase_announcement  # Import the singleton instance from your Announcement class
from FBPost import supabase_fbpost
from fastapi import Body

# ----------------------------
# FastAPI app
# ----------------------------
app = FastAPI(title="Announcement API")

# ----------------------------
# Pydantic model
# ----------------------------
class Announcement(BaseModel):
    id: str
    title: str
    content: str
    url: str
    date_announced: str  # 'YYYY-MM-DD'
    noti_type: str

# ----------------------------
# Routes
# ----------------------------

@app.get("/announcements", response_model=List[Announcement])
def get_announcements(limit: int = 20):
    """Fetch all announcements using Database class"""
    try:
        return supabase_announcement.get_all_announcements(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/newest-unposted-announcement", response_model=Announcement)
def get_newest_unposted_announcement():
    """Fetch the newest unposted announcement using Database class"""
    try:
        return supabase_announcement.get_newest_unposted_announcement()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/announcements")
def create_announcement(announcement: Announcement):
    """Insert a new announcement using Database class"""
    try:
        success = supabase_announcement.insert_announcement(**announcement.dict())
        if not success.get("status"):
            raise HTTPException(status_code=500, detail= success.get("error"))
        return {"message": "Announcement inserted successfully", "id": announcement.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fb-post")
def create_fb_post(fb_post_id: str = Body(...), announcement_id: str = Body(...)):
    try:
        success = supabase_fbpost.insert_fb_post_date(
            fb_post_id=fb_post_id,
            announcement_id=announcement_id
        )
        if not success.get("status"):
            raise HTTPException(status_code=500, detail= success.get("error"))
        return {"message": "FB Post Date inserted successfully", "fb_post_id": fb_post_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
