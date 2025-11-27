import { useEffect, useState } from "react";
import { ThemeMode } from "../App";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, User, Code } from "lucide-react";
import { getApiEndpoint } from "../utils/apiConfig";

interface Plugin {
  id: string;
  metadata: {
    name: string;
    description: string;
    version: string;
    author: string;
    enabled: boolean;
    icon?: string;
    color?: string;
  };
}

interface PublicPluginsPageProps {
  themeMode: ThemeMode;
}

export function PublicPluginsPage({ themeMode }: PublicPluginsPageProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiEndpoint = getApiEndpoint();

      const response = await fetch(`${apiEndpoint}/api/plugins`, {
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        );
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `API returned non-JSON response. Content-Type: ${contentType}. Response: ${text.substring(
            0,
            100
          )}...`
        );
      }

      const data = await response.json();

      if (data.success) {
        setPlugins(data.plugins);
        setError(null);
      } else {
        setError("Failed to fetch plugins: API returned success=false");
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setError(
          `Cannot connect to API at ${getApiEndpoint()}. Check if backend is running and CORS is enabled.`
        );
      } else if (err instanceof SyntaxError) {
        setError(
          `Invalid JSON response from API. Server might be returning HTML error page.`
        );
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
      console.error("Error fetching plugins:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        themeMode === "dark"
          ? "bg-gray-900 text-white"
          : themeMode === "cream"
          ? "bg-gradient-to-br from-amber-50 to-orange-50"
          : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b ${
          themeMode === "dark"
            ? "bg-gray-800 border-gray-700"
            : themeMode === "cream"
            ? "bg-white/80 backdrop-blur border-amber-200"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`text-2xl font-bold ${
                  themeMode === "dark"
                    ? "text-white"
                    : themeMode === "cream"
                    ? "text-amber-900"
                    : "text-gray-900"
                }`}
              >
                VKU Toolkit Plugins
              </h1>
              <p
                className={`text-sm mt-1 ${
                  themeMode === "dark"
                    ? "text-gray-400"
                    : themeMode === "cream"
                    ? "text-amber-700"
                    : "text-gray-600"
                }`}
              >
                Available plugins and their status
              </p>
            </div>
            <Link
              to="/login"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                themeMode === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : themeMode === "cream"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              Login to Access
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div
            className={`p-6 rounded-lg border ${
              themeMode === "dark"
                ? "bg-red-900/20 text-red-400 border-red-800"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Failed to load plugins</h3>
                <p className="text-sm mb-3">{error}</p>
                <div
                  className={`text-xs p-3 rounded ${
                    themeMode === "dark" ? "bg-gray-800/50" : "bg-white/50"
                  }`}
                >
                  <p className="font-mono mb-1">
                    API Endpoint: {getApiEndpoint()}
                  </p>
                  <p className="mt-2 opacity-80">
                    💡 Tip: Go to{" "}
                    <Link to="/login" className="underline font-semibold">
                      login page
                    </Link>{" "}
                    to change API endpoint settings
                  </p>
                </div>
                <button
                  onClick={fetchPlugins}
                  className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    themeMode === "dark"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2
                className={`text-xl font-semibold ${
                  themeMode === "dark"
                    ? "text-white"
                    : themeMode === "cream"
                    ? "text-amber-900"
                    : "text-gray-900"
                }`}
              >
                Available Plugins ({plugins.length})
              </h2>
              <button
                onClick={fetchPlugins}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  themeMode === "dark"
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                    : themeMode === "cream"
                    ? "bg-white hover:bg-amber-50 text-amber-900 border border-amber-200"
                    : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className={`p-6 rounded-xl border transition-all ${
                    themeMode === "dark"
                      ? "bg-gray-800 border-gray-700"
                      : themeMode === "cream"
                      ? "bg-white border-amber-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {/* Plugin Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                            plugin.metadata.color || "from-gray-500 to-gray-600"
                          } flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                        >
                          {plugin.metadata.name[0]}
                        </div>
                        <div>
                          <h3
                            className={`font-semibold text-lg ${
                              themeMode === "dark"
                                ? "text-white"
                                : themeMode === "cream"
                                ? "text-amber-900"
                                : "text-gray-900"
                            }`}
                          >
                            {plugin.metadata.name}
                          </h3>
                          <span
                            className={`text-sm ${
                              themeMode === "dark"
                                ? "text-gray-500"
                                : themeMode === "cream"
                                ? "text-amber-600"
                                : "text-gray-500"
                            }`}
                          >
                            v{plugin.metadata.version}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`text-sm ${
                          themeMode === "dark"
                            ? "text-gray-400"
                            : themeMode === "cream"
                            ? "text-amber-700"
                            : "text-gray-600"
                        }`}
                      >
                        {plugin.metadata.description}
                      </p>
                    </div>

                    {plugin.metadata.enabled ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Plugin Info */}
                  <div
                    className={`grid grid-cols-2 gap-3 pt-4 border-t ${
                      themeMode === "dark"
                        ? "border-gray-700"
                        : themeMode === "cream"
                        ? "border-amber-200"
                        : "border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User
                          className={`w-4 h-4 ${
                            themeMode === "dark"
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            themeMode === "dark"
                              ? "text-gray-500"
                              : themeMode === "cream"
                              ? "text-amber-600"
                              : "text-gray-500"
                          }`}
                        >
                          Author
                        </span>
                      </div>
                      <p
                        className={`text-sm font-medium ${
                          themeMode === "dark"
                            ? "text-gray-300"
                            : themeMode === "cream"
                            ? "text-amber-900"
                            : "text-gray-700"
                        }`}
                      >
                        {plugin.metadata.author}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Code
                          className={`w-4 h-4 ${
                            themeMode === "dark"
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            themeMode === "dark"
                              ? "text-gray-500"
                              : themeMode === "cream"
                              ? "text-amber-600"
                              : "text-gray-500"
                          }`}
                        >
                          Status
                        </span>
                      </div>
                      <p
                        className={`text-sm font-medium ${
                          plugin.metadata.enabled
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      >
                        {plugin.metadata.enabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {plugins.length === 0 && (
              <div
                className={`text-center py-20 ${
                  themeMode === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <p className="text-lg">No plugins available</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
