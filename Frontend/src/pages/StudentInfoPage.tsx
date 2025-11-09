import { useState, useEffect } from "react";
import { User } from "lucide-react";

interface StudentInfoPageProps {
  isDarkMode: boolean;
}

interface StudentInfo {
  "Họ và tên"?: string;
  "Mã SV"?: string;
  "Lớp"?: string;
  "Khóa"?: string;
  "Chuyên ngành"?: string;
  "Khoa"?: string;
}

export function StudentInfoPage({ isDarkMode }: StudentInfoPageProps) {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("studentInfo");
    console.log("Stored student info:", stored);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log("Parsed student info:", parsed);
        setStudentInfo(parsed);
      } catch (e) {
        console.error("Failed to parse student info:", e);
      }
    }
    setLoading(false);
  }, []);

  const fieldOrder = ["Họ và tên", "Mã SV", "Lớp", "Khóa", "Chuyên ngành", "Khoa"];

  return (
    <div className="space-y-4">
      <h1
        className={`text-lg md:text-xl font-bold ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Thông tin sinh viên
      </h1>
      <div
        className={`${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border rounded-lg p-4 md:p-5 max-w-2xl`}
      >
        {loading ? (
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Đang tải thông tin...
          </p>
        ) : studentInfo ? (
          <>
            <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-5">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h2
                  className={`text-base md:text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {studentInfo["Họ và tên"] || "Chưa cập nhật"}
                </h2>
                <p
                  className={`text-xs md:text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  MSSV: {studentInfo["Mã SV"] || "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {fieldOrder.map((field) => {
                if (field === "Họ và tên" || field === "Mã SV") return null;
                return (
                  <div
                    key={field}
                    className={`flex justify-between py-2 border-b ${
                      isDarkMode ? "border-gray-700" : "border-gray-100"
                    }`}
                  >
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {field}:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {studentInfo[field as keyof StudentInfo] || "Chưa cập nhật"}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Chưa có thông tin sinh viên. Vui lòng đi tới tab "Session" để capture session và fetch thông tin.
          </p>
        )}
      </div>
    </div>
  );
}
