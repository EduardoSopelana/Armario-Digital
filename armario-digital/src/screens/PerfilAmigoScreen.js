import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, Alert, StyleSheet, useWindowDimensions } from "react-native";
import Text from "../components/Text";
import Avatar from "../components/Avatar";
import OutfitThumb from "../components/OutfitThumb";
import OutfitDetailSheet from "./OutfitDetailSheet";
import { BotonRedondo } from "../components/PersonaRow";
import { TopBar, EmptyState, PrimaryButton, GhostButton } from "../components/UI";
import { confirmarAccion } from "../confirm";
import { seguir, dejarDeSeguir, aceptarSeguidor, quitarSeguidor } from "../services/friendsService";
import { escucharPrendas, escucharConjuntos } from "../services/wardrobeService";
import { useTheme, useStyles } from "../theme";

// Perfil de otra persona, a pantalla completa y con el mismo aspecto que "Conjuntos".
// perfil: { id, alias, nombre, foto }  ·  rel: { yoSigo, meSigue } o undefined si no hay relación
export default function PerfilAmigoScreen({ perfil, rel, miUid, onBack }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { width } = useWindowDimensions();
  const itemWidth = (width - 40 - 16) / 2;

  const [prendas, setPrendas] = useState(null);
  const [conjuntos, setConjuntos] = useState(null); // null = cargando
  const [privado, setPrivado] = useState(false);
  const [abierto, setAbierto] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const yoSigo = rel?.yoSigo || null;
  const meSigue = rel?.meSigue || null;

  // Si el perfil es privado y no le sigo, las reglas de Firestore rechazan la lectura.
  // Se vuelve a escuchar cuando cambia mi relación (por ejemplo, al aceptar mi solicitud).
  useEffect(() => {
    setPrendas(null);
    setConjuntos(null);
    setPrivado(false);
    const alFallar = (e) => {
      if (e.code === "permission-denied") setPrivado(true);
      setPrendas((p) => p ?? []);
      setConjuntos((c) => c ?? []);
    };
    const dejarPrendas = escucharPrendas(perfil.id, setPrendas, alFallar);
    const dejarConjuntos = escucharConjuntos(perfil.id, setConjuntos, alFallar);
    return () => { dejarPrendas(); dejarConjuntos(); };
  }, [perfil.id, yoSigo]);

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

      <View style={{ width: "100%", marginTop: 14 }}>
        {yoSigo === "accepted" ? (
          <GhostButton icon="checkmark" onPress={pulsarSeguir}>Siguiendo</GhostButton>
        ) : yoSigo === "pending" ? (
          <GhostButton icon="time-outline" onPress={pulsarSeguir}>Solicitud enviada</GhostButton>
        ) : (
          <PrimaryButton icon={seguirTambien ? "repeat" : "person-add-outline"} onPress={pulsarSeguir} disabled={ocupado}>
            {seguirTambien ? "Seguir también" : "Seguir"}
          </PrimaryButton>
        )}
      </View>
      <Text style={styles.seccion}>Conjuntos</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
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
  );
}

const createStyles = (c) => StyleSheet.create({
  cabecera: { alignItems: "center", paddingBottom: 6 },
  nombre: { fontSize: 20, fontWeight: "500", color: c.ink, fontFamily: "display", marginTop: 10 },
  alias: { fontSize: 13, color: c.inkSoft, marginTop: 2 },
  seccion: { alignSelf: "flex-start", fontSize: 18, fontWeight: "500", color: c.ink, fontFamily: "display", marginTop: 22 },
  banner: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: c.accentSofter, borderWidth: 1, borderColor: c.accentSoft },
  bannerTexto: { fontSize: 13.5, fontWeight: "500", color: c.ink, flex: 1, marginRight: 10 },
});
