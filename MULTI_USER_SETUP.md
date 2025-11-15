# Multi-User Support với Supabase Auth

## 🎯 Tổng quan

VKU Toolkit giờ đã hỗ trợ multi-user! Mỗi user đăng nhập sẽ có dữ liệu riêng (sinh viên, điểm, tiến độ học tập).

## ✅ Cách hoạt động

### 1. **User đăng ký/đăng nhập**

- Supabase Auth tạo UUID duy nhất cho mỗi user
- Token được lưu trong localStorage

### 2. **User scrape dữ liệu**

- Frontend gửi Authorization header với Bearer token
- Backend extract `user_id` từ token
- Scraper tự động thêm `user_id` vào mỗi bản ghi

### 3. **User xem dữ liệu**

- Mọi API đều filter theo `user_id`
- User chỉ thấy dữ liệu của mình

## 📊 Database Schema Changes

Cần chạy migration SQL này trong Supabase:

```sql
-- Thêm cột user_id vào các bảng
ALTER TABLE "SinhVien"
ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "Diem"
ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "TienDoHocTap"
ADD COLUMN IF NOT EXISTS "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Tạo indexes để query nhanh
CREATE INDEX IF NOT EXISTS idx_sinhvien_user_id ON "SinhVien"("user_id");
CREATE INDEX IF NOT EXISTS idx_diem_user_id ON "Diem"("user_id");
CREATE INDEX IF NOT EXISTS idx_tiendohoctap_user_id ON "TienDoHocTap"("user_id");

-- Enable Row Level Security (RLS) - User chỉ thấy data của mình
ALTER TABLE "SinhVien" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Diem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TienDoHocTap" ENABLE ROW LEVEL SECURITY;

-- Policies cho SinhVien
CREATE POLICY "Users can view own data" ON "SinhVien"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON "SinhVien"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON "SinhVien"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON "SinhVien"
  FOR DELETE USING (auth.uid() = user_id);

-- Policies cho Diem
CREATE POLICY "Users can view own grades" ON "Diem"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grades" ON "Diem"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies cho TienDoHocTap
CREATE POLICY "Users can view own progress" ON "TienDoHocTap"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON "TienDoHocTap"
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 🔧 Code Changes

### Backend

#### 1. Auth Helper (`auth_utils.py`)

```python
def get_current_user_id(authorization: str = Header(None)) -> str:
    """Extract user_id from Bearer token"""
    # Validate và return user_id
```

#### 2. API Endpoints (`main.py`)

Tất cả endpoints giờ require Authorization header:

```python
@app.post("/api/scrape-and-sync")
async def scrape_and_sync(authorization: str = Header(None)):
    user_id = get_current_user_id(authorization)
    # Pass user_id to scraper
```

#### 3. Repositories (`Supabase/`)

Thêm methods filter theo user:

```python
def get_students_by_user(self, user_id: str) -> List[Dict]
def get_student_by_id_and_user(self, student_id: str, user_id: str)
def get_grades_by_student_and_user(self, student_id: str, user_id: str)
```

#### 4. Scraper (`scraper.py`)

Tự động thêm `user_id` vào data:

```python
class VKUScraperManager:
    def __init__(self, session_path: str = None, headless: bool = True, user_id: str = None):
        self.user_id = user_id

    def _insert_student(self, student_info):
        if self.user_id:
            student_info["user_id"] = self.user_id
```

### Frontend

#### StudentInfoPage.tsx

Tự động gửi Authorization header:

```typescript
const session = JSON.parse(localStorage.getItem("vku_session"));

await fetch(`${API_BASE_URL}/api/students`, {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
```

## 🔐 Security với RLS

**Row Level Security (RLS)** đảm bảo:

- User A không thể xem/sửa/xóa data của User B
- Ngay cả khi User A biết API và bypass frontend
- Bảo vệ ở database level (Supabase)

## 🧪 Testing Multi-User

### Scenario 1: User đầu tiên

```bash
1. Đăng ký account: user1@test.com
2. Đăng nhập
3. Scrape dữ liệu → Lưu với user_id của user1
4. Xem StudentInfo → Thấy data của user1
```

### Scenario 2: User thứ hai

```bash
1. Đăng ký account: user2@test.com
2. Đăng nhập
3. Xem StudentInfo → KHÔNG thấy data của user1
4. Scrape dữ liệu → Lưu với user_id của user2
5. Xem StudentInfo → Chỉ thấy data của user2
```

### Scenario 3: Switch users

```bash
1. User1 đăng nhập → Thấy data của user1
2. Sign out
3. User2 đăng nhập → Thấy data của user2
4. Sign out
5. User1 đăng nhập lại → Vẫn thấy data của user1
```

## 📋 Checklist Migration

- [ ] Chạy SQL migration trong Supabase Dashboard
- [ ] Restart backend server
- [ ] Clear localStorage trong frontend (để test lại)
- [ ] Test với 2 user accounts khác nhau
- [ ] Verify RLS policies hoạt động

## 🎯 Kết quả

✅ **Mỗi user có data riêng**  
✅ **Security ở database level (RLS)**  
✅ **Không cần code phức tạp**  
✅ **Chỉ cần Supabase Auth + user_id column**

## 💡 Notes

- `user_id` là UUID (foreign key tới `auth.users(id)`)
- `ON DELETE CASCADE`: Xóa user → Tự động xóa hết data của user đó
- RLS policies tự động enforce bởi Supabase
- Frontend chỉ cần gửi Authorization header

---

**Developed by L1m-NguyenHai** 🚀
