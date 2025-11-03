# VKU Cookie Login Script

A Python script that uses Selenium to automatically log into the VKU student portal (`https://daotao.vku.udn.vn/sv`) using cookies from a CSV file.

## Features

✅ **Multiple Browser Support**: Chrome, Brave, Edge, Firefox  
✅ **Automatic Cookie Injection**: Loads cookies from CSV and injects them  
✅ **Headless Mode**: Run without GUI for automation  
✅ **Screenshot Capture**: Saves login verification screenshot  
✅ **Error Handling**: Graceful fallbacks and detailed logging

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Required Files

Ensure you have `cookies.csv` in the same directory as the script. The CSV should contain:

- `name`, `value`, `domain`, `path`, `expiry`, `size`, `httpOnly`, `secure`, `sameSite`, `priority`

Example cookies.csv format:

```csv
name,value,domain,path,expiry,size,httpOnly,secure,sameSite,priority
"__cf_logged_in","1",".cloudflare.com","/","2025-11-06T01:17:10.482Z","15","","✓","","Medium"
"laravel_session","...session_token...",".vku.udn.vn","/","2025-11-04T22:50:56.344Z","299","✓","","","Medium"
```

## Usage

### Run with Edge (Default)

```bash
python login_with_cookies.py
```

### Run with Brave

```bash
python login_with_cookies.py brave
```

### Run with Firefox

```bash
python login_with_cookies.py firefox
```

### Run with Chrome

```bash
python login_with_cookies.py chrome
```

### Run in Headless Mode (No GUI)

```bash
python login_with_cookies.py edge --headless
python login_with_cookies.py brave --headless
python login_with_cookies.py firefox --headless
```

## What It Does

1. **Loads Cookies**: Reads `cookies.csv` from the same directory
2. **Launches Browser**: Starts the specified browser (Edge by default)
3. **Injects Cloudflare Cookies**: Navigates to cloudflare.com and adds CF cookies
4. **Injects VKU Cookies**: Navigates to VKU site and adds session cookies
5. **Refreshes Page**: Applies cookies and waits for page to load
6. **Captures Screenshot**: Saves `login_screenshot.png` for verification
7. **Displays Results**: Shows page title, URL, and content preview

## Output Example

```
🚀 Starting VKU login script...
   Browser: edge
   Headless: False
   Available: chrome, brave, edge, firefox

📂 Loading cookies from: D:\...\ManualScrape\cookies.csv
✅ Loaded 8 cookies

🌐 Edge browser launched

🔗 Navigating to cloudflare.com to inject Cloudflare cookies...
  ✅ Added: __cf_logged_in
  ✅ Added: _ga
  ✅ Added: CF_VERIFIED_DEVICE_22ec6a62ea4027560a3da0db2215f084f7a8837b48c6e61f0ddf2290e238c351
  ...

🔗 Navigating to https://daotao.vku.udn.vn/sv...
  ✅ Added: laravel_session
  ✅ Added: XSRF-TOKEN

🔄 Refreshing page to apply cookies...

🔍 Checking login status...
✅ Page Title: Quản lý học tập - VKU
✅ Current URL: https://daotao.vku.udn.vn/sv
📸 Screenshot saved to: D:\...\ManualScrape\login_screenshot.png

✅ Script completed successfully!
ℹ️  Browser will close in 10 seconds. Check the screenshot to verify login status.

🔒 Browser closed
```

## Browser Paths (Brave)

The script automatically searches for Brave in common Windows locations:

- `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
- `C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe`
- `C:\Users\{YourUsername}\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe`

If Brave is installed elsewhere, you can specify the path manually in the script.

## Troubleshooting

### Issue: "Brave browser not found!"

**Solution**: Install Brave from https://brave.com or check the installation path.

### Issue: "Chrome not found!" / "Edge not found!"

**Solution**: Install the respective browser. Drivers are auto-downloaded via `webdriver-manager`.

### Issue: Cookies don't load

**Solution**:

- Check that `cookies.csv` is in the same directory as the script
- Verify CSV header: `name,value,domain,path,expiry,size,httpOnly,secure,sameSite,priority`
- Run: `python -c "import csv; print(list(csv.DictReader(open('cookies.csv')))[:1])"`

### Issue: "KeyError: 'name'"

**Solution**: The CSV file may have blank lines or incorrect encoding. Re-save the cookies.csv file ensuring it starts with the header row.

## Requirements

- Python 3.8+
- selenium >= 4.15.0
- webdriver-manager >= 4.0.0
- pandas >= 2.0.0 (optional, for advanced CSV processing)

## Advanced: Extract Cookies from Browser

To extract cookies from your browser manually:

### Chrome/Edge:

1. Open DevTools (F12)
2. Go to **Application** → **Cookies**
3. Right-click and export as CSV

### Firefox:

1. Open DevTools (F12)
2. Go to **Storage** → **Cookies**
3. Use browser extension like "Export Cookies" to CSV

Then place the CSV in the same directory as `login_with_cookies.py`.

## Notes

- The script keeps the browser open for 10 seconds after login for manual verification
- Screenshots are saved as `login_screenshot.png` in the script directory
- Session cookies typically expire within hours/days; refresh them regularly
- For production automation, consider using headless mode

## License

MIT - Feel free to modify and distribute.
