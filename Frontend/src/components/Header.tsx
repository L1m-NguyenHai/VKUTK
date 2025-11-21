import { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
} from "lucide-react";
import type { ThemeMode } from "../App";

type Page = "plugins" | "info" | "schedule" | "timetable";

interface HeaderProps {
  themeMode: ThemeMode;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  historyIndex: number;
  historyLength: number;
  goBack: () => void;
  goForward: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  navigateTo?: (page: Page) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export function Header({
  themeMode,
  searchQuery,
  setSearchQuery,
  historyIndex,
  historyLength,
  goBack,
  goForward,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  navigateTo,
  setThemeMode,
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
      className={`border-b px-3 py-2 flex items-center space-x-2 md:px-4 md:py-2.5 md:space-x-3 ${
        themeMode === "dark"
          ? "bg-gray-800 border-gray-700"
          : themeMode === "cream"
          ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
          : "bg-white border-gray-200"
      }`}
    >
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className={`p-2 rounded-lg transition-colors md:p-1.5 md:rounded-md ${
          themeMode === "dark"
            ? "hover:bg-gray-700"
            : themeMode === "cream"
            ? "hover:bg-amber-100"
            : "hover:bg-gray-100"
        }`}
        aria-label="Toggle sidebar"
      >
        {isSidebarCollapsed ? (
          <Menu
            className={`w-5 h-5 md:w-4 md:h-4 ${
              themeMode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          />
        ) : (
          <X
            className={`w-5 h-5 md:w-4 md:h-4 ${
              themeMode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          />
        )}
      </button>
      <div className="hidden md:flex items-center space-x-1">
        <button
          onClick={goBack}
          disabled={historyIndex === 0}
          className={`p-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
            themeMode === "dark"
              ? "hover:bg-gray-700"
              : themeMode === "cream"
              ? "hover:bg-amber-100"
              : "hover:bg-gray-100"
          }`}
          aria-label="Go back"
        >
          <ChevronLeft
            className={`w-4 h-4 ${
              themeMode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          />
        </button>
        <button
          onClick={goForward}
          disabled={historyIndex === historyLength - 1}
          className={`p-1.5 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${
            themeMode === "dark"
              ? "hover:bg-gray-700"
              : themeMode === "cream"
              ? "hover:bg-amber-100"
              : "hover:bg-gray-100"
          }`}
          aria-label="Go forward"
        >
          <ChevronRight
            className={`w-4 h-4 ${
              themeMode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          />
        </button>
      </div>
      <div className="flex-1 relative">
        <Search
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            themeMode === "dark" ? "text-gray-500" : "text-gray-400"
          }`}
        />
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-9 pr-3 py-2 md:py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm ${
            themeMode === "dark"
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500"
              : themeMode === "cream"
              ? "bg-white border-amber-300 text-gray-900 placeholder-gray-400 focus:ring-orange-500"
              : "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
          }`}
        />
      </div>
      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors md:p-1.5 md:rounded-md ${
            themeMode === "dark"
              ? "hover:bg-gray-700"
              : themeMode === "cream"
              ? "hover:bg-amber-100"
              : "hover:bg-gray-100"
          }`}
          title="Settings"
        >
          <Settings
            className={`w-5 h-5 md:w-4 md:h-4 ${
              themeMode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          />
        </button>

        {showSettings && (
          <div
            className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-50 ${
              themeMode === "dark"
                ? "bg-gray-800 border-gray-700"
                : themeMode === "cream"
                ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="p-3">
              <h3
                className={`text-sm font-semibold mb-3 ${
                  themeMode === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Cài đặt
              </h3>
              <div className="space-y-2">
                <div>
                  <span
                    className={`text-sm block mb-2 ${
                      themeMode === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Chủ đề giao diện
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setThemeMode("light")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        themeMode === "light"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      ☀️ Sáng
                    </button>
                    <button
                      onClick={() => setThemeMode("dark")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        themeMode === "dark"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      🌙 Tối
                    </button>
                    <button
                      onClick={() => setThemeMode("cream")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        themeMode === "cream"
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          : "bg-gradient-to-r from-amber-100 to-orange-100 text-gray-700 hover:from-amber-200 hover:to-orange-200"
                      }`}
                    >
                      🥛 Kem
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
