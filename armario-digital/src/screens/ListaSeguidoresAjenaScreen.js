import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import { TopBar, EmptyState } from "../components/UI";
import { Fila, BotonRedondo, BotonSeguirDeVuelta, usePerfiles, useAcciones } from "../components/PersonaRow";
import { seguir } from "../services/friendsService";
import { useTheme, useStyles } from "../theme";

// Seguidores o seguidos de OTRA persona (solo disponible si hay seguimiento mutuo con ella).
// lista: [{ otroUid }]  ·  relaciones: mis relaciones, para saber a cuáles sigo yo
export default function ListaSeguidoresAjenaScreen({ perfil, tipo, lista, relaciones, miUid, onAbrirPerfil, onBack }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const perfilDe = usePerfiles(lista);
  const { ocupado, ejecutar, pedirCancelarSolicitud } = useAcciones(miUid);
  const [busqueda, setBusqueda] = useState("");

  const esSeguidores = tipo === "seguidores";
  const relacionCon = (uid) => relaciones.find((r) => r.otroUid === uid) || null;

  const texto = busqueda.trim().toLowerCase();
  const visibles = [...lista]
    .sort((a, b) => b.fecha - a.fecha)
    .filter((r) => {
      if (!texto) return true;
      const p = perfilDe(r.otroUid);
      return p.alias.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto);
    });

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
      <TopBar title={esSeguidores ? "Seguidores" : "Siguiendo"} onBack={onBack} />
      <Text style={styles.sub}>{esSeguidores ? `Quién sigue a @${perfil.alias}` : `A quién sigue @${perfil.alias}`}</Text>

      {lista.length > 0 && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.inkFaint} />
          <TextInput
            value={busqueda} onChangeText={setBusqueda} autoCapitalize="none" autoCorrect={false}
            placeholder={esSeguidores ? "Buscar entre sus seguidores..." : "Buscar entre quienes sigue..."}
            placeholderTextColor={colors.inkFaint} style={styles.searchInput}
          />
          {!!busqueda && (
            <TouchableOpacity onPress={() => setBusqueda("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.inkFaint} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ gap: 10 }}>
        {visibles.map((r) => {
          const p = perfilDe(r.otroUid);
          const esYo = r.otroUid === miUid;
          const rel = relacionCon(r.otroUid);
          return (
            <Fila
              key={r.otroUid} perfil={p}
              extra={esYo ? "tú" : rel?.yoSigo === "accepted" ? "la sigues" : rel?.meSigue === "accepted" ? "te sigue" : undefined}
              onPress={esYo ? undefined : () => onAbrirPerfil(p)}
            >
              {!esYo && !rel?.yoSigo && (
                rel?.meSigue === "accepted"
                  ? <BotonSeguirDeVuelta disabled={ocupado === p.id} onPress={() => ejecutar(p.id, () => seguir(miUid, p.id))} />
                  : <BotonRedondo icon="person-add-outline" relleno disabled={ocupado === p.id} onPress={() => ejecutar(p.id, () => seguir(miUid, p.id))} />
              )}
              {!esYo && rel?.yoSigo === "pending" && (
                <BotonRedondo icon="time-outline" disabled={ocupado === p.id} onPress={() => pedirCancelarSolicitud(p)} />
              )}
              {!esYo && rel?.yoSigo === "accepted" && <BotonRedondo icon="checkmark" onPress={() => onAbrirPerfil(p)} />}
            </Fila>
          );
        })}
        {visibles.length === 0 && (
          texto
            ? <EmptyState icon="search-outline" text="Nadie coincide con esa búsqueda." />
            : <EmptyState icon="people-outline" text={esSeguidores ? "Todavía no tiene seguidores." : "Todavía no sigue a nadie."} />
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  sub: { color: c.inkSoft, fontSize: 13.5, marginBottom: 14, marginTop: -4 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, marginBottom: 18 },
  searchInput: { flex: 1, fontSize: 14, color: c.ink, paddingVertical: 11, fontFamily: "Inter_400Regular" },
});
