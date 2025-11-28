import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { ThemeMode } from "../App";

interface Question {
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation?: string;
  type?: "in_file" | "external";
  source?: string;
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  timeSpent: number;
  answers: Record<number, string>;
  questions?: Question[];
  timestamp: Date | string;
}

interface QuizResultsPageProps {
  themeMode: ThemeMode;
}

export const QuizResultsPage: React.FC<QuizResultsPageProps> = ({
  themeMode,
}) => {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  useEffect(() => {
    // Load results from localStorage
    try {
      const saved = localStorage.getItem("quiz_results");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map(
          (r: QuizResult & { timestamp: string }) => ({
            ...r,
            timestamp: new Date(r.timestamp),
          })
        );
        setResults(withDates);
      }
    } catch (e) {
      console.error("Failed to load quiz results:", e);
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date | string): string => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateStats = () => {
    if (results.length === 0)
      return {
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalTests: 0,
      };

    const scores = results.map((r) => r.score);
    const averageScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    return {
      averageScore,
      bestScore,
      worstScore,
      totalTests: results.length,
    };
  };

  const handleDeleteResult = (index: number) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa kết quả này?");
    if (confirmed) {
      const newResults = results.filter((_, i) => i !== index);
      setResults(newResults);
      localStorage.setItem("quiz_results", JSON.stringify(newResults));
    }
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa tất cả kết quả? Hành động này không thể hoàn tác!"
    );
    if (confirmed) {
      setResults([]);
      localStorage.removeItem("quiz_results");
    }
  };

  const stats = calculateStats();
  const getScoreColor = (score: number) => {
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  };

  const getScoreBgColor = (score: number) => {
    const color = getScoreColor(score);
    if (color === "green") {
      return themeMode === "dark"
        ? "bg-green-900/30 border border-green-700 text-green-300"
        : themeMode === "cream"
        ? "bg-green-50 border border-green-300 text-green-800"
        : "bg-green-50 border border-green-300 text-green-800";
    } else if (color === "yellow") {
      return themeMode === "dark"
        ? "bg-yellow-900/30 border border-yellow-700 text-yellow-300"
        : themeMode === "cream"
        ? "bg-yellow-50 border border-yellow-300 text-yellow-800"
        : "bg-yellow-50 border border-yellow-300 text-yellow-800";
    } else {
      return themeMode === "dark"
        ? "bg-red-900/30 border border-red-700 text-red-300"
        : themeMode === "cream"
        ? "bg-red-50 border border-red-300 text-red-800"
        : "bg-red-50 border border-red-300 text-red-800";
    }
  };

  return (
    <div
      className={`h-full flex flex-col overflow-auto ${
        themeMode === "dark"
          ? "bg-gray-900"
          : themeMode === "cream"
          ? "bg-[#fdf6e3]"
          : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b sticky top-0 z-10 ${
          themeMode === "dark"
            ? "bg-gray-800 border-gray-700"
            : themeMode === "cream"
            ? "bg-[#eee9d4] border-[#dcd6c1]"
            : "bg-white border-gray-200"
        }`}
      >
        <h1
          className={`text-2xl font-bold ${
            themeMode === "dark"
              ? "text-white"
              : themeMode === "cream"
              ? "text-[#6a777e]"
              : "text-gray-900"
          }`}
        >
          📊 Kết Quả Kiểm Tra
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Stats Cards */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                className={`rounded-lg p-4 ${
                  themeMode === "dark"
                    ? "bg-gray-800 border border-gray-700"
                    : themeMode === "cream"
                    ? "bg-[#eee9d4] border border-[#dcd6c1]"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    themeMode === "dark"
                      ? "text-gray-400"
                      : themeMode === "cream"
                      ? "text-[#b3b6ae]"
                      : "text-gray-600"
                  }`}
                >
                  Số Bài Kiểm Tra
                </div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    themeMode === "dark"
                      ? "text-blue-400"
                      : themeMode === "cream"
                      ? "text-blue-700"
                      : "text-blue-600"
                  }`}
                >
                  {stats.totalTests}
                </div>
              </div>

              <div
                className={`rounded-lg p-4 ${
                  themeMode === "dark"
                    ? "bg-gray-800 border border-gray-700"
                    : themeMode === "cream"
                    ? "bg-[#eee9d4] border border-[#dcd6c1]"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    themeMode === "dark"
                      ? "text-gray-400"
                      : themeMode === "cream"
                      ? "text-[#b3b6ae]"
                      : "text-gray-600"
                  }`}
                >
                  Điểm Trung Bình
                </div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    themeMode === "dark"
                      ? "text-purple-400"
                      : themeMode === "cream"
                      ? "text-purple-700"
                      : "text-purple-600"
                  }`}
                >
                  {stats.averageScore}%
                </div>
              </div>

              <div
                className={`rounded-lg p-4 ${
                  themeMode === "dark"
                    ? "bg-gray-800 border border-gray-700"
                    : themeMode === "cream"
                    ? "bg-[#eee9d4] border border-[#dcd6c1]"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    themeMode === "dark"
                      ? "text-gray-400"
                      : themeMode === "cream"
                      ? "text-[#b3b6ae]"
                      : "text-gray-600"
                  }`}
                >
                  Điểm Cao Nhất
                </div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    themeMode === "dark"
                      ? "text-green-400"
                      : themeMode === "cream"
                      ? "text-green-700"
                      : "text-green-600"
                  }`}
                >
                  {stats.bestScore}%
                </div>
              </div>

              <div
                className={`rounded-lg p-4 ${
                  themeMode === "dark"
                    ? "bg-gray-800 border border-gray-700"
                    : themeMode === "cream"
                    ? "bg-[#eee9d4] border border-[#dcd6c1]"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    themeMode === "dark"
                      ? "text-gray-400"
                      : themeMode === "cream"
                      ? "text-[#b3b6ae]"
                      : "text-gray-600"
                  }`}
                >
                  Điểm Thấp Nhất
                </div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    themeMode === "dark"
                      ? "text-red-400"
                      : themeMode === "cream"
                      ? "text-red-700"
                      : "text-red-600"
                  }`}
                >
                  {stats.worstScore}%
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 ? (
            <div className="space-y-3">
              {results
                .slice()
                .reverse()
                .map((result, index) => {
                  const actualIndex = results.length - 1 - index;
                  const isExpanded = expandedResult === actualIndex;

                  return (
                    <div
                      key={actualIndex}
                      className={`rounded-lg overflow-hidden border transition-all ${
                        themeMode === "dark"
                          ? "border-gray-700 bg-gray-800"
                          : themeMode === "cream"
                          ? "border-[#dcd6c1] bg-[#eee9d4]"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {/* Result Header */}
                      <button
                        onClick={() =>
                          setExpandedResult(isExpanded ? null : actualIndex)
                        }
                        className={`w-full p-4 flex items-center justify-between hover:opacity-80 transition ${
                          themeMode === "dark"
                            ? "hover:bg-gray-700"
                            : themeMode === "cream"
                            ? "hover:bg-[#dcd6c1]"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-3">
                            <div
                              className={`px-3 py-1.5 rounded-lg font-bold text-sm ${getScoreBgColor(
                                result.score
                              )}`}
                            >
                              {result.score}%
                            </div>
                            <div>
                              <div
                                className={`font-medium ${
                                  themeMode === "dark"
                                    ? "text-gray-300"
                                    : themeMode === "cream"
                                    ? "text-[#6a777e]"
                                    : "text-gray-900"
                                }`}
                              >
                                {result.correctAnswers}/{result.totalQuestions}{" "}
                                câu đúng
                              </div>
                              <div
                                className={`text-xs mt-0.5 ${
                                  themeMode === "dark"
                                    ? "text-gray-500"
                                    : themeMode === "cream"
                                    ? "text-[#b3b6ae]"
                                    : "text-gray-500"
                                }`}
                              >
                                {formatDate(result.timestamp)} • Thời gian:{" "}
                                {formatTime(result.timeSpent)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResult(actualIndex);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            themeMode === "dark"
                              ? "hover:bg-red-900/30 text-red-400"
                              : themeMode === "cream"
                              ? "hover:bg-red-50 text-red-600"
                              : "hover:bg-red-50 text-red-600"
                          }`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </button>
                      {/* Result Details */}
                      {isExpanded && (
                        <div
                          className={`border-t p-4 space-y-3 ${
                            themeMode === "dark"
                              ? "border-gray-700 bg-gray-700/50"
                              : themeMode === "cream"
                              ? "border-[#dcd6c1] bg-[#dcd6c1]/20"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <div
                                className={`font-medium ${
                                  themeMode === "dark"
                                    ? "text-gray-400"
                                    : themeMode === "cream"
                                    ? "text-[#b3b6ae]"
                                    : "text-gray-600"
                                }`}
                              >
                                Tổng câu hỏi
                              </div>
                              <div
                                className={`mt-1 font-bold ${
                                  themeMode === "dark"
                                    ? "text-blue-400"
                                    : themeMode === "cream"
                                    ? "text-blue-700"
                                    : "text-blue-600"
                                }`}
                              >
                                {result.totalQuestions}
                              </div>
                            </div>
                            <div>
                              <div
                                className={`font-medium ${
                                  themeMode === "dark"
                                    ? "text-gray-400"
                                    : themeMode === "cream"
                                    ? "text-[#b3b6ae]"
                                    : "text-gray-600"
                                }`}
                              >
                                Câu đúng
                              </div>
                              <div
                                className={`mt-1 font-bold ${
                                  themeMode === "dark"
                                    ? "text-green-400"
                                    : themeMode === "cream"
                                    ? "text-green-700"
                                    : "text-green-600"
                                }`}
                              >
                                {result.correctAnswers}
                              </div>
                            </div>
                            <div>
                              <div
                                className={`font-medium ${
                                  themeMode === "dark"
                                    ? "text-gray-400"
                                    : themeMode === "cream"
                                    ? "text-[#b3b6ae]"
                                    : "text-gray-600"
                                }`}
                              >
                                Câu sai
                              </div>
                              <div
                                className={`mt-1 font-bold ${
                                  themeMode === "dark"
                                    ? "text-red-400"
                                    : themeMode === "cream"
                                    ? "text-red-700"
                                    : "text-red-600"
                                }`}
                              >
                                {result.incorrectAnswers}
                              </div>
                            </div>
                          </div>

                          {/* Questions Review */}
                          {result.questions && result.questions.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h3
                                className={`font-semibold text-sm ${
                                  themeMode === "dark"
                                    ? "text-gray-300"
                                    : themeMode === "cream"
                                    ? "text-[#6a777e]"
                                    : "text-gray-900"
                                }`}
                              >
                                📋 Chi Tiết Câu Hỏi:
                              </h3>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {result.questions.map((q, qIndex) => {
                                  const userAnswer = result.answers[qIndex];
                                  const isCorrect = userAnswer === q.answer;

                                  return (
                                    <div
                                      key={qIndex}
                                      className={`p-2 rounded-lg border text-xs ${
                                        isCorrect
                                          ? themeMode === "dark"
                                            ? "bg-green-900/20 border-green-700"
                                            : themeMode === "cream"
                                            ? "bg-green-50 border-green-300"
                                            : "bg-green-50 border-green-300"
                                          : themeMode === "dark"
                                          ? "bg-red-900/20 border-red-700"
                                          : themeMode === "cream"
                                          ? "bg-red-50 border-red-300"
                                          : "bg-red-50 border-red-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold min-w-6">
                                          {qIndex + 1}.
                                        </span>
                                        <span className="flex-1">
                                          {q.question}
                                        </span>
                                        <span
                                          className={`font-bold ${
                                            isCorrect
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {isCorrect ? "✓" : "✗"}
                                        </span>
                                      </div>

                                      <div
                                        className={`mt-1 pl-8 text-xs ${
                                          themeMode === "dark"
                                            ? "text-gray-400"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        <div>
                                          <strong>Bạn trả lời:</strong>{" "}
                                          {userAnswer
                                            ? `${userAnswer}. ${q.options[userAnswer]}`
                                            : "Không trả lời"}
                                        </div>
                                        <div>
                                          <strong>Đáp án đúng:</strong>{" "}
                                          {q.answer}. {q.options[q.answer]}
                                        </div>
                                        {q.explanation && (
                                          <div className="mt-1">
                                            <strong>Giải thích:</strong>{" "}
                                            {q.explanation}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}{" "}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div
              className={`rounded-lg p-8 text-center ${
                themeMode === "dark"
                  ? "bg-gray-800 border border-gray-700"
                  : themeMode === "cream"
                  ? "bg-[#eee9d4] border border-[#dcd6c1]"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="text-4xl mb-4">📚</div>
              <h2
                className={`text-lg font-semibold mb-2 ${
                  themeMode === "dark"
                    ? "text-gray-300"
                    : themeMode === "cream"
                    ? "text-[#6a777e]"
                    : "text-gray-900"
                }`}
              >
                Chưa có kết quả kiểm tra
              </h2>
              <p
                className={`text-sm ${
                  themeMode === "dark"
                    ? "text-gray-500"
                    : themeMode === "cream"
                    ? "text-[#b3b6ae]"
                    : "text-gray-600"
                }`}
              >
                Hãy làm một bài kiểm tra từ ChatPage để xem kết quả tại đây!
              </p>
            </div>
          )}

          {/* Clear All Button */}
          {results.length > 0 && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleClearAll}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  themeMode === "dark"
                    ? "bg-red-900 hover:bg-red-800 text-red-300"
                    : themeMode === "cream"
                    ? "bg-red-200 hover:bg-red-300 text-red-800"
                    : "bg-red-100 hover:bg-red-200 text-red-800"
                }`}
              >
                🗑️ Xóa Tất Cả Kết Quả
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
