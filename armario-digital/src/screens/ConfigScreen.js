import React, { useState } from "react";
import { View, TextInput, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { pedirFoto } from "../imagePicker";
import Text from "../components/Text";
import { TopBar, Pill, PrimaryButton, GhostButton, FieldLabel, Sheet, useInputStyle } from "../components/UI";
import { MenuRow, SwitchRow, Card } from "../components/MenuRow";
import { confirmarAccion } from "../confirm";
import { changePassword, validarAlias, normalizarAlias } from "../services/authService";
import { normalizarTelefono } from "../services/contactsService";
import { useTheme } from "../theme";

const OPCIONES_MENSAJES = [
  { id: "normal", titulo: "Normal", detalle: "Quien no tenga seguimiento mutuo contigo puede enviarte 2 mensajes si tu perfil es privado, hasta que aceptes chatear. Si tu perfil es público, cualquiera puede escribirte." },
  { id: "mutuos", titulo: "Solo seguimiento mutuo", detalle: "Solo pueden escribirte las personas a las que sigues y que te siguen. Nadie más, ni siquiera 2 mensajes." },
  { id: "todos", titulo: "Cualquiera", detalle: "Cualquiera puede escribirte sin límite de mensajes y sin que tengas que aceptar nada." },
];

export default function ConfigScreen({ usuario, onActualizarUsuario, onCerrarSesion, onReset, onBack }) {
  const { colors, tema, setTema } = useTheme();
  const inputStyle = useInputStyle();

  const [editando, setEditando] = useState(null); // "alias" | "password" | null
  const [guardando, setGuardando] = useState(false);

  const [alias, setAlias] = useState(usuario.alias);
  const [errorAlias, setErrorAlias] = useState("");

  const [passActual, setPassActual] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [errorPass, setErrorPass] = useState("");

  const notif = usuario.notificaciones || { prendaAmigo: true, mensajes: true };

  // Guarda cambios en el perfil y avisa si algo falla (sin conexión, permisos...)
  const actualizar = async (cambios) => {
    try {
      await onActualizarUsuario(cambios);
      return true;
    } catch (e) {
      Alert.alert("No se pudo guardar", e.message || "Inténtalo de nuevo.");
      return false;
    }
  };

  const cambiarFoto = async () => {
    const uri = await pedirFoto("Foto de perfil"); // pregunta: cámara o galería
    if (uri) await actualizar({ foto: uri });
  };

  const abrirAlias = () => { setAlias(usuario.alias); setErrorAlias(""); setEditando("alias"); };

  const guardarAlias = async () => {
    const limpio = normalizarAlias(alias);
    const problema = validarAlias(limpio);
    if (problema) { setErrorAlias(problema); return; }
    if (limpio === usuario.alias) { setEditando(null); return; }
    setGuardando(true);
    try {
      await onActualizarUsuario({ alias: limpio });
      setEditando(null);
    } catch (e) {
      setErrorAlias(e.message || "No se pudo cambiar el alias.");
    } finally {
      setGuardando(false);
    }
  };

  const [telefonoTexto, setTelefonoTexto] = useState("");
  const [descubrible, setDescubrible] = useState(true);
  const [errorTelefono, setErrorTelefono] = useState("");

  const abrirTelefono = () => {
    setTelefonoTexto(usuario.telefono || "");
    setDescubrible(usuario.telefonoDescubrible !== false);
    setErrorTelefono("");
    setEditando("telefono");
  };

  const guardarTelefonoSheet = async () => {
    const normalizado = normalizarTelefono(telefonoTexto);
    if (!normalizado) { setErrorTelefono("Escribe un número válido, por ejemplo +34 612 345 678."); return; }
    setGuardando(true);
    try {
      await onActualizarUsuario({ telefono: normalizado, telefonoDescubrible: descubrible });
      setEditando(null);
    } catch (e) {
      setErrorTelefono(e.message || "No se pudo guardar el número.");
    } finally {
      setGuardando(false);
    }
  };

  const quitarTelefono = async () => {
    setGuardando(true);
    try {
      await onActualizarUsuario({ telefono: null });
      setEditando(null);
    } catch (e) {
      setErrorTelefono(e.message || "No se pudo quitar el número.");
    } finally {
      setGuardando(false);
    }
  };

  const abrirPassword = () => { setPassActual(""); setPass1(""); setPass2(""); setErrorPass(""); setEditando("password"); };

  const guardarPassword = async () => {
    if (!passActual) { setErrorPass("Escribe tu contraseña actual."); return; }
    if (pass1.length < 6) { setErrorPass("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    if (pass1 !== pass2) { setErrorPass("Las contraseñas nuevas no coinciden."); return; }
    setGuardando(true);
    try {
      await changePassword({ actual: passActual, nueva: pass1 });
      setEditando(null);
      // Se espera a que se cierre la hoja antes de mostrar la alerta (iOS no admite ambas a la vez)
      setTimeout(() => Alert.alert("Listo", "Tu contraseña se ha actualizado."), 450);
    } catch (e) {
      setErrorPass(e.message || "No se pudo cambiar la contraseña.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
      <TopBar title="Configuración" onBack={onBack} />

      <FieldLabel>Cuenta</FieldLabel>
      <Card style={{ marginBottom: 22 }}>
        <MenuRow icon="camera-outline" label="Cambiar foto de perfil" sub="Galería o cámara" onPress={cambiarFoto} />
        <MenuRow icon="person-outline" label="Cambiar alias" sub={`@${usuario.alias}`} onPress={abrirAlias} />
        <MenuRow icon="call-outline" label="Número de teléfono" sub={usuario.telefono || "Sin añadir"} onPress={abrirTelefono} />
        <MenuRow icon="key-outline" label="Contraseña y seguridad" sub={usuario.email} onPress={abrirPassword} last />
      </Card>

      <FieldLabel>Privacidad</FieldLabel>
      <Card style={{ marginBottom: 22 }}>
        <SwitchRow
          label="Perfil privado"
          sub="Si lo activas, solo quienes te sigan (con tu aprobación) podrán ver tus conjuntos"
          value={usuario.privacidadConjuntos === "privado"}
          onChange={(v) => actualizar({ privacidadConjuntos: v ? "privado" : "publico" })}
        />
        <MenuRow
          icon="chatbubble-ellipses-outline" label="Quién puede escribirme"
          sub={(OPCIONES_MENSAJES.find((o) => o.id === (usuario.mensajesDe || "normal")) || OPCIONES_MENSAJES[0]).titulo}
          onPress={() => setEditando("mensajes")} last
        />
      </Card>

      <FieldLabel>Notificaciones</FieldLabel>
      <Card style={{ marginBottom: 6 }}>
        <SwitchRow
          label="Prendas nuevas de amigos"
          sub="Avisarme cuando un amigo sube una prenda"
          value={notif.prendaAmigo}
          onChange={(v) => actualizar({ notificaciones: { ...notif, prendaAmigo: v } })}
        />
        <SwitchRow
          label="Mensajes"
          sub="Avisarme cuando reciba un mensaje"
          value={notif.mensajes}
          onChange={(v) => actualizar({ notificaciones: { ...notif, mensajes: v } })}
          last
        />
      </Card>
      <Text style={{ fontSize: 11.5, color: colors.inkFaint, marginBottom: 22, lineHeight: 16 }}>
        Tu preferencia se guarda en tu cuenta. Los avisos en el móvil se activarán con la app instalable.
      </Text>

      <FieldLabel>Apariencia</FieldLabel>
      <Card style={{ marginBottom: 22, padding: 14, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "500" }}>Tema</Text>
        <Pill active={tema === "light"} onPress={() => setTema("light")}>Claro</Pill>
        <Pill active={tema === "dark"} onPress={() => setTema("dark")} style={{ marginRight: 0 }}>Oscuro</Pill>
      </Card>

      <FieldLabel>Sesión y datos</FieldLabel>
      <View style={{ gap: 10 }}>
        <GhostButton
          icon="log-out-outline"
          onPress={() => confirmarAccion({ titulo: "Cerrar sesión", mensaje: "¿Cerrar la sesión de tu cuenta en este dispositivo?", textoConfirmar: "Cerrar sesión", onConfirm: onCerrarSesion })}
        >
          Cerrar sesión
        </GhostButton>
        <GhostButton
          icon="trash-outline" iconColor={colors.danger} textStyle={{ color: colors.danger }} style={{ borderColor: colors.dangerSoft }}
          onPress={() => confirmarAccion({ titulo: "Borrar todos los datos", mensaje: "Esto eliminará todas las prendas y conjuntos de tu cuenta, también de la nube. Esta acción no se puede deshacer.", textoConfirmar: "Borrar todo", destructivo: true, onConfirm: onReset })}
        >
          Borrar todos los datos
        </GhostButton>
      </View>

      {editando === "alias" && (
        <Sheet title="Cambiar alias" onClose={() => setEditando(null)}>
          <TextInput
            value={alias} onChangeText={(t) => { setAlias(t); setErrorAlias(""); }} autoCapitalize="none" autoCorrect={false}
            style={[inputStyle, { marginBottom: 10 }]} placeholderTextColor={colors.inkFaint}
          />
          {!!errorAlias && <Text style={{ color: colors.danger, fontSize: 13, marginBottom: 10 }}>{errorAlias}</Text>}
          <PrimaryButton onPress={guardarAlias} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</PrimaryButton>
        </Sheet>
      )}

      {editando === "mensajes" && (
        <Sheet title="Quién puede escribirme" onClose={() => setEditando(null)}>
          <View style={{ gap: 10 }}>
            {OPCIONES_MENSAJES.map((o) => {
              const activa = (usuario.mensajesDe || "normal") === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  onPress={async () => { if (await actualizar({ mensajesDe: o.id })) setEditando(null); }}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1,
                    borderColor: activa ? colors.accent : colors.line, backgroundColor: activa ? colors.accentSofter : colors.surface,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: "500" }}>{o.titulo}</Text>
                    <Text style={{ fontSize: 12, color: colors.inkSoft, lineHeight: 17, marginTop: 2 }}>{o.detalle}</Text>
                  </View>
                  {activa && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Sheet>
      )}

      {editando === "telefono" && (
        <Sheet title="Número de teléfono" onClose={() => setEditando(null)}>
          <TextInput
            value={telefonoTexto} onChangeText={(t) => { setTelefonoTexto(t); setErrorTelefono(""); }}
            keyboardType="phone-pad" placeholder="+34 612 345 678" placeholderTextColor={colors.inkFaint}
            style={[inputStyle, { marginBottom: 8 }]}
          />
          <Text style={{ fontSize: 12, color: colors.inkSoft, lineHeight: 17, marginBottom: 14 }}>
            Si no escribes prefijo de país, se usa +34. Nadie verá tu número: solo sirve para que quienes te tengan en sus contactos te encuentren. Todavía no se verifica por SMS.
          </Text>
          <Card style={{ marginBottom: 14 }}>
            <SwitchRow
              label="Permitir que mis contactos me encuentren"
              sub="Aparecerás como sugerencia a quien tenga tu número guardado"
              value={descubrible} onChange={setDescubrible} last
            />
          </Card>
          {!!errorTelefono && <Text style={{ color: colors.danger, fontSize: 13, marginBottom: 12 }}>{errorTelefono}</Text>}
          <PrimaryButton onPress={guardarTelefonoSheet} disabled={guardando}>{guardando ? "Guardando..." : "Guardar número"}</PrimaryButton>
          {!!usuario.telefono && (
            <GhostButton onPress={quitarTelefono} style={{ marginTop: 10 }} icon="trash-outline" iconColor={colors.danger} textStyle={{ color: colors.danger }}>
              Quitar número
            </GhostButton>
          )}
        </Sheet>
      )}

      {editando === "password" && (
        <Sheet title="Contraseña y seguridad" onClose={() => setEditando(null)}>
          <FieldLabel>Contraseña actual</FieldLabel>
          <TextInput value={passActual} onChangeText={setPassActual} secureTextEntry autoCapitalize="none" style={[inputStyle, { marginBottom: 14 }]} placeholderTextColor={colors.inkFaint} />
          <FieldLabel>Nueva contraseña</FieldLabel>
          <TextInput value={pass1} onChangeText={setPass1} secureTextEntry autoCapitalize="none" style={[inputStyle, { marginBottom: 14 }]} placeholderTextColor={colors.inkFaint} />
          <FieldLabel>Repetir nueva contraseña</FieldLabel>
          <TextInput value={pass2} onChangeText={setPass2} secureTextEntry autoCapitalize="none" style={[inputStyle, { marginBottom: 10 }]} placeholderTextColor={colors.inkFaint} />
          {!!errorPass && <Text style={{ color: colors.danger, fontSize: 13, marginBottom: 12 }}>{errorPass}</Text>}
          <PrimaryButton onPress={guardarPassword} disabled={guardando} style={{ marginBottom: 18 }}>
            {guardando ? "Guardando..." : "Cambiar contraseña"}
          </PrimaryButton>
          <Card>
            <View style={{ padding: 14 }}>
              <Text style={{ fontSize: 14.5, fontWeight: "500" }}>Autenticación en dos pasos</Text>
              <Text style={{ fontSize: 12, color: colors.inkSoft, marginTop: 2, lineHeight: 17 }}>
                Próximamente. Requiere la app instalable y un servicio de verificación adicional.
              </Text>
            </View>
          </Card>
        </Sheet>
      )}
    </ScrollView>
  );
}
