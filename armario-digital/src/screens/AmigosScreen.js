import React, { useEffect, useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import { TopBar, EmptyState, FieldLabel, GhostButton } from "../components/UI";
import { Fila, BotonRedondo, BotonSeguirDeVuelta, usePerfiles, useAcciones } from "../components/PersonaRow";
import { normalizarAlias } from "../services/authService";
import { buscarUsuarios, seguir, aceptarSeguidor, quitarSeguidor } from "../services/friendsService";
import { sugerenciasDeContactos } from "../services/contactsService";
import { useTheme, useStyles } from "../theme";

// Pantalla de Amigos: arriba el buscador y debajo un feed con las solicitudes recibidas, las sugerencias
// de tus contactos, los seguidores más recientes y las solicitudes que has enviado.
// relaciones: [{ otroUid, yoSigo, meSigue, fechaMeSigue }]  ·  onAbrirPerfil(perfil): perfil a pantalla completa
export default function AmigosScreen({ relaciones, miUid, onAbrirPerfil, onBack }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const perfilDe = usePerfiles(relaciones);
  const { ocupado, ejecutar, pedirCancelarSolicitud } = useAcciones(miUid);

  const [search, setSearch] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // null = todavía no hay permiso para leer los contactos
  const [sugerencias, setSugerencias] = useState(null);
  const [cargandoSug, setCargandoSug] = useState(false);

  const texto = normalizarAlias(search);
  const modoBusqueda = texto.length >= 2;

  // Sugerencias de contactos. Al abrir la pantalla solo se cargan si el permiso ya estaba concedido.
  const cargarSugerencias = async ({ pedirPermiso, forzar }, silencioso) => {
    setCargandoSug(true);
    try {
      setSugerencias(await sugerenciasDeContactos(miUid, { pedirPermiso, forzar }));
    } catch (e) {
      if (!silencioso) Alert.alert("No se pudieron cargar las sugerencias", e.message);
    } finally {
      setCargandoSug(false);
    }
  };
  useEffect(() => { cargarSugerencias({ pedirPermiso: false, forzar: false }, true); }, []);

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

  // Solo se sugiere a quien aún no sigo ni he solicitado
  const sugeridos = (sugerencias || []).filter((s) => !relacionCon(s.perfil.id)?.yoSigo);

  const seguirA = (p) => ejecutar(p.id, () => seguir(miUid, p.id));
  const botonSeguir = (p, rel) =>
    rel?.meSigue === "accepted"
      ? <BotonSeguirDeVuelta disabled={ocupado === p.id} onPress={() => seguirA(p)} />
      : <BotonRedondo icon="person-add-outline" relleno disabled={ocupado === p.id} onPress={() => seguirA(p)} />;

  const feedVacio =
    recibidas.length === 0 && nuevos.length === 0 && enviadas.length === 0 && sugerencias !== null && sugeridos.length === 0;

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
                  {!rel?.yoSigo && botonSeguir(p, rel)}
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
            <View style={styles.seccion}>
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

          {/* Sugerencias de tus contactos */}
          {sugerencias === null ? (
            <View style={[styles.seccion, styles.tarjeta]}>
              <Text style={styles.tarjetaTitulo}>Encuentra a tus contactos</Text>
              <Text style={styles.nota}>
                Te sugerimos personas de tu agenda que ya usan la app. No se suben tus contactos ni sus nombres: solo se comparan huellas de los números.
              </Text>
              <GhostButton
                icon="people-circle-outline" style={{ marginTop: 12 }}
                onPress={() => cargarSugerencias({ pedirPermiso: true, forzar: true }, false)}
              >
                {cargandoSug ? "Buscando..." : "Buscar en mis contactos"}
              </GhostButton>
            </View>
          ) : (
            (sugeridos.length > 0 || cargandoSug) && (
              <View style={styles.seccion}>
                <View style={styles.cabeceraSeccion}>
                  <FieldLabel>Sugerencias de tus contactos</FieldLabel>
                  <TouchableOpacity onPress={() => cargarSugerencias({ pedirPermiso: true, forzar: true }, false)} hitSlop={8}>
                    <Text style={styles.enlace}>Actualizar</Text>
                  </TouchableOpacity>
                </View>
                {cargandoSug && sugeridos.length === 0 ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <View style={{ gap: 10 }}>
                    {sugeridos.map((s) => {
                      const rel = relacionCon(s.perfil.id);
                      return (
                        <Fila
                          key={s.perfil.id} perfil={s.perfil} onPress={() => onAbrirPerfil(s.perfil)}
                          extra={s.contacto ? `${s.contacto} · en tus contactos` : "en tus contactos"}
                        >
                          {botonSeguir(s.perfil, rel)}
                        </Fila>
                      );
                    })}
                  </View>
                )}
              </View>
            )
          )}

          {nuevos.length > 0 && (
            <View style={styles.seccion}>
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
            <View style={styles.seccion}>
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
  seccion: { marginBottom: 22 },
  cabeceraSeccion: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  enlace: { fontSize: 12.5, color: c.accent, fontWeight: "500" },
  tarjeta: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 16 },
  tarjetaTitulo: { fontSize: 15, fontWeight: "500", color: c.ink, marginBottom: 4 },
});
