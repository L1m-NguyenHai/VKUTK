import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { BlurView } from "expo-blur";
import { SLASH_COMMANDS } from "@/constants/commands";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PLUGIN_STORAGE_KEY = "@vku_plugins_enabled";

interface CommandSuggestionsProps {
  visible: boolean;
  onSelect: (command: string) => void;
  filterText?: string;
}

export function CommandSuggestions({
  visible,
  onSelect,
  filterText = "",
}: CommandSuggestionsProps) {
  const { isDark } = useTheme();
  const [enabledCommands, setEnabledCommands] = useState(SLASH_COMMANDS);

  useEffect(() => {
    if (visible) {
      loadEnabledCommands();
    }
  }, [visible, filterText]);

  const loadEnabledCommands = async () => {
    try {
      const stored = await AsyncStorage.getItem(PLUGIN_STORAGE_KEY);
      let commands = SLASH_COMMANDS;

      if (stored) {
        const enabledStates = JSON.parse(stored);
        commands = SLASH_COMMANDS.filter((cmd) => {
          if (cmd.pluginId && enabledStates[cmd.pluginId] === false) {
            return false;
          }
          return true;
        });
      }

      if (filterText) {
        const search = filterText.toLowerCase();
        commands = commands.filter((cmd) =>
          cmd.command.toLowerCase().includes(search)
        );
      }

      setEnabledCommands(commands);
    } catch (error) {
      console.error("Failed to load plugin states for commands:", error);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <BlurView
        intensity={isDark ? 80 : 90}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.blurContainer,
          { borderColor: isDark ? "#374151" : "#E5E7EB" },
        ]}
      >
        <FlatList
          data={enabledCommands}
          keyExtractor={(item) => item.command}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.item,
                { borderBottomColor: isDark ? "#374151" : "#E5E7EB" },
              ]}
              onPress={() => onSelect(item.command)}
            >
              <Text
                style={[
                  styles.command,
                  { color: isDark ? "#60A5FA" : "#2563EB" },
                ]}
              >
                {item.command}
              </Text>
              <Text
                style={[
                  styles.description,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
        />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80, // Adjust based on input height
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    maxHeight: 200,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  command: {
    fontWeight: "bold",
    fontSize: 14,
  },
  description: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
    marginLeft: 10,
  },
});
