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
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

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
    colors: ["#6366F1", "#8B5CF6"],
    route: "/(tabs)",
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
    colors: ["#6366F1", "#8B5CF6"],
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
  {
    id: "chatnlp",
    name: "NLP Chat",
    description: "Natural Language Processing",
    icon: "language",
    colors: ["#845ec2", "#d65db1"],
    enabled: false,
    category: "tools",
  },
  {
    id: "example",
    name: "Example Plugin",
    description: "Template for new plugins",
    icon: "cube",
    colors: ["#ffc75f", "#f9f871"],
    enabled: false,
    category: "utility",
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

  const togglePlugin = async (id: string) => {
    const updated = plugins.map((p) => {
      if (p.id === id) {
        const newState = !p.enabled;

        // Try to schedule notification, fallback to Alert if it fails (e.g. in Expo Go on Android)
        try {
          Notifications.scheduleNotificationAsync({
            content: {
              title: newState ? "Plugin Enabled" : "Plugin Disabled",
              body: `${p.name} has been ${newState ? "enabled" : "disabled"}.`,
            },
            trigger: null,
          }).catch(() => {
            // Silent catch or fallback
            // Alert.alert(newState ? "Plugin Enabled" : "Plugin Disabled", `${p.name} has been ${newState ? "enabled" : "disabled"}.`);
          });
        } catch (e) {
          console.log("Notification failed", e);
        }

        return { ...p, enabled: newState };
      }
      return p;
    });
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
          <View
            style={[
              styles.cardContent,
              { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: item.colors[0] + "20" },
                ]}
              >
                <Ionicons name={item.icon} size={24} color={item.colors[0]} />
              </View>

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
                    color: isDark ? "#F3F4F6" : "#111827",
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
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#111827" : "#F3F4F6" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: isDark ? "#111827" : "#F3F4F6",
          },
        ]}
      >
        <View>
          <Text
            style={[
              styles.headerTitle,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            Plugins
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {enabledCount} of {plugins.length} enabled
          </Text>
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["all", "core", "tools", "utility"].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterButton,
                selectedCategory === cat && {
                  backgroundColor: isDark ? "#374151" : "#E5E7EB",
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      selectedCategory === cat
                        ? isDark
                          ? "#FFFFFF"
                          : "#111827"
                        : isDark
                        ? "#9CA3AF"
                        : "#6B7280",
                    fontWeight: selectedCategory === cat ? "700" : "500",
                  },
                ]}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
            tintColor={isDark ? "#FFFFFF" : "#000000"}
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
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  categoryFilter: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
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
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
    height: 160,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  cardBody: {
    gap: 4,
  },
  pluginName: {
    fontSize: 16,
    fontWeight: "700",
  },
  pluginDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
