import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TopBar } from "../components/UI";
import { COLORS } from "../theme";

// Pantalla provisional: cuenta, amigos, mensajes y configuración se añaden
// en la siguiente fase del proyecto.
export default function PerfilScreenStub() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <TopBar title="Perfil" />
      <View style={styles.box}>
        <Ionicons name="construct-outline" size={26} color={COLORS.inkFaint} style={{ marginBottom: 10 }} />
        <Text style={styles.text}>Esta sección (cuenta, amigos, mensajes y configuración) llega en la siguiente fase del proyecto.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: COLORS.line, borderStyle: "dashed", borderRadius: 16, padding: 34, alignItems: "center", marginTop: 20 },
  text: { color: COLORS.inkSoft, fontSize: 14, textAlign: "center", lineHeight: 20 },
});
