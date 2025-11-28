import {
  Grid3x3,
  User,
  LogOut,
  MessageSquare,
  Calendar,
  Zap,
} from "lucide-react";
import type { ThemeMode } from "../App";
import { useAuth } from "../contexts/AuthContext";

type Page = "chat" | "plugins" | "info" | "schedule" | "timetable" | "quiz";

interface SidebarProps {
  themeMode: ThemeMode;
  currentPage: Page;
  navigateTo: (page: Page) => void;
  isSidebarCollapsed: boolean;
}

export function Sidebar({
  themeMode,
  currentPage,
  navigateTo,
  isSidebarCollapsed,
}: SidebarProps) {
  return (
    <div
      className={`${
        isSidebarCollapsed
          ? "-translate-x-full md:translate-x-0 md:w-0"
          : "translate-x-0 md:w-56"
      } fixed md:relative z-50 w-64 md:w-56 h-full ${
        themeMode === "dark"
          ? "bg-gray-800 border-gray-700"
          : themeMode === "cream"
          ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
          : "bg-white border-gray-200"
      } md:border-r flex flex-col transition-all duration-300 overflow-hidden shadow-xl md:shadow-none`}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="mb-6">
          <h2
            className={`text-lg font-bold ${
              themeMode === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            VKU Tools
          </h2>
          <p
            className={`text-xs ${
              themeMode === "dark" ? "text-gray-400" : "text-gray-500"
            } mt-0.5`}
          >
            College Toolkit
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          <button
            onClick={() => navigateTo("chat")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
              currentPage === "chat"
                ? themeMode === "dark"
                  ? "bg-gradient-to-r from-indigo-900/50 to-blue-900/50 text-indigo-300 font-medium shadow-md"
                  : themeMode === "cream"
                  ? "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 font-medium shadow-sm border border-orange-200"
                  : "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 font-medium shadow-sm"
                : themeMode === "dark"
                ? "text-gray-300 hover:bg-gray-700"
                : themeMode === "cream"
                ? "text-gray-700 hover:bg-amber-100"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => navigateTo("plugins")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
              currentPage === "plugins"
                ? themeMode === "dark"
                  ? "bg-gradient-to-r from-blue-900/50 to-cyan-900/50 text-blue-300 font-medium shadow-md"
                  : themeMode === "cream"
                  ? "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 font-medium shadow-sm border border-orange-200"
                  : "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 font-medium shadow-sm"
                : themeMode === "dark"
                ? "text-gray-300 hover:bg-gray-700"
                : themeMode === "cream"
                ? "text-gray-700 hover:bg-amber-100"
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
                ? themeMode === "dark"
                  ? "bg-gradient-to-r from-yellow-900/50 to-amber-900/50 text-yellow-300 font-medium shadow-md"
                  : themeMode === "cream"
                  ? "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 font-medium shadow-sm border border-orange-200"
                  : "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 font-medium shadow-sm"
                : themeMode === "dark"
                ? "text-gray-300 hover:bg-gray-700"
                : themeMode === "cream"
                ? "text-gray-700 hover:bg-amber-100"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Thời khoá biểu</span>
          </button>

          <button
            onClick={() => navigateTo("quiz")}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all text-sm ${
              currentPage === "quiz"
                ? themeMode === "dark"
                  ? "bg-gradient-to-r from-purple-900/50 to-pink-900/50 text-purple-300 font-medium shadow-md"
                  : themeMode === "cream"
                  ? "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 font-medium shadow-sm border border-orange-200"
                  : "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-medium shadow-sm"
                : themeMode === "dark"
                ? "text-gray-300 hover:bg-gray-700"
                : themeMode === "cream"
                ? "text-gray-700 hover:bg-amber-100"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Kết Quả Kiểm Tra</span>
          </button>
        </nav>

        <div
          className={`pt-4 mt-4 border-t space-y-3 ${
            themeMode === "dark"
              ? "border-gray-700"
              : themeMode === "cream"
              ? "border-amber-200"
              : "border-gray-200"
          }`}
        >
          {/* User info */}
          <UserInfoSection themeMode={themeMode} navigateTo={navigateTo} />

          <p
            className={`text-xs ${
              themeMode === "dark" ? "text-gray-500" : "text-gray-400"
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
  themeMode,
  navigateTo,
}: {
  themeMode: ThemeMode;
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
          themeMode === "dark"
            ? "bg-gray-700 hover:bg-gray-600"
            : themeMode === "cream"
            ? "bg-white hover:bg-amber-100 border border-amber-200"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <User
            className={`w-4 h-4 ${
              themeMode === "dark"
                ? "text-blue-400"
                : themeMode === "cream"
                ? "text-orange-600"
                : "text-blue-600"
            }`}
          />
          <p
            className={`text-xs font-medium ${
              themeMode === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {user.metadata?.full_name || "User"}
          </p>
        </div>
        <p
          className={`text-xs truncate text-left ${
            themeMode === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {user.email}
        </p>
      </button>

      <button
        onClick={handleSignOut}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
          themeMode === "dark"
            ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
            : themeMode === "cream"
            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
            : "bg-red-50 text-red-600 hover:bg-red-100"
        }`}
      >
        <LogOut className="w-4 h-4" />
        <span>Sign out</span>
      </button>
    </div>
  );
}
