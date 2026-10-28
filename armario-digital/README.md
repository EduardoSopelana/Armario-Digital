# Mi armario digital (Expo)

## Instalación

1. Sustituye `App.js` y la carpeta `src/` de tu proyecto por las de este paquete
   (borra antes la `src/` antigua para que no queden archivos viejos).
   Copia también `firebaseConfig.js` (solo la primera vez: después tendrá TUS datos) y
   `firestore.rules`.
2. Instala las librerías (una sola línea, empezando por `npx`):

   npx expo install expo-image-picker @react-native-async-storage/async-storage react-native-safe-area-context expo-font @expo-google-fonts/fraunces @expo-google-fonts/inter @expo/vector-icons expo-file-system firebase expo-image-manipulator react-native-gesture-handler react-native-reanimated react-native-worklets expo-contacts expo-crypto

3. Arranca con la caché limpia: `npx expo start -c`

## Qué incluye

- Prendas, armario con filtros, conjuntos (crear / generar / editar / eliminar) y favoritos, guardados en la nube
  (Firestore) por cuenta y sincronizados en tiempo real. Las fotos se reducen y se guardan dentro de cada prenda.
- Cuenta REAL con Firebase: crear cuenta, iniciar sesión, recuperar y cambiar contraseña, alias únicos.
  ("Continuar con Google" se activará con la app instalable.)
- Seguidores REALES (unidireccional): seguir a un perfil público es inmediato; a uno privado, con solicitud que
  él acepta. Cada uno decide si sigue de vuelta (botón "Seguir también"). Amigos = buscador directo + feed de
  solicitudes y nuevos seguidores. Siguiendo y Seguidores van en el menú principal del Perfil.
  El perfil de otra persona se ve a pantalla completa. Aviso rojo en Perfil cuando hay solicitudes.
- Zoom a pantalla completa en las fotos de detalle (pellizco, doble toque y arrastre).
- Foto de perfil desde la galería o con la cámara.
- Número de teléfono opcional (Configuración) y sugerencias de tus contactos del móvil en Amigos.
  El índice usa huellas SHA-256 de los números (nunca el número en claro). Aún sin verificar por SMS.
- Privacidad: el ajuste es "Perfil privado". Si pasa a privado o dejan de seguirte, el acceso se pierde al instante.
- Siguiendo/Seguidores y Mensajes con buscador; en el chat, tocar el @alias abre el perfil.
- Perfil con tres submenús: Prendas por categoría, Amigos y Configuración
  (foto, alias, contraseña y seguridad con dos pasos, privacidad, notificaciones, tema claro/oscuro).
- Mensajes con envío de conjuntos propios o de inspiración.
- Las fotos se copian a la carpeta permanente de la app (`src/images.js`) y se guardan con ruta relativa.

## Arquitectura

```
App.js                    pantalla raíz: estado y navegación
src/theme.js              paletas clara/oscura + ThemeProvider
src/services/             CAPA DE DATOS (todo en Firebase): authService, wardrobeService, friendsService, contactsService, messagesService
src/data/demoData.js      amigos y looks de ejemplo
src/components/           piezas de UI reutilizables
src/screens/              cada pantalla
```

Las pantallas nunca hablan con AsyncStorage ni con el servidor directamente para cuenta,
amigos y mensajes: usan `src/services/`. Para pasar a Firebase solo hay que reescribir
esos tres archivos.

## Lo que es simulado ahora mismo

- Google y la verificación en dos pasos todavía no están activos.
- MENSAJES REALES (Firestore, en tiempo real). Con seguimiento mutuo no hay límite; sin él y con destinatario privado,
  quien escribe puede enviar 2 mensajes hasta que el otro acepte (apartado Solicitudes). Ajuste "Quién puede escribirme".
  El límite lo hacen cumplir las reglas del servidor (firestore.rules), no solo la app.
- Perfil de otra persona: Seguir / Mensajes a mitades, contadores, y sus seguidores/seguidos si os seguís mutuamente.
- Deslizar a izquierda/derecha cambia de menú; deslizar hacia abajo cierra una foto a pantalla completa.
- Los amigos son perfiles de ejemplo y los mensajes no llegan a nadie (solo se guardan en tu móvil).
- Las notificaciones solo guardan tu preferencia.
