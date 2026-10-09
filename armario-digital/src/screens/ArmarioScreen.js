import React, { useEffect, useMemo, useState } from "react";
import { View, TextInput, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import { TopBar, Pill, EmptyState, Sheet, GhostButton, PrimaryButton, RoundAddButton } from "../components/UI";
import ItemCard from "../components/ItemCard";
import { CATEGORIAS, TIPOS_POR_CATEGORIA, TODOS_LOS_TIPOS, ESTACIONES, COLORES } from "../constants";
import { useTheme, useStyles } from "../theme";

export default function ArmarioScreen({ prendas, onOpenPrenda, onAddPrenda, onToggleFavorito, categoriaInicial = null, onCategoriaConsumida }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { width } = useWindowDimensions();
  const itemWidth = (width - 40 - 16) / 2; // 20 de margen a cada lado + 16 de hueco entre columnas

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [fCategoria, setFCategoria] = useState(categoriaInicial);
  const [fTipo, setFTipo] = useState(null);
  const [fEstacion, setFEstacion] = useState(null);
  const [fColor, setFColor] = useState(null);
  const [fFavoritos, setFFavoritos] = useState(false);

  // Si llegamos desde Perfil > Prendas por categoría, la categoría ya viene aplicada
  useEffect(() => {
    if (categoriaInicial && onCategoriaConsumida) onCategoriaConsumida();
  }, []);

  const tiposFiltro = fCategoria ? TIPOS_POR_CATEGORIA[fCategoria] : TODOS_LOS_TIPOS;

  const filtradas = useMemo(() => {
    return prendas.filter((p) => {
      if (search && !p.nombre.toLowerCase().includes(search.toLowerCase()) && !p.tipo.toLowerCase().includes(search.toLowerCase())) return false;
      if (fCategoria && p.categoria !== fCategoria) return false;
      if (fTipo && p.tipo !== fTipo) return false;
      if (fEstacion && !p.estaciones.includes(fEstacion)) return false;
      if (fColor && p.color !== fColor) return false;
      if (fFavoritos && !p.favorito) return false;
      return true;
    });
  }, [prendas, search, fCategoria, fTipo, fEstacion, fColor, fFavoritos]);

  const activos = [fCategoria, fTipo, fEstacion, fColor, fFavoritos ? "fav" : null].filter(Boolean).length;

  const cambiarCategoria = (cat) => {
    setFCategoria(fCategoria === cat ? null : cat);
    setFTipo(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TopBar title="Mis prendas" right={<RoundAddButton onPress={onAddPrenda} />} />
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.inkFaint} />
            <TextInput
              value={search} onChangeText={setSearch} placeholder="Buscar prenda..."
              style={styles.searchInput} placeholderTextColor={colors.inkFaint}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={[styles.filterBtn, activos > 0 && { borderColor: colors.accent, backgroundColor: colors.accentSofter }]}
          >
            <Ionicons name="options-outline" size={18} color={activos > 0 ? colors.accent : colors.inkSoft} />
            {activos > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{activos}</Text></View>}
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={[{ id: null, label: "Todas" }, ...CATEGORIAS]}
          keyExtractor={(item) => item.id || "todas"}
          renderItem={({ item }) => (
            <Pill active={fCategoria === item.id} onPress={() => cambiarCategoria(item.id)}>
              {item.label}
            </Pill>
          )}
          contentContainerStyle={{ paddingBottom: 6 }}
        />
        <Text style={styles.resultCount}>{filtradas.length} {filtradas.length === 1 ? "prenda" : "prendas"}</Text>
      </View>

      <FlatList
        data={filtradas}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, gap: 16 }}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth }}>
            <ItemCard prenda={item} onPress={() => onOpenPrenda(item)} onToggleFavorito={onToggleFavorito} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            text={prendas.length === 0 ? "Tu armario está vacío. Añade tu primera prenda." : "No hay prendas con estos filtros."}
            cta={prendas.length === 0 ? "Añadir prenda" : null}
            onPress={onAddPrenda}
          />
        }
      />

      <Sheet visible={showFilters} title="Filtros" onClose={() => setShowFilters(false)}>
        <Text style={styles.label}>Categoría</Text>
        <View style={styles.wrapRow}>
          {CATEGORIAS.map((c) => (
            <Pill key={c.id} active={fCategoria === c.id} onPress={() => cambiarCategoria(c.id)} style={{ marginBottom: 8 }}>{c.label}</Pill>
          ))}
        </View>
        <Text style={styles.label}>Tipo de prenda</Text>
        <View style={styles.wrapRow}>
          {tiposFiltro.map((t) => (
            <Pill key={t} active={fTipo === t} onPress={() => setFTipo(fTipo === t ? null : t)} style={{ marginBottom: 8 }}>{t}</Pill>
          ))}
        </View>
        <Text style={styles.label}>Estación</Text>
        <View style={styles.wrapRow}>
          {ESTACIONES.map(({ id }) => (
            <Pill key={id} active={fEstacion === id} onPress={() => setFEstacion(fEstacion === id ? null : id)} style={{ marginBottom: 8 }}>{id}</Pill>
          ))}
        </View>
        <Text style={styles.label}>Color</Text>
        <View style={styles.wrapRow}>
          {COLORES.map((c) => (
            <TouchableOpacity
              key={c.nombre} onPress={() => setFColor(fColor === c.nombre ? null : c.nombre)}
              style={[styles.swatch, { backgroundColor: c.hex, borderColor: fColor === c.nombre ? colors.accent : colors.line, borderWidth: fColor === c.nombre ? 2.5 : 1 }]}
            />
          ))}
        </View>
        <Pill active={fFavoritos} onPress={() => setFFavoritos((v) => !v)} style={{ marginBottom: 20, alignSelf: "flex-start" }}>♥ Favoritas</Pill>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <GhostButton onPress={() => { setFCategoria(null); setFTipo(null); setFEstacion(null); setFColor(null); setFFavoritos(false); }} style={{ flex: 1 }}>Limpiar</GhostButton>
          <PrimaryButton onPress={() => setShowFilters(false)} style={{ flex: 1 }}>Ver resultados</PrimaryButton>
        </View>
      </Sheet>
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  header: { paddingHorizontal: 20 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 14, color: c.ink, paddingVertical: 10, fontFamily: "Inter_400Regular" },
  filterBtn: { width: 42, borderWidth: 1, borderColor: c.line, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: -4, backgroundColor: c.accent, borderRadius: 999, width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  badgeText: { color: c.onAccent, fontSize: 10 },
  resultCount: { fontSize: 12.5, color: c.inkSoft, marginBottom: 4 },
  label: { fontSize: 12.5, fontWeight: "500", color: c.inkSoft, marginBottom: 8 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  swatch: { width: 30, height: 30, borderRadius: 999, marginRight: 10, marginBottom: 8 },
});
