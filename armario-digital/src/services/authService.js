// CAPA DE DATOS · CUENTA (Firebase Authentication + Firestore)
// ---------------------------------------------------------------
// Las pantallas solo usan estas funciones y nunca hablan con Firebase directamente.
//
// Datos en Firestore:
//   users/{uid}                    perfil público: nombre, alias, privacidadConjuntos, createdAt
//   users/{uid}/private/settings   ajustes privados: notificaciones
//   aliases/{alias}                { uid }  -> garantiza que cada alias sea único
// El correo vive solo en Firebase Authentication (nadie más puede leerlo).
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut,
  sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, writeBatch, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db, firebaseConfigurado } from "../firebase";
import { getJSON, setJSON, removeKey } from "../storage";

const CACHE = "perfilCache"; // último perfil conocido (para abrir la app sin conexión)
const NOTIF_POR_DEFECTO = { prendaAmigo: true, mensajes: true };

/* ---------- utilidades ---------- */
const err = (mensaje) => Object.assign(new Error(mensaje), { propio: true });

const MENSAJES = {
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Inicia sesión.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/weak-password": "La contraseña es demasiado débil (mínimo 6 caracteres).",
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed": "Sin conexión. Comprueba tu internet.",
  "auth/requires-recent-login": "Por seguridad, cierra sesión y vuelve a entrar para hacer este cambio.",
  "permission-denied": "Firebase ha rechazado la operación (permisos). Comprueba que has publicado las reglas de Firestore.",
  unavailable: "Sin conexión con el servidor. Inténtalo de nuevo en unos segundos.",
};

function traducir(e) {
  if (e?.propio) return e;
  if (__DEV__) console.warn("Firebase:", e?.code, e?.message);
  return err(MENSAJES[e?.code] || "No se ha podido completar la operación. Inténtalo de nuevo.");
}

function asegurarConfiguracion() {
  if (!firebaseConfigurado) {
    throw err("Firebase todavía no está configurado: rellena el archivo firebaseConfig.js con los datos de tu proyecto.");
  }
}

export const normalizarAlias = (texto) => (texto || "").trim().toLowerCase().replace(/\s+/g, "");

// Devuelve un mensaje de error, o null si el alias es válido
export function validarAlias(alias) {
  if (!/^[a-z0-9._]{3,20}$/.test(alias)) {
    return "El alias debe tener entre 3 y 20 caracteres: letras sin tildes, números, punto o guion bajo.";
  }
  return null;
}

/* ---------- perfil ---------- */
async function cargarPerfil(user) {
  const [pub, priv, foto] = await Promise.all([
    getDoc(doc(db, "users", user.uid)),
    getDoc(doc(db, "users", user.uid, "private", "settings")),
    getJSON(`fotoPerfil_${user.uid}`, null), // la foto de perfil se sincronizará en la fase de datos en la nube
  ]);
  if (!pub.exists()) throw err("PERFIL_NO_ENCONTRADO");
  const d = pub.data();
  const perfil = {
    id: user.uid,
    nombre: d.nombre,
    alias: d.alias,
    email: user.email,
    foto,
    authMethod: "email",
    privacidadConjuntos: d.privacidadConjuntos || "publico",
    dosPasos: false, // la verificación en dos pasos real llegará más adelante
    notificaciones: priv.exists() ? { ...NOTIF_POR_DEFECTO, ...priv.data().notificaciones } : NOTIF_POR_DEFECTO,
    fechaRegistro: d.createdAt?.toDate?.().toISOString() || null,
  };
  await setJSON(CACHE, perfil);
  return perfil;
}

export async function getCurrentUser() {
  if (!firebaseConfigurado) return null;
  try {
    await auth.authStateReady(); // espera a que se restaure la sesión guardada
    const user = auth.currentUser;
    if (!user) return null;
    try {
      return await cargarPerfil(user);
    } catch (e) {
      const cache = await getJSON(CACHE, null); // sin conexión: último perfil conocido
      return cache && cache.id === user.uid ? cache : null;
    }
  } catch (e) {
    return null;
  }
}

