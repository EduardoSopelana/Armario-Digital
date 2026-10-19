// Elegir una foto de la galería o hacerla con la cámara
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

const OPCIONES = { quality: 0.7, allowsEditing: true, aspect: [1, 1] };

export async function elegirDeGaleria() {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para elegir una foto.");
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, ...OPCIONES });
  return res.canceled ? null : res.assets[0].uri;
}

export async function hacerFoto() {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) {
    Alert.alert("Permiso necesario", "Necesitamos acceso a tu cámara para hacer la foto.");
    return null;
  }
  const res = await ImagePicker.launchCameraAsync(OPCIONES);
  return res.canceled ? null : res.assets[0].uri;
}

// Pregunta de dónde sacar la foto y devuelve la uri elegida (o null si se cancela)
export function pedirFoto(titulo = "Foto") {
  return new Promise((resolver) => {
    Alert.alert(
      titulo,
      "¿De dónde quieres sacar la foto?",
      [
        { text: "Hacer foto", onPress: () => hacerFoto().then(resolver) },
        { text: "Elegir de la galería", onPress: () => elegirDeGaleria().then(resolver) },
        { text: "Cancelar", style: "cancel", onPress: () => resolver(null) },
      ],
      { cancelable: true, onDismiss: () => resolver(null) }
    );
  });
}
