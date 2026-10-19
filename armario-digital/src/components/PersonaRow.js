import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Text from "./Text";
import Avatar from "./Avatar";
import { confirmarAccion } from "../confirm";
import { obtenerPerfiles, dejarDeSeguir, quitarSeguidor } from "../services/friendsService";
import { useTheme, useStyles } from "../theme";

// Fila de una persona: avatar, nombre, alias y botones a la derecha
export function Fila({ perfil, extra, onPress, children }) {
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

export function BotonRedondo({ icon, onPress, relleno, disabled }) {
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

// "Seguir también": el icono de usuario con un 🔂 en la esquina, para distinguirlo del resto
export function BotonSeguirDeVuelta({ onPress, disabled }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 34, height: 34, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.5 : 1, backgroundColor: colors.accent, borderColor: colors.accent,
      }}
    >
      <View style={{ width: 22, height: 20 }}>
        <Ionicons name="person-outline" size={17} color={colors.onAccent} />
        <View style={{ position: "absolute", right: -2, bottom: -3 }}>
          <MaterialCommunityIcons name="repeat-once" size={12} color={colors.onAccent} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Carga los perfiles de las personas con las que hay alguna relación
export function usePerfiles(relaciones) {
  const [perfiles, setPerfiles] = useState({});
  useEffect(() => {
    let vivo = true;
    obtenerPerfiles(relaciones.map((r) => r.otroUid))
      .then((lista) => { if (vivo) setPerfiles((prev) => ({ ...prev, ...Object.fromEntries(lista.map((p) => [p.id, p])) })); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [relaciones]);
  return (uid) => perfiles[uid] || { id: uid, alias: "...", nombre: "Cargando...", foto: null };
}

// Acciones habituales sobre una persona, con aviso si algo falla
export function useAcciones(miUid) {
  const [ocupado, setOcupado] = useState(null); // uid con una acción en curso

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

  const pedirDejarDeSeguir = (p, titulo = "Dejar de seguir", mensaje, boton = "Dejar de seguir") =>
    confirmarAccion({
      titulo, mensaje: mensaje || `¿Dejar de seguir a @${p.alias}?`, textoConfirmar: boton, destructivo: true,
      onConfirm: () => ejecutar(p.id, () => dejarDeSeguir(miUid, p.id)),
    });

  const pedirCancelarSolicitud = (p) =>
    pedirDejarDeSeguir(p, "Cancelar solicitud", `¿Cancelar tu solicitud para seguir a @${p.alias}?`, "Cancelar solicitud");

  const pedirQuitarSeguidor = (p) =>
    confirmarAccion({
      titulo: "Quitar seguidor",
      mensaje: `¿Quitar a @${p.alias} de tus seguidores? Si tu perfil es privado, dejará de ver tus conjuntos.`,
      textoConfirmar: "Quitar", destructivo: true,
      onConfirm: () => ejecutar(p.id, () => quitarSeguidor(miUid, p.id)),
    });

  return { ocupado, ejecutar, pedirDejarDeSeguir, pedirCancelarSolicitud, pedirQuitarSeguidor };
}

const createStyles = (c) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  nombre: { fontSize: 14, fontWeight: "500", color: c.ink },
  alias: { fontSize: 12.5, color: c.inkSoft, marginTop: 1 },
});
