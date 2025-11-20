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
  LogIn,
  Trash2,
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
  id?: number;
  StudentID: string;
  MaHocPhan?: string;
  TenHocPhan: string;
  SoTC: number;
  DiemTK: number | null;
  DiemThi: number | null;
  DiemT10: number | null;
  DiemTongKet: number | null;
  XepLoai: string | null;
  HocKy: string; // Database stores as text like "Học kỳ 1"
  user_id?: string;
  created_at?: string;
}

interface AcademicProgress {
  id: number;
  StudentID: string;
  TenHocPhan: string;
  HocKy: number;
  BatBuoc: boolean;
  DiemT4: string | null;
  DiemChu: string | null;
  SoTC: number;
  user_id?: string;
  created_at?: string;
}

interface SemesterSummary {
  HocKy: number;
  courses: AcademicProgress[];
  totalTC: number;
  completedTC: number;
}

interface SessionStatus {
  exists: boolean;
  path: string;
  size?: number;
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

  // Session Capture states
  const [isCapturing, setIsCapturing] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null
  );
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(API_BASE_URL);
  const [isEditingEndpoint, setIsEditingEndpoint] = useState(false);
  const [showSessionSection, setShowSessionSection] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
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
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [semesterSummaries, setSemesterSummaries] = useState<SemesterSummary[]>(
    []
  );

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

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

  // Session Capture Functions
  const checkSession = async () => {
    setIsCheckingSession(true);
    try {
      const url = `${apiEndpoint}/api/check-session`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
      });

      if (response.ok) {
        const data = await response.json();
        setSessionStatus(data);
        if (data.exists) {
          setScrapeReady(true);
        } else {
          setScrapeReady(false);
        }
      }
    } catch (error) {
      console.error("Check session error:", error);
      setSessionStatus(null);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const captureSession = async () => {
    setIsCapturing(true);
    setMessage("Opening browser... Please login to VKU");
    setMessageType("info");

    try {
      const response = await fetch(`${apiEndpoint}/api/capture-session`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setMessageType("success");
        await checkSession();
      } else {
        setMessage(data.message || "Failed to capture session");
        setMessageType("error");
      }
    } catch (error) {
      setMessage(
        `Error: ${
          error instanceof Error
            ? error.message
            : "Failed to connect to API server"
        }`
      );
      setMessageType("error");
    } finally {
      setIsCapturing(false);
    }
  };

  const deleteSession = async () => {
    if (!confirm("Are you sure you want to delete the session file?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${apiEndpoint}/api/session`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Session deleted successfully");
        setMessageType("success");
        setSessionStatus(null);
        setScrapeReady(false);
      } else {
        setMessage(data.message || "Failed to delete session");
        setMessageType("error");
      }
    } catch (error) {
      setMessage(
        `Error: ${
          error instanceof Error
            ? error.message
            : "Failed to connect to API server"
        }`
      );
      setMessageType("error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Load student info from database
  const loadStudentInfo = async (forceRefresh = false) => {
    // Check cache validity
    const now = Date.now();
    if (
      !forceRefresh &&
      studentInfo &&
      lastFetchTime &&
      now - lastFetchTime < CACHE_DURATION
    ) {
      console.log("Using cached data");
      return;
    }

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
          setLastFetchTime(Date.now());

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
        const data: AcademicProgress[] = await response.json();
        setAcademicProgress(data);
        setStats((prev) => ({ ...prev, progress: data.length }));

        // Aggregate by semester
        const semesterMap = new Map<number, AcademicProgress[]>();
        data.forEach((course) => {
          if (!semesterMap.has(course.HocKy)) {
            semesterMap.set(course.HocKy, []);
          }
          semesterMap.get(course.HocKy)!.push(course);
        });

        const summaries: SemesterSummary[] = Array.from(semesterMap.entries())
          .map(([hocKy, courses]) => ({
            HocKy: hocKy,
            courses,
            totalTC: courses.reduce((sum, c) => sum + (c.SoTC || 0), 0),
            completedTC: courses
              .filter((c) => c.DiemChu && c.DiemChu !== "F")
              .reduce((sum, c) => sum + (c.SoTC || 0), 0),
          }))
          .sort((a, b) => a.HocKy - b.HocKy);

        setSemesterSummaries(summaries);
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
      setMessage(
        "Please capture session first. Click 'Show Session Manager' below."
      );
      setMessageType("error");
      setShowSessionSection(true);
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
    checkSession();
    loadStudentInfo();
  }, []);

  return (
    <div className="space-y-2 sm:space-y-3 max-w-5xl mx-auto px-2 sm:px-0">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1
          className={`text-sm sm:text-base md:text-lg font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Thông tin sinh viên
        </h1>

        <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            onClick={() => loadStudentInfo(true)}
            disabled={isLoading}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 sm:flex-initial justify-center ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <Loader2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="flex-1 sm:flex-initial flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                Tôi đồng ý cung cấp thông tin cho VKUTK-App.
              </span>
            </label>
            <button
              onClick={scrapeAndSync}
              disabled={isScraping || !scrapeReady || !privacyConsent}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all justify-center ${
                isScraping || !scrapeReady || !privacyConsent
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

      {/* Session Manager Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowSessionSection(!showSessionSection)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-900"
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          {showSessionSection ? "Hide Session Manager" : "Show Session Manager"}
        </button>
      </div>

      {/* Session Capture Section */}
      {showSessionSection && (
        <div
          className={`rounded-lg border p-3 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h2
            className={`text-sm font-bold mb-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            VKU Session Manager
          </h2>

          {/* API Endpoint Configuration */}
          <div
            className={`mb-2 p-2 rounded border text-xs ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <label
                className={`font-medium whitespace-nowrap ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                API:
              </label>
              {isEditingEndpoint ? (
                <>
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className={`flex-1 px-2 py-1 rounded border ${
                      isDarkMode
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                  <button
                    onClick={() => setIsEditingEndpoint(false)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`flex-1 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {apiEndpoint}
                  </span>
                  <button
                    onClick={() => setIsEditingEndpoint(true)}
                    className={`px-2 py-1 rounded ${
                      isDarkMode
                        ? "bg-gray-600 hover:bg-gray-500 text-gray-300"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Session Status */}
          <div
            className={`mb-2 p-2 rounded border text-xs ${
              isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-medium ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Status:
              </span>
              {sessionStatus ? (
                sessionStatus.exists ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500">
                    <XCircle className="w-3.5 h-3.5" />
                    Not found
                  </span>
                )
              ) : (
                <span
                  className={isDarkMode ? "text-gray-400" : "text-gray-600"}
                >
                  Loading...
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={captureSession}
              disabled={isCapturing}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                isCapturing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              }`}
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  Capture
                </>
              )}
            </button>

            <button
              onClick={checkSession}
              disabled={isCheckingSession}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              }`}
            >
              {isCheckingSession ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={deleteSession}
              disabled={isDeleting || !sessionStatus?.exists}
              className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                isDeleting || !sessionStatus?.exists
                  ? "bg-gray-400 cursor-not-allowed text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Instructions */}
          <div
            className={`p-2 rounded border text-xs ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 text-gray-400"
                : "bg-blue-50 border-blue-200 text-gray-700"
            }`}
          >
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Backend phải chạy trước</li>
              <li>Click "Capture" để mở browser</li>
              <li>Đăng nhập VKU trong browser</li>
              <li>Session tự động lưu sau khi login</li>
            </ol>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {studentInfo && stats.grades > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div
            className={`${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } border rounded-lg p-2 sm:p-3`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BookOpen className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-500" />
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Số môn học
              </span>
            </div>
            <p
              className={`text-base sm:text-lg font-bold mt-1 ${
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
            } border rounded-lg p-2 sm:p-3`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-500" />
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Tiến độ học tập
              </span>
            </div>
            <p
              className={`text-base sm:text-lg font-bold mt-1 ${
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
        <div className="flex gap-1 sm:gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === "info"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <GraduationCap className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span className="hidden sm:inline">Sinh viên</span>
            <span className="sm:hidden">SV</span>
          </button>
          <button
            onClick={() => setActiveTab("grades")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === "grades"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <BookOpen className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            Điểm
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === "progress"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <TrendingUp className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
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
        } border rounded-lg p-2 sm:p-3`}
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
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {grades.map((grade, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-lg border transition-all ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600 hover:bg-gray-650"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {/* Header: Tên môn + Điểm */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-sm font-semibold leading-tight mb-1 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {grade.TenHocPhan}
                            </h4>
                            {grade.MaHocPhan && (
                              <p
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {grade.MaHocPhan}
                              </p>
                            )}
                          </div>
                          <div
                            className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-base shadow-sm ${
                              grade.DiemT10 || grade.DiemTongKet
                                ? (grade.DiemT10 || grade.DiemTongKet)! >= 8.5
                                  ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                  : (grade.DiemT10 || grade.DiemTongKet)! >= 7
                                  ? "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
                                  : (grade.DiemT10 || grade.DiemTongKet)! >= 5.5
                                  ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                                  : (grade.DiemT10 || grade.DiemTongKet)! >= 5
                                  ? "bg-gradient-to-br from-orange-500 to-red-500 text-white"
                                  : "bg-gradient-to-br from-red-600 to-rose-700 text-white"
                                : isDarkMode
                                ? "bg-gray-600 text-gray-400"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {(grade.DiemT10 || grade.DiemTongKet)?.toFixed(1) ||
                              "N/A"}
                          </div>
                        </div>

                        {/* Footer: Meta info */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            className={`px-1.5 py-0.5 rounded font-medium ${
                              isDarkMode
                                ? "bg-blue-900/50 text-blue-300"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {grade.HocKy?.replace("Học kỳ ", "HK") || "-"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-medium ${
                              isDarkMode
                                ? "bg-purple-900/50 text-purple-300"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {grade.SoTC} TC
                          </span>
                          {(grade.DiemT10 || grade.DiemTongKet) && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full font-bold ml-auto ${
                                (grade.DiemT10 || grade.DiemTongKet)! >= 8.5
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                  : (grade.DiemT10 || grade.DiemTongKet)! >= 7
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                                  : (grade.DiemT10 || grade.DiemTongKet)! >= 5.5
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                                  : (grade.DiemT10 || grade.DiemTongKet)! >= 4
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                              }`}
                            >
                              {(grade.DiemT10 || grade.DiemTongKet)! >= 8.5
                                ? "A"
                                : (grade.DiemT10 || grade.DiemTongKet)! >= 7
                                ? "B"
                                : (grade.DiemT10 || grade.DiemTongKet)! >= 5.5
                                ? "C"
                                : (grade.DiemT10 || grade.DiemTongKet)! >= 4
                                ? "D"
                                : "F"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Summary */}
                    <div
                      className={`p-2 rounded-lg border font-semibold text-xs mt-2 ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-gray-300"
                          : "bg-gray-100 border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>Tổng: {grades.length} môn</span>
                        <span>
                          {grades.reduce((sum, g) => sum + g.SoTC, 0)} tín chỉ
                        </span>
                      </div>
                    </div>
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
                ) : semesterSummaries.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {semesterSummaries.map((semester) => (
                      <div
                        key={semester.HocKy}
                        className={`p-2 rounded-lg border ${
                          isDarkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {/* Semester Header */}
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-600 dark:border-gray-600">
                          <h3
                            className={`text-sm font-bold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Học kỳ {semester.HocKy}
                          </h3>
                          <div className="flex gap-1.5 text-xs">
                            <span
                              className={`px-1.5 py-0.5 rounded font-medium ${
                                isDarkMode
                                  ? "bg-blue-900/50 text-blue-300"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {semester.totalTC} TC
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-medium ${
                                isDarkMode
                                  ? "bg-green-900/50 text-green-300"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {semester.completedTC} đạt
                            </span>
                          </div>
                        </div>

                        {/* Courses List */}
                        <div className="space-y-1.5">
                          {semester.courses.map((course, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg border transition-all ${
                                isDarkMode
                                  ? "bg-gray-600 border-gray-500 hover:bg-gray-550"
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {/* Course Header */}
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex-1 min-w-0">
                                  <h4
                                    className={`text-xs font-semibold leading-tight ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {course.TenHocPhan}
                                  </h4>
                                </div>
                                {course.DiemChu && (
                                  <div
                                    className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm ${
                                      ["A", "A+", "B+", "B"].includes(
                                        course.DiemChu
                                      )
                                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                        : ["C+", "C", "D+", "D"].includes(
                                            course.DiemChu
                                          )
                                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                                        : course.DiemChu === "F"
                                        ? "bg-gradient-to-br from-red-600 to-rose-700 text-white"
                                        : isDarkMode
                                        ? "bg-gray-500 text-gray-300"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {course.DiemChu}
                                  </div>
                                )}
                              </div>

                              {/* Course Footer */}
                              <div className="flex items-center gap-1.5 text-xs">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-medium ${
                                    isDarkMode
                                      ? "bg-purple-900/50 text-purple-300"
                                      : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  {course.SoTC} TC
                                </span>
                                {course.BatBuoc && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-medium ${
                                      isDarkMode
                                        ? "bg-orange-900/50 text-orange-300"
                                        : "bg-orange-100 text-orange-700"
                                    }`}
                                  >
                                    Bắt buộc
                                  </span>
                                )}
                                {course.DiemT4 && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-medium ml-auto ${
                                      isDarkMode
                                        ? "bg-gray-700 text-gray-300"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {course.DiemT4} / 4.0
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
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
