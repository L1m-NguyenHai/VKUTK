"""
VKU Grade Scraper - Interactive UI
Chạy file này để test scraper với giao diện đẹp
"""

import os
import sys
from pathlib import Path

# Fix encoding for Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import box
import time
from playwright.sync_api import sync_playwright
import json

# Add paths
sys.path.append(os.path.join(os.path.dirname(__file__), 'ManualScrape/VKU_scraper'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'Supabase'))

from vku_scraper import load_session, save_session
from Supabase import sinh_vien_repo, diem_repo, tien_do_hoc_tap_repo

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

def get_session_path():
    """Lấy đường dẫn session file"""
    base_dir = Path(__file__).parent
    sessions_dir = base_dir.parent / "Frontend" / "Sessions"
    sessions_dir.mkdir(parents=True, exist_ok=True)
    return sessions_dir / "session.json"

def check_session_status():
    """Kiểm tra trạng thái session"""
    session_path = get_session_path()
    
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
        students = sinh_vien_repo.get_all_students()
        table.add_row("Connection", "✅ Connected")
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
        "[2] 💾 Lưu HTML trang tiến độ học tập",
        "[3] 🔍 Xem nội dung trang tiến độ học tập",
        "[4] 📊 Crawl dữ liệu hoàn chỉnh",
        "[5] 👥 Quản lý SinhVien (CRUD)",
        "[6] 🔄 Làm mới trạng thái",
        "[0] ❌ Thoát"
    ]
    
    for option in options:
        console.print(f"  {option}")
    
    console.print()

def get_session_from_browser():
    """Lấy session từ browser - user đăng nhập"""
    console.print("\n[cyan]🔐 Đang mở browser để đăng nhập...[/cyan]\n")
    
    session_path = get_session_path()
    vku_login_url = "https://daotao.vku.udn.vn/sv"
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context()
            page = context.new_page()
            
            page.goto(vku_login_url)
            console.print("[yellow]⏳ Đang chờ đăng nhập... (timeout: 5 phút)[/yellow]")
            
            # Đợi user đăng nhập thành công
            try:
                page.wait_for_url("**/sv/**", timeout=300000)  # 5 minutes
                time.sleep(2)
                
                # Lưu session
                save_session(context, str(session_path))
                console.print("[green]✅ Đã lưu session thành công![/green]\n")
                browser.close()
                return True
            except Exception as e:
                console.print(f"[red]❌ Timeout hoặc lỗi: {e}[/red]\n")
                browser.close()
                return False
                
    except Exception as e:
        console.print(f"[red]❌ Lỗi: {e}[/red]\n")
        return False

def preview_tien_do_hoc_tap():
    """Xem nội dung trang tiến độ học tập để chọn scrape đúng phần"""
    session_path = get_session_path()
    
    if not session_path.exists():
        console.print("\n[red]❌ Chưa có session. Vui lòng đăng nhập trước![/red]\n")
        return

def save_tien_do_html():
    """Lưu HTML trang tiến độ học tập vào file"""
    session_path = get_session_path()
    
    if not session_path.exists():
        console.print("\n[red]❌ Chưa có session. Vui lòng đăng nhập trước![/red]\n")
        return
    
    output_file = Path(__file__).parent / "ManualScrape" / "VKU_scraper" / "tien_do_hoc_tap.html"
    tien_do_url = "https://daotao.vku.udn.vn/sv/hoc-phan-con-lai"
    
    console.print("\n[cyan]💾 Đang lưu HTML trang tiến độ học tập...[/cyan]\n")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            
            # Load session
            load_session(context, str(session_path))
            
            page = context.new_page()
            page.goto(tien_do_url)
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            
            # Lưu HTML
            html_content = page.content()
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(html_content)
            
            console.print(f"[green]✅ Đã lưu HTML vào: {output_file}[/green]")
            console.print(f"[green]📊 Size: {len(html_content)} bytes[/green]\n")
            
            browser.close()
            
    except Exception as e:
        console.print(f"[red]❌ Lỗi: {e}[/red]\n")
        import traceback
        traceback.print_exc()

