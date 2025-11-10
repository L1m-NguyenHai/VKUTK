# VKU VKUTK - VKU Tools Kit

Ứng dụng desktop (Tauri + React) 

## 🎯 Tính năng chính hiện tại

- 📚 **Quản lý Sinh viên** - Lấy và lưu thông tin sinh viên
- 📊 **Quản lý Điểm** - Theo dõi điểm số các môn học
- 📈 **Tiến độ Học tập** - (Sắp tới)
- 🔄 **Đồng bộ dữ liệu** - Kết nối với Supabase
- 🌐 **Giao diện thân thiện** - React + Tailwind CSS

## 📁 Cấu trúc Dự án

```
Tauri-VKUTK/
├── Backend/                          # API Server (FastAPI)
│   ├── main.py                      # Entry point - API chính
│   ├── UI_main.py                   # UI CLI để test
│   ├── requirements.txt              # Dependencies
│   ├── Supabase/                    # Database management
│   │   ├── __init__.py
│   │   ├── client.py                # Supabase client (singleton)
│   │   ├── base.py                  # BaseRepository (CRUD chung)
│   │   ├── SinhVien.py              # Repository sinh viên
│   │   ├── Diem.py                  # Repository điểm
│   │   └── TienDoHocTap.py          # Repository tiến độ học tập
│   └── ManualScrape/
│       └── VKU_scraper/
│           ├── scraper_to_supabase.py  # Main scraper (integrate với Supabase)
│           ├── hoc_phan.py             # Scrape điểm (deprecated)
│           ├── thong_tin_ca_nhan.py    # Scrape info (deprecated)
│           ├── tong_ket.py             # Scrape summary (deprecated)
│           └── session_get.py          # Quản lý session
│
├── Frontend/                        # UI (React + Tauri)
│   ├── src/
│   │   ├── main.tsx                 # Entry point
│   │   ├── App.tsx                  # Main app
│   │   ├── components/              # React components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── PluginCard.tsx
│   │   │   └── ToggleSwitch.tsx
│   │   └── pages/                   # Pages
│   │       ├── PluginsPage.tsx
│   │       ├── SchedulePage.tsx
│   │       ├── SessionCapturePage.tsx
│   │       ├── SettingsPage.tsx
│   │       └── StudentInfoPage.tsx
│   ├── src-tauri/                   # Tauri config
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                        # File này
```

## 🗄️ Database Schema (Supabase)

### 📋 Bảng `SinhVien`
```
- StudentID (text) - PK
- ho_va_ten (varchar)
- lop (varchar)
- khoa (varchar)
- chuyen_nganh (varchar)
- khoa_hoc (varchar)
```

### 📊 Bảng `Diem`
```
- id (bigint) - PK
- StudentID (text) - FK → SinhVien
- TenHocPhan (text)
- SoTC (smallint)
- DiemT10 (real)
- HocKy (text)
```

### 📈 Bảng `TienDoHocTap` (Tạm thời)
```
- id (bigint) - PK
- StudentID (text) - FK → SinhVien
- TenHocPhan (text)
- HocKy (smallint)
- BatBuoc (boolean)
- DiemT4 (text)
- DiemChu (text)
- SoTC (smallint)
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

### Session Management
- `POST /api/capture-session` - Capture browser session
- `GET /api/check-session` - Kiểm tra session tồn tại
- `GET /` - Health check

## 🔄 Workflow - Scrape và Lưu Data

### 1. Scrape Data
```python
from Backend.ManualScrape.VKU_scraper.scraper_to_supabase import main

main()  # Chạy scraper
```

**Luồng:**
1. Mở browser → Đăng nhập VKU
2. Lấy thông tin cá nhân → Insert `SinhVien`
3. Lấy dữ liệu điểm → Insert `Diem`
4. Lưu session cookies

### 2. Sử dụng Data
```python
from Backend.Supabase import sinh_vien_repo, diem_repo

# Lấy sinh viên
student = sinh_vien_repo.get_student_by_id("SV123")

# Lấy điểm
grades = diem_repo.get_grades_by_student("SV123")

# Thêm sinh viên
sinh_vien_repo.create_student({
    "StudentID": "SV123",
    "ho_va_ten": "Nguyễn Văn A",
    "lop": "D20TTNC",
    "khoa": "CNTT",
    "chuyen_nganh": "Phần mềm",
    "khoa_hoc": "2020"
})
```

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

## 🔧 Development

### Add New Feature

1. **Tạo function trong folder con**
```python
# Backend/ManualScrape/VKU_scraper/new_feature.py
def scrape_something():
    # Chỉ implement function, không chạy main
    pass
```

2. **Gọi từ main.py**
```python
# Backend/main.py
from Backend.ManualScrape.VKU_scraper.new_feature import scrape_something

@app.post("/api/new-endpoint")
async def new_endpoint():
    result = scrape_something()
    return result
```

3. **Frontend gọi API**
```typescript
// Frontend/src/pages/SomePage.tsx
const response = await fetch("http://localhost:8000/api/new-endpoint", {
    method: "POST"
});
```

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

## 🛣️ Roadmap

- [ ] Hoàn thành `TienDoHocTap` scraper
- [ ] Thêm endpoint quản lý sinh viên (CRUD)
- [ ] UI để view/edit dữ liệu
- [ ] Export PDF/Excel
- [ ] Notification system
- [ ] Mobile app (React Native)

## 👥 Team

- L1m-NguyenHai - Repository owner

## 📄 License

MIT License

---

**Last Updated:** November 10, 2025
