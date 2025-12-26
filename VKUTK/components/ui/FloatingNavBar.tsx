import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavbar } from "@/contexts/NavbarContext";

export function FloatingNavBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isNavbarVisible } = useNavbar();

  if (!isNavbarVisible) return null;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 100 }]}>
      <BlurView
        intensity={isDark ? 60 : 90}
        tint={isDark ? "dark" : "light"}
        style={styles.blurContainer}
      >
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
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused && {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
              activeOpacity={0.7}
            >
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused
                  ? isDark
                    ? "#FFFFFF"
                    : "#000000"
                  : isDark
                  ? "#9CA3AF"
                  : "#6B7280",
                size: 20,
              })}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 15,
    width: 50,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  blurContainer: {
    paddingVertical: 10,
    alignItems: "center",
    gap: 8,
  },
  tabItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
