import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Slash,
  Plug,
  // Plugin icons
  Zap,
  MessageCircle,
  Brain,
  FileText,
  HelpCircle,
  MessageCircleQuestion,
  Calendar,
  Award,
  Search,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { ThemeMode } from "../App";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../contexts/AuthContext";
import { QuestionsDisplay } from "../components/QuestionsDisplay";
import { QuizPage } from "./QuizPage";
import { getApiEndpoint, getApiHeaders } from "../utils/apiConfig";

// Icon mapping from string names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Zap,
  MessageCircle,
  Brain,
  FileText,
  HelpCircle,
  MessageCircleQuestion,
  Calendar,
  Award,
  Search,
  Briefcase,
  Plug, // fallback
};

// Helper function to get icon component from string name
const getPluginIcon = (iconName?: string): LucideIcon => {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return Plug; // fallback icon
};

interface CommandField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface Command {
  cog_id: string;
  cog_name: string;
  icon?: string;
  color?: string;
  command: string;
  description: string;
  fields: CommandField[];
}

interface QuestionsResponseData {
  questions: QuestionData[];
  in_file_count?: number;
  external_count?: number;
}

interface Message {
  id: string;
  type: "user" | "system" | "command";
  content: string;
  timestamp: Date;
  command?: string;
  timetableData?: TimetableData; // For timetable responses
  questionsData?: QuestionsResponseData; // For questions responses
  isPending?: boolean; // For pending/loading messages
}

interface TimetableData {
  scheduled_sessions: ScheduledSession[];
  unscheduled_sessions: ScheduledSession[];
}

interface ScheduledSession {
  stt_id: string;
  course_name: string;
  day: string;
  time_slots: string;
  classroom: string;
  reason_not_selected?: string;
}

interface QuestionData {
  question: string;
  options: Record<string, string>;
  answer: string;
}

