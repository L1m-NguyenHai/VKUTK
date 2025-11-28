import { useState, useEffect } from "react";
import {
  LogIn,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { getApiEndpoint, getApiHeaders } from "../utils/apiConfig";

interface SessionCapturePageProps {
  isDarkMode: boolean;
}

interface SessionStatus {
  exists: boolean;
  path: string;
  size?: number;
}

export function SessionCapturePage({ isDarkMode }: SessionCapturePageProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null
  );
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(() => getApiEndpoint());
  const [isEditingEndpoint, setIsEditingEndpoint] = useState(false);

  console.log("SessionCapturePage mounted, API endpoint:", apiEndpoint);

  const checkSession = async () => {
    console.log("checkSession called");
    setIsCheckingSession(true);
    try {
      const url = `${apiEndpoint}/api/check-session`;
      console.log("Fetching from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getApiHeaders(),
        },
        mode: "cors",
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Session data:", data);
        setSessionStatus(data);
        if (data.exists) {
          setMessage("Session file found");
          setMessageType("success");
        } else {
          setMessage("No session file found");
          setMessageType("info");
        }
      } else {
        console.error("Response not ok:", response.status, response.statusText);
        setMessage("Failed to check session status");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Check session error:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to connect to API server";
      setMessage(`Error: ${errorMsg}`);
      setMessageType("error");
      setSessionStatus(null);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const captureSession = async () => {
    setIsCapturing(true);
    setMessage("Opening browser... Please login to VKU");
    setMessageType("info");

    try {
      const response = await fetch(`${apiEndpoint}/api/capture-session`, {
        method: "POST",
        headers: getApiHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message);
        setMessageType("success");
        // Refresh session status
        await checkSession();
      } else {
        setMessage(data.message || "Failed to capture session");
        setMessageType("error");
      }
    } catch (error) {
      setMessage(
        `Error: ${
          error instanceof Error
            ? error.message
            : "Failed to connect to API server"
        }`
      );
      setMessageType("error");
    } finally {
      setIsCapturing(false);
    }
  };

  const deleteSession = async () => {
    if (!confirm("Are you sure you want to delete the session file?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${apiEndpoint}/api/session`, {
        method: "DELETE",
        headers: getApiHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("Session deleted successfully");
        setMessageType("success");
        setSessionStatus(null);
      } else {
        setMessage(data.message || "Failed to delete session");
        setMessageType("error");
      }
    } catch (error) {
      setMessage(
        `Error: ${
          error instanceof Error
            ? error.message
            : "Failed to connect to API server"
        }`
      );
      setMessageType("error");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className={`rounded-lg shadow-lg p-4 sm:p-5 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="mb-4">
          <h1
            className={`text-xl sm:text-2xl font-bold mb-1 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            VKU Session Capture
          </h1>
          <p
            className={`text-xs sm:text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Capture VKU login session
          </p>
        </div>

        {/* Status Message - Compact */}
        {message && (
          <div
            className={`mb-3 p-2.5 rounded-lg flex items-start gap-2 text-xs ${
              messageType === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : messageType === "error"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            }`}
          >
            {messageType === "success" && (
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            )}
            {messageType === "error" && (
              <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            )}
            {messageType === "info" && (
              <Loader2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 animate-spin" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* API Endpoint Configuration */}
        <div
          className={`mb-3 p-2.5 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <label
              className={`text-xs font-medium whitespace-nowrap ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              API:
            </label>
            {isEditingEndpoint ? (
              <>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className={`flex-1 px-2 py-1 text-xs rounded border ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="http://localhost:8000"
                />
                <button
                  onClick={() => setIsEditingEndpoint(false)}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span
                  className={`flex-1 text-xs ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {apiEndpoint}
                </span>
                <button
                  onClick={() => setIsEditingEndpoint(true)}
                  className={`px-2 py-1 text-xs rounded ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* Session Status Card - Compact */}
        <div
          className={`mb-3 p-2.5 rounded-lg border ${
            isDarkMode
              ? "bg-gray-700 border-gray-600"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Status:
            </span>
            {sessionStatus ? (
              <>
                {sessionStatus.exists ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <XCircle className="w-3.5 h-3.5" />
                    Not found
                  </span>
                )}
              </>
            ) : (
              <span
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Loading...
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons - Compact */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={captureSession}
            disabled={isCapturing}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
              isCapturing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            }`}
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                Capture
              </>
            )}
          </button>

          <button
            onClick={checkSession}
            disabled={isCheckingSession}
            className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-900"
            }`}
          >
            {isCheckingSession ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={deleteSession}
            disabled={isDeleting || !sessionStatus?.exists}
            className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
              isDeleting || !sessionStatus?.exists
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Instructions - Compact */}
        <div
          className={`p-2.5 rounded-lg border text-xs ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-400"
              : "bg-blue-50 border-blue-200 text-gray-700"
          }`}
        >
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Backend phải chạy trước</li>
            <li>Click "Capture" để mở browser</li>
            <li>Đăng nhập VKU trong browser</li>
            <li>Session tự động lưu sau khi login</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
