import React, { useEffect, useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import { TopBar, EmptyState, FieldLabel } from "../components/UI";
import { Fila, BotonRedondo, BotonSeguirDeVuelta, usePerfiles, useAcciones } from "../components/PersonaRow";
import { normalizarAlias } from "../services/authService";
import { buscarUsuarios, seguir, aceptarSeguidor, quitarSeguidor } from "../services/friendsService";
import { useTheme, useStyles } from "../theme";

// Pantalla de Amigos: arriba el buscador y debajo un feed con las solicitudes recibidas,
// los seguidores más recientes y las solicitudes que has enviado.
// relaciones: [{ otroUid, yoSigo, meSigue, fechaMeSigue }]  ·  onAbrirPerfil(perfil): perfil a pantalla completa
export default function AmigosScreen({ relaciones, miUid, onAbrirPerfil, onBack }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const perfilDe = usePerfiles(relaciones);
  const { ocupado, ejecutar, pedirCancelarSolicitud } = useAcciones(miUid);

  const [search, setSearch] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const texto = normalizarAlias(search);
  const modoBusqueda = texto.length >= 2;

  // Búsqueda por alias (con una pequeña espera mientras se escribe)
  useEffect(() => {
    if (!modoBusqueda) { setResultados([]); setBuscando(false); return; }
    let vivo = true;
    setBuscando(true);
    const espera = setTimeout(async () => {
      try {
        const lista = await buscarUsuarios(texto, miUid);
        if (vivo) setResultados(lista);
      } catch (e) {
        if (vivo) { setResultados([]); Alert.alert("No se pudo buscar", e.message); }
      } finally {
        if (vivo) setBuscando(false);
      }
    }, 350);
    return () => { vivo = false; clearTimeout(espera); };
  }, [texto]);

  const masReciente = (a, b) => b.fechaMeSigue - a.fechaMeSigue;
  const recibidas = relaciones.filter((r) => r.meSigue === "pending").sort(masReciente);
  const nuevos = relaciones.filter((r) => r.meSigue === "accepted").sort(masReciente).slice(0, 10);
  const enviadas = relaciones.filter((r) => r.yoSigo === "pending");
  const relacionCon = (uid) => relaciones.find((r) => r.otroUid === uid) || null;

  const seguirA = (p) => ejecutar(p.id, () => seguir(miUid, p.id));
  const feedVacio = recibidas.length === 0 && nuevos.length === 0 && enviadas.length === 0;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
      <TopBar title="Amigos" onBack={onBack} />

      {/* ----- Buscador ----- */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.inkFaint} />
        <TextInput
          value={search} onChangeText={setSearch} placeholder="Buscar personas por alias..."
          autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.inkFaint} style={styles.searchInput}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.inkFaint} />
          </TouchableOpacity>
        )}
      </View>

      {/* ----- Resultados de la búsqueda ----- */}
      {modoBusqueda && (
        buscando ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
        ) : (
          <View style={{ gap: 10 }}>
            {resultados.map((p) => {
              const rel = relacionCon(p.id);
              return (
                <Fila key={p.id} perfil={p} extra={rel?.meSigue === "accepted" ? "te sigue" : undefined} onPress={() => onAbrirPerfil(p)}>
                  {!rel?.yoSigo && (rel?.meSigue === "accepted"
                    ? <BotonSeguirDeVuelta disabled={ocupado === p.id} onPress={() => seguirA(p)} />
                    : <BotonRedondo icon="person-add-outline" relleno disabled={ocupado === p.id} onPress={() => seguirA(p)} />)}
                  {rel?.yoSigo === "pending" && (
                    <BotonRedondo icon="time-outline" disabled={ocupado === p.id} onPress={() => pedirCancelarSolicitud(p)} />
                  )}
                  {rel?.yoSigo === "accepted" && <BotonRedondo icon="checkmark" onPress={() => onAbrirPerfil(p)} />}
                </Fila>
              );
            })}
            {resultados.length === 0 && <EmptyState icon="search-outline" text="No hay ningún usuario con ese alias." />}
          </View>
        )
      )}

      {texto.length === 1 && <Text style={styles.nota}>Escribe al menos 2 letras del alias.</Text>}

      {/* ----- Feed (cuando no se está buscando) ----- */}
      {!modoBusqueda && (
        <View>
          {recibidas.length > 0 && (
            <View style={{ marginBottom: 22 }}>
              <FieldLabel>Solicitudes ({recibidas.length})</FieldLabel>
              <View style={{ gap: 10 }}>
                {recibidas.map((r) => {
                  const p = perfilDe(r.otroUid);
                  return (
                    <Fila key={r.otroUid} perfil={p} extra="quiere seguirte" onPress={() => onAbrirPerfil(p)}>
                      <BotonRedondo icon="checkmark" relleno disabled={ocupado === p.id} onPress={() => ejecutar(p.id, () => aceptarSeguidor(miUid, p.id))} />
                      <BotonRedondo icon="close" disabled={ocupado === p.id} onPress={() => ejecutar(p.id, () => quitarSeguidor(miUid, p.id))} />
                    </Fila>
                  );
                })}
              </View>
            </View>
          )}

          {nuevos.length > 0 && (
            <View style={{ marginBottom: 22 }}>
              <FieldLabel>Nuevos seguidores</FieldLabel>
              <View style={{ gap: 10 }}>
                {nuevos.map((r) => {
                  const p = perfilDe(r.otroUid);
                  return (
                    <Fila key={r.otroUid} perfil={p} extra={r.yoSigo === "accepted" ? "os seguís" : undefined} onPress={() => onAbrirPerfil(p)}>
                      {!r.yoSigo && <BotonSeguirDeVuelta disabled={ocupado === p.id} onPress={() => seguirA(p)} />}
                      {r.yoSigo === "pending" && (
                        <BotonRedondo icon="time-outline" disabled={ocupado === p.id} onPress={() => pedirCancelarSolicitud(p)} />
                      )}
                    </Fila>
                  );
                })}
              </View>
            </View>
          )}

          {enviadas.length > 0 && (
            <View style={{ marginBottom: 22 }}>
              <FieldLabel>Solicitudes enviadas</FieldLabel>
              <View style={{ gap: 10 }}>
                {enviadas.map((r) => {
                  const p = perfilDe(r.otroUid);
                  return (
                    <Fila key={r.otroUid} perfil={p} extra="pendiente" onPress={() => onAbrirPerfil(p)}>
                      <BotonRedondo icon="close" disabled={ocupado === p.id} onPress={() => pedirCancelarSolicitud(p)} />
                    </Fila>
                  );
                })}
              </View>
            </View>
          )}

          {feedVacio && (
            <EmptyState icon="people-outline" text="Busca a alguien por su alias para empezar a seguirle. Aquí aparecerán tus solicitudes y tus nuevos seguidores." />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, marginBottom: 18 },
  searchInput: { flex: 1, fontSize: 14, color: c.ink, paddingVertical: 11, fontFamily: "Inter_400Regular" },
  nota: { fontSize: 13, color: c.inkSoft, lineHeight: 19 },
});
