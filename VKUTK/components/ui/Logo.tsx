import React from "react";
import { Image, StyleSheet, View, ViewStyle, ImageStyle } from "react-native";

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ size = 120, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require("../../assets/images/logo.png")}
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    // Add shadow/elevation if needed, but usually the image handles it or the parent container
  },
  image: {
    // dimensions handled via props
  },
});
