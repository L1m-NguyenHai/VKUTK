import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, Check, X, Clock } from "lucide-react";
import { ThemeMode } from "../App";

interface Question {
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation?: string;
  type?: "in_file" | "external";
  source?: string;
}

interface QuizPageProps {
  themeMode: ThemeMode;
  questions: Question[];
  onBack: () => void;
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score: number;
  timeSpent: number;
  answers: Record<number, string>;
  questions: Question[];
  timestamp: Date;
}

export const QuizPage: React.FC<QuizPageProps> = ({
  themeMode,
  questions,
  onBack,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Calculate total time: 2 minutes per question, minimum 30 minutes
  useEffect(() => {
    const calculatedTime = Math.max(questions.length * 2 * 60, 30 * 60);
    setTotalTime(calculatedTime);
    setTimeLeft(calculatedTime);
  }, [questions]);

  // Timer effect
  useEffect(() => {
    if (isStarted && !isFinished && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft <= 0 && isStarted && !isFinished) {
      handleSubmitQuiz();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isStarted, isFinished]);

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

  const handleStartQuiz = () => {
    setIsStarted(true);
    startTimeRef.current = Date.now();
  };

  const handleSelectAnswer = (option: string) => {
    if (!isFinished) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: option,
      }));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setIsFinished(true);
    setShowResults(true);
  };

  const calculateResults = (): QuizResult => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.answer) {
        correctAnswers++;
      }
    });

    const timeSpent = totalTime - timeLeft;
    const score = Math.round((correctAnswers / questions.length) * 100);

    return {
      totalQuestions: questions.length,
      correctAnswers,
      incorrectAnswers: questions.length - correctAnswers,
      score,
      timeSpent,
      answers,
      questions,
      timestamp: new Date(),
    };
  };

  const handleSaveResults = () => {
    const result = calculateResults();
    const saved = JSON.parse(localStorage.getItem("quiz_results") || "[]");
    saved.push(result);
    localStorage.setItem("quiz_results", JSON.stringify(saved.slice(-20))); // Keep last 20

    alert(
      `✅ Kết quả đã được lưu!\n\nĐiểm: ${result.score}%\nSố câu đúng: ${result.correctAnswers}/${result.totalQuestions}\nThời gian: ${formatTime(result.timeSpent)}`
    );
    onBack();
  };

  if (!isStarted) {
    return (
      <div
        className={`h-full flex flex-col items-center justify-center p-4 ${
          themeMode === "dark"
            ? "bg-gray-900"
            : themeMode === "cream"
            ? "bg-[#fdf6e3]"
            : "bg-gray-50"
        }`}
      >
        <div
          className={`rounded-lg p-8 max-w-md w-full ${
            themeMode === "dark"
              ? "bg-gray-800 border border-gray-700"
              : themeMode === "cream"
              ? "bg-[#eee9d4] border border-[#dcd6c1]"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="text-center space-y-4">
            <h2
              className={`text-2xl font-bold ${
                themeMode === "dark"
                  ? "text-white"
                  : themeMode === "cream"
                  ? "text-[#6a777e]"
                  : "text-gray-900"
              }`}
            >
              📝 Bài Kiểm Tra
            </h2>

            <div
              className={`space-y-2 text-sm ${
                themeMode === "dark"
                  ? "text-gray-300"
                  : themeMode === "cream"
                  ? "text-[#6a777e]"
                  : "text-gray-700"
              }`}
            >
              <p>
                <strong>Tổng câu hỏi:</strong> {questions.length}
              </p>
              <p>
                <strong>Thời gian:</strong> {formatTime(totalTime)}
              </p>
              <p className="text-xs opacity-75">
                ~{Math.round((totalTime / questions.length / 60) * 100) / 100}{" "}
                phút/câu
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={handleStartQuiz}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  themeMode === "dark"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : themeMode === "cream"
                    ? "bg-[#b3b6ae] hover:bg-[#9a9d96] text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                🚀 Bắt Đầu Làm Bài
              </button>
              <button
                onClick={onBack}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  themeMode === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : themeMode === "cream"
                    ? "bg-[#dcd6c1] hover:bg-[#c9bfb0] text-[#6a777e]"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                ← Quay Lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const result = calculateResults();
    const resultColor =
      result.score >= 80 ? "green" : result.score >= 60 ? "yellow" : "red";

    return (
      <div
        className={`h-full flex flex-col items-center justify-center p-4 ${
          themeMode === "dark"
            ? "bg-gray-900"
            : themeMode === "cream"
            ? "bg-[#fdf6e3]"
            : "bg-gray-50"
        }`}
      >
        <div
          className={`rounded-lg p-8 max-w-md w-full ${
            themeMode === "dark"
              ? "bg-gray-800 border border-gray-700"
              : themeMode === "cream"
              ? "bg-[#eee9d4] border border-[#dcd6c1]"
              : "bg-white border border-gray-200"
          }`}
        >
          <div className="text-center space-y-6">
            <div className="text-5xl">
              {result.score >= 80
                ? "🎉"
                : result.score >= 60
                ? "👍"
                : "💪"}
            </div>

            <h2
              className={`text-2xl font-bold ${
                themeMode === "dark"
                  ? "text-white"
                  : themeMode === "cream"
                  ? "text-[#6a777e]"
                  : "text-gray-900"
              }`}
            >
              Kết Quả Bài Kiểm Tra
            </h2>

            <div
              className={`p-4 rounded-lg ${
                resultColor === "green"
                  ? themeMode === "dark"
                    ? "bg-green-900/30 border border-green-700"
                    : themeMode === "cream"
                    ? "bg-green-50 border border-green-300"
                    : "bg-green-50 border border-green-300"
                  : resultColor === "yellow"
                  ? themeMode === "dark"
                    ? "bg-yellow-900/30 border border-yellow-700"
                    : themeMode === "cream"
                    ? "bg-yellow-50 border border-yellow-300"
                    : "bg-yellow-50 border border-yellow-300"
                  : themeMode === "dark"
                  ? "bg-red-900/30 border border-red-700"
                  : themeMode === "cream"
                  ? "bg-red-50 border border-red-300"
                  : "bg-red-50 border border-red-300"
              }`}
            >
              <div
                className={`text-4xl font-bold ${
                  resultColor === "green"
                    ? "text-green-600"
                    : resultColor === "yellow"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {result.score}%
              </div>
            </div>

            <div
              className={`space-y-2 text-sm ${
                themeMode === "dark"
                  ? "text-gray-300"
                  : themeMode === "cream"
                  ? "text-[#6a777e]"
                  : "text-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>✓ Câu đúng:</span>
                <strong className="text-green-600">{result.correctAnswers}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>✗ Câu sai:</span>
                <strong className="text-red-600">{result.incorrectAnswers}</strong>
              </div>
              <div className="flex items-center justify-between border-t pt-2 mt-2">
                <span>⏱️ Thời gian:</span>
                <strong>{formatTime(result.timeSpent)}</strong>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={handleSaveResults}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  themeMode === "dark"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : themeMode === "cream"
                    ? "bg-[#b3b6ae] hover:bg-[#9a9d96] text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                💾 Lưu Kết Quả
              </button>
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setTimeLeft(totalTime);
                  setIsFinished(false);
                  setIsStarted(false);
                }}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  themeMode === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : themeMode === "cream"
                    ? "bg-[#dcd6c1] hover:bg-[#c9bfb0] text-[#6a777e]"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                🔄 Làm Lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestionIndex];
  const isAnswered = selectedAnswer !== undefined;

  return (
    <div
      className={`h-full flex flex-col ${
        themeMode === "dark"
          ? "bg-gray-900"
          : themeMode === "cream"
          ? "bg-[#fdf6e3]"
          : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          themeMode === "dark"
            ? "bg-gray-800 border-gray-700"
            : themeMode === "cream"
            ? "bg-[#eee9d4] border-[#dcd6c1]"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const confirmed = window.confirm(
                  "Bạn có chắc muốn thoát? Tiến độ sẽ không được lưu!"
                );
                if (confirmed) onBack();
              }}
              className={`p-2 rounded-lg hover:opacity-80 transition ${
                themeMode === "dark"
                  ? "hover:bg-gray-700"
                  : themeMode === "cream"
                  ? "hover:bg-[#dcd6c1]"
                  : "hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1
                className={`text-lg font-semibold ${
                  themeMode === "dark"
                    ? "text-white"
                    : themeMode === "cream"
                    ? "text-[#6a777e]"
                    : "text-gray-900"
                }`}
              >
                Bài Kiểm Tra ({currentQuestionIndex + 1}/{questions.length})
              </h1>
            </div>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft < 300
                ? themeMode === "dark"
                  ? "bg-red-900/30 text-red-400"
                  : themeMode === "cream"
                  ? "bg-red-50 text-red-700"
                  : "bg-red-50 text-red-700"
                : themeMode === "dark"
                ? "bg-gray-700 text-gray-300"
                : themeMode === "cream"
                ? "bg-[#dcd6c1] text-[#6a777e]"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <Clock size={18} />
            <span className="font-mono font-bold text-lg">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div
        className={`flex-1 overflow-y-auto p-4 ${
          themeMode === "dark"
            ? "bg-gray-900"
            : themeMode === "cream"
            ? "bg-[#fdf6e3]"
            : "bg-gray-50"
        }`}
      >
        <div className="max-w-4xl mx-auto">
          {/* Question Text */}
          <div
            className={`rounded-lg p-6 mb-6 ${
              themeMode === "dark"
                ? "bg-gray-800 border border-gray-700"
                : themeMode === "cream"
                ? "bg-[#eee9d4] border border-[#dcd6c1]"
                : "bg-white border border-gray-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`px-3 py-1 rounded font-bold text-sm ${
                  themeMode === "dark"
                    ? "bg-blue-900 text-blue-300"
                    : themeMode === "cream"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                Câu {currentQuestionIndex + 1}
              </div>
            </div>
            <h2
              className={`text-lg font-semibold mt-3 ${
                themeMode === "dark"
                  ? "text-white"
                  : themeMode === "cream"
                  ? "text-[#6a777e]"
                  : "text-gray-900"
              }`}
            >
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleSelectAnswer(key)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === key
                    ? themeMode === "dark"
                      ? "border-blue-500 bg-blue-900/20 text-blue-300"
                      : themeMode === "cream"
                      ? "border-blue-400 bg-blue-50 text-blue-900"
                      : "border-blue-500 bg-blue-50 text-blue-900"
                    : themeMode === "dark"
                    ? "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                    : themeMode === "cream"
                    ? "border-[#dcd6c1] bg-[#fdf6e3] text-[#6a777e] hover:border-[#b3b6ae] hover:bg-[#dcd6c1]"
                    : "border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg min-w-6">{key}.</span>
                  <span>{value}</span>
                  {isAnswered && selectedAnswer === key && (
                    <span className="ml-auto">
                      {selectedAnswer === currentQuestion.answer ? (
                        <Check size={20} className="text-green-500" />
                      ) : (
                        <X size={20} className="text-red-500" />
                      )}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Explanation (if answered) */}
          {isAnswered && (
            <div
              className={`rounded-lg p-4 mb-6 ${
                selectedAnswer === currentQuestion.answer
                  ? themeMode === "dark"
                    ? "bg-green-900/30 border border-green-700 text-green-300"
                    : themeMode === "cream"
                    ? "bg-green-50 border border-green-300 text-green-800"
                    : "bg-green-50 border border-green-300 text-green-800"
                  : themeMode === "dark"
                  ? "bg-red-900/30 border border-red-700 text-red-300"
                  : themeMode === "cream"
                  ? "bg-red-50 border border-red-300 text-red-800"
                  : "bg-red-50 border border-red-300 text-red-800"
              }`}
            >
              <div className="font-semibold mb-2">
                {selectedAnswer === currentQuestion.answer
                  ? "✓ Chính xác!"
                  : "✗ Không chính xác"}
              </div>
              {currentQuestion.explanation && (
                <p className="text-sm">{currentQuestion.explanation}</p>
              )}
              {selectedAnswer !== currentQuestion.answer && (
                <p className="text-sm mt-2">
                  <strong>Đáp án đúng:</strong> {currentQuestion.answer}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div
        className={`p-4 border-t ${
          themeMode === "dark"
            ? "bg-gray-800 border-gray-700"
            : themeMode === "cream"
            ? "bg-[#eee9d4] border-[#dcd6c1]"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              themeMode === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:bg-gray-800"
                : themeMode === "cream"
                ? "bg-[#dcd6c1] hover:bg-[#c9bfb0] text-[#6a777e] disabled:bg-[#eee9d4]"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:bg-gray-100"
            }`}
          >
            ← Câu Trước
          </button>

          {/* Question Progress */}
          <div className="flex gap-1">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-lg font-medium text-xs transition-colors ${
                  index === currentQuestionIndex
                    ? themeMode === "dark"
                      ? "bg-blue-600 text-white"
                      : themeMode === "cream"
                      ? "bg-[#b3b6ae] text-white"
                      : "bg-blue-500 text-white"
                    : answers[index] !== undefined
                    ? themeMode === "dark"
                      ? "bg-green-700 text-white"
                      : themeMode === "cream"
                      ? "bg-green-300 text-[#6a777e]"
                      : "bg-green-300 text-gray-900"
                    : themeMode === "dark"
                    ? "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    : themeMode === "cream"
                    ? "bg-[#dcd6c1] text-[#b3b6ae] hover:bg-[#c9bfb0]"
                    : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                themeMode === "dark"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : themeMode === "cream"
                  ? "bg-green-400 hover:bg-green-500 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              ✓ Nộp Bài
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                themeMode === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : themeMode === "cream"
                  ? "bg-[#dcd6c1] hover:bg-[#c9bfb0] text-[#6a777e]"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              Câu Sau →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
