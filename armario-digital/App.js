import React, { useEffect, useState } from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Fraunces_500Medium, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";

import { ThemeProvider, useTheme } from "./src/theme";
import { getJSON, setJSON } from "./src/storage";
import { confirmarEliminar } from "./src/confirm";
import { getCurrentUser, updateProfile, signOut } from "./src/services/authService";
import { migrarPrendas, esUriExterna, guardarImagen, borrarImagen, borrarTodasLasFotos } from "./src/images";
import { getFriendIds, toggleFriend } from "./src/services/friendsService";
import { getAllMessages, sendMessage } from "./src/services/messagesService";

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
  const [usuario, setUsuario] = useState(null);
  const [amigos, setAmigos] = useState([]);
  const [mensajes, setMensajes] = useState({});
  const [cargado, setCargado] = useState(false);

  const [modalAddPrenda, setModalAddPrenda] = useState(false);
  const [editandoPrenda, setEditandoPrenda] = useState(null);
  const [prendaAbierta, setPrendaAbierta] = useState(null);
  const [conjuntoAbierto, setConjuntoAbierto] = useState(null);
  const [editandoConjunto, setEditandoConjunto] = useState(null);
  const [categoriaParaArmario, setCategoriaParaArmario] = useState(null);
  const [ocultarNav, setOcultarNav] = useState(false);

  useEffect(() => {
    (async () => {
      // Las fotos antiguas (ruta temporal) se pasan a la carpeta permanente de la app
      const guardadas = await getJSON("prendas", []);
      const { lista, cambiado } = migrarPrendas(guardadas);
      if (cambiado) await setJSON("prendas", lista);
      setPrendas(lista);
      setConjuntos(await getJSON("conjuntos", []));
      let u = await getCurrentUser();
      if (u && esUriExterna(u.foto)) {
        const nueva = guardarImagen(u.foto);
        if (nueva !== u.foto) u = await updateProfile(u, { foto: nueva });
      }
      setUsuario(u);
      setAmigos(await getFriendIds());
      setMensajes(await getAllMessages());
      setCargado(true);
    })();
  }, []);

  const persistPrendas = (list) => { setPrendas(list); setJSON("prendas", list); };
  const persistConjuntos = (list) => { setConjuntos(list); setJSON("conjuntos", list); };

  // Al salir de "crear" se descarta cualquier edición de conjunto en curso
  const navegar = (destino) => {
    if (destino !== "crear") setEditandoConjunto(null);
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
  };

  const resetTodo = () => { borrarTodasLasFotos(); persistPrendas([]); persistConjuntos([]); };

  /* ---------- Amigos y mensajes ---------- */
  const alternarAmigo = async (id) => { setAmigos(await toggleFriend(id, amigos)); };

  const enviarMensaje = async (amigoId, texto, adjunto) => {
    setMensajes(await sendMessage(mensajes, amigoId, texto, adjunto));
  };

  /* ---------- Prendas ---------- */
  const guardarPrenda = (prenda) => {
    const existe = prendas.some((p) => p.id === prenda.id);
    const anterior = prendas.find((p) => p.id === prenda.id);
    if (anterior && anterior.foto && anterior.foto !== prenda.foto) borrarImagen(anterior.foto); // foto reemplazada
    const list = existe ? prendas.map((p) => (p.id === prenda.id ? prenda : p)) : [prenda, ...prendas];
    persistPrendas(list);
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
    borrarImagen(prendas.find((p) => p.id === id)?.foto);
    persistPrendas(prendas.filter((p) => p.id !== id));
    persistConjuntos(conjuntos.map((c) => ({ ...c, prendaIds: c.prendaIds.filter((pid) => pid !== id) })));
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
    const list = prendas.map((p) => (p.id === id ? { ...p, favorito: !p.favorito } : p));
    persistPrendas(list);
    setPrendaAbierta((prev) => (prev && prev.id === id ? list.find((p) => p.id === id) : prev));
  };

  /* ---------- Conjuntos ---------- */
  const guardarConjunto = (conjunto) => {
    const existe = conjuntos.some((c) => c.id === conjunto.id);
    const list = existe ? conjuntos.map((c) => (c.id === conjunto.id ? conjunto : c)) : [conjunto, ...conjuntos];
    persistConjuntos(list);
    setEditandoConjunto(null);
    setScreen("conjuntos");
  };

  const editarConjunto = (conjunto) => {
    setConjuntoAbierto(null);
    setEditandoConjunto(conjunto);
    setScreen("crear");
  };

  const eliminarConjunto = (id) => {
    persistConjuntos(conjuntos.filter((c) => c.id !== id));
    setConjuntoAbierto(null);
  };

  const pedirEliminarConjunto = (conjunto) => {
    confirmarEliminar("Eliminar conjunto", `¿Eliminar el conjunto "${conjunto.nombre}"?`, () => eliminarConjunto(conjunto.id));
  };

  const toggleFavoritoConjunto = (id) => {
    const list = conjuntos.map((c) => (c.id === id ? { ...c, favorito: !c.favorito } : c));
    persistConjuntos(list);
    setConjuntoAbierto((prev) => (prev && prev.id === id ? list.find((c) => c.id === id) : prev));
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
              amigos={amigos}
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
              prendas={prendas}
              conjuntos={conjuntos}
              usuario={usuario}
              amigos={amigos}
              onVerCategoria={(id) => { setCategoriaParaArmario(id); navegar("armario"); }}
              onToggleAmigo={alternarAmigo}
              onActualizarUsuario={actualizarUsuario}
              onCerrarSesion={cerrarSesion}
              onReset={resetTodo}
            />
          )}
        </View>
      </SafeAreaView>

      {!ocultarNav && <BottomNav screen={screen} onNav={navegar} compact={false} />}

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
    </View>
  );
}
