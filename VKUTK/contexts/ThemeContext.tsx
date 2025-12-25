import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useSystemColorScheme } from "react-native";

type Theme = "light" | "dark" | "system";
type Language = "en" | "vi";

interface ThemeContextType {
  theme: Theme;
  language: Language;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    studentInfo: "Student Info",
    chat: "Chat",
    plugins: "Plugins",

    // Student Info
    studentProfile: "Student Profile",
    info: "Info",
    grades: "Grades",
    progress: "Progress",
    class: "Class",
    department: "Department",
    major: "Major",
    course: "Course",
    noData: "No Data",
    pullToRefresh: "Pull to refresh",

    // Grades
    credits: "TC",
    semester: "Sem",
    score: "Score",

    // Progress
    completed: "Completed",

    // Chat
    vkuAssistant: "VKU Assistant",
    askMeAnything: "Ask me anything...",
    helloMessage: "Hello! I'm your VKU Assistant. How can I help you today?",
    serverError:
      "Sorry, I encountered an error connecting to the server. Please try again later.",

    // Settings
    settings: "Settings",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    systemMode: "System",
    language: "Language",
    english: "English",
    vietnamese: "Vietnamese",
  },
  vi: {
    // Navigation
    studentInfo: "Thông tin SV",
    chat: "Trò chuyện",
    plugins: "Tiện ích",

    // Student Info
    studentProfile: "Hồ sơ sinh viên",
    info: "Thông tin",
    grades: "Điểm",
    progress: "Tiến độ",
    class: "Lớp",
    department: "Khoa",
    major: "Chuyên ngành",
    course: "Khóa học",
    noData: "Không có dữ liệu",
    pullToRefresh: "Kéo để làm mới",

    // Grades
    credits: "TC",
    semester: "HK",
    score: "Điểm",

    // Progress
    completed: "Hoàn thành",

    // Chat
    vkuAssistant: "Trợ lý VKU",
    askMeAnything: "Hỏi gì cũng được...",
    helloMessage: "Xin chào! Tôi là trợ lý VKU. Tôi có thể giúp gì cho bạn?",
    serverError:
      "Xin lỗi, đã xảy ra lỗi kết nối với máy chủ. Vui lòng thử lại sau.",

    // Settings
    settings: "Cài đặt",
    darkMode: "Tối",
    lightMode: "Sáng",
    systemMode: "Hệ thống",
    language: "Ngôn ngữ",
    english: "Tiếng Anh",
    vietnamese: "Tiếng Việt",
  },
};

const STORAGE_KEYS = {
  THEME: "@vkutk_theme",
  LANGUAGE: "@vkutk_language",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [theme, setThemeState] = useState<Theme>("system");
  const [language, setLanguageState] = useState<Language>("vi");
  const [isReady, setIsReady] = useState(false);

  const isDark =
    theme === "system" ? systemColorScheme === "dark" : theme === "dark";

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);

      if (savedTheme) setThemeState(savedTheme as Theme);
      if (savedLanguage) setLanguageState(savedLanguage as Language);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsReady(true);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  // Wait for settings to load before rendering children
  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{ theme, language, isDark, setTheme, setLanguage, t }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback for debugging - helps identify when provider is missing
    console.error("useTheme must be used within ThemeProvider");
    // Return a default context to prevent crash on web
    return {
      theme: "system" as Theme,
      language: "vi" as Language,
      isDark: false,
      setTheme: () => {},
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
}
