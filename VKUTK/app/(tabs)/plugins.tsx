import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
  route?: string;
  enabled: boolean;
  category: "core" | "tools" | "utility";
}

const PLUGIN_STORAGE_KEY = "@vku_plugins_enabled";

const DEFAULT_PLUGINS: Plugin[] = [
  {
    id: "chat",
    name: "AI Chat",
    description: "Intelligent conversation assistant",
    icon: "chatbubbles",
    colors: ["#667eea", "#764ba2"],
    route: "/(tabs)/chat",
    enabled: true,
    category: "core",
  },
  {
    id: "timetable",
    name: "Timetable",
    description: "Manage your class schedule",
    icon: "calendar",
    colors: ["#f093fb", "#f5576c"],
    enabled: true,
    category: "core",
  },
  {
    id: "summary",
    name: "Summarizer",
    description: "Quick document summaries",
    icon: "document-text",
    colors: ["#4facfe", "#00f2fe"],
    enabled: true,
    category: "tools",
  },
  {
    id: "questions",
    name: "Quiz Maker",
    description: "Generate practice questions",
    icon: "help-circle",
    colors: ["#43e97b", "#38f9d7"],
    enabled: true,
    category: "tools",
  },
  {
    id: "research",
    name: "Research",
    description: "AI-powered research assistant",
    icon: "search",
    colors: ["#fa709a", "#fee140"],
    enabled: false,
    category: "tools",
  },
  {
    id: "documents",
    name: "Documents",
    description: "File management system",
    icon: "folder",
    colors: ["#30cfd0", "#330867"],
    enabled: false,
    category: "utility",
  },
  {
    id: "scores",
    name: "Grades",
    description: "Track your academic progress",
    icon: "trophy",
    colors: ["#a8edea", "#fed6e3"],
    enabled: true,
    category: "core",
  },
  {
    id: "stackoverflow",
    name: "Code Helper",
    description: "Programming Q&A assistant",
    icon: "code-slash",
    colors: ["#ff9a56", "#ff6a88"],
    enabled: false,
    category: "tools",
  },
];

export default function PluginsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, t } = useTheme();
  const router = useRouter();
  const [plugins, setPlugins] = useState<Plugin[]>(DEFAULT_PLUGINS);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    loadPluginStates();
  }, []);

  const loadPluginStates = async () => {
    try {
      const stored = await AsyncStorage.getItem(PLUGIN_STORAGE_KEY);
      if (stored) {
        const enabledStates = JSON.parse(stored);
        setPlugins((prev) =>
          prev.map((p) => ({
            ...p,
            enabled:
              enabledStates[p.id] !== undefined
                ? enabledStates[p.id]
                : p.enabled,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load plugin states:", error);
    }
  };

  const savePluginStates = async (updatedPlugins: Plugin[]) => {
    try {
      const enabledStates = updatedPlugins.reduce(
        (acc, p) => ({ ...acc, [p.id]: p.enabled }),
        {}
      );
      await AsyncStorage.setItem(
        PLUGIN_STORAGE_KEY,
        JSON.stringify(enabledStates)
      );
    } catch (error) {
      console.error("Failed to save plugin states:", error);
    }
  };

  const togglePlugin = (id: string) => {
    const updated = plugins.map((p) =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    setPlugins(updated);
    savePluginStates(updated);
  };

  const handlePluginPress = (plugin: Plugin) => {
    if (!plugin.enabled || !plugin.route) return;
    router.push(plugin.route as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPluginStates();
    setTimeout(() => setRefreshing(false), 500);
  };

  const enabledCount = plugins.filter((p) => p.enabled).length;
  const filteredPlugins =
    selectedCategory === "all"
      ? plugins
      : plugins.filter((p) => p.category === selectedCategory);

  const renderPluginCard = ({
    item,
    index,
  }: {
    item: Plugin;
    index: number;
  }) => {
    const scaleAnim = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={[styles.pluginCard, { transform: [{ scale: scaleAnim }] }]}
      >
        <TouchableOpacity
          onPress={() => handlePluginPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!item.enabled}
          activeOpacity={0.9}
        >
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={styles.cardBlur}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={item.enabled ? item.colors : ["#78909C", "#90A4AE"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrapper}
                >
                  <Ionicons name={item.icon} size={28} color="#FFFFFF" />
                </LinearGradient>

                <Switch
                  value={item.enabled}
                  onValueChange={() => togglePlugin(item.id)}
                  trackColor={{
                    false: isDark ? "#374151" : "#D1D5DB",
                    true: item.colors[0],
                  }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={isDark ? "#374151" : "#D1D5DB"}
                  style={styles.switch}
                />
              </View>

              <View style={styles.cardBody}>
                <Text
                  style={[
                    styles.pluginName,
                    {
                      color: isDark ? "#F3F4F6" : "#1F2937",
                      opacity: item.enabled ? 1 : 0.5,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.pluginDesc,
                    {
                      color: isDark ? "#9CA3AF" : "#6B7280",
                      opacity: item.enabled ? 1 : 0.5,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>

                <View style={styles.categoryBadge}>
                  <Text
                    style={[
                      styles.categoryText,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {item.category}
                  </Text>
                </View>
              </View>

              {item.enabled && item.route && (
                <View style={styles.arrowIcon}>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                </View>
              )}
            </View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDark
            ? ["#1a1a2e", "#16213e", "#0f3460"]
            : ["#667eea", "#764ba2", "#f093fb"]
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Plugins</Text>
            <Text style={styles.headerSubtitle}>
              {enabledCount} of {plugins.length} enabled
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          style={styles.filterBlur}
        >
          {["all", "core", "tools", "utility"].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterButton,
                selectedCategory === cat && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              {selectedCategory === cat && (
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === cat && styles.filterTextActive,
                ]}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </BlurView>
      </View>

      {/* Plugins Grid */}
      <FlatList
        data={filteredPlugins}
        renderItem={renderPluginCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={["#667eea"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryFilter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterBlur: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  filterButtonActive: {},
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    textTransform: "capitalize",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pluginCard: {
    width: "48%",
  },
  cardBlur: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  cardBody: {
    gap: 6,
  },
  pluginName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  pluginDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  arrowIcon: {
    position: "absolute",
    bottom: 12,
    right: 12,
  },
});
