import React from "react";
import { View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { resolverFoto } from "../images";

export default function Foto({ uri, ratio = 4 / 5, radius = 14, style }) {
  const { colors } = useTheme();
  return (
    <View style={[{ width: "100%", aspectRatio: ratio, borderRadius: radius, overflow: "hidden", backgroundColor: colors.goldSoft }, style]}>
      {uri ? (
        <Image source={{ uri: resolverFoto(uri) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="shirt-outline" size={28} color={colors.gold} />
        </View>
      )}
    </View>
  );
}
