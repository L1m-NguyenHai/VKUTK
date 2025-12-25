# VKUTK - React Native Login Setup

## 🎨 Giao diện đăng nhập đã được thiết kế

Dự án đã được thiết lập với giao diện đăng nhập đẹp mắt và kết nối với Backend.

### ✨ Các tính năng đã triển khai:

1. **Màn hình Đăng nhập** (`app/login.tsx`)

   - Thiết kế UI hiện đại với gradient và shadow
   - Validation đầu vào
   - Hiển thị/ẩn mật khẩu
   - Loading state khi đăng nhập

2. **Màn hình Đăng ký** (`app/register.tsx`)

   - Form đăng ký với xác nhận mật khẩu
   - Validation mật khẩu (tối thiểu 6 ký tự)
   - Xác thực email format

3. **AuthContext** (`contexts/AuthContext.tsx`)

   - Quản lý trạng thái authentication
   - Lưu trữ session với AsyncStorage
   - Tự động refresh khi mở app
   - Kiểm tra token expiration

4. **API Integration** (`utils/authAPI.ts`)

   - Kết nối với FastAPI backend
   - Các endpoint: signin, signup, signout, get user
   - Error handling đầy đủ

5. **Protected Routes**
   - Auto redirect đến login khi chưa authenticate
   - Auto redirect đến tabs khi đã login

### 🚀 Cách chạy:

#### 1. Cài đặt dependencies (đã hoàn tất):

```bash
cd VKUTK
pnpm install
```

#### 2. Cấu hình Backend URL:

Mở `utils/apiConfig.ts` và cập nhật URL:

- **Android Emulator**: Đã set sẵn `10.0.2.2:8000`
- **iOS Simulator**: Đổi thành `localhost:8000`
- **Real Device**: Đổi thành IP máy tính của bạn (ví dụ: `192.168.1.100:8000`)

#### 3. Khởi động Backend:

```bash
cd Backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 4. Chạy React Native App:

**Android:**

```bash
cd VKUTK
pnpm run android
```

**iOS:**

```bash
cd VKUTK
pnpm run ios
```

### 📱 Screenshots:

Màn hình đăng nhập bao gồm:

- Logo VKU ở trên cùng
- Input fields với icons
- Nút "Quên mật khẩu?"
- Nút đăng nhập với hiệu ứng shadow
- Link đăng ký

### 🔧 Cấu trúc file:

```
VKUTK/
├── app/
│   ├── index.tsx          # Initial redirect screen
│   ├── login.tsx          # Màn hình đăng nhập
│   ├── register.tsx       # Màn hình đăng ký
│   └── _layout.tsx        # Root layout với AuthProvider
├── contexts/
│   └── AuthContext.tsx    # Auth state management
└── utils/
    ├── apiConfig.ts       # API endpoints configuration
    └── authAPI.ts         # API functions
```

### 🔐 Backend API Endpoints:

Các endpoint được sử dụng:

- `POST /api/auth/signin` - Đăng nhập
- `POST /api/auth/signup` - Đăng ký
- `POST /api/auth/signout` - Đăng xuất
- `GET /api/auth/user` - Lấy thông tin user

### 📝 Lưu ý:

1. Session được lưu tự động vào AsyncStorage
2. Token sẽ được kiểm tra expiration mỗi lần mở app
3. Protected routes tự động redirect dựa trên auth state
4. Error messages được hiển thị bằng Alert

### 🎯 Tiếp theo có thể làm:

- [ ] Thêm màn hình "Quên mật khẩu"
- [ ] Thêm social login (Google, Facebook)
- [ ] Thêm biometric authentication (Face ID, Touch ID)
- [ ] Thêm onboarding screens
- [ ] Cải thiện error messages
- [ ] Thêm validation phức tạp hơn
- [ ] Theme customization (dark mode)

### 🐛 Troubleshooting:

**Lỗi kết nối API:**

- Kiểm tra backend đang chạy
- Kiểm tra URL trong `apiConfig.ts`
- Trên real device, đảm bảo cùng network với máy tính

**Lỗi AsyncStorage:**

- Clear app data và thử lại
- Restart Metro bundler

**Lỗi navigation:**

- Clear cache: `pnpm start --clear`
