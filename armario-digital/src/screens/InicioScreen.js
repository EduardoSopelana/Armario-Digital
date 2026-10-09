import React from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import { PrimaryButton, GhostButton, EmptyState } from "../components/UI";
import OutfitThumb from "../components/OutfitThumb";
import { useTheme, useStyles } from "../theme";

export default function InicioScreen({
  prendas, conjuntos, onNav, onAddPrenda, onOpenConjunto, onToggleFavoritoConjunto,
  onAbrirFavoritos, onAbrirMensajes,
}) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const ultimos = [...conjuntos].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)).slice(0, 4);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi armario</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={onAbrirMensajes}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onAbrirFavoritos}>
            <Ionicons name="heart-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.subtitle}>Tu armario, siempre a mano.</Text>

      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => onNav("armario")}>
          <Text style={styles.statNum}>{prendas.length}</Text>
          <Text style={styles.statLabel}>Prendas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => onNav("conjuntos")}>
          <Text style={styles.statNum}>{conjuntos.length}</Text>
          <Text style={styles.statLabel}>Conjuntos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <PrimaryButton onPress={onAddPrenda} icon="add" style={{ flex: 1 }}>Añadir prenda</PrimaryButton>
        <GhostButton onPress={() => onNav("crear")} icon="sparkles-outline" style={{ flex: 1 }}>Nuevo conjunto</GhostButton>
      </View>

      <Text style={styles.sectionTitle}>Últimos conjuntos</Text>
      {ultimos.length === 0 ? (
        <EmptyState text="Aún no has creado ningún conjunto." cta="Crear el primero" onPress={() => onNav("crear")} icon="sparkles-outline" />
      ) : (
        <View style={styles.outfitsRow}>
          {ultimos.map((c) => (
            <View key={c.id} style={{ width: "47%" }}>
              <OutfitThumb conjunto={c} prendas={prendas} onPress={() => onOpenConjunto(c)} onToggleFavorito={onToggleFavoritoConjunto} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 140 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12 },
  title: { fontSize: 26, fontWeight: "500", color: c.ink, fontFamily: "display" },
  iconBtn: { width: 38, height: 38, borderRadius: 999, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  subtitle: { color: c.inkSoft, fontSize: 14.5, marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 26 },
  statCard: { flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 14 },
  statNum: { fontSize: 26, fontWeight: "500", color: c.accent, fontFamily: "display" },
  statLabel: { fontSize: 12.5, color: c.inkSoft, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "500", color: c.ink, marginBottom: 12, fontFamily: "display" },
  outfitsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, rowGap: 20 },
});
