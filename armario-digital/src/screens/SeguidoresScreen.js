import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TopBar, EmptyState } from "../components/UI";
import { Fila, BotonRedondo, BotonSeguirDeVuelta, usePerfiles, useAcciones } from "../components/PersonaRow";
import { seguir } from "../services/friendsService";
import { useTheme, useStyles } from "../theme";

// Lista de a quién sigues ("siguiendo") o de quién te sigue ("seguidores"), con buscador
export default function SeguidoresScreen({ tipo, relaciones, miUid, onAbrirPerfil, onBack }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const perfilDe = usePerfiles(relaciones);
  const { ocupado, ejecutar, pedirDejarDeSeguir, pedirCancelarSolicitud, pedirQuitarSeguidor } = useAcciones(miUid);
  const [busqueda, setBusqueda] = useState("");

  const esSiguiendo = tipo === "siguiendo";
  const completa = relaciones
    .filter((r) => (esSiguiendo ? r.yoSigo === "accepted" : r.meSigue === "accepted"))
    .sort((a, b) => (esSiguiendo ? b.fechaYoSigo - a.fechaYoSigo : b.fechaMeSigue - a.fechaMeSigue));

  const texto = busqueda.trim().toLowerCase();
  const lista = texto
    ? completa.filter((r) => {
        const p = perfilDe(r.otroUid);
        return p.alias.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto);
      })
    : completa;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
      <TopBar title={esSiguiendo ? "Siguiendo" : "Seguidores"} onBack={onBack} />

      {completa.length > 0 && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.inkFaint} />
          <TextInput
            value={busqueda} onChangeText={setBusqueda} autoCapitalize="none" autoCorrect={false}
            placeholder={esSiguiendo ? "Buscar entre quienes sigues..." : "Buscar entre tus seguidores..."}
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
        {lista.map((r) => {
          const p = perfilDe(r.otroUid);
          const mutuo = r.yoSigo === "accepted" && r.meSigue === "accepted";
          return (
            <Fila key={r.otroUid} perfil={p} extra={mutuo ? "os seguís" : undefined} onPress={() => onAbrirPerfil(p)}>
              {esSiguiendo ? (
                <BotonRedondo icon="person-remove-outline" disabled={ocupado === p.id} onPress={() => pedirDejarDeSeguir(p)} />
              ) : (
                <>
                  {!r.yoSigo && <BotonSeguirDeVuelta disabled={ocupado === p.id} onPress={() => ejecutar(p.id, () => seguir(miUid, p.id))} />}
                  {r.yoSigo === "pending" && <BotonRedondo icon="time-outline" disabled={ocupado === p.id} onPress={() => pedirCancelarSolicitud(p)} />}
                  <BotonRedondo icon="close" disabled={ocupado === p.id} onPress={() => pedirQuitarSeguidor(p)} />
                </>
              )}
            </Fila>
          );
        })}
        {lista.length === 0 && (
          texto ? (
            <EmptyState icon="search-outline" text="Nadie coincide con esa búsqueda." />
          ) : (
            <EmptyState
              icon={esSiguiendo ? "people-outline" : "person-outline"}
              text={esSiguiendo ? "Todavía no sigues a nadie. Busca personas desde Amigos." : "Todavía no te sigue nadie."}
            />
          )
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, marginBottom: 18 },
  searchInput: { flex: 1, fontSize: 14, color: c.ink, paddingVertical: 11, fontFamily: "Inter_400Regular" },
});
