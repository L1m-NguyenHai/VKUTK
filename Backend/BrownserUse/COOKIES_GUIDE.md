# BrowserUse + Cookies Integration Guide

## ✅ Yes, BrowserUse Can Use Cookies!

BrowserUse can leverage cookies for automated login in several ways:

---

## 🔧 Method 1: Updated `main.py` (Recommended)

The updated `main.py` now:

1. Loads cookies from `ManualScrape/cookies.csv`
2. Converts them to Netscape format for browser compatibility
3. Passes cookie context to the AI agent
4. Agent automatically injects cookies before navigation

### Usage:

```bash
python main.py
```

**What happens:**

- ✅ Loads 9 cookies
- ✅ Saves as `cookies.txt` (Netscape format)
- ✅ AI agent reads cookies context
- ✅ Navigates to VKU portal (already logged in!)
- ✅ Extracts requested data

---

## 🔧 Method 2: `login_with_cookies_browseruse.py` (Advanced)

More direct cookie injection with better error handling.

### Usage - With Cookie Injection:

```bash
python login_with_cookies_browseruse.py
```

### Usage - Simple Mode (Let Agent Handle Cookies):

```bash
python login_with_cookies_browseruse.py simple
```

**Features:**

- ✅ Loads cookies from CSV
- ✅ Validates cookie format
- ✅ Injects into browser instance
- ✅ Error handling & retry logic
- ✅ Result parsing (JSON extraction)

---

## 📋 How Cookies Are Used

### Step 1: Load Cookies

```python
def load_cookies_from_csv(csv_path):
    cookies = {}
    # Read from CSV...
    return cookies  # {'laravel_session': 'xxx', 'XSRF-TOKEN': 'yyy', ...}
```

### Step 2: Convert to Browser Format

```python
# Netscape format (used by many tools):
# .vku.udn.vn	TRUE	/	TRUE	1797465600	cookie_name	cookie_value
```

### Step 3: Inject into Browser

```python
# BrowserUse browser instance automatically receives:
# - Cookies in context
# - Browser loads with authenticated session
# - No login page needed!
```

### Step 4: AI Agent Extracts Data

```python
task = """
Navigate to VKU portal (already logged in with cookies)
Extract: announcements, schedule, grades, etc.
Return as JSON
"""
```

---

## 🎯 Setup Instructions

### 1. Copy Cookies

The cookies are in `ManualScrape/cookies.csv`:

```bash
cd Backend
cp ManualScrape/cookies.csv BrownserUse/cookies.csv
```

Or BrowserUse will automatically find them.

### 2. Install Dependencies

```bash
pip install google-generativeai browser-use python-dotenv
```

### 3. Set Up Environment

Create `.env` in `BrownserUse/`:

```
GOOGLE_API_KEY=your_api_key_here
```

### 4. Run the Script

```bash
python main.py
```

---

## 📊 What Each Script Does

| Script                             | Purpose                     | Cookies             |
| ---------------------------------- | --------------------------- | ------------------- |
| `main.py`                          | Main BrowserUse entry point | ✅ Uses cookies     |
| `login_with_cookies_browseruse.py` | Advanced cookie injection   | ✅ Direct injection |
| `login_simple.py` (ManualScrape)   | Simple requests-based login | ✅ Verified working |

---

## ✨ Workflow Overview

```
┌─────────────────────────────────────┐
│  Load Cookies from CSV              │
│  (9 cookies: CF, Laravel, XSRF)     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  BrowserUse Initializes             │
│  - Chrome/Edge browser              │
│  - Injects cookies                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  AI Agent Receives Task             │
│  "Extract VKU announcements"         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Navigate to VKU Portal             │
│  (Already authenticated!)            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Extract Data                       │
│  - Announcements                    │
│  - Dates, Content                   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Return Results as JSON             │
│  (Ready to use!)                    │
└─────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: "cookies.csv not found"

**Solution:**

```bash
# Copy from ManualScrape
cp ../ManualScrape/cookies.csv ./cookies.csv
```

### Issue: "GOOGLE_API_KEY not set"

**Solution:**

1. Get API key from https://makersuite.google.com/app/apikey
2. Create `.env` in BrownserUse folder:
   ```
   GOOGLE_API_KEY=your_key_here
   ```
3. Run again

### Issue: "Could not reach VKU portal"

**Solution:**

```bash
# Test connectivity first
cd ../ManualScrape
python check_network.py
```

### Issue: Agent "forgets" to log in

**Solution:**

- Make sure task explicitly mentions cookies
- Cookies might be expired - refresh them
- Try `login_simple.py` to verify cookies still work

---

## 🚀 Example: Extract Student Schedule

```python
task = """
1. Go to https://daotao.vku.udn.vn/sv
2. Click on "Lịch học" (Schedule)
3. Extract all classes for this semester
4. Return as JSON: [{subject, time, room, lecturer}, ...]
"""

agent = Agent(task=task, llm=llm)
result = await agent.run()
```

---

## 📝 Example: Extract Grades

```python
task = """
1. Navigate to grades page
2. Get all grades for current semester
3. Return: {subject: grade, credits, ...}
"""
```

---

## 💾 Saved Files

After running scripts:

- `cookies.txt` - Netscape format cookies (for reference)
- Browser cache/cookies - Stored in browser instance
- Results - Printed to console & can be saved to JSON

---

## ✅ Summary

**BrowserUse + Cookies = Fully Automated VKU Portal Access**

- ✅ Load cookies from CSV
- ✅ Inject into browser automatically
- ✅ AI agent navigates authenticated portal
- ✅ Extract any data you need
- ✅ No manual login required!

Ready to extract VKU data? 🎯
