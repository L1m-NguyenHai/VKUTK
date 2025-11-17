# VKU Toolkit - Hệ thống Quản lý Thông tin Sinh viên

Ứng dụng desktop (Tauri + React) hỗ trợ sinh viên VKU quản lý thông tin học tập với hệ thống plugin mở rộng.

## 🎯 Tính năng chính

- 🔐 **Multi-user Authentication** - Đăng nhập/đăng ký với Supabase Auth, mỗi user có dữ liệu riêng
- 📚 **Quản lý Sinh viên** - Scrape và lưu thông tin từ VKU portal
- 📊 **Bảng điểm** - Hiển thị điểm số với xếp loại A/B/C/D/F, responsive design
- 📈 **Tiến độ Học tập** - Tổng hợp theo học kỳ với cache 5 phút
- 🔌 **Plugin System (Cogs)** - Mở rộ tính năng dễ dàng, hỗ trợ n8n webhook
- 💬 **Chatbot Integration** - Chat panel tích hợp n8n chatbot webhook
- 🎨 **Dark/Light Mode** - Giao diện responsive, mobile-first
- 🔄 **Session Management** - Capture và tái sử dụng VKU session
- 🛡️ **Privacy Consent** - Yêu cầu đồng ý trước khi scrape dữ liệu

## 📁 Cấu trúc Dự án

```
Tauri-VKUTK/
├── Backend/                          # API Server (FastAPI)
│   ├── main.py                      # Entry point - Auto-load plugins
│   ├── cog_loader.py                # Plugin loader
│   ├── auth_utils.py                # JWT token validation
│   ├── requirements.txt              # Dependencies
│   ├── cogs/                        # 🔌 Plugin System
│   │   ├── base_cog.py             # Base class cho plugins
│   │   ├── example_cog.py          # Template plugin
│   │   └── n8n_webhook_cog.py      # N8N integration
│   ├── Supabase/                    # Database repositories
│   │   ├── client.py               # Supabase singleton
│   │   ├── base.py                 # BaseRepository (CRUD)
│   │   ├── SinhVien.py             # Student repo
│   │   ├── Diem.py                 # Grade repo
│   │   └── TienDoHocTap.py         # Progress repo
│   └── ManualScrape/
│       └── VKU_scraper/
│           ├── scraper.py          # VKU scraper manager
│           ├── vku_scraper.py      # Core scraper
│           └── session_get.py      # Session capture
│
├── Frontend/                        # UI (React + Tauri)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatbotPanel.tsx      # 💬 Chatbot UI
│   │   │   └── ToggleSwitch.tsx
│   │   └── pages/
│   │       ├── PluginsPage.tsx         # Plugin manager UI
│   │       ├── SessionCapturePage.tsx  # Session + API config
│   │       ├── StudentInfoPage.tsx     # Student info + grades
│   │       └── SettingsPage.tsx
│   └── src-tauri/
│
└── README.md
```

## 🗄️ Database Schema (Supabase)

### 📋 Bảng `SinhVien`

```sql
- StudentID (text) - PK
- ho_va_ten (varchar)
- lop (varchar)
- khoa (varchar)
- chuyen_nganh (varchar)
- khoa_hoc (varchar)
- user_id (uuid) - FK → auth.users (Multi-user support)
```

### 📊 Bảng `Diem`

```sql
- id (bigint) - PK
- StudentID (text) - FK → SinhVien
- TenHocPhan (text)
- SoTC (smallint)
- DiemT10 (float4)
- HocKy (text)
- user_id (uuid) - FK → auth.users
```

### 📈 Bảng `TienDoHocTap`

```sql
- id (bigint) - PK
- StudentID (text) - FK → SinhVien
- TenHocPhan (text)
- HocKy (smallint)
- BatBuoc (boolean)
- DiemT4 (text)
- DiemChu (text)
- SoTC (smallint)
- user_id (uuid) - FK → auth.users
```

### 🔐 Row Level Security (RLS)

Mỗi user chỉ thấy dữ liệu của mình. Chạy migration này trong Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE "SinhVien" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Diem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TienDoHocTap" ENABLE ROW LEVEL SECURITY;

