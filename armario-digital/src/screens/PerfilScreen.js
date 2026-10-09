import React, { useState } from "react";
import { View, Image, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import { TopBar } from "../components/UI";
import { MenuRow, Card } from "../components/MenuRow";
import AmigosScreen from "./AmigosScreen";
import ConfigScreen from "./ConfigScreen";
import { CATEGORIAS } from "../constants";
import { resolverFoto } from "../images";
import { useTheme, useStyles } from "../theme";

// Menú de perfil con tres submenús: Prendas por categoría, Amigos y Configuración
export default function PerfilScreen({
  prendas, conjuntos, usuario, amigos,
  onVerCategoria, onToggleAmigo, onActualizarUsuario, onCerrarSesion, onReset,
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const [vista, setVista] = useState("menu");

  if (vista === "categorias") {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
        <TopBar title="Prendas por categoría" onBack={() => setVista("menu")} />
        <Text style={styles.help}>Toca una categoría para ver esas prendas en tu armario.</Text>
        <Card>
          {CATEGORIAS.map((c, i) => {
            const n = prendas.filter((p) => p.categoria === c.id).length;
            return (
              <MenuRow
                key={c.id} icon="shirt-outline" label={c.label}
                sub={`${n} ${n === 1 ? "prenda" : "prendas"}`}
                onPress={() => onVerCategoria(c.id)} last={i === CATEGORIAS.length - 1}
              />
            );
          })}
        </Card>
      </ScrollView>
    );
  }

  if (vista === "amigos") {
    return <AmigosScreen amigos={amigos} onToggleAmigo={onToggleAmigo} onBack={() => setVista("menu")} />;
  }

  if (vista === "config") {
    return (
      <ConfigScreen
        usuario={usuario} onActualizarUsuario={onActualizarUsuario}
        onCerrarSesion={onCerrarSesion} onReset={onReset} onBack={() => setVista("menu")}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
      <TopBar title="Perfil" />
      <View style={styles.header}>
        <View style={styles.avatar}>
          {usuario?.foto
            ? <Image source={{ uri: resolverFoto(usuario.foto) }} style={{ width: "100%", height: "100%" }} />
            : <Ionicons name="person" size={24} color={colors.accent} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nombre}>{usuario?.nombre || "Mi cuenta"}</Text>
          <Text style={styles.sub}>@{usuario?.alias} · {prendas.length} prendas · {conjuntos.length} conjuntos</Text>
        </View>
      </View>

      <Card>
        <MenuRow icon="grid-outline" label="Prendas por categoría" sub="Organiza y accede por tipo" onPress={() => setVista("categorias")} />
        <MenuRow icon="people-outline" label="Amigos" sub={`${amigos.length} ${amigos.length === 1 ? "amigo" : "amigos"} · buscar y ver conjuntos`} onPress={() => setVista("amigos")} />
        <MenuRow icon="settings-outline" label="Configuración" sub="Tema, privacidad, cuenta" onPress={() => setVista("config")} last />
      </Card>
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  help: { color: c.inkSoft, fontSize: 13.5, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 26 },
  avatar: { width: 56, height: 56, borderRadius: 999, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  nombre: { fontSize: 16, fontWeight: "500", color: c.ink },
  sub: { fontSize: 13, color: c.inkSoft, marginTop: 2 },
});
