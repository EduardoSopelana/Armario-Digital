import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Foto from "./Foto";
import ImageViewer from "./ImageViewer";

// Igual que <Foto>, pero al tocarla se abre a pantalla completa para poder hacer zoom
export default function FotoZoom({ uri, ...propsFoto }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <TouchableOpacity activeOpacity={0.9} disabled={!uri} onPress={() => setAbierta(true)}>
        <Foto uri={uri} {...propsFoto} />
        {!!uri && (
          <View
            pointerEvents="none"
            style={{ position: "absolute", right: 8, bottom: 8, width: 26, height: 26, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
      {abierta && <ImageViewer foto={uri} onClose={() => setAbierta(false)} />}
    </>
  );
}
