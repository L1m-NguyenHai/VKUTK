# Quick Start - VKU Session Capture Tauri App

## 1. Install Dependencies

```bash
cd d:\VKUTK\Frontend
pnpm install
```

## 2. Run Development Server

```bash
pnpm tauri dev
```

This will:
- Start the Vite dev server
- Launch the Tauri application window
- Enable hot-reload for code changes

## 3. Use the Session Capture Feature

1. Click on **"Session"** in the left sidebar
2. The default paths should be pre-filled:
   - Python Script: `d:\VKUTK\Backend\ManualScrape\VKU_scraper\scripts\session_get.py`
   - Session File: `session.json`
3. Click **"Capture Session"** button
4. A browser window will open to the VKU login page
5. Log in with your VKU credentials
6. Press Enter in the console when done
7. Your session will be saved automatically

## 4. Verify Session

Click **"Check Session"** to verify the session file was created successfully.

## Build for Production

```bash
pnpm tauri build
```

The executable will be in `src-tauri/target/release/`.

## Troubleshooting

**Module not found errors?**
```bash
pnpm install
```

**Python script not found?**
- Ensure the path is correct in the UI
- Or update the default in `src/pages/SessionCapture.tsx`

**Playwright issues?**
```bash
pip install playwright
playwright install chromium
```

## Architecture Overview

```
Tauri App
├── Frontend (React + TypeScript)
│   └── SessionCapture.tsx (UI)
├── Backend (Rust)
│   └── lib.rs (Commands)
└── Python Script
    └── session_get.py (Execution)
```

The frontend sends commands to Rust, which executes the Python script and returns results.