def preview_tien_do_hoc_tap():
    """Xem nội dung trang tiến độ học tập để chọn scrape đúng phần"""
    session_path = get_session_path()
    
    if not session_path.exists():
        console.print("\n[red]❌ Chưa có session. Vui lòng đăng nhập trước![/red]\n")
        return
    
    console.print("\n[cyan]🔍 Đang tải trang tiến độ học tập...[/cyan]\n")
    
    tien_do_url = "https://daotao.vku.udn.vn/sv/hoc-phan-con-lai"
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context()
            
            # Load session
            load_session(context, str(session_path))
            
            page = context.new_page()
            page.goto(tien_do_url)
            page.wait_for_load_state("networkidle")
            time.sleep(2)
            
            console.print("\n[green]✅ Trang đã tải xong. Vui lòng kiểm tra cấu trúc HTML:[/green]\n")
            
            # Tìm các table, div, section chính
            console.print("[yellow]📋 Các thẻ chứa dữ liệu chính:[/yellow]\n")
            
            # Tìm tables
            tables = page.locator("table")
            if tables.count() > 0:
                console.print(f"  [cyan]• Tìm thấy {tables.count()} table(s)[/cyan]")
                for i in range(min(tables.count(), 3)):
                    table = tables.nth(i)
                    headers = table.locator("th")
                    if headers.count() > 0:
                        header_texts = [headers.nth(j).inner_text() for j in range(headers.count())]
                        console.print(f"    └─ Table {i+1}: {', '.join(header_texts[:5])}")
            
            # Tìm divs với class "row", "card" 
            rows = page.locator("[class*='row']")
            if rows.count() > 0:
                console.print(f"  [cyan]• Tìm thấy {rows.count()} row/card elements[/cyan]")
            
            # In ra HTML sample
            console.print("\n[yellow]📄 HTML Sample (500 ký tự):[/yellow]\n")
            html_content = page.content()[:500]
            console.print(f"[dim]{html_content}...[/dim]\n")
            
            console.print("[cyan]💡 Gợi ý: Kiểm tra browser DevTools (F12) để xác định selector chính xác[/cyan]\n")
            console.print("[green]✏️  Sau đó nhập selector vào vku_scraper.py để scrape chính xác[/green]\n")
            
            input("Nhấn Enter để đóng browser...")
            browser.close()
            
    except Exception as e:
        console.print(f"[red]❌ Lỗi: {e}[/red]\n")

def crawl_all_data():
    """Crawl dữ liệu hoàn chỉnh (SinhVien, Diem, TienDoHocTap)"""
    session_path = get_session_path()
    
    if not session_path.exists():
        console.print("\n[red]❌ Chưa có session. Vui lòng đăng nhập trước![/red]\n")
        return False
    
    console.print("\n[bold cyan]📊 CRAWL DỮ LIỆU HOÀN CHỈNH[/bold cyan]\n")
    console.print("[yellow]Sẽ scrape: SinhVien + Diem + TienDoHocTap[/yellow]\n")
    
    try:
        # Import scraper từ thư mục ManualScrape
        sys.path.insert(0, str(Path(__file__).parent / "ManualScrape" / "VKU_scraper"))
        from scraper import VKUScraperManager
        
        # Khởi tạo manager với session path
        scraper_manager = VKUScraperManager(str(session_path))
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("[green]Đang crawl dữ liệu...", total=None)
            
            # Gọi phương thức scrape_and_sync từ manager
            result = scraper_manager.scrape_and_sync()
            
            progress.stop()
        
        # Hiển thị kết quả
        if result.get("success"):
            console.print("\n[bold green]✅ Crawl thành công![/bold green]\n")
            
            table = Table(title="📊 Kết quả", box=box.ROUNDED)
            table.add_column("Thông tin", style="cyan")
            table.add_column("Giá trị", style="green")
            
            if result["data"].get("student_info"):
                table.add_row("StudentID", result["data"]["student_info"].get("StudentID", "N/A"))
                table.add_row("Họ tên", result["data"]["student_info"].get("ho_va_ten", "N/A"))
                table.add_row("Lớp", result["data"]["student_info"].get("lop", "N/A"))
            
            table.add_row("💾 Lưu Diem", f"{result['data'].get('grades_inserted', 0)}")
            table.add_row("⚠️  Lỗi Diem", f"{result['data'].get('grades_failed', 0)}")
            
            if result['data'].get('tien_do_inserted'):
                table.add_row("💾 Lưu TienDoHocTap", f"{result['data']['tien_do_inserted']}")
            if result['data'].get('tien_do_failed'):
                table.add_row("⚠️  Lỗi TienDoHocTap", f"{result['data']['tien_do_failed']}")
            
            console.print(table)
            console.print()
            return True
        else:
            console.print(f"\n[red]❌ Lỗi: {result.get('message', 'Unknown error')}[/red]\n")
            if result.get('error'):
                console.print(f"[dim]{result['error']}[/dim]")
            return False
            
    except Exception as e:
        console.print(f"\n[bold red]❌ Lỗi: {e}[/bold red]\n")
        import traceback
        traceback.print_exc()
        return False

