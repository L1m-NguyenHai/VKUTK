"""
VKU Grade Scraper - Interactive UI
Chạy file này để test scraper với giao diện đẹp
"""

import os
import sys
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import box
import time

# Add paths
sys.path.append(os.path.join(os.path.dirname(__file__), 'ManualScrape/VKU_scraper'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'Supabase'))

from hoc_phan import main as scraper_main, session_file
from Supabase import supabase_db

console = Console()

def print_header():
    """In header đẹp"""
    console.clear()
    header = """
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║        🎓 VKU GRADE SCRAPER - INTERACTIVE UI     ║
    ║                                                   ║
    ║           Developed by L1m-NguyenHai              ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
    """
    console.print(header, style="bold cyan")

def check_session_status():
    """Kiểm tra trạng thái session"""
    # Get absolute path
    base_dir = Path(__file__).parent
    session_path = base_dir / "ManualScrape" / "VKU_scraper" / session_file
    
    table = Table(title="📊 Session Status", box=box.ROUNDED)
    table.add_column("Item", style="cyan", no_wrap=True)
    table.add_column("Status", style="magenta")
    
    if session_path.exists():
        table.add_row("Session File", "✅ Tồn tại")
        table.add_row("Path", str(session_path))
        # Get file modified time
        mtime = os.path.getmtime(session_path)
        mtime_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime))
        table.add_row("Last Modified", mtime_str)
    else:
        table.add_row("Session File", "❌ Chưa có")
        table.add_row("Action Required", "Cần đăng nhập lần đầu")
    
    console.print(table)
    return session_path.exists()

def check_database_status():
    """Kiểm tra trạng thái database"""
    table = Table(title="💾 Database Status", box=box.ROUNDED)
    table.add_column("Item", style="cyan")
    table.add_column("Value", style="green")
    
    try:
        # Test connection
        students = supabase_db.get_all_students()
        table.add_row("Connection", "✅ Connected")
        table.add_row("URL", supabase_db.url)
        table.add_row("Students Count", str(len(students)))
        
        console.print(table)
        return True
    except Exception as e:
        table.add_row("Connection", f"❌ Failed: {str(e)}")
        console.print(table)
        return False

def show_menu():
    """Hiển thị menu chính"""
    console.print("\n[bold yellow]═══ MENU CHÍNH ═══[/bold yellow]\n")
    
    options = [
        "[1] 🔐 Tạo session mới (đăng nhập)",
        "[2] 📊 Crawl điểm (dùng session hiện tại)",
        "[3] 🔄 Force login + Crawl (đăng nhập lại)",
        "[4] 📋 Xem trạng thái hệ thống",
        "[5] 🗑️  Xóa session hiện tại",
        "[0] ❌ Thoát"
    ]
    
    for option in options:
        console.print(f"  {option}")
    
    console.print()

def crawl_with_progress(force_login=False, student_id=None):
    """Crawl với progress bar"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        
        if force_login:
            task1 = progress.add_task("[cyan]Đang tạo session mới...", total=None)
            console.print("\n[yellow]⚠️  Browser sẽ mở. Vui lòng đăng nhập VKU![/yellow]\n")
        
        task2 = progress.add_task("[green]Đang crawl dữ liệu...", total=None)
        
        try:
            # Change to scraper directory (absolute path)
            original_dir = os.getcwd()
            base_dir = Path(__file__).parent
            scraper_dir = base_dir / "ManualScrape" / "VKU_scraper"
            os.chdir(scraper_dir)
            
            # Run scraper
            scraper_main(force_login=force_login, student_id=student_id)
            
            os.chdir(original_dir)
            
            console.print("\n[bold green]✅ Hoàn tất![/bold green]\n")
            return True
            
        except Exception as e:
            os.chdir(original_dir)
            console.print(f"\n[bold red]❌ Lỗi: {e}[/bold red]\n")
            return False

def delete_session():
    """Xóa session file"""
    base_dir = Path(__file__).parent
    session_path = base_dir / "ManualScrape" / "VKU_scraper" / session_file
    
    if session_path.exists():
        confirm = Confirm.ask("Bạn có chắc muốn xóa session?")
        if confirm:
            session_path.unlink()
            console.print("\n[green]✅ Đã xóa session[/green]\n")
    else:
        console.print("\n[yellow]⚠️  Không có session để xóa[/yellow]\n")

def main():
    """Main UI loop"""
    while True:
        print_header()
        
        # Show status
        console.print("\n[bold]🔍 KIỂM TRA HỆ THỐNG[/bold]\n")
        session_exists = check_session_status()
        console.print()
        db_connected = check_database_status()
        
        if not db_connected:
            console.print("\n[bold red]❌ Không thể kết nối database. Kiểm tra file .env![/bold red]")
            input("\nNhấn Enter để thử lại...")
            continue
        
        # Show menu
        show_menu()
        
        choice = Prompt.ask(
            "[bold cyan]Chọn chức năng[/bold cyan]",
            choices=["0", "1", "2", "3", "4", "5"],
            default="2" if session_exists else "1"
        )
        
        if choice == "0":
            console.print("\n[yellow]👋 Tạm biệt![/yellow]\n")
            break
            
        elif choice == "1":
            console.print("\n[bold cyan]🔐 TẠO SESSION MỚI[/bold cyan]\n")
            student_id = Prompt.ask("Student ID (optional, Enter để bỏ qua)", default="")
            crawl_with_progress(force_login=True, student_id=student_id or None)
            input("\nNhấn Enter để tiếp tục...")
            
        elif choice == "2":
            if not session_exists:
                console.print("\n[yellow]⚠️  Chưa có session. Vui lòng chọn option 1 trước![/yellow]\n")
                input("\nNhấn Enter để tiếp tục...")
                continue
                
            console.print("\n[bold cyan]📊 CRAWL ĐIỂM[/bold cyan]\n")
            student_id = Prompt.ask("Student ID (optional, Enter để bỏ qua)", default="")
            crawl_with_progress(force_login=False, student_id=student_id or None)
            input("\nNhấn Enter để tiếp tục...")
            
        elif choice == "3":
            console.print("\n[bold cyan]🔄 FORCE LOGIN + CRAWL[/bold cyan]\n")
            student_id = Prompt.ask("Student ID (optional, Enter để bỏ qua)", default="")
            crawl_with_progress(force_login=True, student_id=student_id or None)
            input("\nNhấn Enter để tiếp tục...")
            
        elif choice == "4":
            input("\nNhấn Enter để refresh...")
            continue
            
        elif choice == "5":
            delete_session()
            input("\nNhấn Enter để tiếp tục...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n\n[yellow]👋 Đã hủy bởi người dùng[/yellow]\n")
    except Exception as e:
        console.print(f"\n[bold red]❌ Lỗi không mong đợi: {e}[/bold red]\n")
