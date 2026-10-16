import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import Text from "../components/Text";
import Avatar from "../components/Avatar";
import { TopBar } from "../components/UI";
import { MenuRow, Card } from "../components/MenuRow";
import AmigosScreen from "./AmigosScreen";
import PerfilAmigoScreen from "./PerfilAmigoScreen";
import ConfigScreen from "./ConfigScreen";
import { CATEGORIAS } from "../constants";
import { useStyles } from "../theme";

// Menú de perfil con tres submenús: Prendas por categoría, Amigos y Configuración.
// App.js lo vuelve a montar al pulsar el botón de Perfil de la barra inferior, así siempre
// se vuelve al menú principal.
export default function PerfilScreen({
  prendas, conjuntos, usuario, relaciones, pendientes, miUid,
  onVerCategoria, onActualizarUsuario, onCerrarSesion, onReset,
}) {
  const styles = useStyles(createStyles);
  const [vista, setVista] = useState("menu");
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

  if (vista === "amigos") {
    // La lista de amigos se mantiene montada (oculta) mientras se ve un perfil,
    // así al volver atrás sigues en la misma pestaña y con la misma búsqueda.
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: perfilAbierto ? "none" : "flex" }}>
          <AmigosScreen relaciones={relaciones} miUid={miUid} onAbrirPerfil={setPerfilAbierto} onBack={() => setVista("menu")} />
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

      <Card>
        <MenuRow icon="grid-outline" label="Prendas por categoría" sub="Organiza y accede por tipo" onPress={() => setVista("categorias")} />
        <MenuRow
          icon="people-outline" label="Amigos"
          sub={`${numSiguiendo} siguiendo · ${numSeguidores} ${numSeguidores === 1 ? "seguidor" : "seguidores"}${pendientes > 0 ? ` · ${pendientes} ${pendientes === 1 ? "solicitud" : "solicitudes"}` : ""}`}
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
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 26 },
  nombre: { fontSize: 16, fontWeight: "500", color: c.ink },
  sub: { fontSize: 13, color: c.inkSoft, marginTop: 2 },
});
