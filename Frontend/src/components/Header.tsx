import { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { ToggleSwitch } from "./ToggleSwitch";

type Page = "plugins" | "info" | "schedule" | "timetable";

interface HeaderProps {
  isDarkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  historyIndex: number;
  historyLength: number;
  goBack: () => void;
  goForward: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  navigateTo?: (page: Page) => void;
  setIsDarkMode: (value: boolean) => void;
}

export function Header({
  isDarkMode,
  searchQuery,
  setSearchQuery,
  historyIndex,
  historyLength,
  goBack,
  goForward,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  navigateTo,
  setIsDarkMode,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border-b px-3 py-2 flex items-center space-x-2 md:px-4 md:py-2.5 md:space-x-3`}
    >
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={`p-2 rounded-lg ${
          isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
        } transition-colors md:p-1.5 md:rounded-md`}
        aria-label="Toggle sidebar"
      >
        {isSidebarCollapsed ? (
          <Menu
            className={`w-5 h-5 md:w-4 md:h-4 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          />
        ) : (
          <X
            className={`w-5 h-5 md:w-4 md:h-4 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          />
        )}
      </button>
      <div className="hidden md:flex items-center space-x-1">
        <button
          onClick={goBack}
          disabled={historyIndex === 0}
          className={`p-1.5 rounded-md ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          } disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
          aria-label="Go back"
        >
          <ChevronLeft
            className={`w-4 h-4 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          />
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex === historyLength - 1}
          className={`p-1.5 rounded-md ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          } disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
          aria-label="Go forward"
        >
          <ChevronRight
            className={`w-4 h-4 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          />
        </button>
      </div>
      <div className="flex-1 relative">
        <Search
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}
        />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-9 pr-3 py-2 md:py-1.5 ${
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500"
              : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400"
          } border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
        />
      </div>
      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg ${
            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          } transition-colors md:p-1.5 md:rounded-md`}
          title="Settings"
        >
          <Settings
            className={`w-5 h-5 md:w-4 md:h-4 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          />
        </button>

        {showSettings && (
          <div
            className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-50 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-3">
              <h3
                className={`text-sm font-semibold mb-3 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Cài đặt
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
