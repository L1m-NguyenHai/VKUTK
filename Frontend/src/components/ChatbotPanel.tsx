import { useState, useRef, useEffect } from "react";
import { Send, X, MessageSquare, Loader } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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

export function ChatbotPanel({ isDarkMode, isOpen, onClose }: ChatbotPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/plugins/n8nchatbot/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: inputValue,
            auth_userid: user?.id || "anonymous",
          }),
        }
      );

      const data = await response.json();

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
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Error: Unable to connect to the chatbot.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all ${
              isDarkMode
                ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                : "bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400"
            } disabled:opacity-50`}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`p-2 rounded-lg transition-all ${
              inputValue.trim() && !isLoading
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
  );
}
