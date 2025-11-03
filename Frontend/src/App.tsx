import { useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { PluginsPage } from "./pages/PluginsPage";
import { StudentInfoPage } from "./pages/StudentInfoPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SchedulePage } from "./pages/SchedulePage";

type Page = "plugins" | "info" | "settings" | "schedule";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("plugins");
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<Page[]>(["plugins"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
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
      case "plugins":
        return <PluginsPage isDarkMode={isDarkMode} navigateTo={navigateTo} />;
      case "schedule":
        return <SchedulePage isDarkMode={isDarkMode} />;
      case "info":
        return <StudentInfoPage isDarkMode={isDarkMode} />;
      case "settings":
        return (
          <SettingsPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        );
    }
  };

  return (
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
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
