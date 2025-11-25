import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import ChatPage from "./pages/ChatPage";
import { PluginsPage } from "./pages/PluginsPage";
import { PublicPluginsPage } from "./pages/PublicPluginsPage";
import { StudentInfoPage } from "./pages/StudentInfoPage";
import { SchedulePage } from "./pages/SchedulePage";
import TimetablePage from "./pages/TimetablePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { QuizResultsPage } from "./pages/QuizResultsPage";

type Page = "chat" | "plugins" | "info" | "schedule" | "timetable" | "quiz";
export type ThemeMode = "dark" | "light" | "cream";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<Page[]>(["chat"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const navigateTo = (page: Page) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(page);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPage(page);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPage(history[historyIndex - 1]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPage(history[historyIndex + 1]);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case "chat":
        return <ChatPage themeMode={themeMode} />;
      case "plugins":
        return <PluginsPage themeMode={themeMode} navigateTo={navigateTo} />;
      case "schedule":
        return <SchedulePage themeMode={themeMode} />;
      case "timetable":
        return <TimetablePage />;
      case "quiz":
        return <QuizResultsPage themeMode={themeMode} />;
      case "info":
        return <StudentInfoPage themeMode={themeMode} />;
    }
  };

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage themeMode={themeMode} />} />
          <Route
            path="/register"
            element={<RegisterPage themeMode={themeMode} />}
          />
          <Route
            path="/plugins"
            element={<PublicPluginsPage themeMode={themeMode} />}
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div
                  className={`h-screen flex flex-col ${
                    themeMode === "dark"
                      ? "bg-gray-900 dark"
                      : themeMode === "cream"
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 cream"
                      : "bg-gray-50"
                  }`}
                >
                  <Header
                    themeMode={themeMode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    historyIndex={historyIndex}
                    historyLength={history.length}
                    goBack={goBack}
                    goForward={goForward}
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                    navigateTo={navigateTo}
                    setThemeMode={setThemeMode}
                  />

                  <div className="flex-1 flex overflow-hidden relative">
                    <Sidebar
                      themeMode={themeMode}
                      currentPage={currentPage}
                      navigateTo={navigateTo}
                      isSidebarCollapsed={isSidebarCollapsed}
                    />

                    <div className="flex-1 overflow-hidden">
                      {renderContent()}
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