interface ChatPageProps {
  themeMode: ThemeMode;
  searchQuery?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ themeMode, searchQuery = "" }) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage
    try {
      const saved = localStorage.getItem("vku_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: Message & { timestamp: string }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (e) {
      console.error("Failed to load chat messages:", e);
    }
    // Default welcome message
    return [
      {
        id: "1",
        type: "system",
        content: "Welcome to VKU Toolkit! Type / to see available commands.",
        timestamp: new Date(),
      },
    ];
  });
  const [commands, setCommands] = useState<Command[]>([]);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [commandValues, setCommandValues] = useState<
    Record<string, string | string[] | Record<string, string> | File>
  >({});
  const [isLoading, setIsLoading] = useState(() => {
    // Check if there's a pending message in localStorage
    try {
      const saved = localStorage.getItem("vku_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.some((msg: Message) => msg.isPending === true);
      }
    } catch (e) {
      console.error("Failed to check pending messages:", e);
    }
    return false;
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuestionData[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages based on search query
  const filteredMessages = messages.filter((msg) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return msg.content.toLowerCase().includes(query);
  });

  // Fetch available commands
  useEffect(() => {
    fetchCommands();

    // Listen for localStorage changes (from PluginsPage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "vku_plugins_enabled") {
        fetchCommands();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("vku_chat_messages", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat messages:", e);
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchCommands = async () => {
    try {
      const response = await fetch(`${getApiEndpoint()}/api/plugins/commands`, {
        headers: getApiHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        // Filter commands based on localStorage enabled state
        const enabledPluginsStr = localStorage.getItem("vku_plugins_enabled");
        const enabledPlugins = enabledPluginsStr
          ? JSON.parse(enabledPluginsStr)
          : {};

        const filteredCommands = data.commands.filter((cmd: Command) => {
          // If not in localStorage, default to enabled
          return enabledPlugins[cmd.cog_id] !== false;
        });

        setCommands(filteredCommands);
      }
    } catch (error) {
      console.error("Failed to fetch commands:", error);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    // Check for /clear command
    if (value.trim() === "/clear") {
      setMessages([
        {
          id: "1",
          type: "system",
          content: "Chat cleared. Type / to see available commands.",
          timestamp: new Date(),
        },
      ]);
      setInput("");
      setShowCommandMenu(false);
      return;
    }

    // Show command menu when typing /
    if (value === "/") {
      setShowCommandMenu(true);
    } else if (!value.startsWith("/")) {
      setShowCommandMenu(false);
    }
  };

  const handleCommandSelect = (command: Command) => {
    setSelectedCommand(command);
    setShowCommandMenu(false);
    setInput(`/${command.command} `);
    setCommandValues({});
  };

  const handleExecuteCommand = async () => {
    if (!selectedCommand) return;

    console.log("[DEBUG] handleExecuteCommand called");
    console.log("[DEBUG] commandValues:", JSON.stringify(commandValues));
    console.log("[DEBUG] selectedCommand:", selectedCommand.command);

    // Validate required fields - check for empty string, null, undefined, but allow 0
    const missingFields = selectedCommand.fields
      .filter((f) => {
        const value = commandValues[f.name];
        const isEmpty = value === "" || value === null || value === undefined;
        console.log(
          `[DEBUG] Field ${f.name}: value=${value}, isEmpty=${isEmpty}, required=${f.required}`
        );
        return f.required && isEmpty;
      })
      .map((f) => f.label);

    if (missingFields.length > 0) {
      alert(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    // Special validation for /questions command
    if (selectedCommand.command === "questions") {
      const numQuestions = parseInt(commandValues.num_questions as string) || 0;
      const numOpenQuestions =
        parseInt(commandValues.num_open_questions as string) || 0;

      if (numOpenQuestions > numQuestions) {
        alert(
          `Number of open-ended questions (${numOpenQuestions}) cannot exceed total questions (${numQuestions})`
        );
        return;
      }
    }

    // Store values before closing modal
    const command = selectedCommand;
    const values = { ...commandValues };

    // Close modal immediately
    setSelectedCommand(null);
    setCommandValues({});
    setInput("");

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `/${command.command} ${Object.entries(values)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")}`,
      timestamp: new Date(),
      command: command.command,
    };

    // Add pending message to show loading state (persisted in localStorage)
    const pendingMessageId = (Date.now() + 1).toString();
    const pendingMessage: Message = {
      id: pendingMessageId,
      type: "system",
      content: `⏳ Đang xử lý lệnh /${command.command}...`,
      timestamp: new Date(),
      isPending: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setIsLoading(true);

    try {
      // Get user ID from AuthContext (Supabase UUID)
      const userId = user?.id || "anonymous";

      let response;

      // Check if this command has file field (like /summary)
      const hasFileField = command.fields.some((f) => f.type === "file");

      if (hasFileField) {
        // Use FormData for file uploads
        const formData = new FormData();

        console.log("[DEBUG] Building FormData with values:", values);

        // Add all command values
        Object.entries(values).forEach(([key, value]) => {
          console.log(`[DEBUG] Processing field ${key}:`, value, typeof value);
          if (value instanceof File) {
            // It's a file
            console.log(
              `[DEBUG] Appending file ${key}:`,
              value.name,
              value.size
            );
            formData.append(key, value);
          } else if (value !== "" && value !== null && value !== undefined) {
            // It's a text field - only add if not empty
            console.log(`[DEBUG] Appending text ${key}:`, String(value));
            formData.append(key, String(value));
          } else {
            console.log(`[DEBUG] Skipping empty field ${key}`);
          }
        });

        // Add auth_userid
        formData.append("auth_userid", userId);

        // Debug: Log FormData contents
        console.log("[DEBUG] FormData entries:");
        for (const [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value);
        }

        // Important: Don't set Content-Type header for FormData - browser sets it automatically with boundary
        // Only use ngrok-skip-browser-warning header
        response = await fetch(
          `${getApiEndpoint()}/api/plugins/${command.cog_id}/execute`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: formData,
          }
        );
      } else {
        // Use JSON for non-file commands
        const requestBody = {
          ...values,
          auth_userid: userId,
        };

        response = await fetch(
          `${getApiEndpoint()}/api/plugins/${command.cog_id}/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getApiHeaders() },
            body: JSON.stringify(requestBody),
          }
        );
      }

      let result;
      let errorDetail = null;

      try {
        result = await response.json();
      } catch {
        // If JSON parsing fails, use text response
        const text = await response.text();
        result = { success: false, message: text || "Unknown error" };
      }

      // Handle HTTP errors (4xx, 5xx)
      if (!response.ok) {
        // FastAPI returns error in "detail" field
        console.error("API Error:", result);
        console.error(
          "Validation errors:",
          JSON.stringify(result.detail, null, 2)
        );
        errorDetail =
          result.detail || result.message || `HTTP ${response.status} error`;
      }

      // Add system response
      let responseContent = "";
      let timetableData = null;
      let questionsData = null;

      if (errorDetail) {
        responseContent = `❌ ${errorDetail}`;
      } else if (result.success) {
        // Show webhook response if available (for n8n integrations)
        if (result.webhook_response) {
          const webhookData = result.webhook_response;

          // Check if this is a questions response
          if (
            webhookData.questions &&
            Array.isArray(webhookData.questions) &&
            command?.command === "questions"
          ) {
            questionsData = webhookData;
            const totalQuestions =
              webhookData.total || webhookData.questions.length;
            const inFileCount = webhookData.in_file_count || 0;
            const externalCount = webhookData.external_count || 0;
            responseContent = `✅ Tạo câu hỏi thành công!\n\n📊 Kết quả:\n• Tổng cộng: ${totalQuestions} câu hỏi\n• Từ tài liệu: ${inFileCount} câu\n• Bổ sung: ${externalCount} câu`;
          }
          // Check if this is a timetable response
          else if (
            webhookData.scheduled_sessions &&
            command?.command === "timetable"
          ) {
            timetableData = webhookData;
            const scheduledCount = webhookData.scheduled_sessions.length;
            const unscheduledCount =
              webhookData.unscheduled_sessions?.length || 0;
            responseContent = `✅ Đã tạo thời khóa biểu thành công!\n\n📊 Kết quả:\n• ${scheduledCount} môn đã xếp lịch\n• ${unscheduledCount} môn chưa xếp được`;
          }
          // Check if this is a research response with download_url
          else if (
            webhookData.download_url &&
            command?.command === "research"
          ) {
            const totalPages = webhookData.total_pages || "N/A";
            const status =
              webhookData.status === "success"
                ? "✅ Thành công"
                : webhookData.status;
            responseContent = `✅ Nghiên cứu hoàn tất!\n\n📊 Kết quả:\n• Trạng thái: ${status}\n• Số trang: ${totalPages} trang\n\n📥 Tải xuống:\n${webhookData.download_url}`;
          }
          // Check if it's an AI agent response with output
          else if (webhookData.output) {
            responseContent = `🤖 ${webhookData.output}`;
          } else if (webhookData.text) {
            responseContent = `📝 ${webhookData.text}`;
          } else if (typeof webhookData === "string") {
            responseContent = `✅ ${webhookData}`;
          } else {
            // Show formatted JSON for debugging
            responseContent = `✅ ${
              result.message
            }\n\n📊 Response:\n${JSON.stringify(webhookData, null, 2)}`;
          }
        } else {
          responseContent = `✅ ${
            result.message || "Command executed successfully"
          }`;
        }
      } else {
        responseContent = `❌ ${result.message || "Command failed"}`;
      }

      const systemMessage: Message = {
        id: pendingMessageId,
        type: "system",
        content: responseContent,
        timestamp: new Date(),
        timetableData: timetableData,
        questionsData: questionsData,
        isPending: false,
      };
      // Replace pending message with actual response
      setMessages((prev) =>
        prev.map((msg) => (msg.id === pendingMessageId ? systemMessage : msg))
      );
    } catch (error) {
      const errorMessage: Message = {
        id: pendingMessageId,
        type: "system",
        content: `❌ Failed to execute command: ${
          error instanceof Error ? error.message : String(error)
        }`,
        timestamp: new Date(),
        isPending: false,
      };
      // Replace pending message with error
      setMessages((prev) =>
        prev.map((msg) => (msg.id === pendingMessageId ? errorMessage : msg))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (selectedCommand) {
      // If command is selected, this should be handled by the modal
      return;
    }

    // Regular message
    const messageText = input.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // Send to backend chat endpoint
    try {
      setIsLoading(true);
      const payload: { message: string; auth_userid: string } = {
        message: messageText,
        auth_userid: user?.id || "anonymous",
      };

      console.log("[ChatPage] Sending plain chat to backend:", payload);

      const response = await fetch(
        `${getApiEndpoint()}/api/plugins/chat/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getApiHeaders() },
          body: JSON.stringify(payload),
        }
      );

      let data: {
        success?: boolean;
        message?: string;
        response?: string;
        webhook_response?: { text?: string } | string;
        detail?: string;
      };
      try {
        data = await response.json();
      } catch {
        const text = await response.text();
        data = { success: false, message: text || "Unknown error" };
      }

      console.log("[ChatPage] Response from chat API:", response.status, data);

      if (!response.ok) {
        const err = data.detail || data.message || `HTTP ${response.status}`;
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "system",
          content: `❌ ${err}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setServerError(String(err));
        // auto clear after 6s
        setTimeout(() => setServerError(null), 6000);
      } else {
        // Display AI response in chat
        const webhookText =
          typeof data.webhook_response === "object" &&
          data.webhook_response !== null
            ? (data.webhook_response as { text?: string }).text
            : typeof data.webhook_response === "string"
            ? data.webhook_response
            : undefined;
        const botText =
          data.message || data.response || webhookText || "(No reply)";
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "system",
          content: botText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("[ChatPage] Error sending plain chat:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "system",
        content: "Error: Unable to reach the chat service.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setServerError(String(error));
      setTimeout(() => setServerError(null), 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = (questions: QuestionData[]) => {
    setQuizMode(true);
    setQuizQuestions(questions);
  };

  const handleBackToChat = () => {
    setQuizMode(false);
    setQuizQuestions([]);
  };

  // If in quiz mode, show QuizPage instead of chat
  if (quizMode && quizQuestions.length > 0) {
    return (
      <QuizPage
        themeMode={themeMode}
        questions={quizQuestions}
        onBack={handleBackToChat}
      />
    );
  }

  return (
    <div
      className={`flex flex-col h-full ${
        themeMode === "dark"
          ? "bg-gray-900"
          : themeMode === "cream"
          ? "bg-[#fdf6e3]"
          : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-2.5 border-b ${
          themeMode === "dark"
            ? "border-gray-700 bg-gray-800"
            : themeMode === "cream"
            ? "border-[#dcd6c1] bg-[#eee9d4]"
            : "border-gray-200 bg-white"
        }`}
      >
        {/* Server error toast */}
        {serverError && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-red-600 text-white px-4 py-2 rounded shadow">
              <div className="flex items-center gap-2">
                <div className="flex-1 text-sm">{serverError}</div>
                <button
                  onClick={() => setServerError(null)}
                  className="text-white opacity-80 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
        <h1
          className={`text-base font-semibold ${
            themeMode === "dark"
              ? "text-white"
              : themeMode === "cream"
              ? "text-[#6a777e]"
              : "text-gray-900"
          }`}
        >
          VKU Toolkit Chat
        </h1>
        <p
          className={`text-xs mt-0.5 ${
            themeMode === "dark"
              ? "text-gray-400"
              : themeMode === "cream"
              ? "text-[#b3b6ae]"
              : "text-gray-600"
          }`}
        >
          Type{" "}
          <code
            className={`px-1 py-0.5 text-xs rounded ${
              themeMode === "dark"
                ? "bg-gray-700"
                : themeMode === "cream"
                ? "bg-[#dcd6c1] text-[#6a777e]"
                : "bg-gray-200"
            }`}
          >
            /
          </code>{" "}
          to see available commands
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {searchQuery.trim() && filteredMessages.length === 0 ? (
          <div
            className={`text-center py-8 ${
              themeMode === "dark" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <p>Không tìm thấy tin nhắn nào chứa "{searchQuery}"</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-2xl px-3 py-1.5 rounded-lg ${
                  msg.type === "user"
                    ? themeMode === "dark"
                      ? "bg-blue-600 text-white"
                      : themeMode === "cream"
                      ? "bg-[#dcd6c1] text-[#6a777e]"
                      : "bg-blue-500 text-white"
                    : msg.type === "system"
                    ? themeMode === "dark"
                      ? "bg-gray-700 text-white"
                      : themeMode === "cream"
                      ? "bg-[#eee9d4] border border-[#dcd6c1] text-[#6a777e]"
                      : "bg-white border border-gray-200 text-gray-800"
                    : themeMode === "dark"
                    ? "bg-purple-900 text-purple-100"
                    : themeMode === "cream"
                    ? "bg-[#eee9d4] border border-[#dcd6c1] text-[#6a777e]"
                    : "bg-purple-50 border border-purple-200 text-purple-900"
                }`}
              >
                <div className="text-xs leading-relaxed break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ ...props }) => (
                        <a
                          {...props}
                          className={`underline hover:opacity-80 ${
                            themeMode === "dark"
                              ? "text-blue-400"
                              : themeMode === "cream"
                              ? "text-[#6a777e] font-semibold"
                              : "text-blue-600"
                          }`}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      strong: ({ ...props }) => (
                        <strong {...props} className="font-bold" />
                      ),
                      em: ({ ...props }) => (
                        <em {...props} className="italic" />
                      ),
                      code: ({ className, ...props }) =>
                        className?.includes("inline") ? (
                          <code
                            {...props}
                            className={`px-1 py-0.5 rounded text-xs ${
                              themeMode === "dark"
                                ? "bg-gray-600"
                                : themeMode === "cream"
                                ? "bg-[#dcd6c1]"
                                : "bg-gray-200"
                            }`}
                          />
                        ) : (
                          <code
                            {...props}
                            className={`block px-2 py-1 rounded text-xs overflow-x-auto ${
                              themeMode === "dark"
                                ? "bg-gray-600"
                                : themeMode === "cream"
                                ? "bg-[#dcd6c1]"
                                : "bg-gray-200"
                            }`}
                          />
                        ),
                      ul: ({ ...props }) => (
                        <ul {...props} className="list-disc list-inside my-1" />
                      ),
                      ol: ({ ...props }) => (
                        <ol
                          {...props}
                          className="list-decimal list-inside my-1"
                        />
                      ),
                      li: ({ children, ...props }) => (
                        <li {...props} className="my-0.5">
                          {children}
                        </li>
                      ),
                      p: ({ ...props }) => <p {...props} className="my-1" />,
                      h1: ({ ...props }) => (
                        <h1 {...props} className="text-sm font-bold my-1" />
                      ),
                      h2: ({ ...props }) => (
                        <h2 {...props} className="text-xs font-bold my-1" />
                      ),
                      h3: ({ ...props }) => (
                        <h3 {...props} className="text-xs font-semibold my-1" />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>

                  {/* Timetable Display */}
                  {msg.timetableData && (
                    <div className="mt-3 space-y-3">
                      {/* Scheduled Sessions */}
                      {msg.timetableData.scheduled_sessions &&
                        msg.timetableData.scheduled_sessions.length > 0 && (
                          <div>
                            <h4
                              className={`text-sm font-semibold mb-2 ${
                                themeMode === "dark"
                                  ? "text-green-400"
                                  : themeMode === "cream"
                                  ? "text-green-700"
                                  : "text-green-600"
                              }`}
                            >
                              📅 Lịch học (
                              {msg.timetableData.scheduled_sessions.length} môn)
                            </h4>
                            <div className="space-y-2">
                              {msg.timetableData.scheduled_sessions.map(
                                (session: ScheduledSession) => (
                                  <div
                                    key={session.stt_id}
                                    className={`p-2 rounded-lg border text-xs ${
                                      themeMode === "dark"
                                        ? "bg-gray-700 border-gray-600"
                                        : themeMode === "cream"
                                        ? "bg-[#fdf6e3] border-[#dcd6c1]"
                                        : "bg-gray-50 border-gray-200"
                                    }`}
                                  >
                                    <div className="font-semibold">
                                      {session.course_name}
                                    </div>
                                    <div className="text-[10px] opacity-80 mt-1">
                                      {session.day} • {session.time_slots} •
                                      Phòng {session.classroom}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Unscheduled Sessions */}
                      {msg.timetableData.unscheduled_sessions &&
                        msg.timetableData.unscheduled_sessions.length > 0 && (
                          <div>
                            <h4
                              className={`text-sm font-semibold mb-2 ${
                                themeMode === "dark"
                                  ? "text-yellow-400"
                                  : themeMode === "cream"
                                  ? "text-yellow-700"
                                  : "text-yellow-600"
                              }`}
                            >
                              ⚠️ Chưa xếp được (
                              {msg.timetableData.unscheduled_sessions.length}{" "}
                              môn)
                            </h4>
                            <div className="space-y-2">
                              {msg.timetableData.unscheduled_sessions.map(
                                (session: ScheduledSession) => (
                                  <div
                                    key={session.stt_id}
                                    className={`p-2 rounded-lg border text-xs ${
                                      themeMode === "dark"
                                        ? "bg-yellow-900/20 border-yellow-700"
                                        : themeMode === "cream"
                                        ? "bg-yellow-50 border-yellow-300"
                                        : "bg-yellow-50 border-yellow-200"
                                    }`}
                                  >
                                    <div className="font-semibold">
                                      {session.course_name}
                                    </div>
                                    <div className="text-[10px] opacity-80 mt-1">
                                      {session.reason_not_selected}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Import Button */}
                      <button
                        onClick={() => {
                          // Only import if there are scheduled sessions
                          if (
                            !msg.timetableData?.scheduled_sessions ||
                            msg.timetableData.scheduled_sessions.length === 0
                          ) {
                            alert("❌ Không có môn nào được xếp lịch để lưu!");
                            return;
                          }

                          // Save to localStorage (keep last 3)
                          const saved = JSON.parse(
                            localStorage.getItem("saved_timetables") || "[]"
                          );
                          const newTimetable = {
                            id: Date.now(),
                            timestamp: new Date().toISOString(),
                            data: msg.timetableData,
                          };
                          saved.unshift(newTimetable);
                          localStorage.setItem(
                            "saved_timetables",
                            JSON.stringify(saved.slice(0, 3))
                          );

                          alert(
                            `✅ Đã lưu ${
                              msg.timetableData?.scheduled_sessions?.length ?? 0
                            } môn vào thời khóa biểu!`
                          );
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          themeMode === "dark"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : themeMode === "cream"
                            ? "bg-[#b3b6ae] hover:bg-[#9a9d96] text-white"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                      >
                        💾 Lưu thời khóa biểu này
                      </button>
                    </div>
                  )}

                  {/* Questions Display */}
                  {msg.questionsData && msg.questionsData.questions && (
                    <div className="mt-3">
                      <QuestionsDisplay
                        questions={msg.questionsData.questions}
                        inFileCount={msg.questionsData.in_file_count || 0}
                        externalCount={msg.questionsData.external_count || 0}
                        isDarkMode={themeMode === "dark"}
                        onStartQuiz={handleStartQuiz}
                      />
                    </div>
                  )}
                </div>
                <span className="text-[10px] opacity-70 mt-0.5 block">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className={`max-w-2xl px-3 py-1.5 rounded-lg ${
                themeMode === "dark"
                  ? "bg-gray-700 text-white"
                  : themeMode === "cream"
                  ? "bg-[#eee9d4] border border-[#dcd6c1] text-[#6a777e]"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-xs">Processing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Command Modal */}
      {selectedCommand && (
        <div
          className={`border-t px-3 py-2.5 max-h-[60vh] overflow-y-auto ${
            themeMode === "dark"
              ? "border-gray-700 bg-gray-800"
              : themeMode === "cream"
              ? "border-[#dcd6c1] bg-[#eee9d4]"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="max-w-2xl mx-auto">
            <div
              className="flex items-center gap-2 mb-2 sticky top-0 pb-2 z-10"
              style={{
                backgroundColor:
                  themeMode === "dark"
                    ? "#1f2937"
                    : themeMode === "cream"
                    ? "#eee9d4"
                    : "white",
              }}
            >
              <Slash
                className={`w-4 h-4 ${
                  themeMode === "dark"
                    ? "text-blue-400"
                    : themeMode === "cream"
                    ? "text-[#b3b6ae]"
                    : "text-blue-500"
                }`}
              />
              <h3
                className={`text-sm font-semibold ${
                  themeMode === "dark"
                    ? "text-white"
                    : themeMode === "cream"
                    ? "text-[#6a777e]"
                    : "text-gray-900"
                }`}
              >
                {selectedCommand.cog_name} - {selectedCommand.description}
              </h3>
            </div>

            <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedCommand.fields.map((field) => (
                <div
                  key={field.name}
                  className={
                    field.type === "textarea" || field.type === "multiselect"
                      ? "md:col-span-1"
                      : ""
                  }
                >
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      themeMode === "dark"
                        ? "text-gray-300"
                        : themeMode === "cream"
                        ? "text-[#6a777e]"
                        : "text-gray-700"
                    }`}
                  >
                    {field.label}{" "}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={(commandValues[field.name] as string) || ""}
                      onChange={(e) =>
                        setCommandValues((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className={`w-full px-2.5 py-1.5 text-xs border rounded-lg resize-none
                               focus:ring-2 focus:border-transparent ${
                                 themeMode === "dark"
                                   ? "border-gray-600 bg-gray-700 text-white focus:ring-blue-500"
                                   : themeMode === "cream"
                                   ? "border-[#dcd6c1] bg-[#fdf6e3] text-[#6a777e] focus:ring-[#b3b6ae]"
                                   : "border-gray-300 bg-white text-gray-900 focus:ring-blue-500"
                               }`}
                      rows={4}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={(commandValues[field.name] as string) || ""}
                      onChange={(e) =>
                        setCommandValues((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      className={`w-full px-2.5 py-1.5 text-xs border rounded-lg
                               focus:ring-2 focus:border-transparent ${
                                 themeMode === "dark"
                                   ? "border-gray-600 bg-gray-700 text-white focus:ring-blue-500"
                                   : themeMode === "cream"
                                   ? "border-[#dcd6c1] bg-[#fdf6e3] text-[#6a777e] focus:ring-[#b3b6ae]"
                                   : "border-gray-300 bg-white text-gray-900 focus:ring-blue-500"
                               }`}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "tristate" ? (
                    <div
                      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-1.5 p-2 border rounded-lg"
                      style={{
                        borderColor:
                          themeMode === "dark"
                            ? "#4b5563"
                            : themeMode === "cream"
                            ? "#dcd6c1"
                            : "#d1d5db",
                      }}
                    >
                      {field.options?.map((opt) => {
                        const currentState =
                          ((commandValues[field.name] as Record<
                            string,
                            string
                          >) || {})[opt] || "none";
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const currentPrefs =
                                (commandValues[field.name] as Record<
                                  string,
                                  string
                                >) || {};
                              const current = currentPrefs[opt] || "none";
                              const next =
                                current === "none"
                                  ? "prefer"
                                  : current === "prefer"
                                  ? "avoid"
                                  : "none";

                              const newPrefs = { ...currentPrefs };
                              if (next === "none") {
                                delete newPrefs[opt];
                              } else {
                                newPrefs[opt] = next;
                              }

                              setCommandValues((prev) => ({
                                ...prev,
                                [field.name]: newPrefs,
                              }));
                            }}
                            className={`px-2 py-1.5 text-xs rounded transition-colors ${
                              currentState === "prefer"
                                ? themeMode === "dark"
                                  ? "bg-green-600 text-white border-2 border-green-500"
                                  : themeMode === "cream"
                                  ? "bg-green-100 text-green-800 border-2 border-green-400"
                                  : "bg-green-100 text-green-800 border-2 border-green-500"
                                : currentState === "avoid"
                                ? themeMode === "dark"
                                  ? "bg-red-600 text-white border-2 border-red-500"
                                  : themeMode === "cream"
                                  ? "bg-red-100 text-red-800 border-2 border-red-400"
                                  : "bg-red-100 text-red-800 border-2 border-red-500"
                                : themeMode === "dark"
                                ? "bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                                : themeMode === "cream"
                                ? "bg-[#fdf6e3] text-[#6a777e] border border-[#dcd6c1] hover:bg-[#dcd6c1]"
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="font-medium truncate">{opt}</div>
                            <div className="text-[10px] opacity-70">
                              {currentState === "prefer"
                                ? "✓ Ưu tiên"
                                : currentState === "avoid"
                                ? "✗ Né"
                                : "•"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : field.type === "multiselect" ? (
                    <div
                      className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto p-1 border rounded-lg"
                      style={{
                        borderColor:
                          themeMode === "dark"
                            ? "#4b5563"
                            : themeMode === "cream"
                            ? "#dcd6c1"
                            : "#d1d5db",
                      }}
                    >
                      {field.options?.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded cursor-pointer ${
                            themeMode === "dark"
                              ? "hover:bg-gray-700"
                              : themeMode === "cream"
                              ? "hover:bg-[#dcd6c1]"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={(
                              (commandValues[field.name] as string[]) || []
                            ).includes(opt)}
                            onChange={(e) => {
                              const currentValues =
                                (commandValues[field.name] as string[]) || [];
                              const newValues = e.target.checked
                                ? [...currentValues, opt]
                                : currentValues.filter((v) => v !== opt);
                              setCommandValues((prev) => ({
                                ...prev,
                                [field.name]: newValues,
                              }));
                            }}
                            className="rounded border-gray-300 w-3 h-3"
                          />
                          <span
                            className={`truncate ${
                              themeMode === "dark"
                                ? "text-gray-300"
                                : themeMode === "cream"
                                ? "text-[#6a777e]"
                                : "text-gray-700"
                            }`}
                          >
                            {opt}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === "file" ? (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,.txt,.docx,.doc,.pptx"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            setCommandValues((prev) => ({
                              ...prev,
                              [field.name]: files[0],
                            }));
                          }
                        }}
                        className={`w-full px-2.5 py-1.5 text-xs border rounded-lg
                                 focus:ring-2 focus:border-transparent ${
                                   themeMode === "dark"
                                     ? "border-gray-600 bg-gray-700 text-white focus:ring-blue-500"
                                     : themeMode === "cream"
                                     ? "border-[#dcd6c1] bg-[#fdf6e3] text-[#6a777e] focus:ring-[#b3b6ae]"
                                     : "border-gray-300 bg-white text-gray-900 focus:ring-blue-500"
                                 }`}
                      />
                      {commandValues[field.name] instanceof File && (
                        <div
                          className={`mt-1 text-xs p-1.5 rounded flex items-center gap-1 ${
                            themeMode === "dark"
                              ? "bg-gray-700 text-green-400"
                              : themeMode === "cream"
                              ? "bg-[#dcd6c1] text-green-700"
                              : "bg-gray-100 text-green-700"
                          }`}
                        >
                          <span>✓</span>
                          <span className="truncate">
                            {(commandValues[field.name] as File).name}
                          </span>
                          <span className="text-gray-500">
                            (
                            {Math.round(
                              (commandValues[field.name] as File).size / 1024
                            )}{" "}
                            KB)
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      value={
                        field.type === "number"
                          ? (commandValues[field.name] as number | string) || ""
                          : (commandValues[field.name] as string) || ""
                      }
                      onChange={(e) => {
                        if (field.type === "number") {
                          // Store as string but let validation happen on submit
                          const value = e.target.value;
                          setCommandValues((prev) => ({
                            ...prev,
                            [field.name]: value,
                          }));
                        } else {
                          setCommandValues((prev) => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }));
                        }
                      }}
                      placeholder={field.placeholder}
                      min={field.type === "number" ? "1" : undefined}
                      max={field.type === "number" ? "100" : undefined}
                      className={`w-full px-2.5 py-1.5 text-xs border rounded-lg
                               focus:ring-2 focus:border-transparent ${
                                 themeMode === "dark"
                                   ? "border-gray-600 bg-gray-700 text-white focus:ring-blue-500"
                                   : themeMode === "cream"
                                   ? "border-[#dcd6c1] bg-[#fdf6e3] text-[#6a777e] focus:ring-[#b3b6ae]"
                                   : "border-gray-300 bg-white text-gray-900 focus:ring-blue-500"
                               }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setSelectedCommand(null);
                  setCommandValues({});
                  setInput("");
                }}
                className={`px-3 py-1.5 text-xs rounded-lg ${
                  themeMode === "dark"
                    ? "text-gray-300 hover:bg-gray-700"
                    : themeMode === "cream"
                    ? "text-[#6a777e] hover:bg-[#dcd6c1]"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteCommand}
                className={`flex-1 px-3 py-1.5 text-xs rounded-lg font-medium ${
                  themeMode === "dark"
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : themeMode === "cream"
                    ? "bg-[#dcd6c1] text-[#6a777e] hover:bg-[#b3b6ae] hover:text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Execute Command
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div
        className={`px-3 py-2.5 border-t ${
          themeMode === "dark"
            ? "border-gray-700 bg-gray-800"
            : themeMode === "cream"
            ? "border-[#dcd6c1] bg-[#eee9d4]"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-2xl mx-auto relative">
          {/* Command Menu */}
          {showCommandMenu && (
            <div
              className={`absolute bottom-full mb-2 w-full border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                themeMode === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : themeMode === "cream"
                  ? "bg-[#eee9d4] border-[#dcd6c1]"
                  : "bg-white border-gray-200"
              }`}
            >
              {commands.length === 0 ? (
                <div
                  className={`p-4 text-center ${
                    themeMode === "dark"
                      ? "text-gray-400"
                      : themeMode === "cream"
                      ? "text-[#b3b6ae]"
                      : "text-gray-500"
                  }`}
                >
                  No commands available. Enable a plugin first.
                </div>
              ) : (
                <>
                  {/* Built-in /clear command */}
                  <button
                    onClick={() => {
                      setMessages([
                        {
                          id: "1",
                          type: "system",
                          content:
                            "Chat cleared. Type / to see available commands.",
                          timestamp: new Date(),
                        },
                      ]);
                      setInput("");
                      setShowCommandMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                      themeMode === "dark"
                        ? "hover:bg-gray-700"
                        : themeMode === "cream"
                        ? "hover:bg-[#dcd6c1]"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <Slash
                      className={`w-4 h-4 ${
                        themeMode === "dark"
                          ? "text-gray-400"
                          : themeMode === "cream"
                          ? "text-[#b3b6ae]"
                          : "text-blue-500"
                      }`}
                    />
                    <div>
                      <div
                        className={`text-xs font-medium ${
                          themeMode === "dark"
                            ? "text-white"
                            : themeMode === "cream"
                            ? "text-[#6a777e]"
                            : "text-gray-900"
                        }`}
                      >
                        /clear
                      </div>
                      <div
                        className={`text-[10px] ${
                          themeMode === "dark"
                            ? "text-gray-400"
                            : themeMode === "cream"
                            ? "text-[#b3b6ae]"
                            : "text-gray-600"
                        }`}
                      >
                        Clear chat history
                      </div>
                    </div>
                  </button>

                  {/* Plugin commands */}
                  {commands.map((cmd) => {
                    const IconComponent = getPluginIcon(cmd.icon);
                    const colorClass =
                      cmd.color && cmd.color.trim() !== ""
                        ? cmd.color
                        : "from-gray-500 to-gray-600";
                    return (
                      <button
                        key={cmd.command}
                        onClick={() => handleCommandSelect(cmd)}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2 ${
                          themeMode === "dark"
                            ? "hover:bg-gray-700"
                            : themeMode === "cream"
                            ? "hover:bg-[#dcd6c1]"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded bg-gradient-to-br ${colorClass} flex items-center justify-center text-white`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div
                            className={`text-xs font-medium ${
                              themeMode === "dark"
                                ? "text-white"
                                : themeMode === "cream"
                                ? "text-[#6a777e]"
                                : "text-gray-900"
                            }`}
                          >
                            /{cmd.command}
                          </div>
                          <div
                            className={`text-[10px] ${
                              themeMode === "dark"
                                ? "text-gray-400"
                                : themeMode === "cream"
                                ? "text-[#b3b6ae]"
                                : "text-gray-600"
                            }`}
                          >
                            {cmd.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                selectedCommand
                  ? "Fill in the fields above..."
                  : "Type a message or / for commands..."
              }
              disabled={!!selectedCommand}
              className={`flex-1 px-3 py-2 text-sm border rounded-lg 
                       focus:ring-2 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed ${
                         themeMode === "dark"
                           ? "border-gray-600 bg-gray-700 text-white focus:ring-blue-500"
                           : themeMode === "cream"
                           ? "border-[#dcd6c1] bg-[#fdf6e3] text-[#6a777e] focus:ring-[#b3b6ae]"
                           : "border-gray-300 bg-white text-gray-900 focus:ring-blue-500"
                       }`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !!selectedCommand}
              className={`px-4 py-2 rounded-lg disabled:cursor-not-allowed ${
                themeMode === "dark"
                  ? "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white"
                  : themeMode === "cream"
                  ? "bg-[#dcd6c1] text-[#6a777e] hover:bg-[#b3b6ae] hover:text-white disabled:bg-[#eee9d4]"
                  : "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