/* ---------- registro e inicio de sesión ---------- */
export async function signUp({ nombre, alias, email, password }) {
  asegurarConfiguracion();
  const aliasLimpio = normalizarAlias(alias);
  const errAlias = validarAlias(aliasLimpio);
  if (errAlias) throw err(errAlias);

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  } catch (e) {
    throw traducir(e);
  }
  const uid = cred.user.uid;

  try {
    const aliasRef = doc(db, "aliases", aliasLimpio);
    if ((await getDoc(aliasRef)).exists()) throw err("Ese alias ya está en uso. Elige otro.");

    // Todo o nada: perfil + alias + ajustes se guardan a la vez
    const batch = writeBatch(db);
    batch.set(aliasRef, { uid });
    batch.set(doc(db, "users", uid), {
      nombre: nombre || "Sin nombre",
      alias: aliasLimpio,
      privacidadConjuntos: "publico",
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "users", uid, "private", "settings"), { notificaciones: NOTIF_POR_DEFECTO });
    await batch.commit();
  } catch (e) {
    try { await cred.user.delete(); } catch (_) {} // deshace la cuenta para poder volver a intentarlo
    throw traducir(e);
  }

  const perfil = {
    id: uid, nombre: nombre || "Sin nombre", alias: aliasLimpio, email: cred.user.email, foto: null,
    authMethod: "email", privacidadConjuntos: "publico", dosPasos: false,
    notificaciones: NOTIF_POR_DEFECTO, fechaRegistro: new Date().toISOString(),
  };
  await setJSON(CACHE, perfil);
  return perfil;
}

export async function signIn({ email, password }) {
  asegurarConfiguracion();
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (e) {
    throw traducir(e);
  }
  try {
    return await cargarPerfil(cred.user);
  } catch (e) {
    if (e.message === "PERFIL_NO_ENCONTRADO") {
      await fbSignOut(auth);
      throw err("Esta cuenta no tiene perfil. Crea una cuenta nueva.");
    }
    throw traducir(e);
  }
}

// Google necesita código nativo, que Expo Go no incluye. Se activa al generar la app instalable.
export async function signInWithGoogle() {
  throw err("El inicio de sesión con Google se activará en la app instalable (lo haremos al generar el APK).");
}

export async function sendPasswordReset(email) {
  asegurarConfiguracion();
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (e) {
    throw traducir(e);
  }
}

export async function signOut() {
  await removeKey(CACHE);
  try { await fbSignOut(auth); } catch (e) {}
}

/* ---------- cambios en la cuenta ---------- */
export async function changePassword({ actual, nueva }) {
  const user = auth.currentUser;
  if (!user?.email) throw err("No hay ninguna sesión iniciada.");
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, actual));
  } catch (e) {
    if (e?.code === "auth/invalid-credential" || e?.code === "auth/wrong-password") {
      throw err("La contraseña actual no es correcta.");
    }
    throw traducir(e);
  }
  try {
    await updatePassword(user, nueva);
  } catch (e) {
    throw traducir(e);
  }
}

async function cambiarAlias(uid, viejo, nuevo) {
  await runTransaction(db, async (tx) => {
    const nuevoRef = doc(db, "aliases", nuevo);
    if ((await tx.get(nuevoRef)).exists()) throw err("Ese alias ya está en uso. Elige otro.");
    tx.delete(doc(db, "aliases", viejo));
    tx.set(nuevoRef, { uid });
    tx.update(doc(db, "users", uid), { alias: nuevo });
  });
}

export async function updateProfile(perfil, cambios) {
  const uid = perfil.id;
  const nuevo = { ...perfil };
  try {
    if ("foto" in cambios) {
      await setJSON(`fotoPerfil_${uid}`, cambios.foto);
      nuevo.foto = cambios.foto;
    }
    if (cambios.alias && cambios.alias !== perfil.alias) {
      const errAlias = validarAlias(cambios.alias);
      if (errAlias) throw err(errAlias);
      await cambiarAlias(uid, perfil.alias, cambios.alias);
      nuevo.alias = cambios.alias;
    }
    const publicos = {};
    if (cambios.nombre !== undefined) publicos.nombre = cambios.nombre;
    if (cambios.privacidadConjuntos !== undefined) publicos.privacidadConjuntos = cambios.privacidadConjuntos;
    if (Object.keys(publicos).length > 0) {
      await updateDoc(doc(db, "users", uid), publicos);
      Object.assign(nuevo, publicos);
    }
    if (cambios.notificaciones) {
      await setDoc(doc(db, "users", uid, "private", "settings"), { notificaciones: cambios.notificaciones }, { merge: true });
      nuevo.notificaciones = cambios.notificaciones;
    }
  } catch (e) {
    throw traducir(e);
  }
  await setJSON(CACHE, nuevo);
  return nuevo;
}
