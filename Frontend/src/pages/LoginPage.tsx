import { useState, useEffect } from "react";
import type { ThemeMode } from "../App";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LogIn,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Server,
  Settings,
} from "lucide-react";
import {
  getApiEndpoint,
  setApiEndpoint as saveApiEndpoint,
  resetApiEndpoint,
  API_CONFIG,
} from "../utils/apiConfig";

interface LoginPageProps {
  themeMode: ThemeMode;
}

export function LoginPage({ themeMode }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(() => getApiEndpoint());
  const [tempApiEndpoint, setTempApiEndpoint] = useState(apiEndpoint);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Check API status on mount and when endpoint changes
  useEffect(() => {
    checkApiStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiEndpoint]);

  const checkApiStatus = async () => {
    setApiStatus("checking");
    console.log("[LoginPage] Checking API at:", apiEndpoint);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiEndpoint}/api/plugins`, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });
      clearTimeout(timeoutId);
      console.log("[LoginPage] API response status:", response.status);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (
        response.ok &&
        contentType &&
        contentType.includes("application/json")
      ) {
        setApiStatus("online");
      } else {
        console.log("[LoginPage] API response not JSON:", contentType);
        setApiStatus("offline");
      }
    } catch (err) {
      console.error("[LoginPage] API check error:", err);
      setApiStatus("offline");
    }
  };

  const handleSaveApiEndpoint = () => {
    const cleanedEndpoint = tempApiEndpoint.trim().replace(/\/$/, ""); // Remove trailing slash
    setApiEndpoint(cleanedEndpoint);
    saveApiEndpoint(cleanedEndpoint);
    setShowApiSettings(false);
  };

  const handleResetApiEndpoint = () => {
    setTempApiEndpoint(API_CONFIG.DEFAULT_ENDPOINT);
    setApiEndpoint(API_CONFIG.DEFAULT_ENDPOINT);
    resetApiEndpoint();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div
        className={`max-w-md w-full space-y-6 p-8 rounded-lg shadow-lg ${
          themeMode === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* API Status Bar */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg text-sm ${
            themeMode === "dark"
              ? "bg-gray-700 border border-gray-600"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span
              className={`font-medium ${
                themeMode === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              API:
            </span>
            <span
              className={`text-xs font-mono ${
                themeMode === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {apiEndpoint}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                apiStatus === "online"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : apiStatus === "offline"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  apiStatus === "online"
                    ? "bg-green-500 animate-pulse"
                    : apiStatus === "offline"
                    ? "bg-red-500"
                    : "bg-gray-400"
                }`}
              />
              {apiStatus === "online"
                ? "Online"
                : apiStatus === "offline"
                ? "Offline"
                : "Checking..."}
            </div>
            <button
              onClick={() => setShowApiSettings(!showApiSettings)}
              className={`p-1.5 rounded transition-colors ${
                themeMode === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-200"
              }`}
              title="API Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Settings Panel */}
        {showApiSettings && (
          <div
            className={`p-4 rounded-lg border space-y-3 ${
              themeMode === "dark"
                ? "bg-gray-700 border-gray-600"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-semibold ${
                  themeMode === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                API Endpoint Configuration
              </h3>
            </div>
            <div>
              <label
                className={`block text-xs font-medium mb-1.5 ${
                  themeMode === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Backend API URL
              </label>
              <input
                type="text"
                value={tempApiEndpoint}
                onChange={(e) => setTempApiEndpoint(e.target.value)}
                placeholder="http://localhost:8000"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  themeMode === "dark"
                    ? "bg-gray-800 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <p
                className={`text-xs mt-1.5 ${
                  themeMode === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Nhập địa chỉ API backend (ví dụ: http://localhost:8000)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveApiEndpoint}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save & Test
              </button>
              <button
                onClick={handleResetApiEndpoint}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  themeMode === "dark"
                    ? "bg-gray-600 hover:bg-gray-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2
            className={`text-3xl font-bold ${
              themeMode === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Welcome Back
          </h2>
          <p
            className={`mt-2 ${
              themeMode === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Sign in to your VKU Toolkit account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${
                  themeMode === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail
                    className={`h-5 w-5 ${
                      themeMode === "dark" ? "text-gray-500" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    themeMode === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 ${
                  themeMode === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 ${
                      themeMode === "dark" ? "text-gray-500" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    themeMode === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg font-medium text-white transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign in
              </>
            )}
          </button>

          {/* Sign up link */}
          <div className="text-center">
            <span
              className={`text-sm ${
                themeMode === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Don't have an account?{" "}
            </span>
            <Link
              to="/register"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign up
            </Link>
          </div>

          {/* View plugins link */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/plugins"
              className={`text-sm hover:underline ${
                themeMode === "dark"
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-700"
              }`}
            >
              View Available Plugins →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
