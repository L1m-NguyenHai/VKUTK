import { Tabs } from "expo-router";
import React from "react";
import { CustomTabBar } from "@/components/ui/CustomTabBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Ionicons } from "@expo/vector-icons";
import { ChatInputProvider } from "@/contexts/ChatInputContext";

export default function TabLayout() {
  return (
    <ChatInputProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Student Info",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={24} name="person.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="chatbubble" size={28} color={color} />
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
      </Tabs>
    </ChatInputProvider>
  );
}
