import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Question {
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation?: string;
  type?: "in_file" | "external";
  source?: string;
}

interface QuestionsDisplayProps {
  data: {
    questions: Question[];
    total: number;
    in_file_count: number;
    external_count: number;
  };
}

export function QuestionsDisplay({ data }: QuestionsDisplayProps) {
  const { isDark } = useTheme();
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});

  const toggleExpanded = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const handleSelectAnswer = (questionIndex: number, optionKey: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionKey,
    }));
  };

  const isAnswerCorrect = (questionIndex: number) => {
    return (
      selectedAnswers[questionIndex] === data.questions[questionIndex].answer
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Stats */}
      <View
        style={[
          styles.statsContainer,
          { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
        ]}
      >
        <Text
          style={[styles.statText, { color: isDark ? "#D1D5DB" : "#4B5563" }]}
        >
          📚 Từ tài liệu:{" "}
          <Text style={styles.statValue}>{data.in_file_count}</Text>
        </Text>
        <Text
          style={[styles.statText, { color: isDark ? "#D1D5DB" : "#4B5563" }]}
        >
          🌐 Bổ sung:{" "}
          <Text style={styles.statValue}>{data.external_count}</Text>
        </Text>
      </View>

      {/* Questions List */}
      <View style={styles.listContainer}>
        {data.questions.map((q, index) => {
          const isExpanded = expandedQuestion === index;
          const hasAnswered = selectedAnswers[index] !== undefined;
          const isCorrect = hasAnswered && isAnswerCorrect(index);

          return (
            <View
              key={index}
              style={[
                styles.questionCard,
                {
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  borderColor: isDark ? "#374151" : "#E5E7EB",
                },
              ]}
            >
              <TouchableOpacity
                style={styles.questionHeader}
                onPress={() => toggleExpanded(index)}
                activeOpacity={0.7}
              >
                <View style={styles.headerContent}>
                  <View style={styles.badges}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            q.type === "in_file"
                              ? isDark
                                ? "rgba(59, 130, 246, 0.2)"
                                : "#DBEAFE"
                              : isDark
                              ? "rgba(139, 92, 246, 0.2)"
                              : "#EDE9FE",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              q.type === "in_file"
                                ? isDark
                                  ? "#93C5FD"
                                  : "#1E40AF"
                                : isDark
                                ? "#C4B5FD"
                                : "#5B21B6",
                          },
                        ]}
                      >
                        {q.type === "in_file" ? "Tài liệu" : "Bổ sung"}
                      </Text>
                    </View>
                    {hasAnswered && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: isCorrect
                              ? isDark
                                ? "rgba(16, 185, 129, 0.2)"
                                : "#D1FAE5"
                              : isDark
                              ? "rgba(239, 68, 68, 0.2)"
                              : "#FEE2E2",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            {
                              color: isCorrect
                                ? isDark
                                  ? "#6EE7B7"
                                  : "#065F46"
                                : isDark
                                ? "#FCA5A5"
                                : "#991B1B",
                            },
                          ]}
                        >
                          {isCorrect ? "Đúng" : "Sai"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.questionText,
                      { color: isDark ? "#F3F4F6" : "#111827" },
                    ]}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {index + 1}. {q.question}
                  </Text>
                </View>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.optionsContainer}>
                  {Object.entries(q.options).map(([key, value]) => {
                    const isSelected = selectedAnswers[index] === key;
                    const isKeyCorrect = key === q.answer;

                    let optionBg = isDark ? "#374151" : "#F9FAFB";
                    let optionBorder = isDark ? "#4B5563" : "#E5E7EB";
                    let optionText = isDark ? "#D1D5DB" : "#374151";

                    if (hasAnswered) {
                      if (isKeyCorrect) {
                        optionBg = isDark
                          ? "rgba(16, 185, 129, 0.2)"
                          : "#D1FAE5";
                        optionBorder = "#10B981";
                        optionText = isDark ? "#D1D5DB" : "#065F46";
                      } else if (isSelected && !isCorrect) {
                        optionBg = isDark
                          ? "rgba(239, 68, 68, 0.2)"
                          : "#FEE2E2";
                        optionBorder = "#EF4444";
                        optionText = isDark ? "#D1D5DB" : "#991B1B";
                      }
                    } else if (isSelected) {
                      optionBg = isDark ? "#4B5563" : "#E5E7EB";
                      optionBorder = "#6366F1";
                    }

                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.optionButton,
                          {
                            backgroundColor: optionBg,
                            borderColor: optionBorder,
                          },
                        ]}
                        onPress={() =>
                          !hasAnswered && handleSelectAnswer(index, key)
                        }
                        disabled={hasAnswered}
                      >
                        <View
                          style={[
                            styles.optionKey,
                            {
                              backgroundColor: isDark ? "#4B5563" : "#E5E7EB",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontWeight: "bold",
                              color: isDark ? "#D1D5DB" : "#374151",
                            }}
                          >
                            {key}
                          </Text>
                        </View>
                        <Text
                          style={[styles.optionContent, { color: optionText }]}
                        >
                          {value}
                        </Text>
                        {hasAnswered && isKeyCorrect && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#10B981"
                          />
                        )}
                        {hasAnswered && isSelected && !isCorrect && (
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color="#EF4444"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {hasAnswered && q.explanation && (
                    <View
                      style={[
                        styles.explanation,
                        { backgroundColor: isDark ? "#374151" : "#EFF6FF" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.explanationTitle,
                          { color: isDark ? "#93C5FD" : "#1E40AF" },
                        ]}
                      >
                        <Ionicons name="information-circle" size={16} /> Giải
                        thích:
                      </Text>
                      <Text
                        style={[
                          styles.explanationText,
                          { color: isDark ? "#D1D5DB" : "#1E3A8A" },
                        ]}
                      >
                        {q.explanation}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  statText: {
    fontSize: 14,
  },
  statValue: {
    fontWeight: "bold",
  },
  listContainer: {
    gap: 12,
  },
  questionCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  questionHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerContent: {
    flex: 1,
    gap: 8,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  optionsContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  optionKey: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
    fontSize: 14,
  },
  explanation: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
