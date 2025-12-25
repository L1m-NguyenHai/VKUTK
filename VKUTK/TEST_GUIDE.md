# 🎯 Hướng dẫn Test Login Flow

## ✅ Checklist để test

### 1. Khởi động Backend

```bash
cd Backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend sẽ chạy tại: `http://localhost:8000`

### 2. Kiểm tra Backend đang hoạt động

Mở browser và truy cập: `http://localhost:8000/docs`
Bạn sẽ thấy Swagger UI với các API endpoints.

### 3. Cấu hình API URL cho React Native

**Nếu test trên Android Emulator:**
File `VKUTK/utils/apiConfig.ts` đã được cấu hình sẵn:

```typescript
const API_BASE_URL = "http://10.0.2.2:8000";
```

**Nếu test trên iOS Simulator:**
Sửa thành:

```typescript
const API_BASE_URL = "http://localhost:8000";
```

**Nếu test trên thiết bị thật:**

1. Tìm IP của máy tính:
   ```bash
   # Windows
   ipconfig
   # Tìm IPv4 Address (ví dụ: 192.168.1.100)
   ```
2. Sửa thành:
   ```typescript
   const API_BASE_URL = "http://192.168.1.100:8000";
   ```
3. Đảm bảo điện thoại và máy tính cùng mạng WiFi

### 4. Chạy React Native App

```bash
cd VKUTK

# Android
pnpm run android

# iOS
pnpm run ios
```

### 5. Test Flow Đăng ký

1. App sẽ tự động mở màn hình Login
2. Nhấn "Đăng ký ngay"
3. Nhập thông tin:
   - Email: `test@example.com`
   - Mật khẩu: `123456` (tối thiểu 6 ký tự)
   - Xác nhận mật khẩu: `123456`
4. Nhấn "Đăng ký"
5. Nếu thành công, sẽ thấy thông báo và quay về Login

### 6. Test Flow Đăng nhập

1. Ở màn hình Login, nhập:
   - Email: `test@example.com`
   - Mật khẩu: `123456`
2. Nhấn "Đăng nhập"
3. Nếu thành công, sẽ redirect vào Home screen
4. Thấy thông tin user và nút "Đăng xuất"

### 7. Test Flow Đăng xuất

1. Ở Home screen, nhấn nút "Đăng xuất"
2. Xác nhận đăng xuất
3. Sẽ redirect về màn hình Login

### 8. Test Session Persistence

1. Đăng nhập thành công
2. Force quit app (swipe up trên Android/iOS)
3. Mở lại app
4. App sẽ tự động đăng nhập lại (không cần nhập email/password)

## 🐛 Troubleshooting

### Lỗi: "Không thể kết nối đến server"

**Kiểm tra:**

1. Backend có đang chạy không?
2. URL trong `apiConfig.ts` có đúng không?
3. Firewall có block port 8000 không?

**Fix:**

```bash
# Windows Firewall - Allow port 8000
# Hoặc tạm thời tắt firewall để test
```

### Lỗi: Network request failed

**Trên Android Emulator:**

- Đảm bảo dùng `10.0.2.2` thay vì `localhost`

**Trên iOS Simulator:**

- Có thể dùng `localhost` trực tiếp

**Trên thiết bị thật:**

- Kiểm tra cùng mạng WiFi
- Dùng IP máy tính thay vì localhost

### Lỗi: Session không được lưu

**Fix:**

1. Uninstall app hoàn toàn
2. Clear Metro cache:
   ```bash
   cd VKUTK
   pnpm start --clear
   ```
3. Rebuild app

### Lỗi: "Invalid credentials" khi đăng nhập

**Kiểm tra:**

1. Email/password có đúng không?
2. Tài khoản đã được tạo chưa?
3. Backend có đang hoạt động không?

## 📱 Test Cases

### Test Case 1: Đăng ký thành công

- Input: Email mới, password hợp lệ
- Expected: Hiện thông báo thành công, redirect về login

### Test Case 2: Đăng ký thất bại - Email trùng

- Input: Email đã tồn tại
- Expected: Hiện lỗi "Email already exists"

### Test Case 3: Đăng ký thất bại - Password ngắn

- Input: Password < 6 ký tự
- Expected: Hiện lỗi "Mật khẩu phải có ít nhất 6 ký tự"

### Test Case 4: Đăng ký thất bại - Password không khớp

- Input: Password ≠ Confirm Password
- Expected: Hiện lỗi "Mật khẩu xác nhận không khớp"

### Test Case 5: Đăng nhập thành công

- Input: Email + password đúng
- Expected: Redirect vào home, hiện thông tin user

### Test Case 6: Đăng nhập thất bại - Sai password

- Input: Password sai
- Expected: Hiện lỗi "Invalid credentials"

### Test Case 7: Auto login khi mở lại app

- Setup: Đăng nhập thành công trước đó
- Action: Force quit và mở lại app
- Expected: Tự động vào home screen

### Test Case 8: Token expired

- Setup: Đăng nhập, đợi token hết hạn
- Action: Mở lại app
- Expected: Redirect về login

## 🎨 UI Features

### Login Screen

- ✅ Logo với icon school
- ✅ Email input với icon mail
- ✅ Password input với icon lock
- ✅ Toggle show/hide password
- ✅ "Quên mật khẩu?" link
- ✅ Login button với loading state
- ✅ "Đăng ký ngay" link

### Register Screen

- ✅ Back button
- ✅ Email input
- ✅ Password input với validation
- ✅ Confirm password input
- ✅ Toggle show/hide password
- ✅ Register button với loading state
- ✅ "Đăng nhập ngay" link

### Home Screen

- ✅ User avatar icon
- ✅ Display user email
- ✅ Display user ID
- ✅ Logout button

## 📊 Backend Endpoints

Các endpoint được test:

| Method | Endpoint            | Description        | Status |
| ------ | ------------------- | ------------------ | ------ |
| POST   | `/api/auth/signup`  | Đăng ký user mới   | ✅     |
| POST   | `/api/auth/signin`  | Đăng nhập          | ✅     |
| POST   | `/api/auth/signout` | Đăng xuất          | ✅     |
| GET    | `/api/auth/user`    | Lấy thông tin user | ✅     |

## 🚀 Next Steps

Sau khi test login flow thành công, có thể phát triển thêm:

1. **Thêm features:**

   - Quên mật khẩu
   - Đổi mật khẩu
   - Cập nhật profile
   - Upload avatar

2. **Cải thiện UI:**

   - Dark mode
   - Animations
   - Custom fonts
   - Splash screen

3. **Tính năng chính:**
   - Xem điểm
   - Xem lịch học
   - Xem thông báo
   - Chat với AI