-- Policies: User chỉ CRUD data của mình
CREATE POLICY "Users can CRUD own data" ON "SinhVien"
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own grades" ON "Diem"
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own progress" ON "TienDoHocTap"
  FOR ALL USING (auth.uid() = user_id);
```

## 🚀 Cách Chạy

### Prerequisites

- Python 3.10+
- Node.js 18+
- pnpm (or npm)
- Supabase account + credentials

### Backend Setup

1. **Cài dependencies**

```bash
cd Backend
pip install -r requirements.txt
```

2. **Config environment**

```bash
# Tạo file .env
cat > .env << EOF
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
EOF
```

3. **Chạy API server**

```bash
python main.py
# Server chạy tại: http://127.0.0.1:8000
```

### Frontend Setup

1. **Cài dependencies**

```bash
cd Frontend
pnpm install
```

2. **Chạy dev server (web)**

```bash
pnpm dev
# Tauri dev server: http://localhost:5173
```

3. **Build Tauri app**

```bash
pnpm tauri build
```

## 📡 API Endpoints

### 🔐 Authentication

```
POST   /api/auth/signup          # Đăng ký user mới
POST   /api/auth/signin          # Đăng nhập
POST   /api/auth/signout         # Đăng xuất
GET    /api/auth/user            # Get user info (require token)
POST   /api/auth/refresh         # Refresh token
POST   /api/auth/reset-password  # Reset password email
```

### 📝 Session Management

```
POST   /api/capture-session      # Mở browser để login VKU
GET    /api/check-session        # Check session tồn tại
DELETE /api/session              # Xóa session
```

### 👥 Students & Grades

```
GET    /api/students             # Danh sách sinh viên (của user)
GET    /api/students/{id}        # Thông tin sinh viên
GET    /api/students/{id}/grades # Điểm của sinh viên
POST   /api/scrape-and-sync      # Scrape data từ VKU
```

### 🔌 Plugins

```
GET    /api/plugins              # List tất cả plugins
POST   /api/plugins/{id}/reload  # Reload plugin
GET    /api/plugins/{id}/*        # Plugin routes (auto-loaded)
```

### 🔌 Plugin Routes

- `POST /api/plugins/example/echo` - Echo message
- `POST /api/plugins/n8nchatbot/send` - Send message to N8N chatbot
- `GET /api/plugins/n8nchatbot/` - Get chatbot info
- `GET /api/plugins/n8nchatbot/logs` - View message logs
- `POST /api/plugins/n8nwebhook/trigger` - N8N webhook endpoint
- `GET /api/plugins/n8nwebhook/logs` - View webhook logs

## 🔄 Workflow Sử Dụng

### 1. Đăng ký/Đăng nhập

1. Mở app → Trang login
2. Đăng ký tài khoản hoặc đăng nhập
3. Token tự động lưu vào localStorage

### 2. Capture VKU Session

1. Vào trang **Session Capture**
2. Cấu hình API endpoint (nếu cần)
3. Click **"Capture"** → Browser mở
4. Đăng nhập VKU → Session auto-save

### 3. Scrape Dữ Liệu

1. Vào trang **Student Info**
2. ✅ Tick checkbox đồng ý privacy
3. Click **"Scrape Data"**
4. Xem progress realtime
5. Data tự động lưu vào Supabase (gắn user_id)

### 4. Xem Dữ Liệu

- Tab **Sinh viên**: Thông tin cá nhân
- Tab **Điểm**: Bảng điểm với xếp loại A/B/C/D/F
- Tab **Tiến độ**: Tổng hợp theo học kỳ
- Cache 5 phút → Click Refresh để reload

### 5. Quản lý Plugins

1. Vào trang **Plugins**
2. Xem danh sách plugins đã load
3. Click **Reload** để reload plugin
4. Click **API** để xem endpoints

## 📚 Repository Pattern

Mỗi bảng có 1 repository class với các function CRUD:

```python
# SinhVien Repository
sinh_vien_repo.get_all_students()
sinh_vien_repo.get_student_by_id("SV123")
sinh_vien_repo.create_student(data)
sinh_vien_repo.update_student("SV123", data)
sinh_vien_repo.delete_student("SV123")
sinh_vien_repo.search_student_by_name("Nguyễn")
sinh_vien_repo.get_students_by_class("D20TTNC")
sinh_vien_repo.get_students_by_major("Phần mềm")
sinh_vien_repo.get_students_by_faculty("CNTT")

# Diem Repository
diem_repo.get_grades_by_student("SV123")
diem_repo.create_grade(data)
diem_repo.bulk_insert_grades([data1, data2, ...])
diem_repo.get_grades_by_subject("Lập trình Python")
diem_repo.get_grades_by_semester("Học kỳ 1")
```

## 🔌 Plugin System (Cogs)

### Cách tạo Plugin mới

**1. Copy template:**

```bash
cd Backend/cogs
cp example_cog.py my_plugin_cog.py
```

**2. Sửa metadata:**

```python
from fastapi import FastAPI
from .base_cog import BaseCog, CogMetadata

class MyPluginCog(BaseCog):
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.metadata = CogMetadata(
            name="My Plugin",
            description="Mô tả plugin",
            version="1.0.0",
            author="Tên bạn",
            icon="Zap",  # Lucide icon
            color="from-blue-500 to-purple-500"
        )

    def setup(self):
        @self.router.get("/hello")
        async def hello():
            return {"message": "Hello!"}

        @self.router.post("/webhook")
        async def webhook(data: dict):
            # Xử lý webhook từ n8n
            return {"success": True}

def setup(app: FastAPI):
    cog = MyPluginCog(app)
    cog.setup()
    cog.register_routes()
    return cog
```

**3. Restart backend** → Plugin auto-load!

**4. Access:** `http://localhost:8000/api/plugins/myplugin/hello`

### N8N Webhook Integration

**Plugin sẵn có:** `n8n_webhook_cog.py`

**Cách dùng với n8n:**

1. Trong n8n workflow, thêm node **Webhook**
2. Method: `POST`
3. URL: `http://localhost:8000/api/plugins/n8nwebhook/trigger`
4. Body (JSON):

```json
{
  "event": "grade_updated",
  "data": {
    "student_id": "2051050001",
    "grade": 9.5
  }
}
```

**Endpoints:**

- `POST /api/plugins/n8nwebhook/trigger` - Main webhook
- `POST /api/plugins/n8nwebhook/grades` - Grade updates
- `GET /api/plugins/n8nwebhook/logs` - View logs

## ⚙️ Config

### Tauri Configuration

- `Frontend/src-tauri/tauri.conf.json` - Cấu hình app

### CORS Settings

- Mặc định cho phép: `localhost:1420`, `localhost:5173`, `tauri://localhost`
- Chỉnh sửa trong `Backend/main.py` → `CORSMiddleware`

## 🐛 Troubleshooting

### Lỗi: "SUPABASE_URL và SUPABASE_KEY phải được set"

```bash
# Check .env file
cat Backend/.env

# Nếu chưa có, tạo mới
echo "SUPABASE_URL=..." > Backend/.env
echo "SUPABASE_KEY=..." >> Backend/.env
```

### Lỗi: Import "Supabase" không tìm thấy

```python
# Thêm path vào sys.path
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / "Supabase"))
from Supabase import sinh_vien_repo
```

### Session hết hạn

- Xóa `session.json` và chạy lại scraper
- Sẽ yêu cầu đăng nhập lại

## 📝 Chú ý

- ❌ **Không chạy scraper trong loop** - Dễ bị block từ VKU
- ⏳ **Thêm delay** giữa các request: `time.sleep(2-3)`
- 🔒 **Lưu session cookies** để tái sử dụng
- 🚫 **Không commit `.env`** - Chứa credentials nhạy cảm

## 🎨 Frontend Features

### Design Highlights

- ✅ **Responsive**: Mobile-first với Tailwind breakpoints
- ✅ **Dark/Light Mode**: Toggle ở Header
- ✅ **Grade Classification**: A (8.5-10), B (7-8.4), C (5.5-6.9), D (4-5.4), F (<4)
- ✅ **Data Caching**: 5-minute cache để tránh spam API
- ✅ **Progress Tracking**: Real-time scrape progress với emoji icons
- ✅ **Privacy Consent**: Checkbox bắt buộc trước khi scrape
- ✅ **Tabbed Interface**: Sinh viên / Điểm / Tiến độ học tập

### API Configuration

- Session Capture page cho phép thay đổi API endpoint
- Mặc định: `http://localhost:8000`
- Có thể đổi sang server remote

## 🛡️ Security & Privacy

### Authentication

- JWT tokens với Supabase Auth
- Tokens lưu trong localStorage
- Auto-refresh khi hết hạn

### Data Isolation

- Row Level Security (RLS) trong Supabase
- Mỗi user chỉ thấy/sửa data của mình
- `user_id` foreign key CASCADE delete

### Privacy Consent

- Bắt buộc tick checkbox trước khi scrape
- Message: "Tôi đồng ý cho phép xem dữ liệu. Cam kết bảo mật."

## 🐛 Troubleshooting

### Backend không start

```bash
# Check dependencies
cd Backend
uv pip list

# Reinstall
uv pip install -r requirements.txt
```

### Frontend không connect backend

- Check API endpoint trong Session Capture page
- Backend phải chạy trước: `http://localhost:8000`
- Check CORS settings trong `main.py`

### Session hết hạn

- Vào Session Capture → Delete Session
- Capture lại session mới

### Plugin không load

- Check `Backend/cogs/` có file `.py` đúng format
- File phải có hàm `setup(app)`
- Restart backend để reload

## 💬 Chatbot Integration

### Setup

**Backend: N8N Chatbot Cog** (`Backend/cogs/n8n_chatbot_cog.py`)

Tự động load khi backend start. Kết nối tới N8N webhook: `https://n8n.group12.cloud/webhook/chat-bot`

**Frontend: Chatbot Panel** (`Frontend/src/components/ChatbotPanel.tsx`)

- Click button "Chatbot" ở sidebar để mở chat panel
- Chat panel hiển thị ở bên phải màn hình (desktop) hoặc full screen (mobile)
- Tự động gửi `message` + `auth_userid` tới backend

### API Endpoints

**POST** `/api/plugins/n8nchatbot/send`

Request body:
```json
{
  "message": "Xin chào!",
  "auth_userid": "user123"
}
```

Response:
```json
{
  "success": true,
  "status_code": 200,
  "message": "Chào bạn!",
  "response": [{"output": "Chào bạn!"}]
}
```

**GET** `/api/plugins/n8nchatbot/`

Lấy thông tin chatbot cog

**GET** `/api/plugins/n8nchatbot/logs?limit=20`

Xem lịch sử tin nhắn (tối đa 100 lưu trong memory)

### Features

- ✅ Real-time message display
- ✅ User & bot message distinction (blue/gray)
- ✅ Timestamps for each message
- ✅ Loading indicator while waiting for response
- ✅ Auto-scroll to latest message
- ✅ Dark/Light mode support
- ✅ JSON response parsing (handles `[{"output":"..."}]` format)
- ✅ Error handling & fallback messages
- ✅ User context (sends authenticated user ID)

### Testing with Postman

Sử dụng Postman để test:

```
POST http://localhost:8000/api/plugins/n8nchatbot/send
Content-Type: application/json

{
  "message": "Chào bot",
  "auth_userid": "student_001"
}
```

---

## 👥 Contributing

### Team Workflow

1. Mỗi thành viên tạo branch: `feature/my-feature`
2. Tạo plugin riêng trong `Backend/cogs/my_cog.py`
3. Test local
4. Create PR (1 file cog, không conflict)
5. Merge → Auto-load

### Code Standards

- Python: PEP 8
- TypeScript: ESLint rules
- Commits: Conventional commits format

## 📄 License

MIT License - VKU Toolkit Team

---

**Last Updated:** November 17, 2025
