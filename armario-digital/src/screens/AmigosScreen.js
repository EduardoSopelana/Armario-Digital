import React, { useEffect, useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import Swatches from "../components/Swatches";
import { TopBar, Pill, EmptyState, Sheet } from "../components/UI";
import { searchUsers, getUsersByIds } from "../services/friendsService";
import { useTheme, useStyles } from "../theme";

export default function AmigosScreen({ amigos, onToggleAmigo, onBack }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [vista, setVista] = useState("mios");
  const [search, setSearch] = useState("");
  const [lista, setLista] = useState([]);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    let vivo = true;
    const carga = vista === "mios" ? getUsersByIds(amigos) : searchUsers(search);
    carga.then((r) => { if (vivo) setLista(r); });
    return () => { vivo = false; };
  }, [vista, search, amigos]);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
      <TopBar title="Amigos" onBack={onBack} />

      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <Pill active={vista === "mios"} onPress={() => setVista("mios")}>Mis amigos ({amigos.length})</Pill>
        <Pill active={vista === "buscar"} onPress={() => setVista("buscar")}>Buscar</Pill>
      </View>

      {vista === "buscar" && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.inkFaint} />
          <TextInput
            value={search} onChangeText={setSearch} placeholder="Buscar por alias o nombre..." autoCapitalize="none"
            placeholderTextColor={colors.inkFaint} style={styles.searchInput}
          />
        </View>
      )}

      <View style={{ gap: 10 }}>
        {lista.map((f) => {
          const esAmigo = amigos.includes(f.id);
          return (
            <View key={f.id} style={styles.row}>
              <TouchableOpacity onPress={() => setAbierto(f)} style={styles.rowMain}>
                <View style={styles.avatar}><Ionicons name="person" size={18} color={colors.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nombre}>{f.nombre}</Text>
                  <Text style={styles.alias}>@{f.alias}{f.privado ? " · perfil privado" : ""}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onToggleAmigo(f.id)}
                style={[styles.actionBtn, esAmigo ? { backgroundColor: colors.bg, borderColor: colors.line } : { backgroundColor: colors.accent, borderColor: colors.accent }]}
              >
                <Ionicons name={esAmigo ? "person-remove-outline" : "person-add-outline"} size={15} color={esAmigo ? colors.inkSoft : colors.onAccent} />
              </TouchableOpacity>
            </View>
          );
        })}
        {lista.length === 0 && (
          <EmptyState icon="people-outline" text={vista === "mios" ? "Todavía no has añadido amigos." : "No hay resultados para esa búsqueda."} />
        )}
      </View>

      {abierto && (
        <Sheet title={`@${abierto.alias}`} onClose={() => setAbierto(null)}>
          <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 18 }}>{abierto.nombre}</Text>
          {abierto.privado ? (
            <EmptyState icon="lock-closed-outline" text="Este perfil es privado. Solo sus amigos aceptados pueden ver sus conjuntos." />
          ) : abierto.looks.length === 0 ? (
            <EmptyState icon="sparkles-outline" text="Todavía no ha compartido ningún conjunto." />
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
              {abierto.looks.map((look, i) => (
                <View key={i} style={{ width: "47%" }}>
                  <Swatches colores={look.colores} />
                  <Text style={styles.lookNombre}>{look.nombre}</Text>
                  <Text style={styles.lookSub}>{look.estacion}</Text>
                </View>
              ))}
            </View>
          )}
        </Sheet>
      )}
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, color: c.ink, paddingVertical: 10, fontFamily: "Inter_400Regular" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" },
  nombre: { fontSize: 14, fontWeight: "500", color: c.ink },
  alias: { fontSize: 12.5, color: c.inkSoft, marginTop: 1 },
  actionBtn: { width: 34, height: 34, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  lookNombre: { marginTop: 6, fontSize: 12.5, fontWeight: "500", color: c.ink },
  lookSub: { fontSize: 11.5, color: c.inkSoft },
});