def delete_session():
    """Xóa session file"""
    session_path = get_session_path()
    
    if session_path.exists():
        confirm = Confirm.ask("Bạn có chắc muốn xóa session?")
        if confirm:
            session_path.unlink()
            console.print("\n[green]✅ Đã xóa session[/green]\n")
    else:
        console.print("\n[yellow]⚠️  Không có session để xóa[/yellow]\n")

# ===== CRUD SinhVien =====

def list_all_students():
    """Hiển thị danh sách tất cả SinhVien"""
    try:
        students = sinh_vien_repo.get_all_students()
        
        if not students:
            console.print("\n[yellow]⚠️  Không có sinh viên trong database[/yellow]\n")
            return
        
        table = Table(title=f"📚 Danh sách SinhVien ({len(students)} bản ghi)", box=box.ROUNDED)
        table.add_column("StudentID", style="cyan")
        table.add_column("Họ tên", style="green")
        table.add_column("Lớp", style="yellow")
        table.add_column("Khoa", style="magenta")
        table.add_column("Chuyên ngành", style="blue")
        
        for student in students[:50]:  # Hiển thị tối đa 50
            table.add_row(
                student.get("StudentID", "N/A"),
                student.get("ho_va_ten", "N/A")[:20],
                student.get("lop", "N/A"),
                student.get("khoa", "N/A")[:15],
                student.get("chuyen_nganh", "N/A")[:15]
            )
        
        console.print(table)
        console.print(f"\n[dim]Hiển thị {min(len(students), 50)} / {len(students)} bản ghi[/dim]\n")
        
    except Exception as e:
        console.print(f"\n[red]❌ Lỗi: {e}[/red]\n")

def search_student():
    """Tìm kiếm sinh viên"""
    try:
        search_term = Prompt.ask("[cyan]Nhập StudentID hoặc họ tên để tìm[/cyan]")
        
        if not search_term.strip():
            console.print("\n[yellow]⚠️  Không được để trống[/yellow]\n")
            return
        
        students = sinh_vien_repo.get_all_students()
        results = []
        
        search_lower = search_term.lower()
        for student in students:
            if (search_lower in str(student.get("StudentID", "")).lower() or 
                search_lower in str(student.get("ho_va_ten", "")).lower()):
                results.append(student)
        
        if not results:
            console.print(f"\n[yellow]⚠️  Không tìm thấy: {search_term}[/yellow]\n")
            return
        
        table = Table(title=f"🔍 Kết quả tìm kiếm ({len(results)} bản ghi)", box=box.ROUNDED)
        table.add_column("StudentID", style="cyan")
        table.add_column("Họ tên", style="green")
        table.add_column("Lớp", style="yellow")
        table.add_column("Khoa", style="magenta")
        
        for student in results:
            table.add_row(
                student.get("StudentID", "N/A"),
                student.get("ho_va_ten", "N/A"),
                student.get("lop", "N/A"),
                student.get("khoa", "N/A")
            )
        
        console.print(table)
        console.print()
        
    except Exception as e:
        console.print(f"\n[red]❌ Lỗi: {e}[/red]\n")

