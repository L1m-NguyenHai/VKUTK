from typing import List, Dict, Optional, Any
from client import supabase_client

class BaseRepository:
    """Base class cho các repository"""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.client = supabase_client.get_client()
    
    def select_all(self) -> List[Dict[str, Any]]:
        """Lấy tất cả dữ liệu từ bảng"""
        try:
            response = self.client.table(self.table_name).select("*").execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Lỗi khi lấy dữ liệu từ {self.table_name}: {e}")
            return []
    
    def select_by_id(self, column: str, value: str) -> Optional[Dict[str, Any]]:
        """Lấy dữ liệu theo ID"""
        try:
            response = self.client.table(self.table_name).select("*").eq(column, value).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"❌ Lỗi khi lấy dữ liệu từ {self.table_name}: {e}")
            return None
    
    def insert_one(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Thêm một bản ghi"""
        try:
            response = self.client.table(self.table_name).insert(data).execute()
            print(f"✅ Thêm bản ghi vào {self.table_name} thành công")
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"❌ Lỗi khi thêm bản ghi vào {self.table_name}: {e}")
            return None
    
    def insert_many(self, data_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Thêm nhiều bản ghi"""
        try:
            response = self.client.table(self.table_name).insert(data_list).execute()
            print(f"✅ Đã thêm {len(data_list)} bản ghi vào {self.table_name}")
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Lỗi khi thêm nhiều bản ghi vào {self.table_name}: {e}")
            return []
    
    def update(self, column: str, value: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cập nhật bản ghi"""
        try:
            response = self.client.table(self.table_name).update(update_data).eq(column, value).execute()
            print(f"✅ Cập nhật bản ghi trong {self.table_name} thành công")
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"❌ Lỗi khi cập nhật bản ghi trong {self.table_name}: {e}")
            return None
    
    def delete(self, column: str, value: str) -> bool:
        """Xóa bản ghi"""
        try:
            self.client.table(self.table_name).delete().eq(column, value).execute()
            print(f"✅ Xóa bản ghi trong {self.table_name} thành công")
            return True
        except Exception as e:
            print(f"❌ Lỗi khi xóa bản ghi trong {self.table_name}: {e}")
            return False
    
    def filter_by(self, column: str, value: str) -> List[Dict[str, Any]]:
        """Lọc dữ liệu theo điều kiện"""
        try:
            response = self.client.table(self.table_name).select("*").eq(column, value).execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Lỗi khi lọc dữ liệu từ {self.table_name}: {e}")
            return []
    
    def search(self, column: str, value: str) -> List[Dict[str, Any]]:
        """Tìm kiếm dữ liệu (like)"""
        try:
            response = self.client.table(self.table_name).select("*").ilike(column, f"%{value}%").execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Lỗi khi tìm kiếm dữ liệu từ {self.table_name}: {e}")
            return []
    
    def get_count(self) -> int:
        """Lấy tổng số bản ghi"""
        try:
            response = self.client.table(self.table_name).select("id", count="exact").execute()
            return response.count if hasattr(response, 'count') else len(response.data)
        except Exception as e:
            print(f"❌ Lỗi khi lấy tổng số bản ghi từ {self.table_name}: {e}")
            return 0
