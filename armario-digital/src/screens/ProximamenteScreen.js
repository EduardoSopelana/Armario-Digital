import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import { TopBar } from "../components/UI";
import { COLORS } from "../theme";

// Pantalla provisional para secciones que llegan en la siguiente fase.
export default function ProximamenteScreen({ title, text, onBack }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <TopBar title={title} onBack={onBack} />
      <View style={styles.box}>
        <Ionicons name="construct-outline" size={26} color={COLORS.inkFaint} style={{ marginBottom: 10 }} />
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: COLORS.line, borderStyle: "dashed", borderRadius: 16, padding: 34, alignItems: "center", marginTop: 20 },
  text: { color: COLORS.inkSoft, fontSize: 14, textAlign: "center", lineHeight: 20 },
});
