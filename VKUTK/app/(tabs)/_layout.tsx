import { Tabs } from "expo-router";
import React from "react";
import { FloatingNavBar } from "@/components/ui/FloatingNavBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Ionicons } from "@expo/vector-icons";
import { ChatInputProvider } from "@/contexts/ChatInputContext";
import { NavbarProvider, useNavbar } from "@/contexts/NavbarContext";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function NavbarToggle() {
  const { isNavbarVisible, toggleNavbar } = useNavbar();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.toggleContainer, { bottom: insets.bottom + 20 }]}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          {
            backgroundColor: isDark
              ? "rgba(31, 41, 55, 0.9)"
              : "rgba(255, 255, 255, 0.9)",
            borderColor: isDark
              ? "rgba(75, 85, 99, 0.5)"
              : "rgba(229, 231, 235, 0.5)",
          },
        ]}
        onPress={toggleNavbar}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isNavbarVisible ? "chevron-down" : "chevron-up"}
          size={20}
          color={isDark ? "#FFFFFF" : "#1F2937"}
        />
      </TouchableOpacity>
    </View>
  );
}

function TabLayoutContent() {
  return (
    <>
      <Tabs
        tabBar={(props) => <FloatingNavBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="chatbubble" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="timetable"
          options={{
            title: "Timetable",
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plugins"
          options={{
            title: "Plugins",
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="student-info"
          options={{
            title: "Student Info",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="person.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      <NavbarToggle />
    </>
  );
}

export default function TabLayout() {
  return (
    <NavbarProvider>
      <ChatInputProvider>
        <TabLayoutContent />
      </ChatInputProvider>
    </NavbarProvider>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    position: "absolute",
    left: 20,
    zIndex: 100,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
