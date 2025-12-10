import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTheme } from "../contexts/ThemeContext";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, theme, language, setTheme, setLanguage, t } = useTheme();
  const router = useRouter();
  const { signOut, user } = useAuth();

  const handleThemeChange = () => {
    const themes: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const handleLanguageChange = () => {
    setLanguage(language === "en" ? "vi" : "en");
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/login");
          },
        },
      ],
      { cancelable: true }
    );
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return "sunny";
      case "dark":
        return "moon";
      case "system":
        return "phone-portrait";
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light Mode";
      case "dark":
        return "Dark Mode";
      case "system":
        return "System";
    }
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </BlurView>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.profileCard}
        >
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarLarge}
          >
            <Text style={styles.avatarText}>
              {user?.ho_va_ten?.charAt(0).toUpperCase() || "U"}
            </Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text
              style={[
                styles.profileName,
                { color: isDark ? "#F3F4F6" : "#1F2937" },
              ]}
            >
              {user?.ho_va_ten || "Student"}
            </Text>
            <Text
              style={[
                styles.profileId,
                { color: isDark ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {user?.StudentID || "Unknown"}
            </Text>
          </View>
        </BlurView>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={styles.card}
          >
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleThemeChange}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrapper}
                >
                  <Ionicons name={getThemeIcon()} size={20} color="#FFFFFF" />
                </LinearGradient>
                <View>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: isDark ? "#F3F4F6" : "#1F2937" },
                    ]}
                  >
                    Theme
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {getThemeLabel()}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                },
              ]}
            />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleLanguageChange}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={["#4facfe", "#00f2fe"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrapper}
                >
                  <Ionicons name="language" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: isDark ? "#F3F4F6" : "#1F2937" },
                    ]}
                  >
                    Language
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {language === "en" ? "English" : "Tiếng Việt"}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={styles.card}
          >
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={["#f093fb", "#f5576c"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrapper}
                >
                  <Ionicons name="notifications" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: isDark ? "#F3F4F6" : "#1F2937" },
                    ]}
                  >
                    Notifications
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Manage notifications
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                },
              ]}
            />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={["#43e97b", "#38f9d7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrapper}
                >
                  <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: isDark ? "#F3F4F6" : "#1F2937" },
                    ]}
                  >
                    Privacy
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Privacy settings
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={styles.card}
          >
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={["#fa709a", "#fee140"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrapper}
                >
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <View>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: isDark ? "#F3F4F6" : "#1F2937" },
                    ]}
                  >
                    About VKU Toolkit
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Version 1.0.0
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                },
              ]}
            />

            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={["#30cfd0", "#330867"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconWrapper}
                >
                  <Ionicons name="help-circle" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: isDark ? "#F3F4F6" : "#1F2937" },
                    ]}
                  >
                    Help & Support
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Get help
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.9}
        >
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={styles.logoutBlur}
          >
            <LinearGradient
              colors={["#EF5350", "#E57373"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </BlurView>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: isDark ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            © 2024 Van Lang University
          </Text>
          <Text
            style={[
              styles.footerSubtext,
              { color: isDark ? "#6B7280" : "#9CA3AF" },
            ]}
          >
            Made with ❤️ by VKU Team
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profileInfo: {
    alignItems: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 12,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#EF5350",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerSubtext: {
    fontSize: 11,
    fontWeight: "500",
  },
});
