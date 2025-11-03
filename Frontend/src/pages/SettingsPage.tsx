import { ToggleSwitch } from "../components/ToggleSwitch";

interface SettingsPageProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export function SettingsPage({ isDarkMode, setIsDarkMode }: SettingsPageProps) {
  return (
    <div className="space-y-4">
      <h1
        className={`text-lg md:text-xl font-bold ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Cài đặt
      </h1>
      <div
        className={`${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        } border rounded-lg p-4 md:p-5 max-w-2xl space-y-4 md:space-y-5`}
      >
        <div className="space-y-3">
          <h3
            className={`text-sm font-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Giao diện
          </h3>
          <div className="flex items-center justify-between py-2">
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Chế độ tối
            </span>
            <ToggleSwitch
              enabled={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
              isDarkMode={isDarkMode}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Ngôn ngữ
            </span>
            <select
              className={`${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-gray-50 border-gray-300 text-gray-900"
              } border rounded-lg px-3 py-1.5 text-sm`}
            >
              <option>Tiếng Việt</option>
              <option>English</option>
            </select>
          </div>
        </div>
        <div
          className={`space-y-3 pt-5 border-t ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h3
            className={`text-sm font-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Thông báo
          </h3>
          <div className="flex items-center justify-between py-2">
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Thông báo lịch học
            </span>
            <ToggleSwitch
              enabled={true}
              onChange={() => {}}
              isDarkMode={isDarkMode}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Thông báo điểm số
            </span>
            <ToggleSwitch
              enabled={true}
              onChange={() => {}}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
