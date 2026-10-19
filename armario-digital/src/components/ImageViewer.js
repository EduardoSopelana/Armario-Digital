import React from "react";
import { Modal, View, Image, TouchableOpacity, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolverFoto } from "../images";

const ZOOM_MAXIMO = 5;

// Limita el desplazamiento para que no se pueda arrastrar la foto fuera de la pantalla
function limitar(valor, escala, tamano) {
  "worklet";
  const maximo = ((escala - 1) * tamano) / 2;
  return Math.max(-maximo, Math.min(maximo, valor));
}

function Visor({ uri, onClose }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const escala = useSharedValue(1);
  const escalaGuardada = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xGuardada = useSharedValue(0);
  const yGuardada = useSharedValue(0);

  // Pellizcar con dos dedos para acercar o alejar
  const pellizco = Gesture.Pinch()
    .onUpdate((e) => {
      escala.value = Math.max(1, Math.min(ZOOM_MAXIMO, escalaGuardada.value * e.scale));
    })
    .onEnd(() => {
      escalaGuardada.value = escala.value;
      xGuardada.value = limitar(x.value, escala.value, width);
      yGuardada.value = limitar(y.value, escala.value, height);
      x.value = withTiming(xGuardada.value);
      y.value = withTiming(yGuardada.value);
    });

  // Arrastrar para moverse por la foto (solo cuando está ampliada)
  const arrastre = Gesture.Pan()
    .onUpdate((e) => {
      if (escala.value > 1) {
        x.value = limitar(xGuardada.value + e.translationX, escala.value, width);
        y.value = limitar(yGuardada.value + e.translationY, escala.value, height);
      }
    })
    .onEnd(() => {
      xGuardada.value = x.value;
      yGuardada.value = y.value;
    });

  // Doble toque: acerca o vuelve al tamaño normal
  const dobleToque = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (escala.value > 1) {
        escala.value = withTiming(1);
        x.value = withTiming(0);
        y.value = withTiming(0);
        escalaGuardada.value = 1;
        xGuardada.value = 0;
        yGuardada.value = 0;
      } else {
        escala.value = withTiming(2.5);
        escalaGuardada.value = 2.5;
      }
    });

  const gesto = Gesture.Simultaneous(pellizco, arrastre, dobleToque);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: escala.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <GestureDetector gesture={gesto}>
        <Animated.View style={[{ width, height, alignItems: "center", justifyContent: "center" }, estilo]}>
          <Image source={{ uri }} style={{ width, height }} resizeMode="contain" />
        </Animated.View>
      </GestureDetector>

      <TouchableOpacity
        onPress={onClose}
        hitSlop={10}
        style={{
          position: "absolute", top: insets.top + 10, right: 16, width: 38, height: 38, borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center",
        }}
      >
        <Ionicons name="close" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

// Foto a pantalla completa con zoom (pellizco, doble toque y arrastre)
export default function ImageViewer({ foto, onClose }) {
  if (!foto) return null;
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {/* Dentro de un Modal los gestos necesitan su propio GestureHandlerRootView */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Visor uri={resolverFoto(foto)} onClose={onClose} />
      </GestureHandlerRootView>
    </Modal>
  );
}
