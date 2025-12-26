import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTimetable } from "../../contexts/TimetableContext";
import { API_ENDPOINTS, API_BASE_URL } from "../../utils/apiConfig";
import { CommandSuggestions } from "@/components/CommandSuggestions";
import { CommandParamModal } from "@/components/CommandParamModal";
import { QuestionsDisplay } from "@/components/QuestionsDisplay";
import { SLASH_COMMANDS, SlashCommand } from "@/constants/commands";
import { useRouter } from "expo-router";
import { saveJob } from "../../utils/jobStorage";

import * as Linking from "expo-linking";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  data?: any;
  messageType?: "text" | "timetable" | "questions" | "pdf" | "topcv_result";
}

const MessageBubble = ({
  item,
  isDark,
}: {
  item: Message;
  isDark: boolean;
}) => {
  const isUser = item.type === "user";
  const { importFromWebhook } = useTimetable();
  const router = useRouter();
  const [analyzingLink, setAnalyzingLink] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<Record<string, string>>(
    {}
  );

  const handleAnalyzeJob = async (url: string) => {
    setAnalyzingLink(url);
    try {
      // Call BrowserUse service directly as requested
      // Note: In a real production app, this should probably go through the main backend
      // to avoid CORS and mixed content issues, but for this requirement we call directly.
      // Assuming localhost:8001 is accessible (e.g. Android Emulator uses 10.0.2.2)
      // For physical device, replace localhost with your machine IP.
      const browserUseUrl = "http://10.0.2.2:8001/execute"; // Android Emulator friendly
      // const browserUseUrl = "http://localhost:8001/execute"; // iOS Simulator / Web

      const response = await fetch(browserUseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: `vào link ${url} và tóm tắt Mô tả công việc`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult((prev) => ({
        ...prev,
        [url]: data.result,
      }));

      // Save to local storage
      await saveJob({
        id: Date.now().toString(),
        url: url,
        summary: data.result,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      Alert.alert("Lỗi", "Không thể phân tích link này. Hãy thử lại sau.");
    } finally {
      setAnalyzingLink(null);
    }
  };

  const handleImport = () => {
    if (item.data) {
      Alert.alert(
        "Xác nhận Import",
        "Bạn có muốn nhập thời khóa biểu này vào lịch học không? Dữ liệu cũ sẽ bị ghi đè.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đồng ý",
            onPress: () => {
              importFromWebhook(item.data);
              router.push("/timetable");
            },
          },
        ]
      );
    }
  };

  const handleOpenPdf = () => {
    const url = item.data?.url || item.data?.download_url;
    if (url) {
      const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
      Linking.openURL(fullUrl);
    }
  };

  if (item.messageType === "questions" && item.data) {
    return (
      <View
        style={[
          styles.messageContainer,
          styles.botMessageContainer,
          { width: "100%" },
        ]}
      >
        <LinearGradient
          colors={["#6366F1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarBot}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={[styles.messageBubble, styles.botBubble, { width: "100%" }]}
          >
            <Text
              style={[
                styles.messageText,
                { color: isDark ? "#F3F4F6" : "#1F2937", marginBottom: 8 },
              ]}
            >
              {item.content}
            </Text>
            <QuestionsDisplay data={item.data} />
            <Text
              style={[
                styles.timestamp,
                {
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  marginTop: 8,
                },
              ]}
            >
              {item.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </BlurView>
        </View>
      </View>
    );
  }

  if (item.messageType === "pdf" && item.data) {
    return (
      <View style={[styles.messageContainer, styles.botMessageContainer]}>
        <LinearGradient
          colors={["#6366F1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarBot}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </LinearGradient>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={[styles.messageBubble, styles.botBubble]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isDark ? "#F3F4F6" : "#1F2937", marginBottom: 8 },
            ]}
          >
            {item.content}
          </Text>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "#374151" : "#EFF6FF",
              padding: 12,
              borderRadius: 12,
              gap: 12,
              borderWidth: 1,
              borderColor: isDark ? "#4B5563" : "#BFDBFE",
            }}
            onPress={handleOpenPdf}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#EF4444",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="document-text" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isDark ? "#F3F4F6" : "#1F2937",
                }}
                numberOfLines={1}
              >
                {item.data.filename || "Research Report.pdf"}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDark ? "#9CA3AF" : "#6B7280",
                }}
              >
                Nhấn để mở file
              </Text>
            </View>
            <Ionicons
              name="download-outline"
              size={20}
              color={isDark ? "#9CA3AF" : "#6B7280"}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.timestamp,
              {
                color: isDark ? "#9CA3AF" : "#6B7280",
                marginTop: 8,
              },
            ]}
          >
            {item.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </BlurView>
      </View>
    );
  }

  if (item.messageType === "topcv_result" && item.data?.links) {
    return (
      <View
        style={[
          styles.messageContainer,
          styles.botMessageContainer,
          { width: "100%" },
        ]}
      >
        <LinearGradient
          colors={["#6366F1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarBot}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={[styles.messageBubble, styles.botBubble, { width: "100%" }]}
          >
            <Text
              style={[
                styles.messageText,
                { color: isDark ? "#F3F4F6" : "#1F2937", marginBottom: 12 },
              ]}
            >
              {item.content}
            </Text>

            {item.data.links.map((link: any, index: number) => (
              <View
                key={index}
                style={{
                  backgroundColor: isDark ? "#374151" : "#F9FAFB",
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: isDark ? "#4B5563" : "#E5E7EB",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: isDark ? "#60A5FA" : "#2563EB",
                    marginBottom: 8,
                  }}
                  onPress={() => Linking.openURL(link.url)}
                >
                  {`Công việc #${link.id}`}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    marginBottom: 8,
                  }}
                  numberOfLines={1}
                >
                  {link.url}
                </Text>

                {analysisResult[link.url] ? (
                  <View
                    style={{
                      marginTop: 8,
                      padding: 8,
                      backgroundColor: isDark ? "#1F2937" : "#EFF6FF",
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "bold",
                        color: isDark ? "#E5E7EB" : "#1F2937",
                        marginBottom: 4,
                      }}
                    >
                      Tóm tắt JD:
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? "#D1D5DB" : "#4B5563",
                      }}
                    >
                      {analysisResult[link.url]}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isDark ? "#4B5563" : "#E5E7EB",
                      paddingVertical: 8,
                      borderRadius: 8,
                      marginTop: 4,
                    }}
                    onPress={() => handleAnalyzeJob(link.url)}
                    disabled={analyzingLink === link.url}
                  >
                    {analyzingLink === link.url ? (
                      <ActivityIndicator
                        size="small"
                        color={isDark ? "#FFFFFF" : "#000000"}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="analytics-outline"
                          size={16}
                          color={isDark ? "#E5E7EB" : "#374151"}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: isDark ? "#E5E7EB" : "#374151",
                          }}
                        >
                          Import & Phân tích
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <Text
              style={[
                styles.timestamp,
                {
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  marginTop: 8,
                },
              ]}
            >
              {item.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </BlurView>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer,
      ]}
    >
      {!isUser && (
        <LinearGradient
          colors={["#6366F1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarBot}
        >
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </LinearGradient>
      )}

      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        {isUser && (
          <LinearGradient
            colors={["#6366F1", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View>
          {item.content.split(/```([\s\S]*?)```/g).map((part, index) => {
            if (index % 2 === 1) {
              // Code block
              return (
                <View
                  key={index}
                  style={{
                    backgroundColor: isDark ? "#111827" : "rgba(0,0,0,0.05)",
                    padding: 8,
                    borderRadius: 6,
                    marginVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                      fontSize: 13,
                      color: isDark ? "#E5E7EB" : "#1F2937",
                    }}
                  >
                    {part.trim()}
                  </Text>
                </View>
              );
            } else {
              // Normal text
              if (!part) return null;
              return (
                <Text
                  key={index}
                  style={[
                    styles.messageText,
                    {
                      color: isUser
                        ? "#FFFFFF"
                        : isDark
                        ? "#F3F4F6"
                        : "#1F2937",
                    },
                  ]}
                >
                  {part.split("\n").map((line, i) => {
                    const lineParts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                      <Text key={i}>
                        {lineParts.map((p, j) => {
                          if (p.startsWith("**") && p.endsWith("**")) {
                            return (
                              <Text key={j} style={{ fontWeight: "bold" }}>
                                {p.slice(2, -2)}
                              </Text>
                            );
                          }
                          return p;
                        })}
                        {i < part.split("\n").length - 1 ? "\n" : ""}
                      </Text>
                    );
                  })}
                </Text>
              );
            }
          })}
        </View>
        <Text
          style={[
            styles.timestamp,
            {
              color: isUser
                ? "rgba(255,255,255,0.7)"
                : isDark
                ? "#9CA3AF"
                : "#6B7280",
            },
          ]}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        {item.messageType === "timetable" && (
          <TouchableOpacity
            style={{
              marginTop: 10,
              backgroundColor: isDark ? "#374151" : "#E5E7EB",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onPress={handleImport}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={isDark ? "#60A5FA" : "#2563EB"}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark ? "#60A5FA" : "#2563EB",
              }}
            >
              Import vào TKB
            </Text>
          </TouchableOpacity>
        )}
      </BlurView>

      {isUser && (
        <View style={styles.avatarUser}>
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

const TypingIndicator = ({ isDark }: { isDark: boolean }) => {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -3],
        }),
      },
    ],
  });

  return (
    <View style={[styles.messageContainer, styles.botMessageContainer]}>
      <LinearGradient
        colors={["#6366F1", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatarBot}
      >
        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
      </LinearGradient>
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.messageBubble,
          styles.botBubble,
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 18,
            minWidth: 60,
            justifyContent: "center",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.typingDot,
            { backgroundColor: isDark ? "#E5E7EB" : "#4B5563" },
            dotStyle(dot1),
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            { backgroundColor: isDark ? "#E5E7EB" : "#4B5563" },
            dotStyle(dot2),
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            { backgroundColor: isDark ? "#E5E7EB" : "#4B5563" },
            dotStyle(dot3),
          ]}
        />
      </BlurView>
    </View>
  );
};

export default function ChatScreen() {
  const router = useRouter();
  const { session, user } = useAuth();
  const { isDark, t } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<SlashCommand | null>(
    null
  );
  const [showParamModal, setShowParamModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        type: "bot",
        content:
          "Xin chào! Tôi là trợ lý ảo VKU-TK. Tôi có thể giúp gì cho bạn hôm nay?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text === "/" || (text.startsWith("/") && !text.includes(" "))) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const handleCommandSelect = (commandStr: string) => {
    const command = SLASH_COMMANDS.find((c) => c.command === commandStr);

    if (command && command.params && command.params.length > 0) {
      setSelectedCommand(command);
      setShowParamModal(true);
      setShowCommands(false);
    } else {
      setInputText(commandStr + " ");
      setShowCommands(false);
    }
  };

  const handleCommandSubmit = async (params: Record<string, any>) => {
    if (!selectedCommand) return;

    // Display user message
    const paramValues = Object.entries(params)
      .map(([key, value]) => {
        if (value && typeof value === "object" && value.name && value.uri) {
          return `[File: ${value.name}]`;
        }
        if (typeof value === "object") {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${value}`;
      })
      .join(" ");

    const displayContent = `${selectedCommand.command} ${paramValues}`;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: displayContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let endpoint = `${API_BASE_URL}/api/plugins/${selectedCommand.pluginId}/execute`;

      // Special endpoint for TopCV
      if (selectedCommand.pluginId === "topcv") {
        endpoint = `${API_BASE_URL}/api/topcv`;
      }

      // Check for file params
      const hasFile = Object.values(params).some(
        (val) => val && typeof val === "object" && val.uri && val.name
      );

      console.log("Sending command:", selectedCommand.command);
      console.log("Has file:", hasFile);
      console.log("Endpoint:", endpoint);

      let response;
      if (hasFile) {
        const formData = new FormData();
        formData.append("auth_userid", user?.id || "anonymous");

        Object.entries(params).forEach(([key, value]) => {
          if (value && typeof value === "object" && value.uri && value.name) {
            // It's a file
            console.log(`Appending file to ${key}:`, value.name);
            const fileData = {
              uri:
                Platform.OS === "android"
                  ? value.uri
                  : value.uri.replace("file://", ""),
              name: value.name,
              type: value.mimeType || "application/pdf",
            };
            formData.append(key, fileData as any);
          } else if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        });

        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            // Content-Type header must be omitted for FormData
          },
          body: formData,
        });
      } else {
        const body = {
          ...params,
          auth_userid: user?.id || "anonymous",
        };

        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        });
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        // If response is not ok, it might be a text error or empty
        if (!response.ok) {
          data = {
            success: false,
            message: `Server error: ${response.status}`,
          };
        } else {
          data = { success: false, message: "Invalid response from server" };
        }
      }

      let botResponse = "Sorry, I couldn't understand that.";
      if (response.ok && data.success) {
        if (data.webhook_response) {
          const wr = data.webhook_response;
          if (typeof wr === "string") {
            botResponse = wr;
          } else if (typeof wr === "object") {
            // Check if it's a timetable response
            if (wr.scheduled_sessions || wr.unscheduled_sessions) {
              let formatted = "📅 **Thời khóa biểu dự kiến:**\n\n";

              if (
                wr.scheduled_sessions &&
                Array.isArray(wr.scheduled_sessions)
              ) {
                // Group by day
                const sessionsByDay: Record<string, any[]> = {};
                wr.scheduled_sessions.forEach((session: any) => {
                  if (!sessionsByDay[session.day])
                    sessionsByDay[session.day] = [];
                  sessionsByDay[session.day].push(session);
                });

                // Order days if needed, or just iterate
                Object.entries(sessionsByDay).forEach(([day, sessions]) => {
                  formatted += `**${day}:**\n`;
                  sessions.forEach((s: any) => {
                    formatted += `- ${s.course_name}\n  ⏰ ${s.time_slots} | 📍 ${s.classroom}\n`;
                  });
                  formatted += "\n";
                });
              }

              if (
                wr.unscheduled_sessions &&
                Array.isArray(wr.unscheduled_sessions) &&
                wr.unscheduled_sessions.length > 0
              ) {
                formatted += "⚠️ **Môn chưa xếp được:**\n";
                wr.unscheduled_sessions.forEach((s: any) => {
                  formatted += `- ${s.course_name}: ${s.reason_not_selected}\n`;
                });
              }

              botResponse = formatted;
            } else if (wr.questions && Array.isArray(wr.questions)) {
              botResponse = "📝 **Bộ câu hỏi ôn tập:**";
            } else if (wr.download_url) {
              botResponse = "Nghiên cứu của bạn xong rùi nè!!";
            } else if (wr.type === "pdf" && wr.url) {
              botResponse =
                wr.message || "📄 **Báo cáo nghiên cứu đã sẵn sàng:**";
            } else if (wr.type === "topcv_result") {
              botResponse = `Đã tìm thấy ${
                wr.links?.length || 0
              } công việc phù hợp từ CV của bạn:`;
            } else {
              botResponse =
                wr.output ||
                wr.message ||
                wr.text ||
                wr.result ||
                JSON.stringify(wr, null, 2);
            }
          }
        } else {
          botResponse = data.message || data.response || JSON.stringify(data);
        }
      } else {
        // Handle error cases
        botResponse = `❌ **Lỗi:** ${
          data.detail || data.message || "Không thể xử lý yêu cầu."
        }`;
        if (data.detail && data.detail.includes("Failed to send webhook")) {
          botResponse +=
            "\n\n(Có thể Webhook n8n chưa được bật hoặc cấu hình sai)";
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: botResponse,
        timestamp: new Date(),
        // Add data for timetable import
        data: data.webhook_response,
        messageType:
          data.webhook_response &&
          (data.webhook_response.scheduled_sessions ||
            data.webhook_response.unscheduled_sessions)
            ? "timetable"
            : data.webhook_response && data.webhook_response.questions
            ? "questions"
            : data.webhook_response &&
              (data.webhook_response.type === "pdf" ||
                data.webhook_response.download_url)
            ? "pdf"
            : data.webhook_response &&
              data.webhook_response.type === "topcv_result"
            ? "topcv_result"
            : "text",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Command execution error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `Error executing command: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedCommand(null);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // Handle clear command
    if (inputText.trim() === "/clear") {
      setMessages([]);
      setInputText("");
      setShowCommands(false);
      return;
    }

    const messageText = inputText;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setShowCommands(false);
    setIsLoading(true);

    // Keep keyboard open for faster chatting
    // Keyboard.dismiss();

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const formData = new FormData();
      formData.append("message", messageText);
      formData.append("auth_userid", user?.id || "anonymous");

      const response = await fetch(API_ENDPOINTS.CHAT.SEND, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        data = { success: false, message: "Error parsing response" };
      }

      let botResponse = "Sorry, I couldn't understand that.";
      if (data.success) {
        if (data.message) {
          botResponse = data.message;
        } else if (data.response) {
          if (typeof data.response === "string") {
            botResponse = data.response;
          } else if (typeof data.response === "object") {
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
      } else {
        botResponse = "Error: Unable to reach the chatbot service.";
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Error: Unable to connect to the chatbot.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return <MessageBubble item={item} isDark={isDark} />;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#111827" : "#F3F4F6" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: isDark ? "#111827" : "#F3F4F6",
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Chat AI
          </Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/saved_jobs")}
          style={{
            padding: 8,
            backgroundColor: isDark ? "#374151" : "#E5E7EB",
            borderRadius: 20,
          }}
        >
          <Ionicons
            name="briefcase-outline"
            size={20}
            color={isDark ? "#FFFFFF" : "#1F2937"}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messagesList, { paddingBottom: 20 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={
            isLoading ? <TypingIndicator isDark={isDark} /> : null
          }
        />

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
              borderTopColor: isDark ? "#374151" : "#E5E7EB",
              paddingBottom: 90, // Add padding to avoid navbar overlap
            },
          ]}
        >
          <CommandSuggestions
            visible={showCommands}
            onSelect={handleCommandSelect}
            filterText={inputText.startsWith("/") ? inputText.substring(1) : ""}
          />
          <CommandParamModal
            visible={showParamModal}
            command={selectedCommand}
            onClose={() => setShowParamModal(false)}
            onSubmit={handleCommandSubmit}
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#374151" : "#F3F4F6",
                color: isDark ? "#FFFFFF" : "#111827",
              },
            ]}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim()
                  ? "#4F46E5"
                  : isDark
                  ? "#4B5563"
                  : "#E5E7EB",
              },
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={
                  inputText.trim() ? "#FFFFFF" : isDark ? "#9CA3AF" : "#9CA3AF"
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
    gap: 8,
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 20,
    padding: 14,
    overflow: "hidden",
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    backgroundColor: "rgba(200, 200, 200, 0.2)",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 0.3,
  },
  avatarBot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 12,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
