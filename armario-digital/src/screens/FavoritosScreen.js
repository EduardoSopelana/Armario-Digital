import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import Text from "../components/Text";
import { TopBar, EmptyState } from "../components/UI";
import ItemCard from "../components/ItemCard";
import OutfitThumb from "../components/OutfitThumb";
import { useStyles } from "../theme";

export default function FavoritosScreen({ prendas, conjuntos, onBack, onOpenPrenda, onOpenConjunto, onToggleFavoritoPrenda, onToggleFavoritoConjunto }) {
  const styles = useStyles(createStyles);
  const prendasFav = prendas.filter((p) => p.favorito);
  const conjuntosFav = conjuntos.filter((c) => c.favorito);
  const vacio = prendasFav.length === 0 && conjuntosFav.length === 0;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
      <TopBar title="Favoritos" onBack={onBack} />
      {vacio ? (
        <EmptyState icon="heart-outline" text="Todavía no has marcado ninguna prenda ni conjunto como favorito." />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Prendas favoritas</Text>
          {prendasFav.length === 0 ? (
            <Text style={styles.emptySmall}>No tienes prendas favoritas todavía.</Text>
          ) : (
            <View style={styles.grid}>
              {prendasFav.map((p) => (
                <View key={p.id} style={{ width: "47%" }}>
                  <ItemCard prenda={p} onPress={() => onOpenPrenda(p)} onToggleFavorito={onToggleFavoritoPrenda} />
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Conjuntos favoritos</Text>
          {conjuntosFav.length === 0 ? (
            <Text style={styles.emptySmall}>No tienes conjuntos favoritos todavía.</Text>
          ) : (
            <View style={styles.grid}>
              {conjuntosFav.map((c) => (
                <View key={c.id} style={{ width: "47%" }}>
                  <OutfitThumb conjunto={c} prendas={prendas} onPress={() => onOpenConjunto(c)} onToggleFavorito={onToggleFavoritoConjunto} />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: "500", color: c.ink, marginBottom: 12, marginTop: 6, fontFamily: "display" },
  emptySmall: { fontSize: 13, color: c.inkSoft, marginBottom: 26 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, rowGap: 20, marginBottom: 28 },
});