def add_student():
    """Thêm sinh viên mới"""
    try:
        console.print("\n[bold cyan]➕ THÊM SINH VIÊN MỚI[/bold cyan]\n")
        
        student_id = Prompt.ask("[cyan]StudentID[/cyan]")
        ho_va_ten = Prompt.ask("[cyan]Họ tên[/cyan]")
        lop = Prompt.ask("[cyan]Lớp[/cyan]")
        khoa = Prompt.ask("[cyan]Khoa[/cyan]")
        chuyen_nganh = Prompt.ask("[cyan]Chuyên ngành[/cyan]", default="IT")
        khoa_hoc = Prompt.ask("[cyan]Khoá học[/cyan]", default="K45")
        
        student_data = {
            "StudentID": student_id,
            "ho_va_ten": ho_va_ten,
            "lop": lop,
            "khoa": khoa,
            "chuyen_nganh": chuyen_nganh,
            "khoa_hoc": khoa_hoc
        }
        
        result = sinh_vien_repo.create_student(student_data)
        if result:
            console.print(f"\n[green]✅ Đã thêm sinh viên: {student_id}[/green]\n")
        else:
            console.print(f"\n[red]❌ Không thể thêm sinh viên[/red]\n")
            
    except Exception as e:
        console.print(f"\n[red]❌ Lỗi: {e}[/red]\n")

def update_student():
    """Cập nhật thông tin sinh viên"""
    try:
        console.print("\n[bold cyan]✏️  CẬP NHẬT SINH VIÊN[/bold cyan]\n")
        
        student_id = Prompt.ask("[cyan]StudentID cần cập nhật[/cyan]")
        
        # Lấy thông tin hiện tại
        student = sinh_vien_repo.get_student_by_id(student_id)
        if not student:
            console.print(f"\n[red]❌ Không tìm thấy sinh viên: {student_id}[/red]\n")
            return
        
        console.print("\n[yellow]Nhập thông tin mới (để trống để giữ nguyên):[/yellow]\n")
        
        ho_va_ten = Prompt.ask("[cyan]Họ tên[/cyan]", default=student.get("ho_va_ten", ""))
        lop = Prompt.ask("[cyan]Lớp[/cyan]", default=student.get("lop", ""))
        khoa = Prompt.ask("[cyan]Khoa[/cyan]", default=student.get("khoa", ""))
        chuyen_nganh = Prompt.ask("[cyan]Chuyên ngành[/cyan]", default=student.get("chuyen_nganh", ""))
        
        update_data = {
            "ho_va_ten": ho_va_ten or student.get("ho_va_ten"),
            "lop": lop or student.get("lop"),
            "khoa": khoa or student.get("khoa"),
            "chuyen_nganh": chuyen_nganh or student.get("chuyen_nganh")
        }
        
        result = sinh_vien_repo.update_student(student_id, update_data)
        if result:
            console.print(f"\n[green]✅ Đã cập nhật: {student_id}[/green]\n")
        else:
            console.print(f"\n[red]❌ Không thể cập nhật[/red]\n")
            
    except Exception as e:
        console.print(f"\n[red]❌ Lỗi: {e}[/red]\n")

def delete_student():
    """Xóa sinh viên (xóa cascade: Diem, TienDoHocTap trước)"""
    try:
        console.print("\n[bold cyan]🗑️  XÓA SINH VIÊN[/bold cyan]\n")
        
        student_id = Prompt.ask("[cyan]StudentID cần xóa[/cyan]")
        
        student = sinh_vien_repo.get_student_by_id(student_id)
        if not student:
            console.print(f"\n[red]❌ Không tìm thấy: {student_id}[/red]\n")
            return
        
        console.print(f"\n[yellow]Sinh viên: {student.get('ho_va_ten')} - {student.get('lop')}[/yellow]")
        
        # Lấy số lượng bản ghi liên quan
        try:
            all_grades = diem_repo.get_grades_by_student(student_id) if hasattr(diem_repo, 'get_grades_by_student') else []
            grades_count = len(all_grades) if all_grades else 0
        except:
            grades_count = 0
        
        if grades_count > 0:
            console.print(f"[yellow]⚠️  Sinh viên này có {grades_count} bản ghi Diem[/yellow]")
            console.print("[yellow]💡 Dữ liệu liên quan sẽ được xóa trước[/yellow]\n")
        
        if Confirm.ask("[bold red]Bạn có chắc muốn xóa?[/bold red]"):
            try:
                # Xóa Diem trước
                if grades_count > 0:
                    console.print("[cyan]🔄 Đang xóa Diem...[/cyan]")
                    try:
                        diem_repo.delete_by_student(student_id)
                        console.print(f"[green]✅ Đã xóa {grades_count} bản ghi Diem[/green]")
                    except:
                        # Fallback: thử xóa qua table trực tiếp
                        pass
                
                # Xóa TienDoHocTap
                try:
                    console.print("[cyan]🔄 Đang xóa TienDoHocTap...[/cyan]")
                    tien_do_hoc_tap_repo.delete_by_student(student_id)
                    console.print("[green]✅ Đã xóa TienDoHocTap[/green]")
                except:
                    pass
                
                # Xóa SinhVien
                console.print("[cyan]🔄 Đang xóa SinhVien...[/cyan]")
                result = sinh_vien_repo.delete_student(student_id)
                if result:
                    console.print(f"\n[green]✅ Đã xóa sinh viên: {student_id}[/green]\n")
                else:
                    console.print(f"\n[red]❌ Không thể xóa[/red]\n")
            except Exception as e:
                console.print(f"\n[red]❌ Lỗi khi xóa: {str(e)}[/red]\n")
                console.print("[yellow]💡 Gợi ý: Kiểm tra xem repo có hỗ trợ delete_by_student() không[/yellow]\n")
        else:
            console.print("\n[yellow]Đã hủy[/yellow]\n")
            
    except Exception as e:
        console.print(f"\n[red]❌ Lỗi: {e}[/red]\n")

