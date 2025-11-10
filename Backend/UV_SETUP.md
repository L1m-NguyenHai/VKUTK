# Backend Setup with UV

This project uses **UV** - a fast Python package manager written in Rust.

## Installation

### 1. Install UV

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**macOS/Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Or visit: https://docs.astral.sh/uv/getting-started/installation/

### 2. Setup Virtual Environment

```bash
cd Backend
uv sync
```

This will:
- Create a virtual environment
- Install all dependencies from `pyproject.toml`
- Generate `uv.lock` with exact versions

### 3. Activate Virtual Environment

**Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
.venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

### 4. Install Playwright Browsers

```bash
uv run playwright install chromium
```

### 5. Run the API Server

```bash
uv run python api_server.py
```

The server will start at `http://127.0.0.1:8000`

## Common UV Commands

```bash
# Sync dependencies (install/update)
uv sync

# Run a command in the virtual environment
uv run python api_server.py

# Add a new dependency
uv add fastapi

# Remove a dependency
uv remove fastapi

# Update all dependencies
uv sync --upgrade

# Show installed packages
uv pip list
```

## Why UV?

- ⚡ **Fast**: 10-100x faster than pip
- 🔒 **Reliable**: Deterministic dependency resolution
- 📦 **Simple**: Single tool for all Python package management
- 🔄 **Compatible**: Works with existing Python projects

## Benefits over Conda

- Smaller footprint (no need for full conda environment)
- Faster installation and updates
- Better for CI/CD pipelines
- Easier to manage multiple projects
- No conda activation needed (uses virtual environments)

## Troubleshooting

**UV not found:**
- Make sure UV is installed and in PATH
- Restart terminal after installation

**Playwright browser not found:**
- Run: `uv run playwright install chromium`

**Virtual environment issues:**
- Delete `.venv` folder and run `uv sync` again
