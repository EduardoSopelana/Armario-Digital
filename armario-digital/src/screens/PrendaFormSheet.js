import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Text from "../components/Text";
import { Sheet, FieldLabel, PrimaryButton, GhostButton, Pill, useInputStyle } from "../components/UI";
import Foto from "../components/Foto";
import { CATEGORIAS, TIPOS_POR_CATEGORIA, ESTACIONES, COLORES, uid } from "../constants";
import { aBase64Reducida } from "../images";
import { useTheme, useStyles } from "../theme";

export default function PrendaFormSheet({ visible, initial, onSave, onClose }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const inputStyle = useInputStyle();

  const [foto, setFoto] = useState(initial?.foto || null);
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [categoria, setCategoria] = useState(initial?.categoria || "superior");
  const [tipo, setTipo] = useState(initial?.tipo || TIPOS_POR_CATEGORIA[initial?.categoria || "superior"][0]);
  const [color, setColor] = useState(initial?.color || "Negro");
  const [estaciones, setEstaciones] = useState(initial?.estaciones || []);
  const [descripcion, setDescripcion] = useState(initial?.descripcion || "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const handleCategoria = (cat) => {
    setCategoria(cat);
    setTipo(TIPOS_POR_CATEGORIA[cat][0]);
  };

  const toggleEstacion = (est) => {
    setEstaciones((prev) => (prev.includes(est) ? prev.filter((e) => e !== est) : [...prev, est]));
  };

  const elegirDeGaleria = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) { Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para elegir una foto."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) setFoto(res.assets[0].uri);
  };

  const hacerFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) { Alert.alert("Permiso necesario", "Necesitamos acceso a tu cámara para hacer la foto."); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) setFoto(res.assets[0].uri);
    // La "versión estudio" con IA se añadirá en una fase posterior, conectada a un servicio real.
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) { setError("Escribe un nombre para la prenda."); return; }
    if (estaciones.length === 0) { setError("Selecciona al menos una estación."); return; }
    setError("");
    setGuardando(true);
    try {
      // La foto se reduce para que quepa en la nube (si no se ha cambiado, se queda como está)
      const fotoFinal = foto ? await aBase64Reducida(foto) : null;
      onSave({
        id: initial?.id || uid(),
        nombre: nombre.trim(),
        foto: fotoFinal,
        categoria,
        tipo,
        color,
        estaciones,
        descripcion: descripcion.trim(),
        favorito: initial?.favorito || false,
        fechaCreacion: initial?.fechaCreacion || new Date().toISOString(),
      });
    } catch (e) {
      setError("No se pudo procesar la foto. Prueba con otra imagen.");
      setGuardando(false);
    }
  };

  return (
    <Sheet visible={visible} title={initial ? "Editar prenda" : "Añadir prenda"} onClose={onClose}>
      <View style={{ width: 150, alignSelf: "center", marginBottom: 12 }}>
        <Foto uri={foto} ratio={1} radius={18} />
      </View>
      <View style={styles.photoBtns}>
        <GhostButton onPress={elegirDeGaleria} icon="images-outline" style={{ flex: 1 }}>Galería</GhostButton>
        <GhostButton onPress={hacerFoto} icon="camera-outline" style={{ flex: 1 }}>Hacer foto</GhostButton>
      </View>

      <FieldLabel>Nombre</FieldLabel>
      <TextInput value={nombre} onChangeText={setNombre} placeholder="Ej. Camisa de lino blanca" style={[inputStyle, { marginBottom: 16 }]} placeholderTextColor={colors.inkFaint} />

      <FieldLabel>Categoría</FieldLabel>
      <View style={styles.wrapRow}>
        {CATEGORIAS.map((c) => (
          <Pill key={c.id} active={categoria === c.id} onPress={() => handleCategoria(c.id)} style={{ marginBottom: 8 }}>{c.label}</Pill>
        ))}
      </View>

      <FieldLabel>Tipo de prenda</FieldLabel>
      <View style={styles.wrapRow}>
        {TIPOS_POR_CATEGORIA[categoria].map((t) => (
          <Pill key={t} active={tipo === t} onPress={() => setTipo(t)} style={{ marginBottom: 8 }}>{t}</Pill>
        ))}
      </View>

      <FieldLabel>Color</FieldLabel>
      <View style={styles.wrapRow}>
        {COLORES.map((c) => (
          <TouchableOpacity
            key={c.nombre} onPress={() => setColor(c.nombre)}
            style={[styles.swatch, { backgroundColor: c.hex, borderColor: color === c.nombre ? colors.accent : colors.line, borderWidth: color === c.nombre ? 2.5 : 1 }]}
          />
        ))}
      </View>

      <FieldLabel>Estación (puedes elegir varias)</FieldLabel>
      <View style={styles.wrapRow}>
        {ESTACIONES.map(({ id }) => (
          <Pill key={id} active={estaciones.includes(id)} onPress={() => toggleEstacion(id)} style={{ marginBottom: 8 }}>{id}</Pill>
        ))}
      </View>

      <FieldLabel>Descripción (opcional)</FieldLabel>
      <TextInput
        value={descripcion} onChangeText={setDescripcion} placeholder="Detalles, marca, ocasión..."
        multiline numberOfLines={2} style={[inputStyle, { marginBottom: 8, minHeight: 60, textAlignVertical: "top" }]}
        placeholderTextColor={colors.inkFaint}
      />

      {!!error && <Text style={{ color: colors.danger, fontSize: 13, marginTop: 6 }}>{error}</Text>}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        <GhostButton onPress={onClose} style={{ flex: 1 }}>Cancelar</GhostButton>
        <PrimaryButton onPress={handleSubmit} disabled={guardando} style={{ flex: 1 }}>{guardando ? "Guardando..." : "Guardar prenda"}</PrimaryButton>
      </View>
    </Sheet>
  );
}

const createStyles = (c) => StyleSheet.create({
  photoBtns: { flexDirection: "row", gap: 8, marginBottom: 20 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  swatch: { width: 30, height: 30, borderRadius: 999, marginRight: 10, marginBottom: 8 },
});
