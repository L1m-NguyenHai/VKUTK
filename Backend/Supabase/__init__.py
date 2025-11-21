"""
Supabase Database Module
Tập hợp các repository cho các bảng trong Supabase
"""

from .client import supabase_client
from .SinhVien import sinh_vien_repo, SinhVienRepository
from .Diem import diem_repo, DiemRepository
from .TienDoHocTap import tien_do_hoc_tap_repo, TienDoHocTapRepository
from .DanhSachLopHP import danh_sach_lop_hp_repo, DanhSachLopHPRepository
from .auth import auth_repo, AuthRepository
from .course_schedule import course_schedule_repo, CourseScheduleRepository

__all__ = [
    'supabase_client',
    'sinh_vien_repo',
    'SinhVienRepository',
    'diem_repo',
    'DiemRepository',
    'tien_do_hoc_tap_repo',
    'TienDoHocTapRepository',
    'danh_sach_lop_hp_repo',
    'DanhSachLopHPRepository',
    'auth_repo',
    'AuthRepository',
    'course_schedule_repo',
    'CourseScheduleRepository',
]
