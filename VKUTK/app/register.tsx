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
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "../components/ui/Logo";
import { useTheme } from "../contexts/ThemeContext";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();
  const { width, height } = useWindowDimensions();

  const theme = useTheme();
  const isDark = theme?.isDark ?? false;

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password);
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Please try again");
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
            {/* Back Button */}
            <TouchableOpacity
              style={[
                styles.backButton,
                { backgroundColor: isDark ? "#374151" : "#E5E7EB" },
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? "#FFFFFF" : "#1F2937"}
              />
            </TouchableOpacity>

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
                  Create Account
                </Text>
                <Text
                  style={[
                    styles.welcomeSubtitle,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Sign up to get started
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                {/* Username Input */}
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
                    name="person-outline"
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { color: isDark ? "#FFFFFF" : "#1F2937" },
                    ]}
                    placeholder="Username"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                {/* Email Input */}
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
                    keyboardType="email-address"
                    autoCapitalize="none"
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

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={[
                    styles.signUpButton,
                    { backgroundColor: isDark ? "#6366F1" : "#4F46E5" },
                    isLoading && styles.signUpButtonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signUpButtonText}>Sign Up</Text>
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
                    Or sign up with
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

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text
                style={[
                  styles.loginText,
                  { color: isDark ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text
                  style={[
                    styles.loginLink,
                    { color: isDark ? "#60A5FA" : "#4F46E5" },
                  ]}
                >
                  Sign In
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
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    padding: 8,
    borderRadius: 12,
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
  signUpButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
