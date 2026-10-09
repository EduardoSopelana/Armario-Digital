import React from "react";
import { View } from "react-native";

// Representa un look de ejemplo (amigos / inspiración) con bloques de color
export default function Swatches({ colores, size = "100%", radius = 12 }) {
  return (
    <View style={{ width: size, aspectRatio: 1, borderRadius: radius, overflow: "hidden", flexDirection: "row", flexWrap: "wrap" }}>
      {colores.map((hex, i) => (
        <View key={i} style={{ width: colores.length > 1 ? "50%" : "100%", height: colores.length > 2 ? "50%" : "100%", backgroundColor: hex }} />
      ))}
    </View>
  );
}
