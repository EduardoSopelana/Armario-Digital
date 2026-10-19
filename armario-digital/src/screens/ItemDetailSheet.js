import React from "react";
import { View, StyleSheet } from "react-native";
import Text from "../components/Text";
import { Sheet, GhostButton, HeartButton } from "../components/UI";
import FotoZoom from "../components/FotoZoom";
import { CAT_LABEL, COLOR_HEX } from "../constants";
import { useTheme, useStyles } from "../theme";

// Se muestra solo cuando hay una prenda abierta (App.js lo monta/desmonta).
export default function ItemDetailSheet({ prenda, onClose, onEdit, onDelete, onToggleFavorito }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <Sheet title="Detalle de la prenda" onClose={onClose}>
      <View style={{ width: 180, alignSelf: "center", marginBottom: 16 }}>
        <FotoZoom uri={prenda.foto} ratio={1} radius={18} />
        <HeartButton favorito={prenda.favorito} onPress={() => onToggleFavorito(prenda.id)} size={34} iconSize={17} />
      </View>
      <Text style={styles.nombre}>{prenda.nombre}</Text>
      <Text style={styles.sub}>{prenda.tipo} · {CAT_LABEL[prenda.categoria]}</Text>

      <View style={styles.tagsRow}>
        <View style={styles.tag}>
          <View style={[styles.dot, { backgroundColor: COLOR_HEX[prenda.color] }]} />
          <Text style={styles.tagText}>{prenda.color}</Text>
        </View>
        {prenda.estaciones.map((e) => (
          <View key={e} style={styles.tag}><Text style={styles.tagText}>{e}</Text></View>
        ))}
      </View>

      {!!prenda.descripcion && <Text style={styles.desc}>{prenda.descripcion}</Text>}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <GhostButton onPress={onEdit} icon="create-outline" style={{ flex: 1 }}>Editar</GhostButton>
        <GhostButton onPress={onDelete} icon="trash-outline" iconColor={colors.danger} textStyle={{ color: colors.danger }} style={{ flex: 1, borderColor: colors.dangerSoft }}>Eliminar</GhostButton>
      </View>
    </Sheet>
  );
}

const createStyles = (c) => StyleSheet.create({
  nombre: { fontSize: 20, fontWeight: "500", color: c.ink, textAlign: "center", fontFamily: "display" },
  sub: { textAlign: "center", color: c.inkSoft, fontSize: 13.5, marginTop: 2, marginBottom: 18 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 18 },
  tag: { flexDirection: "row", alignItems: "center", backgroundColor: c.accentSofter, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  tagText: { fontSize: 12.5, color: c.accent, fontWeight: "500" },
  dot: { width: 10, height: 10, borderRadius: 999, marginRight: 6, borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" },
  desc: { fontSize: 13.5, color: c.inkSoft, lineHeight: 20, textAlign: "center", marginBottom: 18 },
});
