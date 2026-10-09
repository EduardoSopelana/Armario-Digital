import React, { useState } from "react";
import { View, FlatList, useWindowDimensions } from "react-native";
import { TopBar, Pill, EmptyState, RoundAddButton } from "../components/UI";
import OutfitThumb from "../components/OutfitThumb";

export default function ConjuntosScreen({ conjuntos, prendas, onOpen, onNuevo, onToggleFavorito }) {
  const { width } = useWindowDimensions();
  const itemWidth = (width - 40 - 16) / 2;

  const [fFavoritos, setFFavoritos] = useState(false);
  const visibles = fFavoritos ? conjuntos.filter((c) => c.favorito) : conjuntos;
  const ordenados = [...visibles].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <TopBar title="Conjuntos" right={<RoundAddButton onPress={onNuevo} />} />
        {conjuntos.length > 0 && (
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <Pill active={!fFavoritos} onPress={() => setFFavoritos(false)}>Todos</Pill>
            <Pill active={fFavoritos} onPress={() => setFFavoritos(true)}>♥ Favoritos</Pill>
          </View>
        )}
      </View>

      <FlatList
        data={ordenados}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, gap: 16 }}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth }}>
            <OutfitThumb conjunto={item} prendas={prendas} onPress={() => onOpen(item)} onToggleFavorito={onToggleFavorito} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            text={conjuntos.length === 0 ? "Todavía no tienes conjuntos guardados." : "No tienes conjuntos marcados como favoritos."}
            cta={conjuntos.length === 0 ? "Crear conjunto" : null}
            onPress={onNuevo}
            icon="sparkles-outline"
          />
        }
      />
    </View>
  );
}
