import { Search, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";

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
}: HeaderProps) {
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
    </div>
  );
}
