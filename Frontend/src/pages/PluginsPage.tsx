import { useState, useEffect } from "react";
import type { ThemeMode } from "../App";
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
  LayoutGrid,
  List,
  // Plugin icons
  Zap,
  MessageCircle,
  Brain,
  FileText,
  HelpCircle,
  MessageCircleQuestion,
  Calendar,
  Award,
  Search,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { getApiEndpoint } from "../utils/apiConfig";

type Page = "chat" | "plugins" | "info" | "schedule" | "timetable" | "quiz";

// Icon mapping from string names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  Zap,
  MessageCircle,
  Brain,
  FileText,
  HelpCircle,
  MessageCircleQuestion,
  Calendar,
  Award,
  Search,
  Briefcase,
  Plug, // fallback
};

interface PluginsPageProps {
  themeMode: ThemeMode;
  navigateTo: (page: Page) => void;
  searchQuery?: string;
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

const PLUGIN_ENABLED_KEY = "vku_plugins_enabled";
const VIEW_MODE_KEY = "vku_plugins_view_mode";

// Helper function to get icon component from string name
const getPluginIcon = (iconName?: string): LucideIcon => {
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return Plug; // fallback icon
};

export function PluginsPage({ themeMode, searchQuery = "" }: PluginsPageProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  // Filter plugins based on search query
  const filteredPlugins = plugins.filter((plugin) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      plugin.metadata.name.toLowerCase().includes(query) ||
      plugin.metadata.description.toLowerCase().includes(query) ||
      plugin.id.toLowerCase().includes(query)
    );
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    return (stored as "grid" | "list") || "grid";
  });
  const API_BASE_URL = getApiEndpoint();
  const [enabledPlugins, setEnabledPlugins] = useState<Record<string, boolean>>(
    () => {
      // Load from localStorage
      const stored = localStorage.getItem(PLUGIN_ENABLED_KEY);
      return stored ? JSON.parse(stored) : {};
    }
  );

  const loadPlugins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/plugins`, {
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        );
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        await response.text(); // consume body
        throw new Error(
          `API returned non-JSON response. Content-Type: ${contentType}`
        );
      }

      const data = await response.json();
      const loadedPlugins = data.plugins || [];

      // Apply enabled state from localStorage
      const pluginsWithState = loadedPlugins.map((p: Plugin) => ({
        ...p,
        metadata: {
          ...p.metadata,
          enabled:
            enabledPlugins[p.id] !== undefined ? enabledPlugins[p.id] : true,
        },
      }));

      setPlugins(pluginsWithState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage whenever enabledPlugins changes
  useEffect(() => {
    localStorage.setItem(PLUGIN_ENABLED_KEY, JSON.stringify(enabledPlugins));
  }, [enabledPlugins]);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const togglePlugin = (pluginId: string) => {
    const currentEnabled =
      enabledPlugins[pluginId] !== undefined ? enabledPlugins[pluginId] : true;
    const newEnabled = !currentEnabled;

    // Update localStorage state
    setEnabledPlugins((prev) => ({ ...prev, [pluginId]: newEnabled }));

    // Update UI immediately
    setPlugins((prev) =>
      prev.map((p) =>
        p.id === pluginId
          ? { ...p, metadata: { ...p.metadata, enabled: newEnabled } }
          : p
      )
    );
  };

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
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plug
              className={`w-5 h-5 ${
                themeMode === "dark"
                  ? "text-blue-400"
                  : themeMode === "cream"
                  ? "text-orange-600"
                  : "text-blue-600"
              }`}
            />
            <h1
              className={`text-lg md:text-xl font-bold ${
                themeMode === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              Plugins Manager
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div
              className={`flex items-center rounded-lg p-0.5 ${
                themeMode === "dark" ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? themeMode === "dark"
                      ? "bg-gray-600 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                    : themeMode === "dark"
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list"
                    ? themeMode === "dark"
                      ? "bg-gray-600 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                    : themeMode === "dark"
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {/* Refresh Button */}
            <button
              onClick={loadPlugins}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                themeMode === "dark"
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            className={`p-3 rounded-lg border ${
              themeMode === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span
                className={`text-xs ${
                  themeMode === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total Plugins
              </span>
            </div>
            <p
              className={`text-xl font-bold mt-1 ${
                themeMode === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {plugins.length}
            </p>
          </div>

          <div
            className={`p-3 rounded-lg border ${
              themeMode === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span
                className={`text-xs ${
                  themeMode === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Active
              </span>
            </div>
            <p
              className={`text-xl font-bold mt-1 ${
                themeMode === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {plugins.filter((p) => p.metadata.enabled).length}
            </p>
          </div>

          <div
            className={`p-3 rounded-lg border ${
              themeMode === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-500" />
              <span
                className={`text-xs ${
                  themeMode === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Total Routes
              </span>
            </div>
            <p
              className={`text-xl font-bold mt-1 ${
                themeMode === "dark" ? "text-white" : "text-gray-900"
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
              themeMode === "dark"
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
                themeMode === "dark"
                  ? "text-blue-400"
                  : themeMode === "cream"
                  ? "text-orange-600"
                  : "text-blue-600"
              }`}
            />
            <p
              className={`text-sm ${
                themeMode === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Loading plugins...
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Plugins Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPlugins.length === 0 ? (
              <div
                className={`col-span-2 text-center py-8 ${
                  themeMode === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Không tìm thấy plugin nào phù hợp với "{searchQuery}"</p>
              </div>
            ) : (
              filteredPlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    themeMode === "dark"
                      ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Plugin Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {(() => {
                          const IconComponent = getPluginIcon(
                            plugin.metadata.icon
                          );
                          const colorClass =
                            plugin.metadata.color &&
                            plugin.metadata.color.trim() !== ""
                              ? plugin.metadata.color
                              : "from-gray-500 to-gray-600";
                          return (
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                          );
                        })()}
                        <div>
                          <h3
                            className={`font-semibold text-sm ${
                              themeMode === "dark"
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {plugin.metadata.name}
                          </h3>
                          <span
                            className={`text-xs ${
                              themeMode === "dark"
                                ? "text-gray-500"
                                : "text-gray-500"
                            }`}
                          >
                            v{plugin.metadata.version}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`text-xs ${
                          themeMode === "dark"
                            ? "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {plugin.metadata.description}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => togglePlugin(plugin.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        plugin.metadata.enabled
                          ? "bg-green-500 focus:ring-green-500"
                          : themeMode === "dark"
                          ? "bg-gray-600 focus:ring-gray-500"
                          : "bg-gray-300 focus:ring-gray-400"
                      }`}
                      title={plugin.metadata.enabled ? "Disable" : "Enable"}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          plugin.metadata.enabled
                            ? "translate-x-4"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Plugin Info */}
                  <div
                    className={`grid grid-cols-2 gap-2 mb-3 pb-3 border-b ${
                      themeMode === "dark"
                        ? "border-gray-700"
                        : "border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <User className="w-3 h-3 text-gray-500" />
                        <span
                          className={`text-xs ${
                            themeMode === "dark"
                              ? "text-gray-500"
                              : "text-gray-500"
                          }`}
                        >
                          Author
                        </span>
                      </div>
                      <p
                        className={`text-xs font-medium ${
                          themeMode === "dark"
                            ? "text-gray-300"
                            : "text-gray-700"
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
                            themeMode === "dark"
                              ? "text-gray-500"
                              : "text-gray-500"
                          }`}
                        >
                          Routes
                        </span>
                      </div>
                      <p
                        className={`text-xs font-medium ${
                          themeMode === "dark"
                            ? "text-gray-300"
                            : "text-gray-700"
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
                      title="Reload Plugin"
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        themeMode === "dark"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reload</span>
                    </button>
                    <a
                      href={`${API_BASE_URL}/api/plugins/${plugin.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View API Documentation"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        themeMode === "dark"
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                      }`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>API</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Plugins List View */
          <div className="space-y-2">
            {filteredPlugins.length === 0 ? (
              <div
                className={`text-center py-8 ${
                  themeMode === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Không tìm thấy plugin nào phù hợp với "{searchQuery}"</p>
              </div>
            ) : (
              filteredPlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                    themeMode === "dark"
                      ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    {(() => {
                      const IconComponent = getPluginIcon(plugin.metadata.icon);
                      const colorClass =
                        plugin.metadata.color &&
                        plugin.metadata.color.trim() !== ""
                          ? plugin.metadata.color
                          : "from-gray-500 to-gray-600";
                      return (
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white flex-shrink-0`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                      );
                    })()}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-semibold text-sm truncate ${
                            themeMode === "dark"
                              ? "text-white"
                              : "text-gray-900"
                          }`}
                        >
                          {plugin.metadata.name}
                        </h3>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            themeMode === "dark"
                              ? "bg-gray-700 text-gray-400"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          v{plugin.metadata.version}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate ${
                          themeMode === "dark"
                            ? "text-gray-400"
                            : "text-gray-600"
                        }`}
                      >
                        {plugin.metadata.description}
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="hidden sm:flex items-center gap-4 text-xs flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-500" />
                        <span
                          className={
                            themeMode === "dark"
                              ? "text-gray-400"
                              : "text-gray-600"
                          }
                        >
                          {plugin.metadata.author}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Code className="w-3 h-3 text-gray-500" />
                        <span
                          className={
                            themeMode === "dark"
                              ? "text-gray-400"
                              : "text-gray-600"
                          }
                        >
                          {plugin.routes_count} routes
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => reloadPlugin(plugin.id)}
                        title="Reload Plugin"
                        className={`p-1.5 rounded transition-colors ${
                          themeMode === "dark"
                            ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                            : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <a
                        href={`${API_BASE_URL}/api/plugins/${plugin.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View API Documentation"
                        className={`p-1.5 rounded transition-colors ${
                          themeMode === "dark"
                            ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                            : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {/* Toggle Switch */}
                      <button
                        onClick={() => togglePlugin(plugin.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          plugin.metadata.enabled
                            ? "bg-green-500 focus:ring-green-500"
                            : themeMode === "dark"
                            ? "bg-gray-600 focus:ring-gray-500"
                            : "bg-gray-300 focus:ring-gray-400"
                        }`}
                        title={plugin.metadata.enabled ? "Disable" : "Enable"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                            plugin.metadata.enabled
                              ? "translate-x-4"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Help Text */}
        <div
          className={`p-3 rounded-lg border text-xs ${
            themeMode === "dark"
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
    </div>
  );
}
