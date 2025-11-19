from typing import List, Dict, Any
from client import supabase_client

class FBPost:
    def __init__(self):
        self.client = supabase_client.get_client()
    
    def insert_fb_post_date(
        self,
        fb_post_id: str,
        announcement_id: str,
    ) -> Dict[str, Any]:
        """Insert a single FB post record first"""
        self.insert_fb_post(fb_post_id)

        """Insert a single FB post date record"""
        try:
            data = {
                "fb_post_id": fb_post_id,
                "announcement_id": announcement_id,
                # DON'T include created_at → let database default to now()
            }
            self.client.table("fb_post_date").insert(data).execute()
            print(f"✅ FB Post Date inserted: {fb_post_id}")
            return { "status": True, "fb_post_id": fb_post_id }
        except Exception as e:
            print(f"❌ Failed to insert FB Post Date: {e}")
            return { "status": False, "error": e}

    def insert_fb_post(
        self,
        id: str,
    ) -> Dict[str, Any]:
        """Insert a single FB post record"""
        try:
            data = {
                "id": id
            }
            self.client.table("fb_post").insert(data).execute()
            print(f"✅ FB Post inserted: {id}")
            return { "status": True, "id": id }
        except Exception as e:
            print(f"❌ Failed to insert FB Post: {e}")
            return { "status": False, "error": e}

# Singleton instance
supabase_fbpost = FBPost()

# Test connection
if __name__ == "__main__" and True:
    result = supabase_fbpost.insert_fb_post_date(
        fb_post_id="778310428707542_122107825389063521",
        announcement_id="1298"
    )
    print(result)