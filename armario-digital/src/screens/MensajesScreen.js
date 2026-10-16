import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, TouchableOpacity, FlatList, ScrollView, KeyboardAvoidingView, Keyboard, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "../components/Text";
import Swatches from "../components/Swatches";
import Avatar from "../components/Avatar";
import OutfitThumb from "../components/OutfitThumb";
import { TopBar, Pill, EmptyState, Sheet, useInputStyle } from "../components/UI";
import { getUsersByIds } from "../services/friendsService";
import { FAMOSOS_DEMO } from "../data/demoData";
import { resolverFoto } from "../images";
import { useTheme, useStyles } from "../theme";

/* ---- Vista previa de un conjunto adjunto (propio o de inspiración) ---- */
function AdjuntoPreview({ adjunto, prendas }) {
  const styles = useStyles(createStyles);
  if (!adjunto) return null;

  if (adjunto.tipo === "propio") {
    const items = (adjunto.prendaIds || []).map((id) => prendas.find((p) => p.id === id)).filter(Boolean);
    return (
      <View style={styles.adjunto}>
        <View style={styles.adjuntoGrid}>
          {items.slice(0, 4).map((p) => (
            <View key={p.id} style={{ width: "50%", height: "50%" }}>
              {p.foto && <Image source={{ uri: resolverFoto(p.foto) }} style={{ width: "100%", height: "100%" }} />}
            </View>
          ))}
        </View>
        <Text style={styles.adjuntoNombre}>{adjunto.nombre}</Text>
      </View>
    );
  }
  return (
    <View style={styles.adjunto}>
      <Swatches colores={adjunto.colores} size={120} radius={8} />
      <Text style={styles.adjuntoNombre}>{adjunto.nombre}</Text>
      <Text style={styles.adjuntoSub}>Inspiración · {adjunto.origen}</Text>
    </View>
  );
}

