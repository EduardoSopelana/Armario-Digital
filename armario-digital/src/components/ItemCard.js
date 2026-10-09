import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import Text from "./Text";
import Foto from "./Foto";
import { HeartButton } from "./UI";
import { useStyles } from "../theme";

export default function ItemCard({ prenda, onPress, onToggleFavorito, style }) {
  const styles = useStyles(createStyles);
  return (
    <View style={style}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View>
          <Foto uri={prenda.foto} />
          {onToggleFavorito && (
            <HeartButton favorito={prenda.favorito} onPress={() => onToggleFavorito(prenda.id)} />
          )}
        </View>
        <Text style={styles.nombre}>{prenda.nombre}</Text>
        <Text style={styles.sub}>{prenda.tipo} · {prenda.color}</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (c) => StyleSheet.create({
  nombre: { marginTop: 8, fontSize: 13.5, fontWeight: "500", color: c.ink },
  sub: { marginTop: 1, fontSize: 12, color: c.inkSoft },
});
