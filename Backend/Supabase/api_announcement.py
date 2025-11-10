from fastapi import FastAPI, HTTPException
from typing import List
from pydantic import BaseModel
from Database import supabase_db  # Import the singleton instance from your Database class

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
def get_announcements():
    """Fetch all announcements using Database class"""
    try:
        return supabase_db.get_announcements()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/announcements")
def create_announcement(announcement: Announcement):
    """Insert a new announcement using Database class"""
    try:
        success = supabase_db.insert_announcement(**announcement.dict())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to insert announcement")
        return {"message": "Announcement inserted successfully", "id": announcement.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
