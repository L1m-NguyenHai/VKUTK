# VKU Session Capture - Tauri Frontend

This is a Tauri-based desktop application that provides a GUI for capturing VKU login sessions using the `session_get.py` script.

## Features

- **Session Capture**: Launch the session capture process with a single click
- **Session Verification**: Check if a session file exists and is valid
- **Modern UI**: Built with React, TailwindCSS, and Lucide icons
- **Cross-platform**: Runs on Windows, macOS, and Linux

## Setup Instructions

### Prerequisites

- Node.js (v16+) and npm/pnpm
- Rust (for building Tauri)
- Python 3.x with Playwright installed
- Conda environment `tauri_env` (optional, for Python dependencies)

### Installation

1. **Install Node Dependencies**
   ```bash
   cd d:\VKUTK\Frontend
   pnpm install
   ```

2. **Build Rust Backend**
   The Rust backend is automatically built when you run the Tauri dev or build commands.

### Development

To run the development server:

```bash
cd d:\VKUTK\Frontend
pnpm tauri dev
```

This will:
- Start the Vite dev server on `http://localhost:5173`
- Launch the Tauri window
- Enable hot-reload for frontend changes

### Building

To create a production build:

```bash
cd d:\VKUTK\Frontend
pnpm tauri build
```

The built application will be in `src-tauri/target/release/`.

## How to Use

1. **Open the Application**: Launch the Tauri app
2. **Navigate to Session Tab**: Click on "Session" in the sidebar
3. **Configure Paths** (optional):
   - Python Script Path: Path to `session_get.py`
   - Session File Path: Where to save the session file
4. **Capture Session**: Click "Capture Session" button
5. **Complete Login**: A browser window will open - log in to your VKU account
6. **Verify**: Click "Check Session" to verify the session was saved

## Architecture

### Frontend (React + TypeScript)
- **SessionCapture.tsx**: Main UI component for session capture
- Uses `@tauri-apps/api` to communicate with the Rust backend

### Backend (Rust)
- **lib.rs**: Contains Tauri commands:
  - `capture_session`: Executes the Python script
  - `check_session_file`: Verifies session file exists

### Python Script
- **session_get.py**: Original script that:
  - Launches a browser to VKU login page
  - Waits for manual login
  - Saves session cookies/localStorage to JSON

## File Structure

```
Frontend/
├── src/
│   ├── pages/
│   │   └── SessionCapture.tsx    # Session capture UI
│   ├── components/
│   │   └── Sidebar.tsx           # Updated with session button
│   └── App.tsx                   # Updated with session route
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs               # Tauri commands
│   │   └── main.rs              # Entry point
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
├── package.json                 # Node dependencies
└── SESSION_CAPTURE_README.md    # This file
```

## Troubleshooting

### Dependencies Not Found
If you see TypeScript errors about missing modules:
```bash
pnpm install
```

### Python Script Not Found
Ensure the Python script path is correct in the UI or update the default path in `SessionCapture.tsx`.

### Playwright Issues
Make sure Playwright is installed in your Python environment:
```bash
pip install playwright
playwright install chromium
```

### Conda Environment
If using the `tauri_env` conda environment:
```bash
conda activate tauri_env
pnpm tauri dev
```

## Development Notes

- The Rust backend uses `std::process::Command` to execute Python scripts
- The frontend uses Tauri's `invoke` API to call Rust commands
- All UI styling uses TailwindCSS utility classes
- Icons are from the Lucide React library

## Future Enhancements

- [ ] Session expiry detection
- [ ] Multiple session management
- [ ] Session export/import
- [ ] Automatic session refresh
- [ ] Settings persistence
