import React, { useState } from "react";
import { ChevronDown, CheckCircle, AlertCircle } from "lucide-react";

interface Question {
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation?: string;
  type?: "in_file" | "external";
  source?: string;
}

interface QuestionsDisplayProps {
  questions: Question[];
  inFileCount?: number;
  externalCount?: number;
  isDarkMode?: boolean;
  onStartQuiz?: (questions: Question[]) => void;
}

export const QuestionsDisplay: React.FC<QuestionsDisplayProps> = ({
  questions,
  inFileCount = 0,
  externalCount = 0,
  isDarkMode = false,
  onStartQuiz,
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const handleSelectAnswer = (questionIndex: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const toggleExpanded = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const isAnswerCorrect = (questionIndex: number): boolean => {
    return selectedAnswers[questionIndex] === questions[questionIndex].answer;
  };

  return (
    <div className={`space-y-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Summary Stats */}
      <div className={`grid grid-cols-2 gap-2 p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
        <div className="text-sm">
          <span className="font-semibold">📚 Từ tài liệu:</span> {inFileCount}
        </div>
        <div className="text-sm">
          <span className="font-semibold">🌐 Từ ngoài:</span> {externalCount}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {questions.map((question, index) => {
          const isExpanded = expandedQuestion === index;
          const hasAnswered = selectedAnswers[index] !== undefined;
          const isCorrect = hasAnswered && isAnswerCorrect(index);

          return (
            <div
              key={index}
              className={`rounded-lg overflow-hidden border ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {/* Question Header */}
              <button
                onClick={() => toggleExpanded(index)}
                className={`w-full p-3 flex items-start gap-3 hover:opacity-80 transition ${
                  isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-100"
                }`}
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    {/* Question Type Badge */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        question.type === "in_file"
                          ? isDarkMode
                            ? "bg-blue-900 text-blue-200"
                            : "bg-blue-100 text-blue-700"
                          : isDarkMode
                          ? "bg-purple-900 text-purple-200"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {question.type === "in_file" ? "Từ tài liệu" : "Bổ sung"}
                    </span>
                    {hasAnswered && (
                      <div className="flex items-center gap-1">
                        {isCorrect ? (
                          <>
                            <CheckCircle size={16} className="text-green-500" />
                            <span className="text-xs font-medium text-green-500">
                              ✓
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} className="text-red-500" />
                            <span className="text-xs font-medium text-red-500">
                              ✗
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <p className={`text-sm font-medium mt-2 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                    {index + 1}. {question.question}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={`flex-shrink-0 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  } ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                />
              </button>

              {/* Question Content */}
              {isExpanded && (
                <div className={`border-t px-3 py-3 space-y-3 ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}>
                  {/* Options */}
                  <div className="space-y-2">
                    {Object.entries(question.options).map(([key, value]) => {
                      const isSelected = selectedAnswers[index] === key;
                      const isCorrectOption = key === question.answer;

                      return (
                        <button
                          key={key}
                          onClick={() => handleSelectAnswer(index, key)}
                          className={`w-full text-left p-2 rounded border-2 transition ${
                            isSelected
                              ? isCorrectOption
                                ? isDarkMode
                                  ? "border-green-500 bg-green-900"
                                  : "border-green-500 bg-green-100"
                                : isDarkMode
                                ? "border-red-500 bg-red-900"
                                : "border-red-500 bg-red-100"
                              : hasAnswered && isCorrectOption
                              ? isDarkMode
                                ? "border-green-500 bg-green-900"
                                : "border-green-500 bg-green-100"
                              : isDarkMode
                              ? "border-gray-600 hover:border-gray-500"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold min-w-6 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
                              {key}.
                            </span>
                            <span className={isDarkMode ? "text-gray-100" : "text-gray-900"}>
                              {value}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Show Answer & Explanation */}
                  {hasAnswered && (
                    <div
                      className={`p-2 rounded border-l-4 ${
                        isCorrect
                          ? isDarkMode
                            ? "border-l-green-500 bg-green-900 bg-opacity-30"
                            : "border-l-green-500 bg-green-50"
                          : isDarkMode
                          ? "border-l-red-500 bg-red-900 bg-opacity-30"
                          : "border-l-red-500 bg-red-50"
                      }`}
                    >
                      <div className={`text-sm font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {isCorrect ? "✓ Chính xác!" : "✗ Không chính xác"}
                      </div>
                      <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        <strong>Đáp án:</strong> {question.answer}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div
                      className={`p-2 rounded text-xs ${
                        isDarkMode
                          ? "bg-blue-900 bg-opacity-30 text-blue-200"
                          : "bg-blue-50 text-blue-900"
                      }`}
                    >
                      <strong>💡 Giải thích:</strong> {question.explanation}
                    </div>
                  )}

                  {/* Source */}
                  {question.source && (
                    <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      📌 Nguồn: {question.source}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Start Quiz Button */}
      {onStartQuiz && (
        <div className="pt-4">
          <button
            onClick={() => onStartQuiz(questions)}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            }`}
          >
            🚀 Làm Bài Kiểm Tra
          </button>
        </div>
      )}
    </div>
  );
};
