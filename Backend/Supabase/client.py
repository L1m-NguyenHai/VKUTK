import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

class SupabaseClient:
    """Supabase Client Singleton"""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Khởi tạo Supabase client"""
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_KEY")
        
        if not self.url or not self.key:
            raise ValueError("❌ SUPABASE_URL và SUPABASE_KEY phải được set trong .env")
        
        self.client: Client = create_client(self.url, self.key)
        print("[OK] Supabase client initialized: " + self.url)
    
    def get_client(self) -> Client:
        """Lấy Supabase client"""
        return self.client

# Singleton instance
supabase_client = SupabaseClient()
