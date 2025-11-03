import { User } from "lucide-react";

interface StudentInfoPageProps {
  isDarkMode: boolean;
}

export function StudentInfoPage({ isDarkMode }: StudentInfoPageProps) {
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
              Nguyễn Văn A
            </h2>
            <p
              className={`text-xs md:text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              MSSV: 20210001
            </p>
          </div>
        </div>
        <div className="space-y-2.5">
          <div
            className={`flex justify-between py-2 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Khoa:
            </span>
            <span
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-200" : "text-gray-900"
              }`}
            >
              Công nghệ thông tin
            </span>
          </div>
          <div
            className={`flex justify-between py-2 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Ngành:
            </span>
            <span
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-200" : "text-gray-900"
              }`}
            >
              Kỹ thuật phần mềm
            </span>
          </div>
          <div
            className={`flex justify-between py-2 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Khóa học:
            </span>
            <span
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-200" : "text-gray-900"
              }`}
            >
              2021 - 2025
            </span>
          </div>
          <div
            className={`flex justify-between py-2 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Email:
            </span>
            <span
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-200" : "text-gray-900"
              }`}
            >
              nguyenvana@vku.udn.vn
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              GPA:
            </span>
            <span className="text-sm font-semibold text-blue-600">3.45</span>
          </div>
        </div>
      </div>
    </div>
  );
}
