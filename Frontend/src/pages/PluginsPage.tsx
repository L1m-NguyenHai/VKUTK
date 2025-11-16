import { useState, useEffect } from "react";
import {
  Loader2,
  RefreshCw,
  Plug,
  CheckCircle,
  XCircle,
  Code,
  User,
  Package,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

type Page = "plugins" | "info" | "settings" | "schedule";

interface PluginsPageProps {
  isDarkMode: boolean;
  navigateTo: (page: Page) => void;
}

interface PluginMetadata {
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  icon?: string;
  color?: string;
}

interface Plugin {
  id: string;
  metadata: PluginMetadata;
  loaded_at: string;
  routes_count: number;
}

const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "http://127.0.0.1:8000";

export function PluginsPage({ isDarkMode }: PluginsPageProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlugins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/plugins`);
      if (!response.ok) {
        throw new Error("Failed to load plugins");
      }
      const data = await response.json();
      setPlugins(data.plugins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  const reloadPlugin = async (pluginId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/plugins/${pluginId}/reload`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        await loadPlugins();
      }
    } catch (err) {
      console.error("Failed to reload plugin:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug
            className={`w-5 h-5 ${
              isDarkMode ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <h1
            className={`text-lg md:text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Plugins Manager
          </h1>
        </div>
        <button
          onClick={loadPlugins}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-900"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          className={`p-3 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" />
            <span
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Total Plugins
            </span>
          </div>
          <p
            className={`text-xl font-bold mt-1 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {plugins.length}
          </p>
        </div>

        <div
          className={`p-3 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Active
            </span>
          </div>
          <p
            className={`text-xl font-bold mt-1 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {plugins.filter((p) => p.metadata.enabled).length}
          </p>
        </div>

        <div
          className={`p-3 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-purple-500" />
            <span
              className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Total Routes
            </span>
          </div>
          <p
            className={`text-xl font-bold mt-1 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {plugins.reduce((sum, p) => sum + p.routes_count, 0)}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className={`p-3 rounded-lg flex items-start gap-2 text-xs ${
            isDarkMode
              ? "bg-red-900/50 text-red-200"
              : "bg-red-100 text-red-800"
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && plugins.length === 0 ? (
        <div className="text-center py-8">
          <Loader2
            className={`w-8 h-8 mx-auto mb-2 animate-spin ${
              isDarkMode ? "text-blue-400" : "text-blue-600"
            }`}
          />
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Loading plugins...
          </p>
        </div>
      ) : (
        /* Plugins Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Plugin Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                        plugin.metadata.color || "from-gray-500 to-gray-600"
                      } flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {plugin.metadata.name[0]}
                    </div>
                    <div>
                      <h3
                        className={`font-semibold text-sm ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {plugin.metadata.name}
                      </h3>
                      <span
                        className={`text-xs ${
                          isDarkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        v{plugin.metadata.version}
                      </span>
                    </div>
                  </div>
                  <p
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {plugin.metadata.description}
                  </p>
                </div>

                {plugin.metadata.enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>

              {/* Plugin Info */}
              <div
                className={`grid grid-cols-2 gap-2 mb-3 pb-3 border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <User className="w-3 h-3 text-gray-500" />
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Author
                    </span>
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {plugin.metadata.author}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <Code className="w-3 h-3 text-gray-500" />
                    <span
                      className={`text-xs ${
                        isDarkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Routes
                    </span>
                  </div>
                  <p
                    className={`text-xs font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {plugin.routes_count}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => reloadPlugin(plugin.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  Reload
                </button>
                <a
                  href={`${API_BASE_URL}/api/plugins/${plugin.id}/info`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  <ExternalLink className="w-3 h-3" />
                  API
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div
        className={`p-3 rounded-lg border text-xs ${
          isDarkMode
            ? "bg-gray-800 border-gray-700 text-gray-400"
            : "bg-blue-50 border-blue-200 text-gray-700"
        }`}
      >
        <p className="font-semibold mb-1">💡 Cách tạo plugin mới:</p>
        <ol className="list-decimal list-inside space-y-0.5 ml-2">
          <li>
            Copy file{" "}
            <code className="px-1 py-0.5 rounded bg-gray-700 text-gray-300">
              Backend/cogs/example_cog.py
            </code>
          </li>
          <li>Đổi tên và sửa metadata (name, description, author...)</li>
          <li>
            Thêm routes trong hàm{" "}
            <code className="px-1 py-0.5 rounded bg-gray-700 text-gray-300">
              setup()
            </code>
          </li>
          <li>Restart backend để tự động load plugin mới</li>
        </ol>
      </div>
    </div>
  );
}
