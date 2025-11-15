# VKU Toolkit - Authentication Setup Guide

## ✅ Authentication System Complete

VKU Toolkit hiện đã có hệ thống authentication hoàn chỉnh với Supabase!

## 🎉 Features

### Backend (Python + FastAPI)

- ✅ User registration (sign up)
- ✅ User login (sign in)
- ✅ User logout (sign out)
- ✅ Get user info from token
- ✅ Refresh access token
- ✅ Password reset email
- ✅ Update user information
- ✅ Session management

### Frontend (React + TypeScript)

- ✅ Login page với form validation
- ✅ Register page với password confirmation
- ✅ AuthContext để quản lý auth state
- ✅ Protected routes (require login)
- ✅ Auto-redirect khi chưa đăng nhập
- ✅ Sidebar hiển thị user info và sign out
- ✅ LocalStorage để lưu session
- ✅ Auto refresh token khi hết hạn

## 📦 Installation

### 1. Install Frontend Dependencies

```powershell
cd Frontend
pnpm add react-router-dom
pnpm add -D @types/react-router-dom
```

### 2. Setup Supabase Authentication

Vào Supabase Dashboard:

1. **Authentication Settings**

   - Go to: Authentication > Settings
   - Enable Email provider
   - Configure email templates (optional)
   - Set redirect URLs (for password reset):
     - `http://localhost:1420`
     - `http://localhost:5173`

2. **Enable RLS (Row Level Security)** - Optional
   - Nếu muốn bảo mật data theo user
   - Tạo policies cho các bảng SinhVien, Diem, etc.

## 🚀 Usage

### Backend API Endpoints

```
POST   /api/auth/signup          # Register new user
POST   /api/auth/signin          # Login
POST   /api/auth/signout         # Logout
GET    /api/auth/user            # Get current user
POST   /api/auth/refresh         # Refresh token
POST   /api/auth/reset-password  # Send reset email
PUT    /api/auth/user            # Update user info
```

### Example API Calls

#### Sign Up

```bash
curl -X POST http://127.0.0.1:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "metadata": {
      "full_name": "Nguyen Van A"
    }
  }'
```

#### Sign In

```bash
curl -X POST http://127.0.0.1:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Frontend Usage

#### 1. Wrap App with AuthProvider (Already done in App.tsx)

```tsx
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return <AuthProvider>{/* Your app */}</AuthProvider>;
}
```

#### 2. Use Auth in Components

```tsx
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { user, signIn, signUp, signOut } = useAuth();

  // Sign in
  await signIn("email@example.com", "password");

  // Sign up
  await signUp("email@example.com", "password", { full_name: "Name" });

  // Sign out
  await signOut();

  // Check user
  if (user) {
    console.log("Logged in:", user.email);
  }
}
```

#### 3. Protected Routes (Already implemented)

Routes yêu cầu đăng nhập sẽ tự động redirect về `/login`:

- `/` - Home (Plugins page)
- `/info` - Student info
- `/session` - Session capture
- `/settings` - Settings

Public routes:

- `/login` - Login page
- `/register` - Register page

## 🔒 Security Notes

1. **Password Requirements**

   - Minimum 6 characters (enforced by Supabase)
   - Frontend validates before sending to API

2. **Session Storage**

   - Access token và refresh token được lưu trong localStorage
   - Session tự động refresh khi token hết hạn
   - Token được clear khi sign out

3. **API Security**
   - Tất cả protected endpoints cần access token
   - Backend validate token qua Supabase
   - CORS đã được config cho Tauri

## 🧪 Testing

### Test Auth Flow

1. **Start Backend**

```powershell
cd Backend
uv run uvicorn main:main --reload --host 127.0.0.1 --port 8000
```

2. **Start Frontend**

```powershell
cd Frontend
pnpm install  # Install react-router-dom first
pnpm run tauri dev
```

3. **Test Registration**

   - Open app → Should redirect to `/login`
   - Click "Sign up"
   - Fill form and submit
   - Should redirect to home page

4. **Test Login**

   - Sign out from sidebar
   - Should redirect to `/login`
   - Enter credentials
   - Should redirect to home page

5. **Test Protected Routes**
   - Navigate to different pages
   - Sign out → Should redirect to login
   - All routes should require auth

## 📁 Files Created/Modified

### Backend

- ✅ `Backend/Supabase/auth.py` - Auth repository
- ✅ `Backend/Supabase/__init__.py` - Export auth_repo
- ✅ `Backend/main.py` - Auth endpoints

### Frontend

- ✅ `Frontend/src/contexts/AuthContext.tsx` - Auth context provider
- ✅ `Frontend/src/pages/LoginPage.tsx` - Login page
- ✅ `Frontend/src/pages/RegisterPage.tsx` - Register page
- ✅ `Frontend/src/App.tsx` - Protected routes setup
- ✅ `Frontend/src/components/Sidebar.tsx` - User info + sign out

## 🐛 Troubleshooting

### Backend không start

```
ERROR: Attribute "main" not found in module "main"
```

✅ Fixed - Added `main = app` in main.py

### Frontend không redirect

- Check AuthProvider wrapped around Router
- Check ProtectedRoute component
- Check localStorage has session

### Supabase errors

- Check `.env` có đúng SUPABASE_URL và SUPABASE_KEY
- Check Supabase dashboard Authentication enabled
- Check network connection

## 🎯 Next Steps

- [ ] Thêm "Remember me" checkbox
- [ ] Thêm "Forgot password" flow
- [ ] Thêm email verification
- [ ] Thêm social login (Google, Facebook)
- [ ] Thêm user profile page
- [ ] Thêm change password
- [ ] Thêm RLS policies cho data security

## 👨‍💻 Developer

Authentication system by **L1m-NguyenHai**

---

Happy coding! 🚀🔐
