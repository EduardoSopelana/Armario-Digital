import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StatusBar, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Fraunces_500Medium, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";

import { ThemeProvider, useTheme } from "./src/theme";
import { getJSON, removeKey } from "./src/storage";
import { confirmarEliminar } from "./src/confirm";
import { borrarTodasLasFotos } from "./src/images";
import { getCurrentUser, updateProfile, signOut } from "./src/services/authService";
import { escucharRelaciones } from "./src/services/friendsService";
import { getAllMessages, sendMessage } from "./src/services/messagesService";
import * as nube from "./src/services/wardrobeService";

import Text from "./src/components/Text";
import BottomNav from "./src/components/BottomNav";
import AuthScreen from "./src/screens/AuthScreen";
import InicioScreen from "./src/screens/InicioScreen";
import ArmarioScreen from "./src/screens/ArmarioScreen";
import ConjuntosScreen from "./src/screens/ConjuntosScreen";
import CrearConjuntoScreen from "./src/screens/CrearConjuntoScreen";
import FavoritosScreen from "./src/screens/FavoritosScreen";
import MensajesScreen from "./src/screens/MensajesScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import PrendaFormSheet from "./src/screens/PrendaFormSheet";
import ItemDetailSheet from "./src/screens/ItemDetailSheet";
import OutfitDetailSheet from "./src/screens/OutfitDetailSheet";

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { colors, tema } = useTheme();
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium, Fraunces_600SemiBold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  });

  const [screen, setScreen] = useState("inicio");
  const [prendas, setPrendas] = useState([]);
  const [conjuntos, setConjuntos] = useState([]);
  const [nubeLista, setNubeLista] = useState(false); // ya han llegado las prendas y conjuntos de la nube
  const [migrando, setMigrando] = useState(null);     // { hecho, total } mientras se suben datos del móvil
  const [usuario, setUsuario] = useState(null);
  const [relaciones, setRelaciones] = useState([]); // a quién sigo y quién me sigue (en tiempo real)
  const [mensajes, setMensajes] = useState({});
  const [cargado, setCargado] = useState(false);

  const [modalAddPrenda, setModalAddPrenda] = useState(false);
  const [editandoPrenda, setEditandoPrenda] = useState(null);
  const [prendaAbierta, setPrendaAbierta] = useState(null);
  const [conjuntoAbierto, setConjuntoAbierto] = useState(null);
  const [editandoConjunto, setEditandoConjunto] = useState(null);
  const [categoriaParaArmario, setCategoriaParaArmario] = useState(null);
  const [ocultarNav, setOcultarNav] = useState(false);
  const [perfilKey, setPerfilKey] = useState(0); // al cambiar, el Perfil vuelve a su menú principal

  const errorMostrado = useRef(false);
  const errorRelacionesMostrado = useRef(false);
  const migracionComprobada = useRef(null);

  const avisarError = (e) => Alert.alert("Algo ha fallado", e?.message || "Inténtalo de nuevo.");

  /* ---------- carga inicial (cuenta, amigos y mensajes) ---------- */
  useEffect(() => {
    (async () => {
      setUsuario(await getCurrentUser());
      setMensajes(await getAllMessages());
      setCargado(true);
    })();
  }, []);

  /* ---------- armario en la nube: se escucha en tiempo real ---------- */
  useEffect(() => {
    if (!usuario?.id) {
      setPrendas([]);
      setConjuntos([]);
      setNubeLista(false);
      return;
    }
    errorMostrado.current = false;
    let listoPrendas = false;
    let listoConjuntos = false;
    const comprobar = () => { if (listoPrendas && listoConjuntos) setNubeLista(true); };
    const alFallar = (e) => {
      if (!errorMostrado.current) {
        errorMostrado.current = true;
        Alert.alert("No se pudieron cargar tus datos", e.message);
      }
    };

    const dejarDePrendas = nube.escucharPrendas(
      usuario.id,
      (lista) => { setPrendas(lista); listoPrendas = true; comprobar(); },
      (e) => { alFallar(e); listoPrendas = true; comprobar(); }
    );
    const dejarDeConjuntos = nube.escucharConjuntos(
      usuario.id,
      (lista) => { setConjuntos(lista); listoConjuntos = true; comprobar(); },
      (e) => { alFallar(e); listoConjuntos = true; comprobar(); }
    );
    // Sin conexión puede que nunca llegue la primera respuesta: pasado un rato se continúa igualmente
    const limite = setTimeout(() => setNubeLista(true), 7000);

    return () => { dejarDePrendas(); dejarDeConjuntos(); clearTimeout(limite); };
  }, [usuario?.id]);

  /* ---------- seguidores y seguidos: se escuchan en tiempo real ---------- */
  useEffect(() => {
    if (!usuario?.id) { setRelaciones([]); return; }
    errorRelacionesMostrado.current = false;
    return escucharRelaciones(usuario.id, setRelaciones, (e) => {
      if (!errorRelacionesMostrado.current) {
        errorRelacionesMostrado.current = true;
        Alert.alert("No se pudieron cargar tus amigos", e.message);
      }
    });
  }, [usuario?.id]);

  // Personas con las que hay una relación aceptada en cualquier sentido (se usa en Mensajes)
  const contactosIds = useMemo(
    () => relaciones.filter((r) => r.yoSigo === "accepted" || r.meSigue === "accepted").map((r) => r.otroUid),
    [relaciones]
  );
  // Personas que han pedido seguirme y aún no he aceptado
  const pendientes = useMemo(() => relaciones.filter((r) => r.meSigue === "pending").length, [relaciones]);

  /* ---------- lo que había guardado solo en el móvil se ofrece subir a la cuenta ---------- */
  useEffect(() => {
    if (!usuario?.id || !nubeLista || migracionComprobada.current === usuario.id) return;
    migracionComprobada.current = usuario.id;
    (async () => {
      const locPrendas = await getJSON("prendas", []);
      const locConjuntos = await getJSON("conjuntos", []);
      if (locPrendas.length === 0 && locConjuntos.length === 0) return;
      Alert.alert(
        "Datos guardados en este móvil",
        `Hemos encontrado ${locPrendas.length} prendas y ${locConjuntos.length} conjuntos que solo estaban en este móvil. ¿Quieres subirlos a tu cuenta para tenerlos en la nube?`,
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Subirlos", onPress: () => subirDatosLocales(locPrendas, locConjuntos) },
        ]
      );
    })();
  }, [usuario?.id, nubeLista]);

  const subirDatosLocales = async (locPrendas, locConjuntos) => {
    setMigrando({ hecho: 0, total: locPrendas.length + locConjuntos.length });
    try {
      await nube.subirLocales(usuario.id, locPrendas, locConjuntos, (hecho, total) => setMigrando({ hecho, total }));
      // Todo subido: se limpian las copias antiguas del móvil para no duplicar datos
      await removeKey("prendas");
      await removeKey("conjuntos");
      borrarTodasLasFotos();
      Alert.alert("Listo", "Tus prendas y conjuntos ya están en tu cuenta.");
    } catch (e) {
      Alert.alert("No se pudo subir todo", `${e.message}\n\nTus datos del móvil siguen guardados y se volverá a preguntar la próxima vez.`);
    } finally {
      setMigrando(null);
    }
  };

  // Al salir de "crear" se descarta cualquier edición de conjunto en curso
  // Pulsar un botón de la barra inferior siempre lleva al menú principal de esa sección
  const navegar = (destino) => {
    if (destino !== "crear") setEditandoConjunto(null);
    if (destino === "perfil") setPerfilKey((k) => k + 1);
    setScreen(destino);
  };

  /* ---------- Cuenta ---------- */
  const iniciarSesion = (perfil) => { setUsuario(perfil); setScreen("inicio"); };

  const actualizarUsuario = async (cambios) => { setUsuario(await updateProfile(usuario, cambios)); };

  const cerrarSesion = async () => {
    await signOut();
    setUsuario(null);
    setScreen("inicio");
    setEditandoConjunto(null);
    setPrendaAbierta(null);
    setConjuntoAbierto(null);
  };

  const resetTodo = () => { nube.borrarTodo(usuario.id).catch(avisarError); };

  /* ---------- Amigos y mensajes ---------- */
  const enviarMensaje = async (amigoId, texto, adjunto) => {
    setMensajes(await sendMessage(mensajes, amigoId, texto, adjunto));
  };

  /* ---------- Prendas ---------- */
  const guardarPrenda = (prenda) => {
    nube.guardarPrenda(usuario.id, prenda).catch(avisarError);
    setModalAddPrenda(false);
    setEditandoPrenda(null);
    setPrendaAbierta(null);
  };

  // Primero se cierra la hoja de detalle y, pasado un momento, se abre el formulario:
  // en iOS no se puede cerrar un Modal y abrir otro en el mismo instante.
  const editarPrenda = (prenda) => {
    setPrendaAbierta(null);
    setTimeout(() => setEditandoPrenda(prenda), 450);
  };

  const eliminarPrenda = (id) => {
    const afectados = conjuntos.filter((c) => c.prendaIds.includes(id)).map((c) => c.id);
    nube.eliminarPrenda(usuario.id, id, afectados).catch(avisarError);
    setPrendaAbierta(null);
  };

  const pedirEliminarPrenda = (prenda) => {
    confirmarEliminar(
      "Eliminar prenda",
      `¿Eliminar "${prenda.nombre}" de tu armario? También se quitará de los conjuntos que la usen.`,
      () => eliminarPrenda(prenda.id)
    );
  };

  const toggleFavoritoPrenda = (id) => {
    const prenda = prendas.find((p) => p.id === id);
    if (!prenda) return;
    const favorito = !prenda.favorito;
    nube.actualizarCampo(usuario.id, "prendas", id, { favorito }).catch(avisarError);
    setPrendaAbierta((prev) => (prev && prev.id === id ? { ...prev, favorito } : prev));
  };

  /* ---------- Conjuntos ---------- */
  const guardarConjunto = (conjunto) => {
    nube.guardarConjunto(usuario.id, conjunto).catch(avisarError);
    setEditandoConjunto(null);
    setScreen("conjuntos");
  };

  const editarConjunto = (conjunto) => {
    setConjuntoAbierto(null);
    setEditandoConjunto(conjunto);
    setScreen("crear");
  };

  const eliminarConjunto = (id) => {
    nube.eliminarConjunto(usuario.id, id).catch(avisarError);
    setConjuntoAbierto(null);
  };

  const pedirEliminarConjunto = (conjunto) => {
    confirmarEliminar("Eliminar conjunto", `¿Eliminar el conjunto "${conjunto.nombre}"?`, () => eliminarConjunto(conjunto.id));
  };

  const toggleFavoritoConjunto = (id) => {
    const conjunto = conjuntos.find((c) => c.id === id);
    if (!conjunto) return;
    const favorito = !conjunto.favorito;
    nube.actualizarCampo(usuario.id, "conjuntos", id, { favorito }).catch(avisarError);
    setConjuntoAbierto((prev) => (prev && prev.id === id ? { ...prev, favorito } : prev));
  };

  /* ---------- Render ---------- */
  const barraEstado = <StatusBar barStyle={tema === "dark" ? "light-content" : "dark-content"} backgroundColor={colors.bg} />;

  if (!cargado || !fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!usuario) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {barraEstado}
        <AuthScreen onLogin={iniciarSesion} />
      </View>
    );
  }

  if (!nubeLista) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 14 }}>
        {barraEstado}
        <ActivityIndicator color={colors.accent} />
        <Text style={{ color: colors.inkSoft, fontSize: 14 }}>Cargando tu armario...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {barraEstado}

      {/* SafeAreaView solo en la parte de arriba: así el menú inferior puede bajar hasta el borde */}
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {screen === "inicio" && (
            <InicioScreen
              prendas={prendas}
              conjuntos={conjuntos}
              onNav={navegar}
              onAddPrenda={() => setModalAddPrenda(true)}
              onOpenConjunto={setConjuntoAbierto}
              onToggleFavoritoConjunto={toggleFavoritoConjunto}
              onAbrirFavoritos={() => navegar("favoritos")}
              onAbrirMensajes={() => navegar("mensajes")}
            />
          )}
          {screen === "armario" && (
            <ArmarioScreen
              prendas={prendas}
              onOpenPrenda={setPrendaAbierta}
              onAddPrenda={() => setModalAddPrenda(true)}
              onToggleFavorito={toggleFavoritoPrenda}
              categoriaInicial={categoriaParaArmario}
              onCategoriaConsumida={() => setCategoriaParaArmario(null)}
            />
          )}
          {screen === "conjuntos" && (
            <ConjuntosScreen
              conjuntos={conjuntos}
              prendas={prendas}
              onOpen={setConjuntoAbierto}
              onNuevo={() => navegar("crear")}
              onToggleFavorito={toggleFavoritoConjunto}
            />
          )}
          {screen === "crear" && (
            <CrearConjuntoScreen
              key={editandoConjunto?.id || "nuevo"}
              prendas={prendas}
              initial={editandoConjunto}
              onSave={guardarConjunto}
              onCancel={() => navegar("conjuntos")}
            />
          )}
          {screen === "favoritos" && (
            <FavoritosScreen
              prendas={prendas}
              conjuntos={conjuntos}
              onBack={() => navegar("inicio")}
              onOpenPrenda={setPrendaAbierta}
              onOpenConjunto={setConjuntoAbierto}
              onToggleFavoritoPrenda={toggleFavoritoPrenda}
              onToggleFavoritoConjunto={toggleFavoritoConjunto}
            />
          )}
          {screen === "mensajes" && (
            <MensajesScreen
              amigos={contactosIds}
              mensajes={mensajes}
              prendas={prendas}
              conjuntos={conjuntos}
              onEnviar={enviarMensaje}
              onBack={() => navegar("inicio")}
              onHiloChange={setOcultarNav}
            />
          )}
          {screen === "perfil" && (
            <PerfilScreen
              key={perfilKey}
              prendas={prendas}
              conjuntos={conjuntos}
              usuario={usuario}
              relaciones={relaciones}
              pendientes={pendientes}
              miUid={usuario.id}
              onVerCategoria={(id) => { setCategoriaParaArmario(id); navegar("armario"); }}
              onActualizarUsuario={actualizarUsuario}
              onCerrarSesion={cerrarSesion}
              onReset={resetTodo}
            />
          )}
        </View>
      </SafeAreaView>

      {!ocultarNav && <BottomNav screen={screen} onNav={navegar} compact={false} badges={{ perfil: pendientes > 0 }} />}

      {/* Cada hoja solo existe mientras está abierta: así el formulario siempre arranca limpio
          y nunca hay dos Modal abiertos a la vez. */}
      {(modalAddPrenda || !!editandoPrenda) && (
        <PrendaFormSheet
          key={editandoPrenda?.id || "nueva"}
          visible
          initial={editandoPrenda}
          onSave={guardarPrenda}
          onClose={() => { setModalAddPrenda(false); setEditandoPrenda(null); }}
        />
      )}

      {!!prendaAbierta && (
        <ItemDetailSheet
          prenda={prendaAbierta}
          onClose={() => setPrendaAbierta(null)}
          onEdit={() => editarPrenda(prendaAbierta)}
          onDelete={() => pedirEliminarPrenda(prendaAbierta)}
          onToggleFavorito={toggleFavoritoPrenda}
        />
      )}

      {!!conjuntoAbierto && (
        <OutfitDetailSheet
          conjunto={conjuntoAbierto}
          prendas={prendas}
          onClose={() => setConjuntoAbierto(null)}
          onEdit={() => editarConjunto(conjuntoAbierto)}
          onDelete={() => pedirEliminarConjunto(conjuntoAbierto)}
          onToggleFavorito={toggleFavoritoConjunto}
        />
      )}

      {!!migrando && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", gap: 14 }]}>
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={{ color: "#FFFFFF", fontSize: 15 }}>Subiendo a tu cuenta... {migrando.hecho}/{migrando.total}</Text>
        </View>
      )}
    </View>
  );
}
