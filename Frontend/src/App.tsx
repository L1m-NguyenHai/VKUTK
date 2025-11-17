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
import { ChatbotPanel } from "./components/ChatbotPanel";
import { PluginsPage } from "./pages/PluginsPage";
import { StudentInfoPage } from "./pages/StudentInfoPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { SessionCapturePage } from "./pages/SessionCapturePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

type Page = "plugins" | "info" | "settings" | "schedule" | "session";

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
  const [currentPage, setCurrentPage] = useState<Page>("plugins");
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<Page[]>(["plugins"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

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
      case "plugins":
        return <PluginsPage isDarkMode={isDarkMode} navigateTo={navigateTo} />;
      case "schedule":
        return <SchedulePage isDarkMode={isDarkMode} />;
      case "info":
        return <StudentInfoPage isDarkMode={isDarkMode} />;
      case "session":
        return <SessionCapturePage isDarkMode={isDarkMode} />;
      case "settings":
        return (
          <SettingsPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        );
    }
  };

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={<LoginPage isDarkMode={isDarkMode} />}
          />
          <Route
            path="/register"
            element={<RegisterPage isDarkMode={isDarkMode} />}
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div
                  className={`h-screen flex flex-col ${
                    isDarkMode ? "bg-gray-900" : "bg-gray-50"
                  }`}
                >
                  <Header
                    isDarkMode={isDarkMode}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    historyIndex={historyIndex}
                    historyLength={history.length}
                    goBack={goBack}
                    goForward={goForward}
                    isSidebarCollapsed={isSidebarCollapsed}
                    setIsSidebarCollapsed={setIsSidebarCollapsed}
                  />

                  <div className="flex-1 flex overflow-hidden relative">
                    <Sidebar
                      isDarkMode={isDarkMode}
                      currentPage={currentPage}
                      navigateTo={navigateTo}
                      isSidebarCollapsed={isSidebarCollapsed}
                      onChatbotClick={() => setIsChatbotOpen(!isChatbotOpen)}
                    />

                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                      {renderContent()}
                    </div>

                    <ChatbotPanel
                      isDarkMode={isDarkMode}
                      isOpen={isChatbotOpen}
                      onClose={() => setIsChatbotOpen(false)}
                    />
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