/* ---- Hoja para elegir qué conjunto adjuntar ---- */
function AttachSheet({ conjuntos, prendas, onPick, onClose }) {
  const [tab, setTab] = useState("propios");
  return (
    <Sheet title="Adjuntar conjunto" onClose={onClose}>
      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <Pill active={tab === "propios"} onPress={() => setTab("propios")}>Tus conjuntos</Pill>
        <Pill active={tab === "inspiracion"} onPress={() => setTab("inspiracion")}>Inspiración</Pill>
      </View>

      {tab === "propios" ? (
        conjuntos.length === 0 ? (
          <EmptyState icon="sparkles-outline" text="Todavía no tienes conjuntos guardados para enviar." />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
            {conjuntos.map((c) => (
              <View key={c.id} style={{ width: "47%" }}>
                <OutfitThumb conjunto={c} prendas={prendas} onPress={() => onPick({ tipo: "propio", nombre: c.nombre, prendaIds: c.prendaIds })} />
              </View>
            ))}
          </View>
        )
      ) : (
        <View style={{ gap: 18 }}>
          {FAMOSOS_DEMO.map((f) => (
            <View key={f.id}>
              <Text style={{ fontSize: 13, fontWeight: "500", opacity: 0.7, marginBottom: 8 }}>{f.nombre}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
                {f.looks.map((look, i) => (
                  <TouchableOpacity
                    key={i} style={{ width: "47%" }}
                    onPress={() => onPick({ tipo: "famoso", nombre: look.nombre, colores: look.colores, origen: f.nombre })}
                  >
                    <Swatches colores={look.colores} />
                    <Text style={{ marginTop: 6, fontSize: 12.5, fontWeight: "500" }}>{look.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </Sheet>
  );
}

/* ---- Conversación con un amigo ---- */
function Hilo({ amigo, mensajes, prendas, conjuntos, onEnviar, onBack }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const inputStyle = useInputStyle();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);

  const [texto, setTexto] = useState("");
  const [adjunto, setAdjunto] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const lista = mensajes[amigo.id] || [];

  const enviar = () => {
    if (!texto.trim() && !adjunto) return;
    onEnviar(amigo.id, texto.trim(), adjunto);
    setTexto("");
    setAdjunto(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={{ paddingHorizontal: 20 }}>
        <TopBar title={`@${amigo.alias}`} onBack={onBack} />
      </View>

      <FlatList
        ref={listRef}
        data={lista}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 10, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text style={styles.vacio}>Envía un mensaje o comparte un conjunto con {amigo.nombre}.{"\n\n"}Por ahora los mensajes solo se guardan en tu móvil: llegarán a tus amigos en la siguiente fase.</Text>
        }
        renderItem={({ item: m }) => (
          <View style={{ alignItems: m.de === "yo" ? "flex-end" : "flex-start" }}>
            <View style={[styles.burbuja, m.de === "yo" ? styles.burbujaYo : styles.burbujaOtro]}>
              {!!m.texto && <Text style={[styles.burbujaTexto, m.de === "yo" && { color: colors.onAccent }]}>{m.texto}</Text>}
              <AdjuntoPreview adjunto={m.adjunto} prendas={prendas} />
            </View>
          </View>
        )}
      />

      <View style={[styles.compose, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {adjunto && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1, alignItems: "flex-start" }}><AdjuntoPreview adjunto={adjunto} prendas={prendas} /></View>
            <TouchableOpacity onPress={() => setAdjunto(null)} style={styles.quitarAdjunto}>
              <Ionicons name="close" size={14} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowAttach(true); }} style={styles.roundBtn}>
            <Ionicons name="attach" size={18} color={colors.inkSoft} />
          </TouchableOpacity>
          <TextInput
            value={texto} onChangeText={setTexto} placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.inkFaint} style={[inputStyle, { flex: 1, width: undefined }]}
          />
          <TouchableOpacity onPress={enviar} style={[styles.roundBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
            <Ionicons name="send" size={16} color={colors.onAccent} />
          </TouchableOpacity>
        </View>
      </View>

      {showAttach && (
        <AttachSheet
          conjuntos={conjuntos} prendas={prendas}
          onPick={(a) => { setAdjunto(a); setShowAttach(false); }}
          onClose={() => setShowAttach(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

/* ---- Lista de conversaciones ---- */
export default function MensajesScreen({ amigos, mensajes, prendas, conjuntos, onEnviar, onBack, onHiloChange }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const [hilo, setHilo] = useState(null);
  const [misAmigos, setMisAmigos] = useState([]);

  useEffect(() => { getUsersByIds(amigos).then(setMisAmigos); }, [amigos]);

  // Avisa a App.js para ocultar el menú inferior mientras hay una conversación abierta
  useEffect(() => {
    onHiloChange(!!hilo);
    return () => onHiloChange(false);
  }, [hilo]);

  if (hilo) {
    return <Hilo amigo={hilo} mensajes={mensajes} prendas={prendas} conjuntos={conjuntos} onEnviar={onEnviar} onBack={() => setHilo(null)} />;
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
      <TopBar title="Mensajes" onBack={onBack} />
      {misAmigos.length === 0 ? (
        <EmptyState icon="chatbubble-outline" text="Cuando sigas a alguien (o alguien te siga) y la solicitud esté aceptada, podrás escribirle desde aquí." />
      ) : (
        <View style={{ gap: 10 }}>
          {misAmigos.map((f) => {
            const ultimo = (mensajes[f.id] || []).slice(-1)[0];
            return (
              <TouchableOpacity key={f.id} style={styles.fila} onPress={() => setHilo(f)}>
                <Avatar foto={f.foto} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.nombre}>{f.nombre}</Text>
                  <Text style={styles.preview} numberOfLines={1}>{ultimo ? (ultimo.texto || "Conjunto compartido") : `@${f.alias}`}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  vacio: { fontSize: 13, color: c.inkSoft, textAlign: "center", marginTop: 30 },
  burbuja: { maxWidth: "78%", borderRadius: 14, paddingVertical: 9, paddingHorizontal: 12 },
  burbujaYo: { backgroundColor: c.accent },
  burbujaOtro: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
  burbujaTexto: { fontSize: 14, lineHeight: 20, color: c.ink },
  adjunto: { backgroundColor: c.bg, borderRadius: 12, padding: 8, marginTop: 6, alignSelf: "flex-start" },
  adjuntoGrid: { width: 120, aspectRatio: 1, borderRadius: 8, overflow: "hidden", flexDirection: "row", flexWrap: "wrap", backgroundColor: c.goldSoft },
  adjuntoNombre: { marginTop: 6, fontSize: 12, fontWeight: "500", color: c.ink },
  adjuntoSub: { fontSize: 11, color: c.inkSoft },
  compose: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg },
  roundBtn: { width: 38, height: 38, borderRadius: 999, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  quitarAdjunto: { width: 26, height: 26, borderRadius: 999, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  avatar: { width: 42, height: 42, borderRadius: 999, backgroundColor: c.accentSoft, alignItems: "center", justifyContent: "center" },
  nombre: { fontSize: 14, fontWeight: "500", color: c.ink },
  preview: { fontSize: 12.5, color: c.inkSoft, marginTop: 1 },
});
