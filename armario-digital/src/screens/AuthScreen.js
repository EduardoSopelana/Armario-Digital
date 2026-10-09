import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Text from "../components/Text";
import { Pill, PrimaryButton, FieldLabel, Sheet, useInputStyle } from "../components/UI";
import { signIn, signUp, signInWithGoogle, sendPasswordReset, validarAlias, normalizarAlias } from "../services/authService";
import { useTheme, useStyles } from "../theme";

export default function AuthScreen({ onLogin }) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const inputStyle = useInputStyle();

  const [modo, setModo] = useState("login");
  const [nombre, setNombre] = useState("");
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const [recuperando, setRecuperando] = useState(false);
  const [recuperado, setRecuperado] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState("");

  const submit = async () => {
    if (!email.includes("@")) { setError("Introduce un correo electrónico válido."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (modo === "signup") {
      const errAlias = validarAlias(normalizarAlias(alias));
      if (errAlias) { setError(errAlias); return; }
    }
    setError("");
    setCargando(true);
    try {
      const perfil = modo === "login"
        ? await signIn({ email, password })
        : await signUp({ nombre: nombre.trim(), alias: normalizarAlias(alias), email, password });
      onLogin(perfil);
    } catch (e) {
      setError(e.message || "No se ha podido completar la operación.");
      setCargando(false);
    }
  };

  const entrarConGoogle = async () => {
    setCargando(true);
    try {
      onLogin(await signInWithGoogle());
    } catch (e) {
      setError(e.message || "No se ha podido iniciar sesión con Google.");
      setCargando(false);
    }
  };

  const cerrarRecuperacion = () => { setRecuperando(false); setRecuperado(false); setEmailRecuperar(""); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}>
            <View style={styles.logo}><Ionicons name="shirt-outline" size={26} color={colors.onAccent} /></View>
            <Text style={styles.title}>Mi armario</Text>
            <Text style={styles.subtitle}>Tu armario digital, siempre contigo.</Text>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 22 }}>
            <Pill active={modo === "login"} onPress={() => { setModo("login"); setError(""); }}>Iniciar sesión</Pill>
            <Pill active={modo === "signup"} onPress={() => { setModo("signup"); setError(""); }}>Crear cuenta</Pill>
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={entrarConGoogle} disabled={cargando}>
            <Ionicons name="logo-google" size={18} color="#DB4437" />
            <Text style={styles.googleText}>Continuar con Google</Text>
          </TouchableOpacity>
          <Text style={styles.note}>El inicio con Google se activará en la app instalable (lo haremos al generar el APK).</Text>

          <View style={styles.divider}>
            <View style={styles.line} /><Text style={styles.dividerText}>o con tu correo</Text><View style={styles.line} />
          </View>

          {modo === "signup" && (
            <>
              <FieldLabel>Nombre</FieldLabel>
              <TextInput value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor={colors.inkFaint} style={[inputStyle, { marginBottom: 14 }]} />
              <FieldLabel>Alias de usuario</FieldLabel>
              <TextInput value={alias} onChangeText={setAlias} autoCapitalize="none" placeholder="Ej. martaestilo" placeholderTextColor={colors.inkFaint} style={[inputStyle, { marginBottom: 14 }]} />
            </>
          )}

          <FieldLabel>Correo electrónico</FieldLabel>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={16} color={colors.inkFaint} style={styles.inputIcon} />
            <TextInput
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false}
              placeholder="tucorreo@gmail.com" placeholderTextColor={colors.inkFaint} style={[inputStyle, { paddingLeft: 38 }]}
            />
          </View>

          <FieldLabel>Contraseña</FieldLabel>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.inkFaint} style={styles.inputIcon} />
            <TextInput
              value={password} onChangeText={setPassword} secureTextEntry={!verPass} autoCapitalize="none"
              placeholder="••••••••" placeholderTextColor={colors.inkFaint} style={[inputStyle, { paddingLeft: 38, paddingRight: 40 }]}
            />
            <TouchableOpacity onPress={() => setVerPass((v) => !v)} style={styles.eye} hitSlop={8}>
              <Ionicons name={verPass ? "eye-off-outline" : "eye-outline"} size={17} color={colors.inkFaint} />
            </TouchableOpacity>
          </View>

          {modo === "login" && (
            <TouchableOpacity onPress={() => setRecuperando(true)} style={{ alignSelf: "flex-end", marginTop: 2 }}>
              <Text style={{ color: colors.accent, fontSize: 13 }}>¿Has olvidado tu contraseña?</Text>
            </TouchableOpacity>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton onPress={submit} disabled={cargando} style={{ marginTop: 18 }}>
            {modo === "login" ? "Iniciar sesión" : "Crear mi cuenta"}
          </PrimaryButton>

          <Text style={[styles.note, { marginTop: 16 }]}>
            Tu acceso lo gestiona Firebase Authentication. Tu contraseña nunca se guarda en el móvil ni se muestra a nadie.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {recuperando && (
        <Sheet title="Recuperar contraseña" onClose={cerrarRecuperacion}>
          {recuperado ? (
            <>
              <Text style={{ fontSize: 14, lineHeight: 22, marginBottom: 18 }}>
                Si existe una cuenta con {emailRecuperar}, te hemos enviado un enlace para restablecer tu contraseña.
              </Text>
              <PrimaryButton onPress={cerrarRecuperacion}>Entendido</PrimaryButton>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 13.5, color: colors.inkSoft, lineHeight: 21, marginBottom: 16 }}>
                Introduce tu correo y te enviaremos un enlace para crear una nueva contraseña.
              </Text>
              <FieldLabel>Correo electrónico</FieldLabel>
              <TextInput
                value={emailRecuperar} onChangeText={setEmailRecuperar} autoCapitalize="none" keyboardType="email-address"
                placeholder="tucorreo@gmail.com" placeholderTextColor={colors.inkFaint} style={[inputStyle, { marginBottom: 16 }]}
              />
              <PrimaryButton
                disabled={!emailRecuperar.includes("@")}
                onPress={async () => {
                  try { await sendPasswordReset(emailRecuperar); setRecuperado(true); }
                  catch (e) { Alert.alert("No se pudo enviar", e.message); }
                }}
              >
                Enviar enlace
              </PrimaryButton>
              <Text style={[styles.note, { marginTop: 14 }]}>Si no lo ves en unos minutos, revisa la carpeta de spam.</Text>
            </>
          )}
        </Sheet>
      )}
    </SafeAreaView>
  );
}

const createStyles = (c) => StyleSheet.create({
  container: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 40 },
  logoBox: { alignItems: "center", marginBottom: 30 },
  logo: { width: 56, height: 56, borderRadius: 18, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 26, fontWeight: "500", color: c.ink, fontFamily: "display" },
  subtitle: { color: c.inkSoft, fontSize: 14, marginTop: 4 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface },
  googleText: { fontSize: 14.5, fontWeight: "500", color: c.ink },
  note: { fontSize: 11, color: c.inkFaint, textAlign: "center", marginTop: 8, lineHeight: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: c.line },
  dividerText: { fontSize: 12, color: c.inkFaint },
  inputWrap: { marginBottom: 14, justifyContent: "center" },
  inputIcon: { position: "absolute", left: 13, zIndex: 1 },
  eye: { position: "absolute", right: 12 },
  error: { color: c.danger, fontSize: 13, marginTop: 10 },
});
