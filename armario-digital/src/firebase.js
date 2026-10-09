// Inicialización de Firebase (se importa desde los servicios, nunca desde las pantallas)
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig } from "../firebaseConfig";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// La sesión se guarda en AsyncStorage para seguir iniciada al cerrar y abrir la app
function crearAuth() {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (e) {
    return getAuth(app); // ya estaba inicializado (recarga rápida durante el desarrollo)
  }
}

// Detección automática de long polling: evita problemas de conexión de Firestore en React Native
function crearDb() {
  try {
    return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch (e) {
    return getFirestore(app);
  }
}

export const auth = crearAuth();
export const db = crearDb();
export const firebaseConfigurado = !String(firebaseConfig.apiKey).startsWith("PEGA");
