import { Grid3x3, User, LogOut, MessageSquare, Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Page = "plugins" | "info" | "schedule" | "timetable";

interface SidebarProps {
  isDarkMode: boolean;
  currentPage: Page;
  navigateTo: (page: Page) => void;
  isSidebarCollapsed: boolean;
  onChatbotClick?: () => void;
}

export function Sidebar({
  isDarkMode,
  currentPage,
  navigateTo,
  isSidebarCollapsed,
  onChatbotClick,
}: SidebarProps) {
  return (
    <div
      className={`${
        isSidebarCollapsed
          ? "-translate-x-full md:translate-x-0 md:w-0"
          : "translate-x-0 md:w-56"
      } fixed md:relative z-50 w-64 md:w-56 h-full ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } md:border-r flex flex-col transition-all duration-300 overflow-hidden shadow-xl md:shadow-none`}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="mb-6">
          <h2
            className={`text-lg font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            VKU Tools
          </h2>
          <p
            className={`text-xs ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            } mt-0.5`}
          >
            College Toolkit
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          <button
            onClick={() => navigateTo("plugins")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
              currentPage === "plugins"
                ? isDarkMode
                  ? "bg-gradient-to-r from-blue-900/50 to-cyan-900/50 text-blue-300 font-medium shadow-md"
                  : "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-medium shadow-sm"
                : isDarkMode
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            <span>Plugins</span>
          </button>
          <button
            onClick={() => navigateTo("timetable")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
              currentPage === "timetable"
                ? isDarkMode
                  ? "bg-gradient-to-r from-yellow-900/50 to-amber-900/50 text-yellow-300 font-medium shadow-md"
                  : "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 font-medium shadow-sm"
                : isDarkMode
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Thời khoá biểu</span>
          </button>

          <button
            onClick={onChatbotClick}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
              isDarkMode
                ? "text-gray-300 hover:bg-gray-700 bg-gradient-to-r from-indigo-900/30 to-blue-900/30 hover:from-indigo-900/50 hover:to-blue-900/50"
                : "text-gray-700 hover:bg-gray-100 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 hover:from-indigo-100 hover:to-blue-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chatbot</span>
          </button>
        </nav>

        <div
          className={`pt-4 mt-4 border-t space-y-3 ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {/* User info */}
          <UserInfoSection isDarkMode={isDarkMode} navigateTo={navigateTo} />

          <p
            className={`text-xs ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
            } text-center`}
          >
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}

// User Info Section Component
function UserInfoSection({
  isDarkMode,
  navigateTo,
}: {
  isDarkMode: boolean;
  navigateTo: (page: Page) => void;
}) {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => navigateTo("info")}
        className={`w-full px-3 py-2 rounded-lg transition-all ${
          isDarkMode
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <User
            className={`w-4 h-4 ${
              isDarkMode ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <p
            className={`text-xs font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {user.metadata?.full_name || "User"}
          </p>
        </div>
        <p
          className={`text-xs truncate text-left ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {user.email}
        </p>
      </button>

      <button
        onClick={handleSignOut}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
          isDarkMode
            ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
            : "bg-red-50 text-red-600 hover:bg-red-100"
        }`}
      >
        <LogOut className="w-4 h-4" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
