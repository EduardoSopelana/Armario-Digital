import React from "react";
import { TouchableOpacity, View, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "./Text";
import { HeartButton } from "./UI";
import { useTheme, useStyles } from "../theme";
import { resolverFoto } from "../images";

export default function OutfitThumb({ conjunto, prendas, onPress, onToggleFavorito, style }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const items = conjunto.prendaIds.map((id) => prendas.find((p) => p.id === id)).filter(Boolean);
  return (
    <View style={style}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.grid}>
          {items.length === 0 ? (
            <View style={styles.placeholderCell}>
              <Ionicons name="shirt-outline" size={24} color={colors.gold} />
            </View>
          ) : (
            items.slice(0, 4).map((p) => (
              <View key={p.id} style={styles.cell}>
                {p.foto ? (
                  <Image source={{ uri: resolverFoto(p.foto) }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholderCell}><Ionicons name="shirt-outline" size={18} color={colors.gold} /></View>
                )}
              </View>
            ))
          )}
          {onToggleFavorito && <HeartButton favorito={conjunto.favorito} onPress={() => onToggleFavorito(conjunto.id)} />}
        </View>
        <Text style={styles.nombre}>{conjunto.nombre}</Text>
        <Text style={styles.sub}>{conjunto.estacion}</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  grid: { width: "100%", aspectRatio: 1, borderRadius: 14, overflow: "hidden", backgroundColor: c.goldSoft, flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "50%", height: "50%" },
  placeholderCell: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  nombre: { marginTop: 8, fontSize: 13.5, fontWeight: "500", color: c.ink },
  sub: { marginTop: 1, fontSize: 12, color: c.inkSoft },
});
