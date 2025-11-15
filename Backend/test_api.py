"""
Test script cho VKU Toolkit API
"""
import requests
import json
from rich.console import Console
from rich.table import Table
from rich import box

console = Console()
BASE_URL = "http://127.0.0.1:8000"

def test_root():
    """Test root endpoint"""
    console.print("\n[cyan]Testing root endpoint...[/cyan]")
    response = requests.get(f"{BASE_URL}/")
    console.print(f"Status: {response.status_code}")
    console.print(f"Response: {response.json()}")
    return response.status_code == 200

def test_check_session():
    """Test check session endpoint"""
    console.print("\n[cyan]Testing check session...[/cyan]")
    response = requests.get(f"{BASE_URL}/api/check-session")
    console.print(f"Status: {response.status_code}")
    data = response.json()
    console.print(f"Session exists: {data.get('exists')}")
    console.print(f"Session path: {data.get('path')}")
    return response.status_code == 200

def test_scrape_status():
    """Test scrape status endpoint"""
    console.print("\n[cyan]Testing scrape status...[/cyan]")
    response = requests.get(f"{BASE_URL}/api/scrape-status")
    console.print(f"Status: {response.status_code}")
    data = response.json()
    console.print(f"Session exists: {data.get('session_exists')}")
    console.print(f"Ready to scrape: {data.get('ready')}")
    console.print(f"Message: {data.get('message')}")
    return response.status_code == 200

def test_get_students():
    """Test get students endpoint"""
    console.print("\n[cyan]Testing get students...[/cyan]")
    response = requests.get(f"{BASE_URL}/api/students")
    console.print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        console.print(f"Total students: {data.get('count', 0)}")
        
        if data.get('students'):
            table = Table(title="Students", box=box.ROUNDED)
            table.add_column("StudentID", style="cyan")
            table.add_column("Name", style="green")
            table.add_column("Class", style="yellow")
            
            for student in data['students'][:5]:  # Show first 5
                table.add_row(
                    student.get('StudentID', 'N/A'),
                    student.get('ho_va_ten', 'N/A'),
                    student.get('lop', 'N/A')
                )
            
            console.print(table)
    
    return response.status_code == 200

def test_scrape_and_sync():
    """Test scrape and sync endpoint (warning: this takes time!)"""
    console.print("\n[cyan]Testing scrape and sync...[/cyan]")
    console.print("[yellow]This may take a few minutes...[/yellow]")
    
    try:
        response = requests.post(f"{BASE_URL}/api/scrape-and-sync", timeout=300)
        console.print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            console.print(f"Success: {data.get('success')}")
            console.print(f"Message: {data.get('message')}")
            
            if data.get('data'):
                scrape_data = data['data']
                table = Table(title="Scrape Results", box=box.ROUNDED)
                table.add_column("Item", style="cyan")
                table.add_column("Value", style="green")
                
                if scrape_data.get('student_info'):
                    student = scrape_data['student_info']
                    table.add_row("StudentID", student.get('StudentID', 'N/A'))
                    table.add_row("Name", student.get('ho_va_ten', 'N/A'))
                
                table.add_row("Grades Inserted", str(scrape_data.get('grades_inserted', 0)))
                table.add_row("Grades Failed", str(scrape_data.get('grades_failed', 0)))
                table.add_row("TienDo Inserted", str(scrape_data.get('tien_do_inserted', 0)))
                table.add_row("TienDo Failed", str(scrape_data.get('tien_do_failed', 0)))
                
                console.print(table)
        else:
            console.print(f"Error: {response.json()}")
        
        return response.status_code == 200
    except requests.Timeout:
        console.print("[red]Request timeout (>5 minutes)[/red]")
        return False
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        return False

def main():
    console.print("[bold cyan]🧪 VKU Toolkit API Test Suite[/bold cyan]")
    console.print("=" * 60)
    
    tests = [
        ("Root endpoint", test_root),
        ("Check session", test_check_session),
        ("Scrape status", test_scrape_status),
        ("Get students", test_get_students),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            console.print(f"[red]Error in {test_name}: {e}[/red]")
            results.append((test_name, False))
    
    # Summary
    console.print("\n" + "=" * 60)
    console.print("[bold cyan]📊 Test Summary[/bold cyan]")
    
    summary_table = Table(box=box.ROUNDED)
    summary_table.add_column("Test", style="cyan")
    summary_table.add_column("Result", style="green")
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        summary_table.add_row(test_name, status)
    
    console.print(summary_table)
    
    # Optional: Test scrape if user wants
    console.print("\n[yellow]Note: Scrape and sync test is skipped by default (takes time)[/yellow]")
    console.print("[yellow]Run test_scrape_and_sync() manually if needed[/yellow]")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Test interrupted by user[/yellow]")
    except Exception as e:
        console.print(f"\n[red]Unexpected error: {e}[/red]")
