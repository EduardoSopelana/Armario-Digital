import React, { useEffect, useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import Avatar from "../components/Avatar";
import { TopBar, Pill, EmptyState, FieldLabel } from "../components/UI";
import { confirmarAccion } from "../confirm";
import { normalizarAlias } from "../services/authService";
import { buscarUsuarios, obtenerPerfiles, seguir, aceptarSeguidor, dejarDeSeguir, quitarSeguidor } from "../services/friendsService";
import { useTheme, useStyles } from "../theme";

/* ---------- piezas pequeñas ---------- */
function Fila({ perfil, extra, onPress, children }) {
  const styles = useStyles(createStyles);
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.rowMain}>
        <Avatar foto={perfil.foto} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nombre}>{perfil.nombre}</Text>
          <Text style={styles.alias}>@{perfil.alias}{extra ? ` · ${extra}` : ""}</Text>
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: "row", gap: 8 }}>{children}</View>
    </View>
  );
}

function BotonRedondo({ icon, onPress, relleno, disabled }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 34, height: 34, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
        backgroundColor: relleno ? colors.accent : colors.bg,
        borderColor: relleno ? colors.accent : colors.line,
      }}
    >
      <Ionicons name={icon} size={16} color={relleno ? colors.onAccent : colors.inkSoft} />
    </TouchableOpacity>
  );
}

