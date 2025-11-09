# FastAPI Backend Setup Guide

This guide explains how to set up and run the FastAPI backend for the VKU Session Capture application.

## Prerequisites

- Python 3.8+
- Conda environment `tauri_env` (or any Python environment)
- Playwright installed

## Installation

### 1. Install Dependencies

```bash
cd d:\VKUTK\Backend\ManualScrape\VKU_scraper
pip install -r requirements.txt
```

Or if using conda:

```bash
conda activate tauri_env
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

## Running the FastAPI Server

### Option 1: Using Python directly

```bash
cd d:\VKUTK\Backend\ManualScrape\VKU_scraper
python api.py
```

### Option 2: Using the batch file (Windows)

Double-click `run_api.bat` in the VKU_scraper folder.

### Option 3: Using uvicorn directly

```bash
cd d:\VKUTK\Backend\ManualScrape\VKU_scraper
uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

## Verifying the Server

Once running, you should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Visit http://127.0.0.1:8000/docs in your browser to see the interactive API documentation.

## API Endpoints

### 1. Capture Session
- **URL**: `POST /api/capture-session`
- **Body**:
  ```json
  {
    "python_script_path": "d:\\VKUTK\\Backend\\ManualScrape\\VKU_scraper\\scripts\\session_get.py",
    "session_path": "d:\\VKUTK\\Backend\\ManualScrape\\VKU_scraper\\scripts\\session.json"
  }
  ```

### 2. Fetch Student Info
- **URL**: `POST /api/fetch-student-info`
- **Body**:
  ```json
  {
    "python_script_path": "d:\\VKUTK\\Backend\\ManualScrape\\VKU_scraper\\scripts\\thong_tin_ca_nhan_api.py",
    "session_path": "d:\\VKUTK\\Backend\\ManualScrape\\VKU_scraper\\scripts\\session.json"
  }
  ```

### 3. Check Session
- **URL**: `POST /api/check-session`
- **Body**:
  ```json
  {
    "session_path": "d:\\VKUTK\\Backend\\ManualScrape\\VKU_scraper\\scripts\\session.json"
  }
  ```

### 4. Health Check
- **URL**: `GET /api/health`
- **Response**: `{"status": "ok", "service": "VKU Session API"}`

## Workflow

1. **Start FastAPI Server**
   ```bash
   python api.py
   ```

2. **Start Tauri App**
   ```bash
   cd d:\VKUTK\Frontend
   pnpm tauri dev
   ```

3. **Use the App**
   - Go to Session tab
   - Click "Capture Session" → Login to VKU
   - Click "Check Session" → Fetches student info automatically
   - Go to "Thông tin" tab → See the fetched data

## Troubleshooting

### "Failed to connect to API"
- Make sure FastAPI server is running on `http://127.0.0.1:8000`
- Check if port 8000 is available
- Check firewall settings

### "Python script not found"
- Verify the script paths are correct
- Use absolute paths instead of relative paths

### "Session file not found"
- Make sure you've captured a session first
- Check the session file path is correct

### Playwright issues
```bash
playwright install chromium
```

## Development

For development with auto-reload:

```bash
uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

## Production

For production deployment, use a production ASGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker api:app
```
