import React from "react";
import { View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resolverFoto } from "../images";
import { useTheme } from "../theme";

// Círculo con la foto de perfil, o un icono si no tiene
export default function Avatar({ foto, size = 40 }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {foto
        ? <Image source={{ uri: resolverFoto(foto) }} style={{ width: "100%", height: "100%" }} />
        : <Ionicons name="person" size={size * 0.45} color={colors.accent} />}
    </View>
  );
}
