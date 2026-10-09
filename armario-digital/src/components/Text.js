import React from "react";
import { Text as RNText, StyleSheet } from "react-native";
import { useTheme } from "../theme";

// Envoltorio de <Text> que aplica las tipografías y el color por defecto del tema:
//  - Inter para el texto normal (según fontWeight 400 / 500 / 600)
//  - Fraunces para titulares (se activa con fontFamily: "display" en el estilo)
const INTER = {
  "400": "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
};

export default function Text({ style, ...props }) {
  const { colors } = useTheme();
  const { fontWeight, fontFamily, ...rest } = StyleSheet.flatten(style) || {};
  const w = String(fontWeight || "400");
  const bold = w === "700" || w === "bold";
  let family;
  if (fontFamily === "display") {
    family = w === "600" || bold ? "Fraunces_600SemiBold" : "Fraunces_500Medium";
  } else if (bold) {
    family = INTER["600"];
  } else {
    family = INTER[w] || INTER["400"];
  }
  return <RNText {...props} style={[{ color: colors.ink }, rest, { fontFamily: family }]} />;
}
