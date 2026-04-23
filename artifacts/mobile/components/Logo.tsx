import React from "react";
import { Image, ImageStyle, StyleProp, View, ViewStyle } from "react-native";

const LOGO = require("@/assets/images/truegigs-logo.webp");

export function Logo({
  size = 56,
  rounded = true,
  style,
}: {
  size?: number;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const radius = rounded ? size * 0.22 : 0;
  const wrap: StyleProp<ViewStyle> = [
    {
      width: size,
      height: size,
      borderRadius: radius,
      overflow: "hidden",
      backgroundColor: "#0b1f3a",
    },
    style,
  ];
  const img: StyleProp<ImageStyle> = {
    width: "100%",
    height: "100%",
  };
  return (
    <View style={wrap}>
      <Image source={LOGO} style={img} resizeMode="cover" />
    </View>
  );
}

export default Logo;
