import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Đăng xuất thành công",
                body: "Hẹn gặp lại bạn!",
              },
              trigger: null,
            });
            router.replace("/login");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const SettingItem = ({
    icon,
    title,
    value,
    onPress,
    type = "arrow",
    color,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value?: string | boolean;
    onPress?: () => void;
    type?: "arrow" | "switch" | "text";
    color?: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" },
      ]}
      onPress={onPress}
      disabled={type === "switch"}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text
        style={[styles.settingText, { color: isDark ? "#FFFFFF" : "#111827" }]}
      >
        {title}
      </Text>
      {type === "switch" && (
        <Switch
          value={value as boolean}
          onValueChange={onPress}
          trackColor={{ false: "#767577", true: "#818cf8" }}
          thumbColor={value ? "#4f46e5" : "#f4f3f4"}
        />
      )}
      {type === "arrow" && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? "#9CA3AF" : "#6B7280"}
        />
      )}
      {type === "text" && (
        <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
          {value as string}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#111827" : "#F3F4F6",
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? "#FFFFFF" : "#111827" },
          ]}
        >
          Cài đặt
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.card}>
            <View
              style={[
                styles.userInfo,
                { borderBottomColor: isDark ? "#374151" : "#E5E7EB" },
              ]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
              <View>
                <Text
                  style={[
                    styles.userName,
                    { color: isDark ? "#FFFFFF" : "#111827" },
                  ]}
                >
                  {user?.email?.split("@")[0] || "User"}
                </Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ứng dụng</Text>
          <View style={styles.card}>
            <SettingItem
              icon="moon"
              title="Giao diện tối"
              type="switch"
              value={isDark}
              onPress={toggleTheme}
              color="#8B5CF6"
            />
            <SettingItem
              icon="notifications"
              title="Thông báo"
              type="switch"
              value={true}
              onPress={() => {}}
              color="#EC4899"
            />
            <SettingItem
              icon="language"
              title="Ngôn ngữ"
              type="text"
              value="Tiếng Việt"
              color="#10B981"
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          <View style={styles.card}>
            <SettingItem
              icon="help-circle"
              title="Trợ giúp & Hỗ trợ"
              color="#F59E0B"
            />
            <SettingItem
              icon="information-circle"
              title="Về ứng dụng"
              color="#3B82F6"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent", // Inherits from card item
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 24,
    marginBottom: 40,
  },
});
