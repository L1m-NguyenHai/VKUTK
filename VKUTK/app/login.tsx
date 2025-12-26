import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "../components/ui/Logo";
import { useTheme } from "../contexts/ThemeContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  const { width, height } = useWindowDimensions();
  // We might not have access to ThemeContext here if it's wrapped inside the authenticated part,
  // but usually ThemeProvider wraps the whole app.
  // If not, we'll default to light mode or check system preference.
  // Assuming ThemeProvider wraps the root layout.

  // For now, I'll assume we can use useTheme, but if it fails (because context is not available),
  // I'll fallback to a default style.
  // Actually, looking at the file structure, `app/_layout.tsx` likely wraps everything.

  // Let's try to use useTheme, but handle if it's not available safely?
  // No, hooks must be used. I'll assume it's available.

  // Wait, I need to check if I can import useTheme. It was imported in student-info.tsx.
  // Let's check if I can import it here. Yes.

  const theme = useTheme();
  const isDark = theme?.isDark ?? false; // Fallback if context is missing (though it shouldn't be)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Đăng nhập thành công",
          body: "Chào mừng bạn quay trở lại!",
        },
        trigger: null,
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Đăng nhập thất bại",
          body: error.message || "Vui lòng kiểm tra lại thông tin đăng nhập",
        },
        trigger: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (platform: string) => {
    Alert.alert("Coming Soon", `${platform} login will be available soon`);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#111827" : "#F3F4F6" },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <Logo size={100} />
            </View>

            {/* Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
                  borderColor: isDark ? "#374151" : "#E5E7EB",
                  borderWidth: 1,
                },
              ]}
            >
              {/* Welcome Section */}
              <View style={styles.welcomeSection}>
                <Text
                  style={[
                    styles.welcomeTitle,
                    { color: isDark ? "#FFFFFF" : "#111827" },
                  ]}
                >
                  Welcome Back
                </Text>
                <Text
                  style={[
                    styles.welcomeSubtitle,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Please sign in to continue
                </Text>
              </View>

              {/* Email Input */}
              <View style={styles.formSection}>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? "#374151" : "#F9FAFB",
                      borderColor: isDark ? "#4B5563" : "#E5E7EB",
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { color: isDark ? "#FFFFFF" : "#1F2937" },
                    ]}
                    placeholder="Email"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                  />
                </View>

                {/* Password Input */}
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? "#374151" : "#F9FAFB",
                      borderColor: isDark ? "#4B5563" : "#E5E7EB",
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { color: isDark ? "#FFFFFF" : "#1F2937" },
                    ]}
                    placeholder="Password"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text
                    style={[
                      styles.forgotPasswordText,
                      { color: isDark ? "#60A5FA" : "#4F46E5" },
                    ]}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[
                    styles.signInButton,
                    { backgroundColor: isDark ? "#6366F1" : "#4F46E5" },
                    isLoading && styles.signInButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signInButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: isDark ? "#374151" : "#E5E7EB" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.dividerText,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Or continue with
                  </Text>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: isDark ? "#374151" : "#E5E7EB" },
                    ]}
                  />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.socialButton,
                      {
                        backgroundColor: isDark ? "#374151" : "#F9FAFB",
                        borderColor: isDark ? "#4B5563" : "#E5E7EB",
                      },
                    ]}
                    onPress={() => handleSocialLogin("Google")}
                  >
                    <Ionicons name="logo-google" size={22} color="#DB4437" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.socialButton,
                      {
                        backgroundColor: isDark ? "#374151" : "#F9FAFB",
                        borderColor: isDark ? "#4B5563" : "#E5E7EB",
                      },
                    ]}
                    onPress={() => handleSocialLogin("Facebook")}
                  >
                    <Ionicons name="logo-facebook" size={22} color="#4267B2" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.socialButton,
                      {
                        backgroundColor: isDark ? "#374151" : "#F9FAFB",
                        borderColor: isDark ? "#4B5563" : "#E5E7EB",
                      },
                    ]}
                    onPress={() => handleSocialLogin("Apple")}
                  >
                    <Ionicons
                      name="logo-apple"
                      size={22}
                      color={isDark ? "#FFFFFF" : "#000000"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text
                style={[
                  styles.signUpText,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text
                  style={[
                    styles.signUpLink,
                    { color: isDark ? "#60A5FA" : "#4F46E5" },
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  contentContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
  },
  formSection: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: "600",
  },
  signInButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: "500",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
