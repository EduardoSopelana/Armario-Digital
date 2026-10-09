import { Alert } from "react-native";

// Confirmaciones nativas. Se usan en lugar de un segundo <Modal> porque abrir
// dos Modal a la vez falla (y puede cerrar la app) en iOS.
export function confirmarAccion({ titulo, mensaje, textoConfirmar = "Aceptar", destructivo = false, onConfirm }) {
  Alert.alert(titulo, mensaje, [
    { text: "Cancelar", style: "cancel" },
    { text: textoConfirmar, style: destructivo ? "destructive" : "default", onPress: onConfirm },
  ]);
}

export function confirmarEliminar(titulo, mensaje, onConfirm) {
  confirmarAccion({ titulo, mensaje, textoConfirmar: "Eliminar", destructivo: true, onConfirm });
}
