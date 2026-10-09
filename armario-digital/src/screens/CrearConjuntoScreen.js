import React, { useMemo, useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Text from "../components/Text";
import { TopBar, Pill, PrimaryButton, FieldLabel, Sheet, EmptyState, useInputStyle } from "../components/UI";
import Foto from "../components/Foto";
import { ESTACIONES, uid } from "../constants";
import { useTheme, useStyles } from "../theme";

const SLOTS = [
  { id: "top", label: "Parte superior o vestido", categorias: ["superior", "vestido"], required: true },
  { id: "bottom", label: "Parte inferior", categorias: ["inferior"], required: true, skipIfVestido: true },
  { id: "shoes", label: "Calzado", categorias: ["calzado"], required: true },
  { id: "coat", label: "Abrigo", categorias: ["abrigo"], required: false },
  { id: "acc", label: "Accesorios", categorias: ["accesorio"], required: false, multi: true },
];

// Reconstruye la selección por huecos a partir de un conjunto guardado (para editarlo)
function seleccionDesdeConjunto(conjunto, prendas) {
  const items = (conjunto?.prendaIds || []).map((id) => prendas.find((p) => p.id === id)).filter(Boolean);
  return {
    top: items.find((p) => p.categoria === "superior" || p.categoria === "vestido") || null,
    bottom: items.find((p) => p.categoria === "inferior") || null,
    shoes: items.find((p) => p.categoria === "calzado") || null,
    coat: items.find((p) => p.categoria === "abrigo") || null,
    acc: items.filter((p) => p.categoria === "accesorio"),
  };
}

// `initial` (opcional): conjunto existente que se está editando
export default function CrearConjuntoScreen({ prendas, initial, onSave, onCancel }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const inputStyle = useInputStyle();

  const [modo, setModo] = useState("manual");
  const [sel, setSel] = useState(() => seleccionDesdeConjunto(initial, prendas));
  const [pickerSlot, setPickerSlot] = useState(null);
  const [nombre, setNombre] = useState(initial?.nombre || "");
  const [estacion, setEstacion] = useState(initial?.estacion || "Verano");
  const [descripcion, setDescripcion] = useState(initial?.descripcion || "");
  const [error, setError] = useState("");
  const [genMsg, setGenMsg] = useState("");

  const esVestido = sel.top && sel.top.categoria === "vestido";

  const seleccionadas = useMemo(() => {
    const list = [];
    if (sel.top) list.push(sel.top);
    if (sel.bottom && !esVestido) list.push(sel.bottom);
    if (sel.shoes) list.push(sel.shoes);
    if (sel.coat) list.push(sel.coat);
    list.push(...sel.acc);
    return list;
  }, [sel, esVestido]);

  const pickItem = (slotId, item) => {
    setSel((prev) => {
      if (slotId === "acc") {
        const yaEsta = prev.acc.some((a) => a.id === item.id);
        return { ...prev, acc: yaEsta ? prev.acc.filter((a) => a.id !== item.id) : [...prev.acc, item] };
      }
      return { ...prev, [slotId]: prev[slotId]?.id === item.id ? null : item };
    });
  };

  const generar = () => {
    setGenMsg("");
    const porEstacion = prendas.filter((p) => p.estaciones.includes(estacion));
    const elegir = (cats) => {
      const opciones = porEstacion.filter((p) => cats.includes(p.categoria));
      if (opciones.length === 0) return null;
      return opciones[Math.floor(Math.random() * opciones.length)];
    };
    const top = elegir(["superior", "vestido"]);
    const esVest = top?.categoria === "vestido";
    const bottom = esVest ? null : elegir(["inferior"]);
    const shoes = elegir(["calzado"]);
    const coat = (estacion === "Otoño" || estacion === "Invierno") ? elegir(["abrigo"]) : null;

    if (!top || !shoes || (!esVest && !bottom)) {
      setGenMsg(`No hay suficientes prendas de ${estacion.toLowerCase()} en tu armario para generar un conjunto completo.`);
      return;
    }
    setSel({ top, bottom, shoes, coat, acc: [] });
    setGenMsg("¡Listo! Puedes ajustar cualquier prenda a mano o generar otra combinación.");
  };

  const guardar = () => {
    if (!sel.top || !sel.shoes || (!esVestido && !sel.bottom)) {
      setError("Completa parte superior (o vestido), parte inferior y calzado.");
      return;
    }
    if (!nombre.trim()) { setError("Ponle un nombre a tu conjunto."); return; }
    setError("");
    onSave({
      id: initial?.id || uid(),
      nombre: nombre.trim(),
      prendaIds: seleccionadas.map((p) => p.id),
      estacion,
      descripcion: descripcion.trim(),
      favorito: initial?.favorito || false,
      fechaCreacion: initial?.fechaCreacion || new Date().toISOString(),
    });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
      <TopBar title={initial ? "Editar conjunto" : "Nuevo conjunto"} onBack={onCancel} />

      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        <Pill active={modo === "manual"} onPress={() => setModo("manual")}>Elegir a mano</Pill>
        <Pill active={modo === "generar"} onPress={() => setModo("generar")}>✨ Generar</Pill>
      </View>

      {modo === "generar" && (
        <View style={styles.genBox}>
          <FieldLabel>Estación para el conjunto</FieldLabel>
          <View style={styles.wrapRow}>
            {ESTACIONES.map(({ id }) => (
              <Pill key={id} active={estacion === id} onPress={() => setEstacion(id)} style={{ marginBottom: 8 }}>{id}</Pill>
            ))}
          </View>
          <PrimaryButton onPress={generar} icon="sparkles-outline">Generar combinación</PrimaryButton>
          {!!genMsg && <Text style={styles.genMsg}>{genMsg}</Text>}
        </View>
      )}

      <FieldLabel>Prendas del conjunto</FieldLabel>
      <View style={{ gap: 10, marginBottom: 22 }}>
        {SLOTS.map((slot) => {
          if (slot.skipIfVestido && esVestido) return null;
          const valor = slot.multi ? sel.acc : sel[slot.id];
          const lista = slot.multi ? valor : (valor ? [valor] : []);
          return (
            <TouchableOpacity key={slot.id} style={styles.slotRow} onPress={() => setPickerSlot(slot)}>
              <View style={{ flexDirection: "row" }}>
                {lista.length > 0 ? lista.slice(0, 3).map((p) => (
                  <View key={p.id} style={styles.slotThumb}>
                    <Foto uri={p.foto} ratio={1} radius={8} />
                  </View>
                )) : (
                  <View style={[styles.slotThumb, styles.slotEmpty]}>
                    <Ionicons name="add" size={16} color={colors.inkFaint} />
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotLabel}>{slot.label}{!slot.required && <Text style={{ color: colors.inkFaint }}> · opcional</Text>}</Text>
                <Text style={styles.slotSub}>{lista.length === 0 ? "Sin seleccionar" : lista.map((p) => p.nombre).join(", ")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.inkFaint} />
            </TouchableOpacity>
          );
        })}
      </View>

      {seleccionadas.length > 0 && (
        <View style={styles.previewRow}>
          {seleccionadas.map((p) => (
            <View key={p.id} style={{ width: "22%" }}><Foto uri={p.foto} ratio={1} radius={10} /></View>
          ))}
        </View>
      )}

      <FieldLabel>Nombre del conjunto</FieldLabel>
      <TextInput value={nombre} onChangeText={setNombre} placeholder="Ej. Look casual verano" style={[inputStyle, { marginBottom: 16 }]} placeholderTextColor={colors.inkFaint} />

      <FieldLabel>Estación recomendada</FieldLabel>
      <View style={styles.wrapRow}>
        {ESTACIONES.map(({ id }) => (
          <Pill key={id} active={estacion === id} onPress={() => setEstacion(id)} style={{ marginBottom: 8 }}>{id}</Pill>
        ))}
      </View>

      <FieldLabel>Descripción (opcional)</FieldLabel>
      <TextInput
        value={descripcion} onChangeText={setDescripcion} placeholder="¿Para qué ocasión es este look?"
        multiline numberOfLines={2} style={[inputStyle, { marginBottom: 16, minHeight: 60, textAlignVertical: "top" }]}
        placeholderTextColor={colors.inkFaint}
      />

      {!!error && <Text style={{ color: colors.danger, fontSize: 13, marginBottom: 12 }}>{error}</Text>}
      <PrimaryButton onPress={guardar}>{initial ? "Guardar cambios" : "Guardar conjunto"}</PrimaryButton>

      <Sheet visible={!!pickerSlot} title={pickerSlot?.label || ""} onClose={() => setPickerSlot(null)}>
        {pickerSlot && (
          <PickerGrid slot={pickerSlot} prendas={prendas} seleccion={pickerSlot.multi ? sel.acc : sel[pickerSlot.id]} onPick={(item) => pickItem(pickerSlot.id, item)} />
        )}
        <PrimaryButton onPress={() => setPickerSlot(null)} style={{ marginTop: 16 }}>Listo</PrimaryButton>
      </Sheet>
    </ScrollView>
  );
}

function PickerGrid({ slot, prendas, seleccion, onPick }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const opciones = prendas.filter((p) => slot.categorias.includes(p.categoria));
  const estaElegido = (item) => (slot.multi ? seleccion.some((s) => s.id === item.id) : seleccion?.id === item.id);

  if (opciones.length === 0) {
    return <EmptyState text="No tienes prendas de este tipo todavía." />;
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
      {opciones.map((p) => {
        const elegido = estaElegido(p);
        return (
          <TouchableOpacity key={p.id} onPress={() => onPick(p)} style={{ width: "46%" }}>
            <View>
              <Foto uri={p.foto} radius={12} />
              {elegido && (
                <View style={styles.checkBadge}><Ionicons name="checkmark" size={14} color={colors.onAccent} /></View>
              )}
            </View>
            <Text style={styles.slotLabel}>{p.nombre}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  genBox: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 16, marginBottom: 22 },
  genMsg: { fontSize: 12.5, color: c.inkSoft, marginTop: 10, lineHeight: 18 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  slotThumb: { width: 42, height: 42, borderRadius: 8, overflow: "hidden", marginRight: 4 },
  slotEmpty: { backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
  slotLabel: { fontSize: 13.5, fontWeight: "500", color: c.ink, marginTop: 6 },
  slotSub: { fontSize: 12, color: c.inkSoft, marginTop: 1 },
  previewRow: { flexDirection: "row", gap: 8, marginBottom: 22, flexWrap: "wrap" },
  checkBadge: { position: "absolute", top: 8, right: 8, backgroundColor: c.accent, borderRadius: 999, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
});
