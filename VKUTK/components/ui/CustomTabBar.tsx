import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  UIManager,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useChatInput } from "@/contexts/ChatInputContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { inputText, setInputText, sendMessage } = useChatInput();
  const [isLoading, setIsLoading] = React.useState(false);

  const currentRoute = state.routes[state.index];
  const isOnChatPage = currentRoute.name === "chat";

  // Transform into chat input on chat page
  if (isOnChatPage) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? "dark" : "light"}
          style={styles.chatInputContainer}
        >
          <View style={styles.chatInputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons
                name="add-circle"
                size={28}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>

            <TextInput
              style={[
                styles.chatInput,
                { color: isDark ? "#F3F4F6" : "#1F2937" },
              ]}
              placeholder="Type your message..."
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={styles.chatSendButton}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  inputText.trim() && !isLoading
                    ? ["#667eea", "#764ba2"]
                    : ["#9CA3AF", "#6B7280"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <BlurView
        intensity={isDark ? 60 : 80}
        tint={isDark ? "dark" : "light"}
        style={styles.blurContainer}
      >
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                {isFocused ? (
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activeTab}
                  >
                    {options.tabBarIcon?.({
                      focused: true,
                      color: "#FFFFFF",
                      size: 26,
                    })}
                  </LinearGradient>
                ) : (
                  <View style={styles.inactiveTab}>
                    {options.tabBarIcon?.({
                      focused: false,
                      color: isDark ? "#9CA3AF" : "#6B7280",
                      size: 24,
                    })}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurContainer: {
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  activeTab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  inactiveTab: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  chatInputContainer: {
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  chatInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chatInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
