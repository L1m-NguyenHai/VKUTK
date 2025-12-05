from typing import List, Dict, Any
from client import supabase_client
from datetime import datetime

class Announcement:
    def __init__(self):
        self.client = supabase_client.get_client()
    
    def get_newest_unposted_announcement(self) -> Dict[str, Any]:
        response = self.client.rpc("get_newest_unposted_announcement").execute()
        return response.data[0] if response.data else None
        
    def get_newest_announcement_date(self) -> str:
        response = self.client.table("announcement").select("date_announced").order("date_announced", desc=True).limit(1).execute()
        return response.data[0] if response.data else None
    
    def get_newest_announcement(self):
        """
        Return the most recent announcement row ordered by date_announced.
        """
        response = (
            self.client
            .table("announcement")
            .select("*")                       # select all columns
            .order("date_announced", desc=True)
            .limit(1)
            .execute()
        )

        return response.data[0] if response.data else None

    
    def get_all_announcements(self, limit = 20) -> List[Dict[str, Any]]:
        """Lấy tất cả thông báo"""
        response = self.client.table("announcement").select("*").order("date_announced", desc=True).limit(limit).execute()
        return response.data
    
    def get_announcement_by_id(self, announcement_id: str) -> Dict[str, Any]:
        """Lấy thông báo theo ID"""
        response = self.client.table("announcement").select("*").eq("id", announcement_id).execute()
        return response.data[0] if response.data else None

    def insert_announcement(
        self,
        id: str,
        title: str,
        content: str,
        url: str,
        date_announced: str,  # 'YYYY-MM-DD'
        noti_type: str
    ) -> Dict[str, Any]:
        date_announced = datetime.strptime(date_announced, "%d-%m-%Y").strftime("%Y-%m-%d")

        """Insert a single announcement"""
        try:
            data = {
                "id": id,
                "title": title,
                "content": content,
                "url": url,
                "date_announced": date_announced,
                "noti_type": noti_type
                # DON'T include created_at → let database default to now()
            }
            self.client.table("announcement").insert(data).execute()
            print(f"✅ Announcement inserted: {id}")
            return { "status": True, "id": id }
        except Exception as e:
            print(f"❌ Failed to insert announcement: {e}")
            return { "status": False, "error": e}

# Singleton instance
supabase_announcement = Announcement()

# Test connection
if __name__ == "__main__" and False:
    try:
        announcements = supabase_announcement.get_newest_announcement_date()
        print(announcements)
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")
elif __name__ == "__main__" and False:
    # Test inserting a new announcement
    result = supabase_announcement.insert_announcement(
        id="20251110-006",
        title="Thông báo mới",
        content="Nội dung thông báo mới.",
        url="https://example.com/announcement/20251110-006",
        date_announced="2025-11-10",
        noti_type="general"
    )
    print(result)
elif __name__ == "__main__" and True:
    result = supabase_announcement.get_newest_unposted_announcement()
    print(result)



    