/* ---------- pantalla ---------- */
// relaciones: [{ otroUid, yoSigo, meSigue }]  ·  onAbrirPerfil(perfil): abre el perfil a pantalla completa
export default function AmigosScreen({ relaciones, miUid, onAbrirPerfil, onBack }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  const [vista, setVista] = useState("siguiendo"); // "siguiendo" | "seguidores" | "solicitudes" | "buscar"
  const [perfiles, setPerfiles] = useState({});
  const [search, setSearch] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [ocupado, setOcupado] = useState(null); // uid con una acción en curso

  const siguiendo = relaciones.filter((r) => r.yoSigo === "accepted");
  const seguidores = relaciones.filter((r) => r.meSigue === "accepted");
  const recibidas = relaciones.filter((r) => r.meSigue === "pending");
  const enviadas = relaciones.filter((r) => r.yoSigo === "pending");

  const perfilDe = (uid) => perfiles[uid] || { id: uid, alias: "...", nombre: "Cargando...", foto: null };
  const relacionCon = (uid) => relaciones.find((r) => r.otroUid === uid) || null;
  const esMutuo = (r) => r.yoSigo === "accepted" && r.meSigue === "accepted";

  // Carga los perfiles de todas las personas con las que hay alguna relación
  useEffect(() => {
    let vivo = true;
    obtenerPerfiles(relaciones.map((r) => r.otroUid))
      .then((lista) => { if (vivo) setPerfiles((prev) => ({ ...prev, ...Object.fromEntries(lista.map((p) => [p.id, p])) })); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [relaciones]);

  // Búsqueda por alias (con una pequeña espera mientras se escribe)
  useEffect(() => {
    if (vista !== "buscar") return;
    const texto = normalizarAlias(search);
    if (texto.length < 2) { setResultados([]); setBuscando(false); return; }
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
  }, [search, vista]);

  // Ejecuta una acción mostrando un aviso si falla. Devuelve true si todo fue bien.
  const ejecutar = async (uid, accion) => {
    setOcupado(uid);
    try {
      await accion();
      return true;
    } catch (e) {
      Alert.alert("No se pudo completar", e.message);
      return false;
    } finally {
      setOcupado(null);
    }
  };

  const pedirDejarDeSeguir = (p, titulo, mensaje, boton) =>
    confirmarAccion({
      titulo, mensaje, textoConfirmar: boton, destructivo: true,
      onConfirm: () => ejecutar(p.id, () => dejarDeSeguir(miUid, p.id)),
    });

  const pedirQuitarSeguidor = (p) =>
    confirmarAccion({
      titulo: "Quitar seguidor",
      mensaje: `¿Quitar a @${p.alias} de tus seguidores? Si tu perfil es privado, dejará de ver tus conjuntos.`,
      textoConfirmar: "Quitar", destructivo: true,
      onConfirm: () => ejecutar(p.id, () => quitarSeguidor(miUid, p.id)),
    });

  // Al aceptar, se ofrece seguir de vuelta (sin obligar)
  const aceptar = async (p, rel) => {
    const ok = await ejecutar(p.id, () => aceptarSeguidor(miUid, p.id));
    if (ok && !rel.yoSigo) {
      Alert.alert(
        `@${p.alias} ya te sigue`,
        "¿Quieres seguirle tú también? Tendrá que aceptar tu solicitud.",
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Seguir", onPress: () => ejecutar(p.id, () => seguir(miUid, p.id)) },
        ]
      );
    }
  };

  const textoPildora = (t, n, avisar) => `${t}${n > 0 ? ` (${n})` : ""}`;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
      <TopBar title="Amigos" onBack={onBack} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 16 }} keyboardShouldPersistTaps="handled">
        <Pill active={vista === "siguiendo"} onPress={() => setVista("siguiendo")}>Siguiendo ({siguiendo.length})</Pill>
        <Pill active={vista === "seguidores"} onPress={() => setVista("seguidores")}>Seguidores ({seguidores.length})</Pill>
        <Pill active={vista === "solicitudes"} onPress={() => setVista("solicitudes")}>{textoPildora("Solicitudes", recibidas.length)}</Pill>
        <Pill active={vista === "buscar"} onPress={() => setVista("buscar")}>Buscar</Pill>
      </ScrollView>

      {/* ----- Siguiendo ----- */}
      {vista === "siguiendo" && (
        <View style={{ gap: 10 }}>
          {siguiendo.map((r) => {
            const p = perfilDe(r.otroUid);
            return (
              <Fila key={r.otroUid} perfil={p} extra={esMutuo(r) ? "os seguís" : undefined} onPress={() => onAbrirPerfil(p)}>
                <BotonRedondo
                  icon="person-remove-outline" disabled={ocupado === p.id}
                  onPress={() => pedirDejarDeSeguir(p, "Dejar de seguir", `¿Dejar de seguir a @${p.alias}?`, "Dejar de seguir")}
                />
              </Fila>
            );
          })}
          {siguiendo.length === 0 && (
            <EmptyState icon="people-outline" text="Todavía no sigues a nadie. Busca a alguien por su alias y pídele seguirle." cta="Buscar" onPress={() => setVista("buscar")} />
          )}
        </View>
      )}

      {/* ----- Seguidores ----- */}
      {vista === "seguidores" && (
        <View style={{ gap: 10 }}>
          {seguidores.map((r) => {
            const p = perfilDe(r.otroUid);
            return (
              <Fila key={r.otroUid} perfil={p} extra={esMutuo(r) ? "os seguís" : undefined} onPress={() => onAbrirPerfil(p)}>
                {!r.yoSigo && (
                  <BotonRedondo icon="person-add-outline" relleno disabled={ocupado === p.id} onPress={() => ejecutar(p.id, () => seguir(miUid, p.id))} />
                )}
                {r.yoSigo === "pending" && (
                  <BotonRedondo
                    icon="time-outline" disabled={ocupado === p.id}
                    onPress={() => pedirDejarDeSeguir(p, "Cancelar solicitud", `¿Cancelar tu solicitud para seguir a @${p.alias}?`, "Cancelar solicitud")}
                  />
                )}
                <BotonRedondo icon="close" disabled={ocupado === p.id} onPress={() => pedirQuitarSeguidor(p)} />
              </Fila>
            );
          })}
          {seguidores.length === 0 && <EmptyState icon="person-outline" text="Todavía no te sigue nadie." />}
        </View>
      )}

      {/* ----- Solicitudes ----- */}
      {vista === "solicitudes" && (
        <View>
          <FieldLabel>Quieren seguirte</FieldLabel>
          <View style={{ gap: 10, marginBottom: 22 }}>
            {recibidas.map((r) => {
              const p = perfilDe(r.otroUid);
              return (
                <Fila key={r.otroUid} perfil={p} onPress={() => onAbrirPerfil(p)}>
                  <BotonRedondo icon="checkmark" relleno disabled={ocupado === p.id} onPress={() => aceptar(p, r)} />
                  <BotonRedondo icon="close" disabled={ocupado === p.id} onPress={() => ejecutar(p.id, () => quitarSeguidor(miUid, p.id))} />
                </Fila>
              );
            })}
            {recibidas.length === 0 && <Text style={styles.nota}>No tienes solicitudes pendientes.</Text>}
          </View>

          <FieldLabel>Solicitudes que has enviado</FieldLabel>
          <View style={{ gap: 10 }}>
            {enviadas.map((r) => {
              const p = perfilDe(r.otroUid);
              return (
                <Fila key={r.otroUid} perfil={p} onPress={() => onAbrirPerfil(p)}>
                  <BotonRedondo
                    icon="close" disabled={ocupado === p.id}
                    onPress={() => pedirDejarDeSeguir(p, "Cancelar solicitud", `¿Cancelar tu solicitud para seguir a @${p.alias}?`, "Cancelar solicitud")}
                  />
                </Fila>
              );
            })}
            {enviadas.length === 0 && <Text style={styles.nota}>No has enviado ninguna solicitud.</Text>}
          </View>
        </View>
      )}

      {/* ----- Buscar ----- */}
      {vista === "buscar" && (
        <View>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.inkFaint} />
            <TextInput
              value={search} onChangeText={setSearch} placeholder="Buscar por alias..."
              autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.inkFaint} style={styles.searchInput}
            />
          </View>

          {normalizarAlias(search).length < 2 ? (
            <Text style={styles.nota}>Escribe al menos 2 letras del alias de la persona que buscas.</Text>
          ) : buscando ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
          ) : (
            <View style={{ gap: 10 }}>
              {resultados.map((p) => {
                const rel = relacionCon(p.id);
                return (
                  <Fila key={p.id} perfil={p} extra={rel?.meSigue === "accepted" ? "te sigue" : undefined} onPress={() => onAbrirPerfil(p)}>
                    {!rel?.yoSigo && (
                      <BotonRedondo icon="person-add-outline" relleno disabled={ocupado === p.id} onPress={() => ejecutar(p.id, () => seguir(miUid, p.id))} />
                    )}
                    {rel?.yoSigo === "pending" && (
                      <BotonRedondo
                        icon="time-outline" disabled={ocupado === p.id}
                        onPress={() => pedirDejarDeSeguir(p, "Cancelar solicitud", `¿Cancelar tu solicitud para seguir a @${p.alias}?`, "Cancelar solicitud")}
                      />
                    )}
                    {rel?.yoSigo === "accepted" && <BotonRedondo icon="checkmark" onPress={() => onAbrirPerfil(p)} />}
                  </Fila>
                );
              })}
              {resultados.length === 0 && <EmptyState icon="search-outline" text="No hay ningún usuario con ese alias." />}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, color: c.ink, paddingVertical: 10, fontFamily: "Inter_400Regular" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  nombre: { fontSize: 14, fontWeight: "500", color: c.ink },
  alias: { fontSize: 12.5, color: c.inkSoft, marginTop: 1 },
  nota: { fontSize: 13, color: c.inkSoft, lineHeight: 19 },
});
