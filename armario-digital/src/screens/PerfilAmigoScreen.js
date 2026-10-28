import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, useWindowDimensions } from "react-native";
import Text from "../components/Text";
import Avatar from "../components/Avatar";
import OutfitThumb from "../components/OutfitThumb";
import OutfitDetailSheet from "./OutfitDetailSheet";
import ListaSeguidoresAjenaScreen from "./ListaSeguidoresAjenaScreen";
import { BotonRedondo } from "../components/PersonaRow";
import { TopBar, EmptyState, PrimaryButton, GhostButton } from "../components/UI";
import { confirmarAccion } from "../confirm";
import { seguir, dejarDeSeguir, aceptarSeguidor, quitarSeguidor, escucharPerfil, escucharSeguimientos } from "../services/friendsService";
import { escucharPrendas, escucharConjuntos } from "../services/wardrobeService";
import { useTheme, useStyles } from "../theme";

// Perfil de otra persona, a pantalla completa y con el mismo aspecto que "Conjuntos".
// perfil: { id, alias, nombre, foto }  ·  relaciones: MIS relaciones (a quién sigo y quién me sigue)
// onMensaje(perfil): abre la conversación con esa persona
export default function PerfilAmigoScreen({ perfil, relaciones, miUid, onBack, onMensaje }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { width } = useWindowDimensions();
  const itemWidth = (width - 40 - 16) / 2;

  const rel = relaciones.find((r) => r.otroUid === perfil.id);
  const yoSigo = rel?.yoSigo || null;
  const meSigue = rel?.meSigue || null;

  const [prendas, setPrendas] = useState(null);
  const [conjuntos, setConjuntos] = useState(null); // null = cargando
  const [privado, setPrivado] = useState(false);
  const [abierto, setAbierto] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [privacidad, setPrivacidad] = useState(perfil.privacidadConjuntos || "publico");

  // Sus seguidores y a quién sigue: solo se pueden ver si hay seguimiento mutuo
  const [seguidores, setSeguidores] = useState(null);
  const [siguiendo, setSiguiendo] = useState(null);
  const [listasBloqueadas, setListasBloqueadas] = useState(false);
  const [lista, setLista] = useState(null); // "seguidores" | "siguiendo" | null
  const [hijo, setHijo] = useState(null);   // otro perfil abierto desde una de esas listas

  // La privacidad de la otra persona se escucha en directo: si pasa a privado, o si deja de seguirme
  // / yo dejo de seguirle, el acceso a sus conjuntos se pierde al instante (sin refrescar).
  useEffect(() => escucharPerfil(perfil.id, (p) => setPrivacidad(p.privacidadConjuntos), () => {}), [perfil.id]);

  // Si el perfil es privado y no le sigo, las reglas de Firestore rechazan la lectura.
  // Se vuelve a escuchar cada vez que cambia mi relación con esa persona o su privacidad.
  useEffect(() => {
    setPrendas(null);
    setConjuntos(null);
    setPrivado(false);
    const alFallar = (e) => {
      if (e.code === "permission-denied") {
        setPrivado(true);
        setAbierto(null); // si había un conjunto abierto, se cierra
      }
      setPrendas((p) => p ?? []);
      setConjuntos((c) => c ?? []);
    };
    const dejarPrendas = escucharPrendas(perfil.id, setPrendas, alFallar);
    const dejarConjuntos = escucharConjuntos(perfil.id, setConjuntos, alFallar);
    return () => { dejarPrendas(); dejarConjuntos(); };
  }, [perfil.id, yoSigo, privacidad]);

  // Listas de seguidores y seguidos (también se actualizan al cambiar mi relación)
  useEffect(() => {
    setSeguidores(null);
    setSiguiendo(null);
    setListasBloqueadas(false);
    const alFallar = (e) => {
      if (e.code === "permission-denied") setListasBloqueadas(true);
      setSeguidores((s) => s ?? []);
      setSiguiendo((s) => s ?? []);
    };
    const dejarSeguidores = escucharSeguimientos(perfil.id, "seguidores", setSeguidores, alFallar);
    const dejarSiguiendo = escucharSeguimientos(perfil.id, "siguiendo", setSiguiendo, alFallar);
    return () => { dejarSeguidores(); dejarSiguiendo(); };
  }, [perfil.id, yoSigo, meSigue]);

  const ejecutar = async (accion) => {
    setOcupado(true);
    try {
      await accion();
    } catch (e) {
      Alert.alert("No se pudo completar", e.message);
    } finally {
      setOcupado(false);
    }
  };

  const pulsarSeguir = () => {
    if (yoSigo === "accepted") {
      confirmarAccion({
        titulo: "Dejar de seguir", mensaje: `¿Dejar de seguir a @${perfil.alias}?`, textoConfirmar: "Dejar de seguir", destructivo: true,
        onConfirm: () => ejecutar(() => dejarDeSeguir(miUid, perfil.id)),
      });
    } else if (yoSigo === "pending") {
      confirmarAccion({
        titulo: "Cancelar solicitud", mensaje: `¿Cancelar tu solicitud para seguir a @${perfil.alias}?`, textoConfirmar: "Cancelar solicitud", destructivo: true,
        onConfirm: () => ejecutar(() => dejarDeSeguir(miUid, perfil.id)),
      });
    } else {
      ejecutar(() => seguir(miUid, perfil.id));
    }
  };

  const abrirLista = (tipo) => {
    if (listasBloqueadas) {
      Alert.alert("Lista no disponible", `Solo puedes ver quién sigue a @${perfil.alias} y a quién sigue si os seguís mutuamente.`);
      return;
    }
    setLista(tipo);
  };

  const cuenta = (datos) => (listasBloqueadas ? "—" : datos === null ? "…" : datos.length);
  const seguirTambien = meSigue === "accepted";

  const cabecera = (
    <View style={styles.cabecera}>
      <Avatar foto={perfil.foto} size={72} />
      <Text style={styles.nombre}>{perfil.nombre}</Text>
      <Text style={styles.alias}>@{perfil.alias}{seguirTambien ? " · te sigue" : ""}</Text>

      {meSigue === "pending" && (
        <View style={styles.banner}>
          <Text style={styles.bannerTexto}>@{perfil.alias} quiere seguirte</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <BotonRedondo icon="checkmark" relleno disabled={ocupado} onPress={() => ejecutar(() => aceptarSeguidor(miUid, perfil.id))} />
            <BotonRedondo icon="close" disabled={ocupado} onPress={() => ejecutar(() => quitarSeguidor(miUid, perfil.id))} />
          </View>
        </View>
      )}

      {/* Mitad izquierda: seguir. Mitad derecha: mensajes. */}
      <View style={styles.botones}>
        <View style={{ flex: 1 }}>
          {yoSigo === "accepted" ? (
            <GhostButton icon="checkmark" onPress={pulsarSeguir}>Siguiendo</GhostButton>
          ) : yoSigo === "pending" ? (
            <GhostButton icon="time-outline" onPress={pulsarSeguir}>Solicitado</GhostButton>
          ) : (
            <PrimaryButton icon={seguirTambien ? "repeat" : "person-add-outline"} onPress={pulsarSeguir} disabled={ocupado}>
              {seguirTambien ? "Seguir también" : "Seguir"}
            </PrimaryButton>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <GhostButton icon="chatbubble-outline" onPress={() => onMensaje && onMensaje(perfil)}>Mensajes</GhostButton>
        </View>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => abrirLista("siguiendo")}>
          <Text style={styles.statNum}>{cuenta(siguiendo)}</Text>
          <Text style={styles.statLabel}>Siguiendo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => abrirLista("seguidores")}>
          <Text style={styles.statNum}>{cuenta(seguidores)}</Text>
          <Text style={styles.statLabel}>Seguidores</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.seccion}>Conjuntos</Text>
    </View>
  );

  const hayCapaEncima = !!lista || !!hijo;

  return (
    <View style={{ flex: 1 }}>
      {/* Pantalla del perfil (se queda montada, oculta, mientras se ve una lista u otro perfil) */}
      <View style={{ flex: 1, display: hayCapaEncima ? "none" : "flex" }}>
        <View style={{ paddingHorizontal: 20 }}>
          <TopBar title={`@${perfil.alias}`} onBack={onBack} />
        </View>

        <FlatList
          data={conjuntos || []}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, gap: 16 }}
          ListHeaderComponent={cabecera}
          renderItem={({ item }) => (
            <View style={{ width: itemWidth }}>
              <OutfitThumb conjunto={item} prendas={prendas || []} onPress={() => setAbierto(item)} />
            </View>
          )}
          ListEmptyComponent={
            conjuntos === null ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />
            ) : privado ? (
              <EmptyState
                icon="lock-closed-outline"
                text={`Este perfil es privado. Pide seguir a @${perfil.alias} y, cuando acepte, podrás ver sus conjuntos.`}
              />
            ) : (
              <EmptyState icon="sparkles-outline" text="Todavía no tiene conjuntos." />
            )
          }
        />

        {!!abierto && <OutfitDetailSheet conjunto={abierto} prendas={prendas || []} onClose={() => setAbierto(null)} />}
      </View>

      {/* Lista de seguidores o seguidos de esta persona */}
      {!!lista && (
        <View style={{ flex: 1, display: hijo ? "none" : "flex" }}>
          <ListaSeguidoresAjenaScreen
            perfil={perfil} tipo={lista} lista={(lista === "seguidores" ? seguidores : siguiendo) || []}
            relaciones={relaciones} miUid={miUid}
            onAbrirPerfil={setHijo} onBack={() => setLista(null)}
          />
        </View>
      )}

      {/* Otro perfil abierto desde esa lista */}
      {!!hijo && (
        <PerfilAmigoScreen perfil={hijo} relaciones={relaciones} miUid={miUid} onBack={() => setHijo(null)} onMensaje={onMensaje} />
      )}
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  cabecera: { alignItems: "center", paddingBottom: 6 },
  nombre: { fontSize: 20, fontWeight: "500", color: c.ink, fontFamily: "display", marginTop: 10 },
  alias: { fontSize: 13, color: c.inkSoft, marginTop: 2 },
  seccion: { alignSelf: "flex-start", fontSize: 18, fontWeight: "500", color: c.ink, fontFamily: "display", marginTop: 22 },
  banner: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: c.accentSofter, borderWidth: 1, borderColor: c.accentSoft },
  bannerTexto: { fontSize: 13.5, fontWeight: "500", color: c.ink, flex: 1, marginRight: 10 },
  botones: { width: "100%", flexDirection: "row", gap: 10, marginTop: 14 },
  statsRow: { width: "100%", flexDirection: "row", gap: 12, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  statNum: { fontSize: 22, fontWeight: "500", color: c.accent, fontFamily: "display" },
  statLabel: { fontSize: 12.5, color: c.inkSoft, marginTop: 1 },
});
