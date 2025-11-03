# Cấu trúc dự án Frontend

## 📁 Cấu trúc thư mục

```
src/
├── components/          # Các component tái sử dụng
│   ├── Header.tsx      # Component header với search và navigation
│   ├── Sidebar.tsx     # Component sidebar với menu
│   ├── ToggleSwitch.tsx # Component toggle switch
│   └── PluginCard.tsx  # Card hiển thị plugin
├── pages/              # Các trang của ứng dụng
│   ├── PluginsPage.tsx      # Trang danh sách plugins
│   ├── StudentInfoPage.tsx  # Trang thông tin sinh viên
│   ├── SettingsPage.tsx     # Trang cài đặt
│   └── SchedulePage.tsx     # Trang lịch học
├── App.tsx             # Component chính, quản lý routing và state
└── main.tsx            # Entry point của ứng dụng
```

## 🧩 Components

### Header

- Thanh header với chức năng tìm kiếm
- Nút điều hướng (back/forward)
- Nút toggle sidebar

### Sidebar

- Menu điều hướng giữa các trang
- Hiển thị logo và version
- Responsive design

### ToggleSwitch

- Component toggle switch tái sử dụng
- Sử dụng trong trang cài đặt

### PluginCard

- Card hiển thị thông tin plugin
- Icon gradient và hover effects

## 📄 Pages

### PluginsPage

- Hiển thị danh sách các plugin có sẵn
- Grid layout responsive
- Navigation đến các trang khác

### StudentInfoPage

- Hiển thị thông tin sinh viên
- Các thông tin: MSSV, Khoa, Ngành, Email, GPA

### SettingsPage

- Cài đặt giao diện (dark mode)
- Cài đặt ngôn ngữ
- Cài đặt thông báo

### SchedulePage

- Hiển thị lịch học và lịch thi
- (Component này đã tồn tại từ trước)

## 🎯 App.tsx

File chính quản lý:

- State toàn cục (dark mode, navigation history, search query)
- Routing logic giữa các trang
- Kết nối các components và pages

## ✨ Lợi ích của cấu trúc mới

1. **Tách biệt rõ ràng**: Components và Pages được tổ chức riêng biệt
2. **Dễ bảo trì**: Mỗi file có trách nhiệm rõ ràng
3. **Tái sử dụng**: Components có thể được sử dụng lại
4. **Dễ mở rộng**: Thêm pages/components mới dễ dàng
5. **Clean code**: Code ngắn gọn, dễ đọc hơn
