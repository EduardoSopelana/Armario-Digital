import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, TouchableOpacity, FlatList, ScrollView, KeyboardAvoidingView, Keyboard, Image, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "../components/Text";
import Swatches from "../components/Swatches";
import Avatar from "../components/Avatar";
import OutfitThumb from "../components/OutfitThumb";
import PerfilAmigoScreen from "./PerfilAmigoScreen";
import { usePerfiles } from "../components/PersonaRow";
import { TopBar, Pill, EmptyState, Sheet, GhostButton, PrimaryButton, useInputStyle } from "../components/UI";
import {
  escucharMensajes, enviarMensaje, estadoDeEnvio, prepararAdjunto, aceptarChat, rechazarChat, esMutuo, LIMITE_SIN_ACEPTAR,
} from "../services/messagesService";
import { FAMOSOS_DEMO } from "../data/demoData";
import { resolverFoto } from "../images";
import { useTheme, useStyles } from "../theme";

/* ---- Tarjeta de un conjunto adjunto, sin burbuja alrededor ---- */
// Un mensaje enviado lleva sus miniaturas dentro (items). El borrador antes de enviar usa prendaIds.
function AdjuntoPreview({ adjunto, prendas }) {
  const styles = useStyles(createStyles);
  if (!adjunto) return null;

  if (adjunto.tipo === "propio") {
    const fotos = adjunto.items
      ? adjunto.items.map((i) => i.foto)
      : (adjunto.prendaIds || []).map((id) => prendas.find((p) => p.id === id)?.foto);
    return (
      <View style={styles.adjunto}>
        <View style={styles.adjuntoGrid}>
          {fotos.slice(0, 4).map((f, i) => (
            <View key={i} style={{ width: "50%", height: "50%" }}>
              {!!f && <Image source={{ uri: resolverFoto(f) }} style={{ width: "100%", height: "100%" }} />}
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

/* ---- Conversación con una persona ---- */
function Hilo({ perfil, chat, mutuo, miUid, prendas, conjuntos, onBack, onAbrirPerfil }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const inputStyle = useInputStyle();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [adjunto, setAdjunto] = useState(null);
  const [showAttach, setShowAttach] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const chatId = chat?.id;
  // Los mensajes llegan en tiempo real mientras la conversación exista
  useEffect(() => {
    if (!chatId) { setMensajes([]); return; }
    return escucharMensajes(chatId, setMensajes, () => {});
  }, [chatId]);

  const esSolicitud = !!chat && chat.estado === "pendiente" && chat.iniciador !== miUid;
  const envio = estadoDeEnvio({ chat, miUid, mutuo });
  const margenInferior = { paddingBottom: Math.max(insets.bottom, 12) };

  const enviar = async () => {
    if ((!texto.trim() && !adjunto) || enviando) return;
    setEnviando(true);
    try {
      const adj = await prepararAdjunto(adjunto, prendas);
      await enviarMensaje({ miUid, otroUid: perfil.id, chat, texto, adjunto: adj, mutuo });
      setTexto("");
      setAdjunto(null);
    } catch (e) {
      Alert.alert("No se pudo enviar", e.message);
    } finally {
      setEnviando(false);
    }
  };

  const aceptar = async () => {
    try { await aceptarChat(chat.id); } catch (e) { Alert.alert("No se pudo aceptar", e.message); }
  };
  const rechazar = async () => {
    try { await rechazarChat(chat.id); onBack(); } catch (e) { Alert.alert("No se pudo rechazar", e.message); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={{ paddingHorizontal: 20 }}>
        {/* Tocar el @alias abre el perfil de la persona */}
        <TopBar title={`@${perfil.alias}`} onBack={onBack} onTitlePress={onAbrirPerfil} />
      </View>

      <FlatList
        ref={listRef}
        data={mensajes}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 10, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text style={styles.vacio}>
            {chat ? "Cargando mensajes..." : `Escribe tu primer mensaje a ${perfil.nombre}.`}
          </Text>
        }
        renderItem={({ item: m }) => {
          const yo = m.de === miUid;
          return (
            // El texto va en su burbuja y el conjunto como tarjeta aparte, sin burbuja granate alrededor
            <View style={{ alignItems: yo ? "flex-end" : "flex-start", gap: 6 }}>
              {!!m.texto && (
                <View style={[styles.burbuja, yo ? styles.burbujaYo : styles.burbujaOtro]}>
                  <Text style={[styles.burbujaTexto, yo && { color: colors.onAccent }]}>{m.texto}</Text>
                </View>
              )}
              {!!m.adjunto && <AdjuntoPreview adjunto={m.adjunto} prendas={prendas} />}
            </View>
          );
        }}
      />

      {esSolicitud ? (
        // Alguien que no tiene seguimiento mutuo contigo te ha escrito: decides si aceptas la conversación
        <View style={[styles.compose, margenInferior]}>
          <Text style={styles.aviso}>@{perfil.alias} quiere chatear contigo. Hasta que aceptes, solo puede enviarte {LIMITE_SIN_ACEPTAR} mensajes.</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <GhostButton onPress={rechazar} style={{ flex: 1 }}>Rechazar</GhostButton>
            <PrimaryButton onPress={aceptar} style={{ flex: 1 }}>Aceptar</PrimaryButton>
          </View>
        </View>
      ) : !envio.puede ? (
        <View style={[styles.compose, margenInferior]}>
          <Text style={styles.aviso}>
            {envio.motivo === "rechazada"
              ? `@${perfil.alias} no ha aceptado la conversación.`
              : `Has enviado los ${LIMITE_SIN_ACEPTAR} mensajes permitidos. Podrás seguir escribiendo cuando @${perfil.alias} acepte chatear contigo.`}
          </Text>
        </View>
      ) : (
        <View style={[styles.compose, margenInferior]}>
          {envio.restantes != null && (
            <Text style={styles.aviso}>
              Puedes enviar {envio.restantes} {envio.restantes === 1 ? "mensaje más" : "mensajes más"} hasta que @{perfil.alias} acepte chatear contigo.
            </Text>
          )}
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
            <TouchableOpacity
              onPress={enviar} disabled={enviando}
              style={[styles.roundBtn, { backgroundColor: colors.accent, borderColor: colors.accent, opacity: enviando ? 0.5 : 1 }]}
            >
              <Ionicons name="send" size={16} color={colors.onAccent} />
            </TouchableOpacity>
          </View>
        </View>
      )}

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

/* ---- Pantalla: lista de conversaciones, solicitudes y chat ---- */
// abrirCon: perfil con el que abrir una conversación nada más entrar (viene del botón Mensajes de un perfil)
export default function MensajesScreen({ chats, relaciones, miUid, prendas, conjuntos, abrirCon, onAbierto, onBack, onHiloChange }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const perfilDe = usePerfiles(chats);

  const [vista, setVista] = useState("lista"); // "lista" | "solicitudes"
  const [hiloPerfil, setHiloPerfil] = useState(null);
  const [perfilAbierto, setPerfilAbierto] = useState(null); // perfil visto desde el chat, a pantalla completa
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (abrirCon) { setHiloPerfil(abrirCon); setVista("lista"); if (onAbierto) onAbierto(); }
  }, [abrirCon]);

  // Avisa a App.js para ocultar el menú inferior mientras hay una conversación abierta
  // (se vuelve a mostrar al ver un perfil)
  useEffect(() => {
    onHiloChange(!!hiloPerfil && !perfilAbierto);
    return () => onHiloChange(false);
  }, [hiloPerfil, perfilAbierto]);

  const masReciente = (a, b) => b.actualizado - a.actualizado;
  // Mensajes: conversaciones abiertas y las que he iniciado yo. Solicitudes: las que me han iniciado a mí sin aceptar.
  const principales = chats.filter((c) => c.estado === "abierta" || c.iniciador === miUid).sort(masReciente);
  const solicitudes = chats.filter((c) => c.estado === "pendiente" && c.iniciador !== miUid).sort(masReciente);

  const texto = busqueda.trim().toLowerCase();
  const filtradas = principales.filter((c) => {
    if (!texto) return true;
    const p = perfilDe(c.otroUid);
    return p.alias.toLowerCase().includes(texto) || p.nombre.toLowerCase().includes(texto);
  });

  const chatActual = hiloPerfil ? chats.find((c) => c.otroUid === hiloPerfil.id) || null : null;
  const relActual = hiloPerfil ? relaciones.find((r) => r.otroUid === hiloPerfil.id) : null;

  const fila = (c, esSolicitud) => {
    const p = perfilDe(c.otroUid);
    const mio = c.ultimo?.de === miUid;
    const pendiente = !esSolicitud && c.iniciador === miUid && c.estado !== "abierta";
    return (
      <TouchableOpacity key={c.id} style={styles.fila} onPress={() => setHiloPerfil(p)}>
        <Avatar foto={p.foto} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nombre}>{p.nombre}</Text>
          <Text style={styles.preview} numberOfLines={1}>
            {pendiente ? (c.estado === "rechazada" ? "No aceptada · " : "Pendiente de aceptar · ") : ""}
            {mio ? "Tú: " : ""}{c.ultimo?.texto || `@${p.alias}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, display: perfilAbierto ? "none" : "flex" }}>
        {hiloPerfil ? (
          <Hilo
            perfil={hiloPerfil} chat={chatActual} mutuo={esMutuo(relActual)} miUid={miUid}
            prendas={prendas} conjuntos={conjuntos}
            onBack={() => setHiloPerfil(null)} onAbrirPerfil={() => setPerfilAbierto(hiloPerfil)}
          />
        ) : vista === "solicitudes" ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
            <TopBar title="Solicitudes" onBack={() => setVista("lista")} />
            <Text style={styles.nota}>Mensajes de personas con las que no hay seguimiento mutuo. Hasta que aceptes, solo pueden enviarte {LIMITE_SIN_ACEPTAR} mensajes.</Text>
            {solicitudes.length === 0 ? (
              <EmptyState icon="mail-open-outline" text="No tienes solicitudes de mensajes." />
            ) : (
              <View style={{ gap: 10, marginTop: 14 }}>{solicitudes.map((c) => fila(c, true))}</View>
            )}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
            <TopBar
              title="Mensajes" onBack={onBack}
              right={
                <TouchableOpacity style={styles.btnSolicitudes} onPress={() => setVista("solicitudes")}>
                  <Text style={styles.btnSolicitudesTexto}>Solicitudes</Text>
                  {solicitudes.length > 0 && (
                    <View style={styles.badge}><Text style={styles.badgeTexto}>{solicitudes.length}</Text></View>
                  )}
                </TouchableOpacity>
              }
            />

            {principales.length > 0 && (
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color={colors.inkFaint} />
                <TextInput
                  value={busqueda} onChangeText={setBusqueda} placeholder="Buscar en tus conversaciones..."
                  autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.inkFaint} style={styles.searchInput}
                />
                {!!busqueda && (
                  <TouchableOpacity onPress={() => setBusqueda("")} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={colors.inkFaint} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {principales.length === 0 ? (
              <EmptyState icon="chatbubble-outline" text="Todavía no tienes conversaciones. Abre el perfil de alguien y pulsa Mensajes para escribirle." />
            ) : filtradas.length === 0 ? (
              <EmptyState icon="search-outline" text="No hay conversaciones que coincidan con esa búsqueda." />
            ) : (
              <View style={{ gap: 10 }}>{filtradas.map((c) => fila(c, false))}</View>
            )}
          </ScrollView>
        )}
      </View>

      {!!perfilAbierto && (
        <PerfilAmigoScreen
          perfil={perfilAbierto} relaciones={relaciones} miUid={miUid}
          onBack={() => setPerfilAbierto(null)}
          onMensaje={() => setPerfilAbierto(null)} // ya estamos en su conversación: se vuelve a ella
        />
      )}
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  vacio: { fontSize: 13, color: c.inkSoft, textAlign: "center", marginTop: 30, lineHeight: 19 },
  nota: { fontSize: 13, color: c.inkSoft, lineHeight: 19 },
  burbuja: { maxWidth: "78%", borderRadius: 14, paddingVertical: 9, paddingHorizontal: 12 },
  burbujaYo: { backgroundColor: c.accent },
  burbujaOtro: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
  burbujaTexto: { fontSize: 14, lineHeight: 20, color: c.ink },
  // Tarjeta del conjunto: un poco más oscura que el fondo del chat para que se distinga
  adjunto: { backgroundColor: c.line, borderRadius: 12, padding: 8 },
  adjuntoGrid: { width: 120, aspectRatio: 1, borderRadius: 8, overflow: "hidden", flexDirection: "row", flexWrap: "wrap", backgroundColor: c.goldSoft },
  adjuntoNombre: { marginTop: 6, fontSize: 12, fontWeight: "500", color: c.ink },
  adjuntoSub: { fontSize: 11, color: c.inkSoft },
  compose: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg },
  aviso: { fontSize: 12.5, color: c.inkSoft, lineHeight: 18, marginBottom: 10 },
  roundBtn: { width: 38, height: 38, borderRadius: 999, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  quitarAdjunto: { width: 26, height: 26, borderRadius: 999, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, marginBottom: 18 },
  searchInput: { flex: 1, fontSize: 14, color: c.ink, paddingVertical: 11, fontFamily: "Inter_400Regular" },
  fila: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  nombre: { fontSize: 14, fontWeight: "500", color: c.ink },
  preview: { fontSize: 12.5, color: c.inkSoft, marginTop: 1 },
  btnSolicitudes: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  btnSolicitudesTexto: { fontSize: 13, fontWeight: "500", color: c.accent },
  badge: { minWidth: 18, height: 18, borderRadius: 999, backgroundColor: "#E53950", alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeTexto: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
});
