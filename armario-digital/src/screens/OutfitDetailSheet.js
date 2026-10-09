import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import { Sheet, GhostButton } from "../components/UI";
import Foto from "../components/Foto";
import { CAT_LABEL } from "../constants";
import { useTheme, useStyles } from "../theme";

// Se muestra solo cuando hay un conjunto abierto (App.js lo monta/desmonta).
export default function OutfitDetailSheet({ conjunto, prendas, onClose, onEdit, onDelete, onToggleFavorito }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const items = conjunto.prendaIds.map((id) => prendas.find((p) => p.id === id)).filter(Boolean);

  return (
    <Sheet title={conjunto.nombre} onClose={onClose}>
      <View style={styles.subRow}>
        <Text style={[styles.sub, { flex: 1 }]}>{conjunto.estacion}{conjunto.descripcion ? ` · ${conjunto.descripcion}` : ""}</Text>
        <TouchableOpacity onPress={() => onToggleFavorito(conjunto.id)} hitSlop={10}>
          <Ionicons
            name={conjunto.favorito ? "heart" : "heart-outline"}
            size={22}
            color={conjunto.favorito ? colors.heart : colors.inkFaint}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {items.map((p) => (
          <View key={p.id} style={{ width: "47%" }}>
            <Foto uri={p.foto} />
            <Text style={styles.itemNombre}>{p.nombre}</Text>
            <Text style={styles.itemCat}>{CAT_LABEL[p.categoria]}</Text>
          </View>
        ))}
        {items.length === 0 && <Text style={styles.sub}>Las prendas de este conjunto ya no están disponibles.</Text>}
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <GhostButton onPress={onEdit} icon="create-outline" style={{ flex: 1 }}>Editar</GhostButton>
        <GhostButton onPress={onDelete} icon="trash-outline" iconColor={colors.danger} textStyle={{ color: colors.danger }} style={{ flex: 1, borderColor: colors.dangerSoft }}>Eliminar</GhostButton>
      </View>
    </Sheet>
  );
}

const createStyles = (c) => StyleSheet.create({
  subRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10 },
  sub: { color: c.inkSoft, fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, rowGap: 18, marginBottom: 18 },
  itemNombre: { marginTop: 6, fontSize: 12.5, fontWeight: "500", color: c.ink },
  itemCat: { fontSize: 11.5, color: c.inkSoft },
});