def manage_students():
    """Menu quản lý SinhVien"""
    while True:
        console.clear()
        console.print("[bold cyan]👥 QUẢN LÝ SINH VIÊN[/bold cyan]\n")
        
        options = [
            "[1] 📋 Xem tất cả sinh viên",
            "[2] 🔍 Tìm kiếm sinh viên",
            "[3] ➕ Thêm sinh viên mới",
            "[4] ✏️  Cập nhật sinh viên",
            "[5] 🗑️  Xóa sinh viên",
            "[0] 🔙 Quay lại"
        ]
        
        for opt in options:
            console.print(f"  {opt}")
        
        choice = Prompt.ask("\n[cyan]Chọn chức năng[/cyan]", choices=["0", "1", "2", "3", "4", "5"])
        
        if choice == "0":
            break
        elif choice == "1":
            list_all_students()
            input("\nNhấn Enter để tiếp tục...")
        elif choice == "2":
            search_student()
            input("\nNhấn Enter để tiếp tục...")
        elif choice == "3":
            add_student()
            input("\nNhấn Enter để tiếp tục...")
        elif choice == "4":
            update_student()
            input("\nNhấn Enter để tiếp tục...")
        elif choice == "5":
            delete_student()
            input("\nNhấn Enter để tiếp tục...")

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
            choices=["0", "1", "2", "3", "4", "5", "6"],
            default="4" if session_exists else "1"
        )
        
        if choice == "0":
            console.print("\n[yellow]👋 Tạm biệt![/yellow]\n")
            break
            
        elif choice == "1":
            console.print("\n[bold cyan]🔐 TẠO SESSION MỚI[/bold cyan]\n")
            if get_session_from_browser():
                console.print("[green]✅ Session đã được tạo[/green]\n")
            input("\nNhấn Enter để tiếp tục...")
            
        elif choice == "2":
            console.print("\n[bold cyan]💾 LƯU HTML TRANG TIẾN ĐỘ HỌC TẬP[/bold cyan]\n")
            save_tien_do_html()
            input("\nNhấn Enter để tiếp tục...")
            
        elif choice == "3":
            console.print("\n[bold cyan]🔍 XEM TRANG TIẾN ĐỘ HỌC TẬP[/bold cyan]\n")
            preview_tien_do_hoc_tap()
            input("\nNhấn Enter để tiếp tục...")
            
        elif choice == "4":
            crawl_all_data()
            input("\nNhấn Enter để tiếp tục...")
            
        elif choice == "5":
            manage_students()
            
        elif choice == "6":
            input("\nNhấn Enter để refresh...")
            continue

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n\n[yellow]👋 Đã hủy bởi người dùng[/yellow]\n")
    except Exception as e:
        console.print(f"\n[bold red]❌ Lỗi không mong đợi: {e}[/bold red]\n")
