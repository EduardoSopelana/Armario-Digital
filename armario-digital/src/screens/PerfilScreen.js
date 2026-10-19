import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import Text from "../components/Text";
import Avatar from "../components/Avatar";
import { TopBar } from "../components/UI";
import { MenuRow, Card } from "../components/MenuRow";
import AmigosScreen from "./AmigosScreen";
import SeguidoresScreen from "./SeguidoresScreen";
import PerfilAmigoScreen from "./PerfilAmigoScreen";
import ConfigScreen from "./ConfigScreen";
import { CATEGORIAS } from "../constants";
import { useStyles } from "../theme";

// Menú de perfil: Prendas por categoría, Amigos y Configuración, con Siguiendo y Seguidores bajo el nombre.
// App.js lo vuelve a montar al pulsar el botón de Perfil de la barra inferior, así siempre
// se vuelve al menú principal.
export default function PerfilScreen({
  prendas, conjuntos, usuario, relaciones, pendientes, miUid,
  onVerCategoria, onActualizarUsuario, onCerrarSesion, onReset,
}) {
  const styles = useStyles(createStyles);
  const [vista, setVista] = useState("menu"); // menu | categorias | amigos | siguiendo | seguidores | config
  const [perfilAbierto, setPerfilAbierto] = useState(null); // perfil de otra persona, a pantalla completa

  const numSiguiendo = relaciones.filter((r) => r.yoSigo === "accepted").length;
  const numSeguidores = relaciones.filter((r) => r.meSigue === "accepted").length;

  if (vista === "categorias") {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
        <TopBar title="Prendas por categoría" onBack={() => setVista("menu")} />
        <Text style={styles.help}>Toca una categoría para ver esas prendas en tu armario.</Text>
        <Card>
          {CATEGORIAS.map((c, i) => {
            const n = prendas.filter((p) => p.categoria === c.id).length;
            return (
              <MenuRow
                key={c.id} icon="shirt-outline" label={c.label}
                sub={`${n} ${n === 1 ? "prenda" : "prendas"}`}
                onPress={() => onVerCategoria(c.id)} last={i === CATEGORIAS.length - 1}
              />
            );
          })}
        </Card>
      </ScrollView>
    );
  }

  if (vista === "amigos" || vista === "siguiendo" || vista === "seguidores") {
    // La lista se mantiene montada (oculta) mientras se ve un perfil, así al volver atrás
    // sigues en el mismo punto (con la misma búsqueda, por ejemplo).
    const volver = () => setVista("menu");
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: perfilAbierto ? "none" : "flex" }}>
          {vista === "amigos" ? (
            <AmigosScreen relaciones={relaciones} miUid={miUid} onAbrirPerfil={setPerfilAbierto} onBack={volver} />
          ) : (
            <SeguidoresScreen tipo={vista} relaciones={relaciones} miUid={miUid} onAbrirPerfil={setPerfilAbierto} onBack={volver} />
          )}
        </View>
        {!!perfilAbierto && (
          <PerfilAmigoScreen
            perfil={perfilAbierto}
            rel={relaciones.find((r) => r.otroUid === perfilAbierto.id)}
            miUid={miUid}
            onBack={() => setPerfilAbierto(null)}
          />
        )}
      </View>
    );
  }

  if (vista === "config") {
    return (
      <ConfigScreen
        usuario={usuario} onActualizarUsuario={onActualizarUsuario}
        onCerrarSesion={onCerrarSesion} onReset={onReset} onBack={() => setVista("menu")}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
      <TopBar title="Perfil" />
      <View style={styles.header}>
        <Avatar foto={usuario?.foto} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nombre}>{usuario?.nombre || "Mi cuenta"}</Text>
          <Text style={styles.sub}>@{usuario?.alias} · {prendas.length} prendas · {conjuntos.length} conjuntos</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => setVista("siguiendo")}>
          <Text style={styles.statNum}>{numSiguiendo}</Text>
          <Text style={styles.statLabel}>Siguiendo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => setVista("seguidores")}>
          <Text style={styles.statNum}>{numSeguidores}</Text>
          <Text style={styles.statLabel}>{numSeguidores === 1 ? "Seguidor" : "Seguidores"}</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <MenuRow icon="grid-outline" label="Prendas por categoría" sub="Organiza y accede por tipo" onPress={() => setVista("categorias")} />
        <MenuRow
          icon="people-outline" label="Amigos"
          sub={pendientes > 0 ? `${pendientes} ${pendientes === 1 ? "solicitud pendiente" : "solicitudes pendientes"}` : "Buscar personas y ver novedades"}
          badge={pendientes > 0 ? pendientes : undefined}
          onPress={() => setVista("amigos")}
        />
        <MenuRow icon="settings-outline" label="Configuración" sub="Tema, privacidad, cuenta" onPress={() => setVista("config")} last />
      </Card>
    </ScrollView>
  );
}

const createStyles = (c) => StyleSheet.create({
  help: { color: c.inkSoft, fontSize: 13.5, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  nombre: { fontSize: 16, fontWeight: "500", color: c.ink },
  sub: { fontSize: 13, color: c.inkSoft, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 22 },
  statCard: { flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  statNum: { fontSize: 22, fontWeight: "500", color: c.accent, fontFamily: "display" },
  statLabel: { fontSize: 12.5, color: c.inkSoft, marginTop: 1 },
});
