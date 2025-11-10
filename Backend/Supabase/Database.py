import os
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Optional, List, Dict, Any

load_dotenv()

class Database:
    """Supabase Database Manager"""
    
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("❌ SUPABASE_URL và SUPABASE_KEY phải được set trong .env")
        
        self.client: Client = create_client(self.url, self.key)
        print(f"✅ Supabase client initialized: {self.url}")

    def get_announcements(self) -> List[Dict[str, Any]]:
        """Lấy tất cả thông báo"""
        response = self.client.table("announcement").select("*").order("created_at", desc=True).execute()
        return response.data

    def insert_announcement(
        self,
        id: str,
        title: str,
        content: str,
        url: str,
        date_announced: str,  # 'YYYY-MM-DD'
        noti_type: str
    ) -> bool:
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
            return True
        except Exception as e:
            print(f"❌ Failed to insert announcement: {e}")
            return False

# Singleton instance
supabase_db = Database()

# Test connection
if __name__ == "__main__" and False:
    try:
        announcements = supabase_db.client.table("announcement").select("*").execute().data
        print(f"✅ Kết nối Supabase thành công. Số thông báo hiện có: {len(announcements)}")

        # Print all columns for each row
        if announcements:
            print("\n📋 Dữ liệu trong bảng 'announcement':")
            for row in announcements:
                print(row)
        else:
            print("⚠️ Bảng 'announcement' hiện trống.")
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")

elif __name__ == "__main__" and True:
    # Test inserting a new announcement
    result = supabase_db.insert_announcement(
        id="20251110-001",
        title="New Event",
        content="We have a new event coming up!",
        url="https://example.com/event",
        date_announced="2025-11-10",
        noti_type="info"
    )
    print("Insert result:", result)
