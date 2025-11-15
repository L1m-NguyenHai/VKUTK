import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface RegisterPageProps {
  isDarkMode: boolean;
}

export function RegisterPage({ isDarkMode }: RegisterPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, { full_name: fullName });
      setSuccess("Account created successfully! Redirecting...");

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div
        className={`max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2
            className={`text-3xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Create Account
          </h2>
          <p
            className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            Join VKU Toolkit today
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User
                    className={`h-5 w-5 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="Nguyen Van A"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail
                    className={`h-5 w-5 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
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
                    isDarkMode
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
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              <p
                className={`mt-1 text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Minimum 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>
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
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create account
              </>
            )}
          </button>

          {/* Sign in link */}
          <div className="text-center">
            <span
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
