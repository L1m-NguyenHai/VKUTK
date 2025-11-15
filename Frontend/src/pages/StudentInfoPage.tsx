import { useState, useEffect } from "react";
import {
  User,
  Loader2,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  GraduationCap,
  BookOpen,
  TrendingUp,
} from "lucide-react";

interface StudentInfoPageProps {
  isDarkMode: boolean;
}

interface StudentInfo {
  StudentID: string;
  ho_va_ten: string;
  lop: string;
  khoa: string;
  chuyen_nganh?: string;
  khoa_hoc?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface ScrapeResult {
  success: boolean;
  message: string;
  data?: {
    student_info?: StudentInfo;
    grades_inserted?: number;
    grades_failed?: number;
    tien_do_inserted?: number;
    tien_do_failed?: number;
  };
}

interface ScrapeProgress {
  step: string;
  status: "loading" | "success" | "error";
  message: string;
}

interface Grade {
  StudentID: string;
  MaHocPhan: string;
  TenHocPhan: string;
  SoTC: number;
  DiemTK: number | null;
  DiemThi: number | null;
  DiemTongKet: number | null;
  XepLoai: string | null;
  HocKy: number;
}

interface AcademicProgress {
  HocKy: number;
  SoTC: number;
  SoTCTichLuy: number | null;
  TBCHocKy: number | null;
  TBCTichLuy: number | null;
  XepLoaiHocLuc: string | null;
}

const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://127.0.0.1:8000";

export function StudentInfoPage({
  isDarkMode,
}: StudentInfoPageProps): JSX.Element {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [scrapeReady, setScrapeReady] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgress[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "grades" | "progress">(
    "info"
  );
  const [stats, setStats] = useState({ grades: 0, progress: 0 });
  const [grades, setGrades] = useState<Grade[]>([]);
  const [academicProgress, setAcademicProgress] = useState<AcademicProgress[]>(
    []
  );
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Check if ready to scrape
  const checkScrapeStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape-status`);
      if (response.ok) {
        const data = await response.json();
        setScrapeReady(data.ready);
      }
    } catch (error) {
      console.error("Failed to check scrape status:", error);
    }
  };

  // Load student info from database
  const loadStudentInfo = async () => {
    setIsLoading(true);
    try {
      // Get session from localStorage
      const storedSession = localStorage.getItem("vku_session");
      if (!storedSession) {
        setMessage("Please login first");
        setMessageType("error");
        setIsLoading(false);
        return;
      }

      const session = JSON.parse(storedSession);

      const response = await fetch(`${API_BASE_URL}/api/students`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.students && data.students.length > 0) {
          // Get the first student (or you can implement selection)
          const student = data.students[0];
          setStudentInfo(student);
          setMessage("Loaded student data from database");
          setMessageType("success");

          // Load grades and academic progress
          await Promise.all([
            loadGrades(student.StudentID),
            loadAcademicProgress(student.StudentID),
          ]);
        } else {
          setMessage("No student data found. Please scrape data first.");
          setMessageType("info");
        }
      } else if (response.status === 401) {
        setMessage("Session expired. Please login again.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Failed to load student info:", error);
      setMessage("Failed to connect to API");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch grades
  const loadGrades = async (studentId: string) => {
    setIsLoadingGrades(true);
    try {
      const storedSession = localStorage.getItem("vku_session");
      if (!storedSession) {
        console.error("No session found");
        return;
      }
      const session = JSON.parse(storedSession);
      const response = await fetch(
        `${API_BASE_URL}/api/students/${studentId}/grades`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGrades(data);
        setStats((prev) => ({ ...prev, grades: data.length }));
      }
    } catch (error) {
      console.error("Error loading grades:", error);
    } finally {
      setIsLoadingGrades(false);
    }
  };

  // Fetch academic progress
  const loadAcademicProgress = async (studentId: string) => {
    setIsLoadingProgress(true);
    try {
      const storedSession = localStorage.getItem("vku_session");
      if (!storedSession) {
        console.error("No session found");
        return;
      }
      const session = JSON.parse(storedSession);
      const response = await fetch(
        `${API_BASE_URL}/api/students/${studentId}/tien-do-hoc-tap`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAcademicProgress(data);
        setStats((prev) => ({ ...prev, progress: data.length }));
      }
    } catch (error) {
      console.error("Error loading academic progress:", error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  // Scrape and sync data with progress updates
  const scrapeAndSync = async () => {
    if (!scrapeReady) {
      setMessage("Please capture session first in Session Capture page");
      setMessageType("error");
      return;
    }

    setIsScraping(true);
    setScrapeProgress([]);
    setMessage("");

    const addProgress = (
      step: string,
      status: ScrapeProgress["status"],
      message: string
    ) => {
      setScrapeProgress((prev) => [...prev, { step, status, message }]);
    };

    try {
      addProgress("init", "loading", "📡 Bắt đầu scrape dữ liệu từ VKU...");

      // Get session from localStorage
      const storedSession = localStorage.getItem("vku_session");
      if (!storedSession) {
        addProgress("init", "error", "❌ Vui lòng đăng nhập trước");
        setMessage("Please login first");
        setMessageType("error");
        setIsScraping(false);
        return;
      }

      const session = JSON.parse(storedSession);

      addProgress("scrape", "loading", "🚀 Đang lấy dữ liệu từ VKU Portal...");
      addProgress("scrape-info", "loading", "📋 Đang lấy thông tin cá nhân...");

      const response = await fetch(`${API_BASE_URL}/api/scrape-and-sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result: ScrapeResult = await response.json();

      if (response.ok && result.success) {
        addProgress(
          "scrape-info",
          "success",
          "✅ Lấy thông tin sinh viên thành công"
        );
        addProgress(
          "scrape-grades",
          "success",
          `✅ Đã lấy ${result.data?.grades_inserted || 0} môn điểm`
        );
        addProgress(
          "scrape-progress",
          "success",
          `✅ Đã lấy ${result.data?.tien_do_inserted || 0} học phần tiến độ`
        );

        addProgress("save", "loading", "💾 Đang lưu dữ liệu vào database...");
        addProgress(
          "save-student",
          "success",
          "✅ Lưu thông tin sinh viên thành công"
        );
        addProgress(
          "save-grades",
          "success",
          `✅ Lưu ${result.data?.grades_inserted}/${result.data?.grades_inserted} điểm`
        );
        addProgress(
          "save-progress",
          "success",
          `✅ Lưu ${result.data?.tien_do_inserted}/${result.data?.tien_do_inserted} tiến độ`
        );

        addProgress("complete", "success", "🎉 ĐỒNG BỘ THÀNH CÔNG!");

        setMessage(result.message);
        setMessageType("success");

        // Update stats
        setStats({
          grades: result.data?.grades_inserted || 0,
          progress: result.data?.tien_do_inserted || 0,
        });

        // Update student info from scrape result
        if (result.data?.student_info) {
          setStudentInfo(result.data.student_info);
        }

        // Reload from database to get latest
        await loadStudentInfo();
      } else {
        addProgress(
          "error",
          "error",
          `❌ ${result.message || "Failed to scrape data"}`
        );
        setMessage(result.message || "Failed to scrape data");
        setMessageType("error");
      }
    } catch (error) {
      addProgress(
        "error",
        "error",
        `❌ Lỗi: ${
          error instanceof Error ? error.message : "Failed to scrape data"
        }`
      );
      setMessage(
        `Error: ${
          error instanceof Error ? error.message : "Failed to scrape data"
        }`
      );
      setMessageType("error");
    } finally {
      setIsScraping(false);
    }
  };

