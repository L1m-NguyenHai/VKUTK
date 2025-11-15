# VKU Toolkit - API & Frontend Integration

## 📋 Tổng quan

VKU Toolkit đã được update với các tính năng mới:

- ✅ API scraping hoàn chỉnh trong `main.py`
- ✅ Frontend tích hợp với backend để scrape dữ liệu sinh viên
- ✅ Hiển thị thông tin sinh viên từ database

## 🚀 Cách sử dụng

### 1. Khởi động Backend

```powershell
cd Backend
uv run uvicorn main:main --reload --host 127.0.0.1 --port 8000
```

Backend sẽ chạy tại: http://127.0.0.1:8000

### 2. Khởi động Frontend

```powershell
cd Frontend
pnpm run tauri dev
```

### 3. Workflow sử dụng

#### Bước 1: Capture Session (Đăng nhập VKU)

1. Vào trang **Session Capture**
2. Click **"Capture Session"**
3. Đăng nhập vào VKU trong browser tự động mở ra
4. Sau khi đăng nhập thành công, session sẽ được lưu tự động

#### Bước 2: Scrape dữ liệu

1. Vào trang **Student Info**
2. Click **"Scrape Data"** để lấy dữ liệu từ VKU
3. Chờ vài phút để scraper hoàn thành
4. Dữ liệu sẽ được lưu vào Supabase và hiển thị

#### Bước 3: Xem dữ liệu

- Thông tin sinh viên hiển thị tự động sau khi scrape
- Click **"Refresh"** để load lại dữ liệu từ database

## 📡 API Endpoints

### Session Management

- `GET /api/check-session` - Kiểm tra session có tồn tại không
- `POST /api/capture-session` - Mở browser để đăng nhập VKU
- `DELETE /api/session` - Xóa session file
- `GET /api/session-content` - Xem nội dung session (debug)

### Scraping

- `GET /api/scrape-status` - Kiểm tra xem có thể scrape không (session ready)
- `POST /api/scrape-and-sync` - Scrape dữ liệu từ VKU và lưu vào database

### Students

- `GET /api/students` - Lấy danh sách tất cả sinh viên
- `GET /api/students/{student_id}` - Lấy thông tin một sinh viên
- `GET /api/students/{student_id}/grades` - Lấy điểm của sinh viên

### Statistics

- `GET /api/stats` - Thống kê tổng quan (số sinh viên, khoa, ngành)

## 🧪 Test API

Chạy script test để kiểm tra API:

```powershell
cd Backend
uv run python test_api.py
```

Script sẽ test các endpoint cơ bản và hiển thị kết quả.

## 🗂️ Cấu trúc thay đổi

### Backend

```
Backend/
├── main.py              # ✅ Updated với scraping endpoints
├── UI_main.py           # ✅ Test UI (optional)
├── test_api.py          # ✅ New: API test script
├── ManualScrape/
│   └── VKU_scraper/
│       ├── scraper.py   # Scraper manager
│       ├── vku_scraper.py
│       └── session_get.py
└── Supabase/
    ├── client.py
    ├── SinhVien.py
    ├── Diem.py
    └── TienDoHocTap.py
```

### Frontend

```
Frontend/
├── src/
│   └── pages/
│       ├── SessionCapturePage.tsx   # ✅ Session capture UI
│       └── StudentInfoPage.tsx      # ✅ Updated with scraping
└── Sessions/
    └── session.json                 # Session được lưu ở đây
```

## 🔧 Troubleshooting

### Backend không connect được

```powershell
# Kiểm tra xem backend có đang chạy không
curl http://127.0.0.1:8000/
```

### Session không được lưu

- Kiểm tra thư mục `Frontend/Sessions/` có tồn tại không
- Đảm bảo bạn đã đăng nhập thành công trong browser

### Scrape thất bại

1. Kiểm tra session còn hiệu lực không (có thể đã hết hạn)
2. Capture session mới
3. Thử scrape lại

### Database errors

- Kiểm tra file `.env` có đầy đủ thông tin Supabase
- Test connection bằng `UI_main.py`

## 📝 Notes

1. **Session Management**: Session được lưu tại `Frontend/Sessions/session.json` để chia sẻ giữa backend và frontend
2. **Scraping Time**: Quá trình scrape có thể mất 2-5 phút tùy vào dữ liệu
3. **Headless Mode**: Backend chạy scraper ở chế độ headless (không hiển thị browser)
4. **CORS**: Backend đã config CORS cho phép frontend gọi API

## 🎯 Next Steps

- [ ] Thêm pagination cho danh sách sinh viên
- [ ] Thêm trang xem điểm chi tiết
- [ ] Thêm trang tiến độ học tập
- [ ] Export dữ liệu sang Excel
- [ ] Caching để giảm thời gian load

## 👨‍💻 Developer

Developed by **L1m-NguyenHai**

---

Happy coding! 🚀
