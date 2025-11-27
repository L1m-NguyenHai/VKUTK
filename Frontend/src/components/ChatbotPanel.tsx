import { useState, useRef, useEffect } from "react";
import { Send, X, MessageSquare, Loader, Paperclip } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getApiEndpoint } from "../utils/apiConfig";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

interface ChatbotPanelProps {
  isDarkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const SLASH_COMMANDS = [
  { command: "/documents", description: "Xem tài liệu của trường" },
  { command: "/scores", description: "Xem điểm số cá nhân" },
  { command: "/summary", description: "Tóm tắt nội dung từ file PDF" },
];

// Parse markdown: bold (**text**), links ([text](url)), and line breaks (\n)
function parseMarkdown(text: string) {
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;

  // Regex for markdown patterns
  const markdownRegex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)|(\\n)/g;
  let match;

  while ((match = markdownRegex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold text**
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold">
          {match[1]}
        </strong>
      );
    } else if (match[2] && match[3]) {
      // [link text](url)
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      // \n for line break
      parts.push(<br key={`break-${match.index}`} />);
    }

    lastIndex = markdownRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function ChatbotPanel({
  isDarkMode,
  isOpen,
  onClose,
}: ChatbotPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    // Don't send if neither input nor file
    if (!inputValue.trim() && !selectedFile) return;
    if (isLoading) return;

    // Build user message text (show file + text if both exist)
    let displayText = "";
    if (selectedFile) {
      displayText = `📎 ${selectedFile.name}`;
      if (inputValue.trim()) {
        displayText += "\n" + inputValue;
      }
    } else {
      displayText = inputValue;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: displayText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build FormData for multipart request (supporting binary file upload)
      const formData = new FormData();
      formData.append("message", displayText);
      formData.append("auth_userid", user?.id || "anonymous");

      // Add file if selected (binary upload like Postman)
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      // Don't set Content-Type header for FormData - browser will auto-set with boundary
      const response = await fetch(
        `${getApiEndpoint()}/api/plugins/chat/send`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: formData,
        }
      );

      console.log("[ChatbotPanel] Chat send response status:", response.status);

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error("[ChatbotPanel] Failed to parse JSON response:", e, text);
        data = { success: false, message: text || "Unknown error" };
      }
      console.log("[ChatbotPanel] Chat send response payload:", data);

      // Parse bot response - extract clean message text
      let botResponse = "Sorry, I couldn't understand that.";
      if (data.success) {
        // Prioritize message field (already extracted by backend)
        if (data.message) {
          botResponse = data.message;
        } else if (data.response) {
          if (typeof data.response === "string") {
            botResponse = data.response;
          } else if (typeof data.response === "object") {
            // Handle array or object responses
            if (Array.isArray(data.response) && data.response.length > 0) {
              const item = data.response[0];
              if (typeof item === "object" && item.output) {
                botResponse = item.output;
              } else {
                botResponse = JSON.stringify(item);
              }
            } else if (data.response.message || data.response.output) {
              botResponse = data.response.message || data.response.output;
            } else {
              botResponse = JSON.stringify(data.response);
            }
          }
        }
      } else if (!data.success) {
        botResponse = "Error: Unable to reach the chatbot service.";
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Clear selected file after sending
      setSelectedFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Error: Unable to connect to the chatbot.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setToast("Error: Unable to connect to the chatbot.");
      setTimeout(() => setToast(null), 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Show commands if input starts with /
    if (value === "/" || (value.startsWith("/") && !value.includes(" "))) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const selectCommand = (command: string) => {
    setInputValue(command + " ");
    setShowCommands(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-0 right-0 w-full md:w-96 h-screen md:h-screen md:rounded-tl-xl shadow-2xl flex flex-col z-40 ${
        isDarkMode
          ? "bg-gradient-to-b from-gray-800 to-gray-900 border-l border-gray-700"
          : "bg-gradient-to-b from-white to-gray-50 border-l border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b ${
          isDarkMode
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3
              className={`font-semibold text-sm ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              VKU Assistant
            </h3>
            <p
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Online
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? "hover:bg-gray-700 text-gray-400"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-3 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare
                className={`w-12 h-12 mx-auto mb-2 ${
                  isDarkMode ? "text-gray-700" : "text-gray-300"
                }`}
              />
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Start a conversation...
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.sender === "user"
                  ? isDarkMode
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-100"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <p className="text-sm break-words whitespace-pre-wrap">
                {parseMarkdown(message.text)}
              </p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "user"
                    ? "text-blue-100"
                    : isDarkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className={`px-4 py-2 rounded-lg ${
                isDarkMode
                  ? "bg-gray-700 text-gray-100"
                  : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <p className="text-sm">Typing...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className={`p-4 border-t ${
          isDarkMode
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-white"
        }`}
      >
        <div ref={inputContainerRef} className="flex flex-col gap-2">
          {/* Input Area with File Display */}
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              {/* File Badge Display */}
              {selectedFile && (
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-lg text-sm">
                    <Paperclip className="w-3 h-3" />
                    <span className="max-w-[150px] truncate">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={removeSelectedFile}
                      className="ml-1 hover:text-blue-700 dark:hover:text-blue-300"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (try /)"
                disabled={isLoading}
                className={`w-full px-3 py-2 rounded-lg text-sm outline-none transition-all ${
                  isDarkMode
                    ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                    : "bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400"
                } disabled:opacity-50`}
              />

              {/* Slash Commands Suggestions */}
              {showCommands && (
                <div
                  className={`absolute bottom-full left-0 right-0 mb-2 rounded-lg shadow-lg overflow-hidden z-50 ${
                    isDarkMode
                      ? "bg-gray-700 border border-gray-600"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {SLASH_COMMANDS.map((cmd) => (
                    <button
                      key={cmd.command}
                      onClick={() => selectCommand(cmd.command)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        isDarkMode
                          ? "hover:bg-gray-600 text-white"
                          : "hover:bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="font-mono font-semibold">
                        {cmd.command}
                      </div>
                      <div
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {cmd.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-all ${
                !isLoading
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-200 text-gray-500"
              }`}
              title="Gửi file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />

            {/* Send Message Button */}
            <button
              onClick={sendMessage}
              disabled={(!inputValue.trim() && !selectedFile) || isLoading}
              className={`p-2 rounded-lg transition-all ${
                (inputValue.trim() || selectedFile) && !isLoading
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50">
          <div className="bg-red-600 text-white px-3 py-2 rounded shadow-md flex items-center gap-2">
            <div className="text-sm">{toast}</div>
            <button onClick={() => setToast(null)} className="text-white">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