  useEffect(() => {
    checkScrapeStatus();
    loadStudentInfo();
  }, []);

  return (
    <div className="space-y-3 max-w-5xl mx-auto">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h1
          className={`text-base md:text-lg font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Thông tin sinh viên
        </h1>

        <div className="flex gap-2">
          <button
            onClick={loadStudentInfo}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh
          </button>

          <button
            onClick={scrapeAndSync}
            disabled={isScraping || !scrapeReady}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isScraping || !scrapeReady
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            } text-white`}
          >
            {isScraping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Scrape Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Display */}
      {scrapeProgress.length > 0 && (
        <div
          className={`${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border rounded-lg p-3 max-h-48 overflow-y-auto`}
        >
          <div className="space-y-2">
            {scrapeProgress.map((progress, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 text-xs ${
                  progress.status === "success"
                    ? "text-green-600 dark:text-green-400"
                    : progress.status === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {progress.status === "loading" && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 mt-0.5" />
                )}
                {progress.status === "success" && (
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                )}
                {progress.status === "error" && (
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                )}
                <span>{progress.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div
          className={`p-3 rounded-lg flex items-start gap-2 text-xs ${
            messageType === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : messageType === "error"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          }`}
        >
          {messageType === "success" && (
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          {messageType === "error" && (
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          {messageType === "info" && (
            <Loader2 className="w-4 h-4 flex-shrink-0 mt-0.5 animate-spin" />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Stats Cards */}
      {studentInfo && stats.grades > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } border rounded-lg p-3`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Số môn học
              </span>
            </div>
            <p
              className={`text-lg font-bold mt-1 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {stats.grades}
            </p>
          </div>
          <div
            className={`${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } border rounded-lg p-3`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Tiến độ học tập
              </span>
            </div>
            <p
              className={`text-lg font-bold mt-1 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {stats.progress}
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      {studentInfo && (
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all border-b-2 ${
              activeTab === "info"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Sinh viên
          </button>
          <button
            onClick={() => setActiveTab("grades")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all border-b-2 ${
              activeTab === "grades"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Điểm
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all border-b-2 ${
              activeTab === "progress"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Tiến độ
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div
        className={`${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border rounded-lg p-3`}
      >
        {studentInfo ? (
          <>
            {/* Sinh Viên Tab */}
            {activeTab === "info" && (
              <div>
                <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2
                      className={`text-sm font-bold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {studentInfo.ho_va_ten}
                    </h2>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      MSSV: {studentInfo.StudentID}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div
                    className={`flex justify-between py-1.5 border-b ${
                      isDarkMode ? "border-gray-700" : "border-gray-100"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Lớp:
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {studentInfo.lop}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between py-1.5 border-b ${
                      isDarkMode ? "border-gray-700" : "border-gray-100"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Khoa:
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {studentInfo.khoa}
                    </span>
                  </div>
                  {studentInfo.chuyen_nganh && (
                    <div
                      className={`flex justify-between py-1.5 border-b ${
                        isDarkMode ? "border-gray-700" : "border-gray-100"
                      }`}
                    >
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Chuyên ngành:
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {studentInfo.chuyen_nganh}
                      </span>
                    </div>
                  )}
                  {studentInfo.khoa_hoc && (
                    <div
                      className={`flex justify-between py-1.5 border-b ${
                        isDarkMode ? "border-gray-700" : "border-gray-100"
                      }`}
                    >
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Khóa học:
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {studentInfo.khoa_hoc}
                      </span>
                    </div>
                  )}
                  {studentInfo.created_at && (
                    <div
                      className={`flex justify-between py-1.5 border-b ${
                        isDarkMode ? "border-gray-700" : "border-gray-100"
                      }`}
                    >
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Ngày tạo:
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {new Date(studentInfo.created_at).toLocaleString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                  )}
                  {studentInfo.updated_at && (
                    <div className={`flex justify-between py-1.5`}>
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Cập nhật lần cuối:
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isDarkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {new Date(studentInfo.updated_at).toLocaleString(
                          "vi-VN"
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Điểm Tab */}
            {activeTab === "grades" && (
              <div>
                {isLoadingGrades ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Đang tải dữ liệu điểm...
                    </p>
                  </div>
                ) : grades.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {grades.map((grade, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3
                            className={`text-xs font-semibold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {grade.TenHocPhan}
                          </h3>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              grade.DiemTongKet && grade.DiemTongKet >= 5
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {grade.DiemTongKet?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-xs">
                          <div>
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              Mã HP:
                            </span>
                            <p
                              className={`font-medium ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {grade.MaHocPhan}
                            </p>
                          </div>
                          <div>
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              TC:
                            </span>
                            <p
                              className={`font-medium ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {grade.SoTC}
                            </p>
                          </div>
                          <div>
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              HK:
                            </span>
                            <p
                              className={`font-medium ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {grade.HocKy}
                            </p>
                          </div>
                          <div>
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              Xếp loại:
                            </span>
                            <p
                              className={`font-medium ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {grade.XepLoai || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen
                      className={`w-12 h-12 mx-auto mb-3 ${
                        isDarkMode ? "text-gray-600" : "text-gray-300"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Chưa có dữ liệu điểm
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tiến Độ Tab */}
            {activeTab === "progress" && (
              <div>
                {isLoadingProgress ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-500" />
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Đang tải tiến độ học tập...
                    </p>
                  </div>
                ) : academicProgress.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {academicProgress.map((progress, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <h3
                            className={`text-xs font-semibold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Học kỳ {progress.HocKy}
                          </h3>
                          {progress.XepLoaiHocLuc && (
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                progress.XepLoaiHocLuc === "Giỏi" ||
                                progress.XepLoaiHocLuc === "Xuất sắc"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : progress.XepLoaiHocLuc === "Khá"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              }`}
                            >
                              {progress.XepLoaiHocLuc}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              Số TC:
                            </span>
                            <p
                              className={`font-medium ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {progress.SoTC}
                            </p>
                          </div>
                          <div>
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              TC tích lũy:
                            </span>
                            <p
                              className={`font-medium ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {progress.SoTCTichLuy || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span
                              className={
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              TBC HK:
                            </span>
                            <p
                              className={`font-medium ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {progress.TBCHocKy?.toFixed(2) || "N/A"}
                            </p>
                          </div>
                        </div>
                        {progress.TBCTichLuy && (
                          <div className="mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between text-xs">
                              <span
                                className={
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }
                              >
                                TBC tích lũy:
                              </span>
                              <span
                                className={`font-semibold ${
                                  isDarkMode ? "text-blue-400" : "text-blue-600"
                                }`}
                              >
                                {progress.TBCTichLuy.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp
                      className={`w-12 h-12 mx-auto mb-3 ${
                        isDarkMode ? "text-gray-600" : "text-gray-300"
                      }`}
                    />
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Chưa có dữ liệu tiến độ học tập
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <User
              className={`w-12 h-12 mx-auto mb-3 ${
                isDarkMode ? "text-gray-600" : "text-gray-300"
              }`}
            />
            <p
              className={`text-sm mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Chưa có dữ liệu sinh viên
            </p>
            <p
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Nhấn "Scrape Data" để lấy thông tin từ VKU
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
